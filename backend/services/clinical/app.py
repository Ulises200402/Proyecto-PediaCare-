import json
from datetime import date, datetime

from flask import Blueprint, current_app, g, jsonify, request

from services.common.access import patient_access_filter
from services.common.app import create_service
from services.common.database import query, transaction
from services.common.events import notify_patient_tutors
from services.common.security import require_auth, require_registration_code

bp = Blueprint("clinical", __name__)

CONSULTATION_SELECT = """SELECT c.id_consulta AS id, hc.id_paciente AS idPaciente,
  p.nombre AS pacienteNombre, p.dni AS pacienteDni, c.id_medico AS idMedico,
  u.nombre AS medicoNombre, c.fecha_consulta AS fechaConsulta, c.motivo,
  c.diagnostico, c.tratamiento, c.observaciones,
  c.indicaciones_para_padres AS indicacionesParaPadres
  FROM consulta c
  JOIN historial_clinico hc ON hc.id_historial=c.id_historial
  JOIN paciente p ON p.id_paciente=hc.id_paciente
  JOIN usuario u ON u.id_usuario=c.id_medico"""

MEDICATION_SELECT = """SELECT m.id_medicacion AS id, m.id_paciente AS idPaciente,
  p.nombre AS pacienteNombre, p.dni, m.id_enfermero AS idEnfermero,
  u.nombre AS enfermeroNombre, m.nombre AS medicamento, m.dosis,
  m.via_administracion AS via, m.frecuencia, m.horarios, m.indicaciones,
  m.fecha_inicio AS fechaInicio, m.fecha_fin AS fechaFin, m.activa
  FROM medicacion m JOIN paciente p ON p.id_paciente=m.id_paciente
  JOIN usuario u ON u.id_usuario=m.id_enfermero"""

REMINDER_SELECT = """SELECT r.id_recordatorio AS id, m.id_medicacion AS idMedicacion,
  p.id_paciente AS idPaciente, p.nombre AS pacienteNombre, p.dni,
  m.nombre AS medicamento, m.dosis, m.via_administracion AS via,
  TIME_FORMAT(r.fecha_hora_programada, '%%H:%%i') AS horario,
  r.fecha_hora_programada AS fechaHoraProgramada, r.estado,
  r.fecha_hora_administrada AS fechaHoraAdministrada,
  COALESCE(eu.nombre, 'Sin asignar') AS enfermero,
  r.id_enfermero_asignado AS idEnfermeroAsignado,
  COALESCE(au.nombre, 'Sin asignar') AS enfermeroAsignado, r.observaciones
  FROM recordatorio r JOIN medicacion m ON m.id_medicacion=r.id_medicacion
  JOIN paciente p ON p.id_paciente=m.id_paciente
  LEFT JOIN usuario eu ON eu.id_usuario=r.id_enfermero
  LEFT JOIN usuario au ON au.id_usuario=r.id_enfermero_asignado"""

VACCINE_SELECT = """SELECT v.id_vacuna AS id, v.id_paciente AS idPaciente,
  p.nombre AS pacienteNombre, p.dni AS pacienteDni, v.id_medico AS idMedico,
  v.id_enfermero AS idEnfermero, COALESCE(mu.nombre, eu.nombre) AS profesional,
  v.nombre, v.dosis, v.fecha_aplicacion AS fechaAplicacion,
  v.proxima_dosis AS proximaDosis, v.estado, v.observaciones
  FROM vacuna v JOIN paciente p ON p.id_paciente=v.id_paciente
  LEFT JOIN usuario mu ON mu.id_usuario=v.id_medico
  LEFT JOIN usuario eu ON eu.id_usuario=v.id_enfermero"""


def _id(value):
    if isinstance(value, bool):
        return None
    try:
        parsed = int(value)
        if isinstance(value, float) and not value.is_integer():
            return None
        return parsed if parsed > 0 else None
    except (TypeError, ValueError):
        return None


def _notify(connection, patient_id, kind, message):
    notify_patient_tutors(connection, patient_id, kind, message)


def _scope_patient(user, alias="p"):
    return patient_access_filter(user, alias)


@bp.get("/consultations")
@require_auth("MEDICO", "ENFERMERO", "PADRE_MADRE")
def list_consultations():
    if g.user["role"] == "PADRE_MADRE":
        rows = query(
            CONSULTATION_SELECT + """ WHERE p.id_tutor_1=%s OR p.id_tutor_2=%s
                                     ORDER BY c.fecha_consulta DESC LIMIT 200""",
            (g.user["id"], g.user["id"]),
        )
    elif g.user["role"] == "MEDICO":
        rows = query(
            CONSULTATION_SELECT + """ WHERE c.id_medico=%s
                                     ORDER BY c.fecha_consulta DESC LIMIT 200""",
            (g.user["id"],),
        )
    else:
        rows = query(CONSULTATION_SELECT + " ORDER BY c.fecha_consulta DESC LIMIT 200")
    return jsonify(data=rows)


def _consultation_payload(body, require_patient=False):
    if not isinstance(body, dict):
        return None
    patient_id = _id(body.get("idPaciente")) if require_patient else None
    required = ("motivo", "diagnostico", "tratamiento")
    if (require_patient and not patient_id) or any(
        not isinstance(body.get(key), str) or not body[key].strip()
        for key in required
    ):
        return None
    for key in (*required, "observaciones", "indicacionesParaPadres"):
        value = body.get(key)
        if value is not None and (not isinstance(value, str) or len(value) > 5000):
            return None
    values = {
        "motivo": body["motivo"].strip(),
        "diagnostico": body["diagnostico"].strip(),
        "tratamiento": body["tratamiento"].strip(),
        "observaciones": body.get("observaciones"),
        "indicacionesParaPadres": body.get("indicacionesParaPadres"),
    }
    if require_patient:
        values["idPaciente"] = patient_id
    return values


@bp.post("/consultations")
@require_auth("MEDICO")
def create_consultation():
    body = _consultation_payload(request.get_json(silent=True), require_patient=True)
    if not body:
        return jsonify(error="Completá los datos obligatorios de la consulta con valores válidos."), 400
    try:
        with transaction() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id_historial FROM historial_clinico WHERE id_paciente=%s LIMIT 1",
                    (body["idPaciente"],),
                )
                history = cursor.fetchone()
                if history:
                    history_id = history["id_historial"]
                else:
                    cursor.execute(
                        "INSERT INTO historial_clinico (id_paciente) VALUES (%s)",
                        (body["idPaciente"],),
                    )
                    history_id = cursor.lastrowid
                cursor.execute(
                    """INSERT INTO consulta
                       (id_historial,id_medico,fecha_consulta,motivo,diagnostico,
                        tratamiento,observaciones,indicaciones_para_padres)
                       VALUES (%s,%s,NOW(),%s,%s,%s,%s,%s)""",
                    (
                        history_id, g.user["id"], body["motivo"], body["diagnostico"],
                        body["tratamiento"], body["observaciones"], body["indicacionesParaPadres"],
                    ),
                )
                consultation_id = cursor.lastrowid
                cursor.execute(
                    CONSULTATION_SELECT + " WHERE c.id_consulta=%s LIMIT 1",
                    (consultation_id,),
                )
                saved = cursor.fetchone()
                _notify(
                    connection,
                    body["idPaciente"],
                    "consulta",
                    f'{saved["medicoNombre"]} registró una consulta para {saved["pacienteNombre"]}: "{body["motivo"]}".',
                )
        return jsonify(data=saved), 201
    except Exception:
        current_app.logger.exception("Consultation creation failed")
        return jsonify(error="No se pudo registrar la consulta."), 500


@bp.put("/consultations/<int:consultation_id>")
@require_auth("MEDICO")
def update_consultation(consultation_id):
    denied = require_registration_code()
    if denied:
        return denied
    body = _consultation_payload(request.get_json(silent=True))
    if not body:
        return jsonify(error="Los datos de la consulta no son válidos."), 400
    try:
        with transaction() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """SELECT hc.id_paciente, p.nombre AS paciente
                       FROM consulta c JOIN historial_clinico hc ON hc.id_historial=c.id_historial
                       JOIN paciente p ON p.id_paciente=hc.id_paciente
                       WHERE c.id_consulta=%s AND c.id_medico=%s FOR UPDATE""",
                    (consultation_id, g.user["id"]),
                )
                existing = cursor.fetchone()
                if not existing:
                    return jsonify(error="Consulta no encontrada."), 404
                cursor.execute(
                    """UPDATE consulta SET motivo=%s, diagnostico=%s, tratamiento=%s,
                         observaciones=%s, indicaciones_para_padres=%s
                       WHERE id_consulta=%s AND id_medico=%s""",
                    (
                        body["motivo"], body["diagnostico"], body["tratamiento"],
                        body["observaciones"], body["indicacionesParaPadres"],
                        consultation_id, g.user["id"],
                    ),
                )
                cursor.execute(
                    CONSULTATION_SELECT + " WHERE c.id_consulta=%s LIMIT 1",
                    (consultation_id,),
                )
                saved = cursor.fetchone()
                _notify(
                    connection, existing["id_paciente"], "consulta",
                    f'Se actualizó la consulta de {existing["paciente"]}: "{body["motivo"]}".',
                )
        return jsonify(data=saved)
    except Exception:
        current_app.logger.exception("Consultation update failed")
        return jsonify(error="No se pudo actualizar la consulta."), 500


@bp.delete("/consultations/<int:consultation_id>")
@require_auth("MEDICO")
def delete_consultation(consultation_id):
    denied = require_registration_code()
    if denied:
        return denied
    try:
        with transaction() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """SELECT hc.id_paciente,p.nombre AS paciente,c.motivo
                       FROM consulta c JOIN historial_clinico hc ON hc.id_historial=c.id_historial
                       JOIN paciente p ON p.id_paciente=hc.id_paciente
                       WHERE c.id_consulta=%s AND c.id_medico=%s FOR UPDATE""",
                    (consultation_id, g.user["id"]),
                )
                consultation = cursor.fetchone()
                if not consultation:
                    return jsonify(error="Consulta no encontrada."), 404
                _notify(
                    connection, consultation["id_paciente"], "consulta",
                    f'Se eliminó el registro de consulta de {consultation["paciente"]}: "{consultation["motivo"]}".',
                )
                cursor.execute(
                    "DELETE FROM consulta WHERE id_consulta=%s AND id_medico=%s",
                    (consultation_id, g.user["id"]),
                )
        return jsonify(data={"success": True})
    except Exception:
        current_app.logger.exception("Consultation deletion failed")
        return jsonify(error="No se pudo eliminar la consulta."), 500


@bp.get("/consultations/metrics")
@require_auth("MEDICO")
def doctor_metrics():
    doctor_id = g.user["id"]
    month = query(
        """SELECT COUNT(*) AS n FROM consulta
           WHERE id_medico=%s AND MONTH(fecha_consulta)=MONTH(CURRENT_DATE())
             AND YEAR(fecha_consulta)=YEAR(CURRENT_DATE())""",
        (doctor_id,), one=True,
    )
    previous = query(
        """SELECT COUNT(*) AS n FROM consulta
           WHERE id_medico=%s AND YEAR(fecha_consulta)=YEAR(CURRENT_DATE - INTERVAL 1 MONTH)
             AND MONTH(fecha_consulta)=MONTH(CURRENT_DATE - INTERVAL 1 MONTH)""",
        (doctor_id,), one=True,
    )
    today = query(
        "SELECT COUNT(*) AS n FROM consulta WHERE id_medico=%s AND DATE(fecha_consulta)=CURDATE()",
        (doctor_id,), one=True,
    )
    patients = query(
        """SELECT COUNT(DISTINCT hc.id_paciente) AS n FROM consulta c
           JOIN historial_clinico hc ON hc.id_historial=c.id_historial WHERE c.id_medico=%s""",
        (doctor_id,), one=True,
    )
    common = query(
        """SELECT motivo AS label,COUNT(*) AS count FROM consulta
           WHERE id_medico=%s GROUP BY motivo ORDER BY count DESC LIMIT 5""",
        (doctor_id,),
    )
    return jsonify(data={
        "totalConsultasMes": month["n"],
        "consultasMesAnterior": previous["n"],
        "consultasHoy": today["n"],
        "pacientesDistintos": patients["n"],
        "motivosFrecuentes": common,
    })


def _valid_date(value):
    if not isinstance(value, str) or len(value) != 10:
        return False
    try:
        return date.fromisoformat(value).isoformat() == value
    except ValueError:
        return False


def _parse_medication(body, require_active=False):
    if not isinstance(body, dict):
        return None
    patient_id = _id(body.get("idPaciente"))
    name = body.get("medicamento")
    dose = body.get("dosis")
    via = body.get("via")
    frequency = body.get("frecuencia")
    times = body.get("horarios")
    if (
        not patient_id
        or not isinstance(name, str) or not name.strip() or len(name) > 100
        or not isinstance(dose, str) or not dose.strip() or len(dose) > 100
        or not isinstance(via, str) or not via.strip() or len(via) > 30
        or not isinstance(frequency, str) or not frequency.strip() or len(frequency) > 50
        or not isinstance(times, list) or not times or len(times) > 24
        or any(
            not isinstance(item, str)
            or len(item) != 5
            or item[2] != ":"
            or not item[:2].isdigit()
            or not item[3:].isdigit()
            or int(item[:2]) > 23
            or int(item[3:]) > 59
            for item in times
        )
        or len(set(times)) != len(times)
        or not _valid_date(body.get("fechaInicio"))
        or (body.get("fechaFin") and not _valid_date(body["fechaFin"]))
        or (body.get("fechaFin") and body["fechaFin"] < body["fechaInicio"])
        or (
            body.get("fechaFin")
            and (date.fromisoformat(body["fechaFin"]) - date.fromisoformat(body["fechaInicio"])).days > 365
        )
        or (
            body.get("indicaciones") is not None
            and (not isinstance(body["indicaciones"], str) or len(body["indicaciones"]) > 2000)
        )
        or (require_active and not isinstance(body.get("activa"), bool))
    ):
        return None
    return {
        "idPaciente": patient_id,
        "medicamento": name.strip(),
        "dosis": dose.strip(),
        "via": via.strip(),
        "frecuencia": frequency.strip(),
        "horarios": times,
        "indicaciones": body.get("indicaciones"),
        "fechaInicio": body.get("fechaInicio"),
        "fechaFin": body.get("fechaFin") or None,
        "activa": body.get("activa", True),
    }


def _decode_json(value):
    return value if isinstance(value, (list, dict)) else json.loads(value or "[]")


@bp.get("/clinical/medications")
@require_auth("MEDICO", "ENFERMERO", "PADRE_MADRE")
def list_medications():
    scope, values = _scope_patient(g.user)
    parent_where = f" WHERE (p.id_tutor_1=%s OR p.id_tutor_2=%s)" if scope else ""
    rows = query(
        MEDICATION_SELECT + parent_where + " ORDER BY m.fecha_carga DESC",
        values,
    )
    for row in rows:
        row["horarios"] = _decode_json(row["horarios"])
        row["estado"] = "Activa" if row["activa"] else "Finalizada"
    return jsonify(data=rows)


@bp.post("/clinical/medications")
@require_auth("ENFERMERO")
def create_medication():
    body = _parse_medication(request.get_json(silent=True))
    if not body:
        return jsonify(error="Los datos de medicación no son válidos."), 400
    try:
        with transaction() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """INSERT INTO medicacion
                       (id_paciente,id_enfermero,nombre,dosis,via_administracion,
                        frecuencia,horarios,indicaciones,fecha_inicio,fecha_fin)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (
                        body["idPaciente"], g.user["id"], body["medicamento"], body["dosis"],
                        body["via"], body["frecuencia"], json.dumps(body["horarios"]),
                        body["indicaciones"], body["fechaInicio"], body["fechaFin"],
                    ),
                )
                medication_id = cursor.lastrowid
                _notify(
                    connection, body["idPaciente"], "medicacion",
                    f'Se registró el plan de medicación {body["medicamento"]} ({body["dosis"]}).',
                )
        medication = query(
            MEDICATION_SELECT + " WHERE m.id_medicacion=%s",
            (medication_id,),
            one=True,
        )
        if medication:
            medication["horarios"] = _decode_json(medication["horarios"])
            medication["estado"] = "Activa" if medication["activa"] else "Finalizada"
        return jsonify(data=medication), 201
    except Exception:
        current_app.logger.exception("Medication creation failed")
        return jsonify(error="No se pudo registrar la medicación."), 500


@bp.put("/clinical/medications/<int:medication_id>")
@require_auth("ENFERMERO")
def edit_medication(medication_id):
    denied = require_registration_code()
    if denied:
        return denied
    body = _parse_medication(request.get_json(silent=True), require_active=True)
    if not body:
        return jsonify(error="Los datos de medicación no son válidos."), 400
    try:
        with transaction() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """SELECT id_paciente FROM medicacion
                       WHERE id_medicacion=%s AND id_enfermero=%s FOR UPDATE""",
                    (medication_id, g.user["id"]),
                )
                existing = cursor.fetchone()
                if not existing:
                    return jsonify(error="Plan de medicación no encontrado."), 404
                cursor.execute(
                    """UPDATE medicacion SET nombre=%s,dosis=%s,via_administracion=%s,
                         frecuencia=%s,horarios=%s,indicaciones=%s,fecha_inicio=%s,
                         fecha_fin=%s,activa=%s
                       WHERE id_medicacion=%s AND id_enfermero=%s""",
                    (
                        body["medicamento"], body["dosis"], body["via"], body["frecuencia"],
                        json.dumps(body["horarios"]), body["indicaciones"], body["fechaInicio"],
                        body["fechaFin"], body["activa"], medication_id, g.user["id"],
                    ),
                )
                if body["activa"]:
                    cursor.execute(
                        """DELETE FROM recordatorio WHERE id_medicacion=%s
                           AND estado='Pendiente' AND fecha_hora_programada>=NOW()""",
                        (medication_id,),
                    )
                else:
                    cursor.execute(
                        """UPDATE recordatorio SET estado='Omitida',
                             observaciones='Plan de medicación finalizado.'
                           WHERE id_medicacion=%s AND estado='Pendiente'
                             AND fecha_hora_programada>=NOW()""",
                        (medication_id,),
                    )
                _notify(
                    connection, existing["id_paciente"], "medicacion",
                    f'Se actualizó el plan de medicación {body["medicamento"]} ({body["dosis"]})'
                    f'{" y se finalizó el tratamiento" if not body["activa"] else ""}.',
                )
        rows = query(MEDICATION_SELECT + " WHERE m.id_medicacion=%s", (medication_id,))
        if rows:
            rows[0]["horarios"] = _decode_json(rows[0]["horarios"])
            rows[0]["estado"] = "Activa" if rows[0]["activa"] else "Finalizada"
        return jsonify(data=rows[0] if rows else None)
    except Exception:
        current_app.logger.exception("Medication update failed")
        return jsonify(error="No se pudo actualizar la medicación."), 500


def _ensure_reminder_window():
    with transaction() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """SELECT id_medicacion,horarios FROM medicacion
                   WHERE activa=TRUE AND (fecha_fin IS NULL OR fecha_fin>=CURDATE())
                     AND fecha_inicio<=DATE_ADD(CURDATE(), INTERVAL 29 DAY)
                   ORDER BY id_medicacion"""
            )
            meds = cursor.fetchall()
            for medication in meds:
                for scheduled in _decode_json(medication["horarios"]):
                    cursor.execute(
                        """INSERT IGNORE INTO recordatorio (id_medicacion,fecha_hora_programada)
                           SELECT %s,CONCAT(DATE_ADD(CURDATE(), INTERVAL days.n DAY),' ',%s)
                           FROM (
                             SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
                             UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
                             UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
                             UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
                             UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
                             UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18
                             UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL SELECT 21
                             UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24
                             UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27
                             UNION ALL SELECT 28 UNION ALL SELECT 29
                           ) days JOIN medicacion cm ON cm.id_medicacion=%s
                           WHERE cm.fecha_inicio<=DATE_ADD(CURDATE(), INTERVAL days.n DAY)
                             AND (cm.fecha_fin IS NULL OR cm.fecha_fin>=
                                  DATE_ADD(CURDATE(), INTERVAL days.n DAY))""",
                        (medication["id_medicacion"], scheduled, medication["id_medicacion"]),
                    )
            cursor.execute(
                """UPDATE recordatorio r LEFT JOIN enfermero e
                     ON e.id_usuario=r.id_enfermero_asignado AND e.activo=TRUE
                   SET r.id_enfermero_asignado=NULL
                   WHERE r.estado='Pendiente' AND r.id_enfermero_asignado IS NOT NULL
                     AND e.id_usuario IS NULL AND r.fecha_hora_programada>=NOW()
                     AND r.fecha_hora_programada<DATE_ADD(NOW(), INTERVAL 30 DAY)"""
            )
            cursor.execute(
                """SELECT id_usuario AS id FROM enfermero WHERE activo=TRUE ORDER BY id_usuario"""
            )
            nurses = cursor.fetchall()
            if nurses:
                cursor.execute(
                    """SELECT id_enfermero_asignado AS id,COUNT(*) workload
                       FROM recordatorio WHERE id_enfermero_asignado IS NOT NULL
                         AND estado='Pendiente' AND fecha_hora_programada>=NOW()
                         AND fecha_hora_programada<DATE_ADD(NOW(), INTERVAL 30 DAY)
                       GROUP BY id_enfermero_asignado"""
                )
                workload = {row["id"]: row["workload"] for row in cursor.fetchall()}
                cursor.execute(
                    """SELECT r.id_recordatorio AS id FROM recordatorio r
                       JOIN medicacion m ON m.id_medicacion=r.id_medicacion
                       WHERE r.id_enfermero_asignado IS NULL AND r.estado='Pendiente'
                         AND r.fecha_hora_programada>=NOW()
                         AND r.fecha_hora_programada<DATE_ADD(NOW(), INTERVAL 30 DAY)
                         AND m.activa=TRUE
                       ORDER BY r.fecha_hora_programada,r.id_recordatorio"""
                )
                for reminder in cursor.fetchall():
                    nurse = min(nurses, key=lambda item: workload.get(item["id"], 0))
                    cursor.execute(
                        """UPDATE recordatorio SET id_enfermero_asignado=%s
                           WHERE id_recordatorio=%s AND id_enfermero_asignado IS NULL""",
                        (nurse["id"], reminder["id"]),
                    )
                    workload[nurse["id"]] = workload.get(nurse["id"], 0) + 1


@bp.get("/clinical/reminders")
@require_auth("MEDICO", "ENFERMERO", "PADRE_MADRE")
def list_reminders():
    try:
        _ensure_reminder_window()
        scope, params = _scope_patient(g.user)
        nurse_filter = ""
        if g.user["role"] == "ENFERMERO":
            nurse_filter = " AND (r.id_enfermero_asignado=%s OR r.id_enfermero_asignado IS NULL)"
            params += (g.user["id"],)
        rows = query(
            REMINDER_SELECT + """ WHERE r.fecha_hora_programada>=DATE_SUB(NOW(), INTERVAL 30 DAY)"""
            + scope + nurse_filter
            + " ORDER BY r.fecha_hora_programada LIMIT 1000",
            params,
        )
        return jsonify(data=rows)
    except Exception:
        current_app.logger.exception("Reminder listing failed")
        return jsonify(error="No se pudieron cargar los recordatorios."), 500


@bp.get("/clinical/nurses")
@require_auth("MEDICO", "ENFERMERO")
def list_nurses():
    return jsonify(data=query(
        """SELECT e.id_usuario AS id,u.nombre FROM enfermero e
           JOIN usuario u ON u.id_usuario=e.id_usuario
           WHERE e.activo=TRUE ORDER BY u.nombre LIMIT 100"""
    ))


@bp.patch("/clinical/reminders/<int:reminder_id>/assignment")
@require_auth("MEDICO", "ENFERMERO")
def assign_reminder(reminder_id):
    body = request.get_json(silent=True)
    nurse_id = _id(body.get("idEnfermeroAsignado")) if isinstance(body, dict) else None
    if not nurse_id:
        return jsonify(error="El enfermero asignado no es válido."), 400
    try:
        with transaction() as connection:
            with connection.cursor() as cursor:
                nurse_filter = ""
                params = [reminder_id]
                if g.user["role"] == "ENFERMERO":
                    nurse_filter = " AND (id_enfermero_asignado=%s OR id_enfermero_asignado IS NULL)"
                    params.append(g.user["id"])
                cursor.execute(
                    """SELECT id_recordatorio FROM recordatorio
                       WHERE id_recordatorio=%s AND estado='Pendiente'""" + nurse_filter + " FOR UPDATE",
                    params,
                )
                if not cursor.fetchone():
                    return jsonify(error="Recordatorio no encontrado o no asignable."), 404
                cursor.execute(
                    "SELECT id_usuario FROM enfermero WHERE id_usuario=%s AND activo=TRUE FOR UPDATE",
                    (nurse_id,),
                )
                if not cursor.fetchone():
                    return jsonify(error="El enfermero seleccionado no está activo."), 400
                cursor.execute(
                    "UPDATE recordatorio SET id_enfermero_asignado=%s WHERE id_recordatorio=%s",
                    (nurse_id, reminder_id),
                )
        row = query(REMINDER_SELECT + " WHERE r.id_recordatorio=%s", (reminder_id,), one=True)
        return jsonify(data=row)
    except Exception:
        current_app.logger.exception("Reminder assignment failed")
        return jsonify(error="No se pudo asignar el recordatorio."), 500


@bp.patch("/clinical/reminders/<int:reminder_id>/status")
@require_auth("ENFERMERO")
def update_reminder_status(reminder_id):
    body = request.get_json(silent=True)
    status = body.get("estado") if isinstance(body, dict) else None
    observations = body.get("observaciones") if isinstance(body, dict) else None
    if status not in {"Administrada", "Omitida"} or (
        observations is not None and (not isinstance(observations, str) or len(observations) > 500)
    ):
        return jsonify(error="El estado o las observaciones no son válidos."), 400
    try:
        with transaction() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """SELECT r.id_recordatorio,m.id_paciente,m.nombre,m.dosis,p.nombre paciente
                       FROM recordatorio r JOIN medicacion m ON m.id_medicacion=r.id_medicacion
                       JOIN paciente p ON p.id_paciente=m.id_paciente
                       WHERE r.id_recordatorio=%s AND r.estado='Pendiente'
                         AND (r.id_enfermero_asignado=%s OR r.id_enfermero_asignado IS NULL)
                       FOR UPDATE""",
                    (reminder_id, g.user["id"]),
                )
                existing = cursor.fetchone()
                if not existing:
                    return jsonify(error="Recordatorio no encontrado o ya procesado."), 404
                cursor.execute(
                    """UPDATE recordatorio SET estado=%s,
                         fecha_hora_administrada=IF(%s='Administrada',NOW(),NULL),
                         id_enfermero=IF(%s='Administrada',%s,NULL),
                         id_enfermero_asignado=COALESCE(id_enfermero_asignado,%s),
                         observaciones=%s
                       WHERE id_recordatorio=%s AND estado='Pendiente'""",
                    (status, status, status, g.user["id"], g.user["id"], observations, reminder_id),
                )
                message = (
                    f'Se registró la administración de {existing["nombre"]} ({existing["dosis"]}) para {existing["paciente"]}.'
                    if status == "Administrada" else
                    f'Se registró una dosis omitida de {existing["nombre"]} ({existing["dosis"]}) para {existing["paciente"]}.'
                )
                _notify(connection, existing["id_paciente"], "medicacion", message)
        row = query(REMINDER_SELECT + " WHERE r.id_recordatorio=%s", (reminder_id,), one=True)
        return jsonify(data=row)
    except Exception:
        current_app.logger.exception("Reminder status update failed")
        return jsonify(error="No se pudo actualizar el recordatorio."), 500


def _vaccine_payload(body):
    if not isinstance(body, dict):
        return None
    patient_id = _id(body.get("idPaciente"))
    name = body.get("nombre")
    dose = body.get("dosis")
    state = body.get("estado")
    if (
        not patient_id or not isinstance(name, str) or not name.strip() or len(name) > 100
        or not isinstance(dose, str) or not dose.strip() or len(dose) > 50
        or state not in {"Pendiente", "Aplicada", "Atrasada"}
        or (body.get("fechaAplicacion") and not _valid_date(body["fechaAplicacion"]))
        or (body.get("proximaDosis") and not _valid_date(body["proximaDosis"]))
        or (state == "Aplicada" and not body.get("fechaAplicacion"))
        or (
            body.get("observaciones") is not None
            and (not isinstance(body["observaciones"], str) or len(body["observaciones"]) > 500)
        )
    ):
        return None
    return {
        "idPaciente": patient_id, "nombre": name.strip(), "dosis": dose.strip(),
        "fechaAplicacion": body.get("fechaAplicacion") or None,
        "proximaDosis": body.get("proximaDosis") or None,
        "estado": state, "observaciones": body.get("observaciones") or None,
    }


@bp.get("/clinical/vaccines")
@require_auth("MEDICO", "ENFERMERO", "PADRE_MADRE")
def list_vaccines():
    scope, values = _scope_patient(g.user)
    return jsonify(data=query(
        VACCINE_SELECT + " WHERE 1=1" + scope
        + " ORDER BY COALESCE(v.proxima_dosis,v.fecha_aplicacion) DESC,v.nombre",
        values,
    ))


@bp.post("/clinical/vaccines")
@require_auth("MEDICO", "ENFERMERO")
def create_vaccine():
    body = _vaccine_payload(request.get_json(silent=True))
    if not body:
        return jsonify(error="Los datos de la vacuna no son válidos."), 400
    professional_col = "id_medico" if g.user["role"] == "MEDICO" else "id_enfermero"
    try:
        with transaction() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    f"""INSERT INTO vacuna (id_paciente,{professional_col},nombre,dosis,
                         fecha_aplicacion,proxima_dosis,estado,observaciones)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (
                        body["idPaciente"], g.user["id"], body["nombre"], body["dosis"],
                        body["fechaAplicacion"], body["proximaDosis"], body["estado"],
                        body["observaciones"],
                    ),
                )
                vaccine_id = cursor.lastrowid
                _notify(
                    connection, body["idPaciente"], "vacuna",
                    f'Se registró {body["nombre"]} ({body["dosis"]}), con estado {body["estado"]}.',
                )
        row = query(VACCINE_SELECT + " WHERE v.id_vacuna=%s", (vaccine_id,), one=True)
        return jsonify(data=row), 201
    except Exception:
        current_app.logger.exception("Vaccine creation failed")
        return jsonify(error="No se pudo registrar la vacuna."), 500


@bp.put("/clinical/vaccines/<int:vaccine_id>")
@require_auth("MEDICO", "ENFERMERO")
def update_vaccine(vaccine_id):
    denied = require_registration_code()
    if denied:
        return denied
    body = _vaccine_payload(request.get_json(silent=True))
    if not body:
        return jsonify(error="Los datos de la vacuna no son válidos."), 400
    try:
        with transaction() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id_paciente FROM vacuna WHERE id_vacuna=%s FOR UPDATE",
                    (vaccine_id,),
                )
                previous = cursor.fetchone()
                if not previous:
                    return jsonify(error="Vacuna no encontrada."), 404
                cursor.execute(
                    """UPDATE vacuna SET id_paciente=%s,nombre=%s,dosis=%s,
                         fecha_aplicacion=%s,proxima_dosis=%s,estado=%s,observaciones=%s
                       WHERE id_vacuna=%s""",
                    (
                        body["idPaciente"], body["nombre"], body["dosis"],
                        body["fechaAplicacion"], body["proximaDosis"], body["estado"],
                        body["observaciones"], vaccine_id,
                    ),
                )
                message = f'Se actualizó {body["nombre"]} ({body["dosis"]}); estado: {body["estado"]}.'
                _notify(connection, previous["id_paciente"], "vacuna", message)
                if previous["id_paciente"] != body["idPaciente"]:
                    _notify(connection, body["idPaciente"], "vacuna", message)
        row = query(VACCINE_SELECT + " WHERE v.id_vacuna=%s", (vaccine_id,), one=True)
        return jsonify(data=row)
    except Exception:
        current_app.logger.exception("Vaccine update failed")
        return jsonify(error="No se pudo actualizar la vacuna."), 500


@bp.delete("/clinical/vaccines/<int:vaccine_id>")
@require_auth("MEDICO", "ENFERMERO")
def delete_vaccine(vaccine_id):
    denied = require_registration_code()
    if denied:
        return denied
    try:
        with transaction() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id_paciente,nombre,dosis FROM vacuna WHERE id_vacuna=%s FOR UPDATE",
                    (vaccine_id,),
                )
                vaccine = cursor.fetchone()
                if not vaccine:
                    return jsonify(error="Vacuna no encontrada."), 404
                _notify(
                    connection, vaccine["id_paciente"], "vacuna",
                    f'Se eliminó el registro de {vaccine["nombre"]} ({vaccine["dosis"]}).',
                )
                cursor.execute("DELETE FROM vacuna WHERE id_vacuna=%s", (vaccine_id,))
        return jsonify(data={"success": True})
    except Exception:
        current_app.logger.exception("Vaccine deletion failed")
        return jsonify(error="No se pudo eliminar la vacuna."), 500


def create_app():
    return create_service("clinical", bp, 3002)


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=3002)
