from datetime import datetime
import re

from flask import Blueprint, current_app, g, jsonify, request

from services.common.app import create_service
from services.common.database import query, transaction
from services.common.events import notify_patient_tutors
from services.common.security import require_auth

bp = Blueprint("coordination", __name__)

APPOINTMENT_SELECT = """SELECT t.id_turno AS id,t.id_paciente AS idPaciente,
  p.nombre AS pacienteNombre,p.dni AS pacienteDni,t.id_medico AS idMedico,
  mu.nombre AS medicoNombre,m.especialidad,t.fecha_hora AS fechaHora,t.motivo,
  t.estado,t.fecha_alta AS fechaAlta
  FROM turno t JOIN paciente p ON p.id_paciente=t.id_paciente
  JOIN medico m ON m.id_usuario=t.id_medico
  JOIN usuario mu ON mu.id_usuario=m.id_usuario"""

NOTIFICATION_SELECT = """SELECT n.id_notificacion AS id,n.id_usuario AS idUsuario,
  n.id_paciente AS idPaciente,p.nombre AS pacienteNombre,n.canal,n.tipo,
  CASE n.tipo WHEN 'consulta' THEN 'Nueva consulta registrada'
    WHEN 'medicacion' THEN 'Novedad de medicación'
    WHEN 'turno' THEN 'Actualización de turno'
    WHEN 'vacuna' THEN 'Actualización de vacunas'
    ELSE 'Notificación' END AS titulo,
  n.contenido AS mensaje,n.estado,n.fecha_creacion AS fecha,n.leida
  FROM notificacion n LEFT JOIN paciente p ON p.id_paciente=n.id_paciente"""


@bp.get("/health")
def health():
    return jsonify(status="ok", service="coordination")


@bp.get("/health/database")
def health_database():
    try:
        query("SELECT 1")
        return jsonify(status="ok", database="connected")
    except Exception:
        current_app.logger.exception("Database health check failed")
        return jsonify(
            status="error",
            database="disconnected",
            message="Revisa que MySQL esté iniciado y que la configuración del entorno sea correcta.",
        ), 503


@bp.get("/appointments")
@require_auth("MEDICO", "ENFERMERO", "PADRE_MADRE")
def list_appointments():
    user = g.user
    if user["role"] == "PADRE_MADRE":
        rows = query(
            APPOINTMENT_SELECT + """ WHERE p.id_tutor_1=%s OR p.id_tutor_2=%s
                                     ORDER BY t.fecha_hora DESC LIMIT 100""",
            (user["id"], user["id"]),
        )
    elif user["role"] == "MEDICO":
        rows = query(
            APPOINTMENT_SELECT + " WHERE t.id_medico=%s ORDER BY t.fecha_hora DESC LIMIT 100",
            (user["id"],),
        )
    else:
        rows = query(APPOINTMENT_SELECT + " ORDER BY t.fecha_hora DESC LIMIT 100")
    return jsonify(data=rows)


@bp.get("/appointments/doctors")
@require_auth("PADRE_MADRE")
def list_doctors():
    return jsonify(data=query(
        """SELECT m.id_usuario AS id,u.nombre,m.especialidad
           FROM medico m JOIN usuario u ON u.id_usuario=m.id_usuario
           WHERE m.activo=TRUE ORDER BY u.nombre"""
    ))


def _insert_parent_notifications(connection, patient_id, kind, message):
    notify_patient_tutors(connection, patient_id, kind, message)


@bp.post("/appointments")
@require_auth("PADRE_MADRE")
def request_appointment():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        body = {}
    try:
        patient_id = int(body.get("idPaciente"))
        doctor_id = int(body.get("idMedico"))
        raw_date = body.get("fechaHora", "")
        if not isinstance(raw_date, str) or not re.fullmatch(
            r"\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d", raw_date
        ):
            raise ValueError
        parsed_date = datetime.strptime(raw_date, "%Y-%m-%dT%H:%M")
        reason = body.get("motivo")
        if (
            patient_id < 1 or doctor_id < 1
            or parsed_date <= datetime.now()
            or not isinstance(reason, str) or not reason.strip() or len(reason.strip()) > 255
        ):
            raise ValueError
    except (TypeError, ValueError):
        return jsonify(error="Ingresá paciente, profesional, fecha futura y motivo válidos."), 400

    date_value = parsed_date.strftime("%Y-%m-%d %H:%M:00")
    try:
        with transaction() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """SELECT m.id_usuario,u.nombre,m.especialidad FROM medico m
                       JOIN usuario u ON u.id_usuario=m.id_usuario
                       WHERE m.id_usuario=%s AND m.activo=TRUE FOR UPDATE""",
                    (doctor_id,),
                )
                doctor = cursor.fetchone()
                if not doctor:
                    return jsonify(error="El profesional seleccionado no está disponible."), 400
                cursor.execute(
                    """SELECT id_paciente,nombre FROM paciente
                       WHERE id_paciente=%s AND (id_tutor_1=%s OR id_tutor_2=%s) FOR UPDATE""",
                    (patient_id, g.user["id"], g.user["id"]),
                )
                patient = cursor.fetchone()
                if not patient:
                    return jsonify(error="Paciente no encontrado o no asociado a tu cuenta."), 404
                cursor.execute(
                    """SELECT id_turno FROM turno
                       WHERE fecha_hora=%s AND estado<>'Cancelado'
                         AND (id_medico=%s OR id_paciente=%s) LIMIT 1""",
                    (date_value, doctor_id, patient_id),
                )
                if cursor.fetchone():
                    return jsonify(error="Ese horario ya está solicitado. Elegí otro horario."), 409
                cursor.execute(
                    """INSERT INTO turno (id_paciente,id_medico,fecha_hora,motivo,estado)
                       VALUES (%s,%s,%s,%s,'Programado')""",
                    (patient_id, doctor_id, date_value, reason.strip()),
                )
                appointment_id = cursor.lastrowid
                message = (
                    f'Se solicitó un turno para {patient["nombre"]} el {date_value} '
                    f'con {doctor["nombre"]}.'
                )
                cursor.execute(
                    """INSERT INTO notificacion
                       (id_usuario,id_paciente,canal,tipo,contenido,estado)
                       VALUES (%s,%s,'APP','turno',%s,'Enviada')""",
                    (doctor_id, patient_id, message),
                )
                _insert_parent_notifications(connection, patient_id, "turno", message)
                cursor.execute(
                    APPOINTMENT_SELECT + " WHERE t.id_turno=%s LIMIT 1",
                    (appointment_id,),
                )
                appointment = cursor.fetchone()
        return jsonify(data=appointment), 201
    except Exception:
        current_app.logger.exception("Appointment request failed")
        return jsonify(error="No se pudo solicitar el turno."), 500


@bp.patch("/appointments/<int:appointment_id>/status")
@require_auth("MEDICO", "ENFERMERO")
def update_appointment_status(appointment_id):
    body = request.get_json(silent=True)
    state = body.get("estado") if isinstance(body, dict) else None
    valid_states = {"Programado", "Confirmado", "Atendido", "Ausente", "Cancelado"}
    if state not in valid_states:
        return jsonify(error="Estado de turno no válido."), 400
    try:
        with transaction() as connection:
            with connection.cursor() as cursor:
                doctor_filter = " AND id_medico=%s" if g.user["role"] == "MEDICO" else ""
                params = [appointment_id]
                if doctor_filter:
                    params.append(g.user["id"])
                cursor.execute(
                    "SELECT id_paciente,estado FROM turno WHERE id_turno=%s"
                    + doctor_filter + " FOR UPDATE",
                    params,
                )
                existing = cursor.fetchone()
                if not existing:
                    return jsonify(error="Turno no encontrado."), 404
                allowed = {
                    "Programado": {"Confirmado", "Cancelado"},
                    "Confirmado": {"Atendido", "Ausente", "Cancelado"},
                    "Atendido": set(),
                    "Ausente": set(),
                    "Cancelado": set(),
                }
                if state not in allowed.get(existing["estado"], set()):
                    return jsonify(error="El turno no puede cambiar a ese estado desde su estado actual."), 409
                cursor.execute(
                    "UPDATE turno SET estado=%s WHERE id_turno=%s",
                    (state, appointment_id),
                )
                _insert_parent_notifications(
                    connection,
                    existing["id_paciente"],
                    "turno",
                    f'El turno de {existing["estado"].lower()} cambió a {state.lower()}.',
                )
                cursor.execute(
                    APPOINTMENT_SELECT + " WHERE t.id_turno=%s LIMIT 1",
                    (appointment_id,),
                )
                appointment = cursor.fetchone()
        return jsonify(data=appointment)
    except Exception:
        current_app.logger.exception("Appointment status update failed")
        return jsonify(error="No se pudo actualizar el turno."), 500


@bp.patch("/appointments/<int:appointment_id>/cancel")
@require_auth("PADRE_MADRE")
def cancel_appointment(appointment_id):
    try:
        with transaction() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """SELECT t.id_paciente,t.id_medico,t.estado FROM turno t
                       JOIN paciente p ON p.id_paciente=t.id_paciente
                       WHERE t.id_turno=%s AND (p.id_tutor_1=%s OR p.id_tutor_2=%s)
                       FOR UPDATE""",
                    (appointment_id, g.user["id"], g.user["id"]),
                )
                existing = cursor.fetchone()
                if not existing or existing["estado"] not in {"Programado", "Confirmado"}:
                    return jsonify(error="Turno no encontrado o ya no se puede cancelar."), 404
                cursor.execute(
                    "UPDATE turno SET estado='Cancelado' WHERE id_turno=%s",
                    (appointment_id,),
                )
                cursor.execute(
                    """INSERT INTO notificacion
                       (id_usuario,id_paciente,canal,tipo,contenido,estado)
                       VALUES (%s,%s,'APP','turno',%s,'Enviada')""",
                    (existing["id_medico"], existing["id_paciente"], "La familia canceló un turno solicitado."),
                )
                cursor.execute(
                    APPOINTMENT_SELECT + " WHERE t.id_turno=%s LIMIT 1",
                    (appointment_id,),
                )
                appointment = cursor.fetchone()
        return jsonify(data=appointment)
    except Exception:
        current_app.logger.exception("Appointment cancellation failed")
        return jsonify(error="No se pudo cancelar el turno."), 500


@bp.get("/notifications")
@require_auth("PADRE_MADRE", "MEDICO", "ENFERMERO")
def list_notifications():
    rows = query(
        NOTIFICATION_SELECT + """ WHERE n.id_usuario=%s
                                 ORDER BY n.fecha_creacion DESC LIMIT 100""",
        (g.user["id"],),
    )
    for row in rows:
        row["leida"] = bool(row["leida"])
    return jsonify(data=rows)


@bp.patch("/notifications/<int:notification_id>/read")
@require_auth("PADRE_MADRE", "MEDICO", "ENFERMERO")
def mark_notification_read(notification_id):
    try:
        with transaction() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE notificacion SET leida=TRUE WHERE id_notificacion=%s AND id_usuario=%s",
                    (notification_id, g.user["id"]),
                )
        row = query(
            NOTIFICATION_SELECT + " WHERE n.id_notificacion=%s AND n.id_usuario=%s LIMIT 1",
            (notification_id, g.user["id"]),
            one=True,
        )
        if not row:
            return jsonify(error="Notificación no encontrada."), 404
        row["leida"] = bool(row["leida"])
        return jsonify(data=row)
    except Exception:
        current_app.logger.exception("Notification read update failed")
        return jsonify(error="No se pudo actualizar la notificación."), 500


DEFAULT_TYPES = {
    "turnos": True, "medicacion": True, "consultas": True, "vacunas": True
}


@bp.get("/notifications/preferences")
@require_auth("PADRE_MADRE")
def get_notification_preferences():
    row = query(
        """SELECT recibe_notificaciones_app AS app,preferencias_notificacion AS tipos
           FROM padre_madre WHERE id_usuario=%s LIMIT 1""",
        (g.user["id"],), one=True,
    )
    if not row:
        return jsonify(error="Preferencias no encontradas."), 404
    import json
    types = row["tipos"]
    if isinstance(types, str):
        types = json.loads(types or "{}")
    return jsonify(data={
        "canales": {"app": bool(row["app"]), "email": False, "sms": False},
        "tipos": {**DEFAULT_TYPES, **(types or {})},
    })


@bp.put("/notifications/preferences")
@require_auth("PADRE_MADRE")
def update_notification_preferences():
    body = request.get_json(silent=True)
    channels = body.get("canales") if isinstance(body, dict) else None
    types = body.get("tipos") if isinstance(body, dict) else None
    if (
        not isinstance(channels, dict) or not isinstance(channels.get("app"), bool)
        or not isinstance(types, dict)
        or any(not isinstance(types.get(key), bool) for key in DEFAULT_TYPES)
    ):
        return jsonify(error="Las preferencias de notificación no son válidas."), 400
    import json
    try:
        with transaction() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """UPDATE padre_madre SET recibe_notificaciones_app=%s,
                         preferencias_notificacion=%s WHERE id_usuario=%s""",
                    (channels["app"], json.dumps({key: types[key] for key in DEFAULT_TYPES}), g.user["id"]),
                )
                if cursor.rowcount == 0:
                    exists = cursor.execute(
                        "SELECT id_usuario FROM padre_madre WHERE id_usuario=%s",
                        (g.user["id"],),
                    )
                    if not exists:
                        return jsonify(error="Preferencias no encontradas."), 404
        return get_notification_preferences()
    except Exception:
        current_app.logger.exception("Notification preferences update failed")
        return jsonify(error="No se pudieron guardar las preferencias."), 500


def create_app():
    return create_service("coordination", bp, 3003)


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=3003)
