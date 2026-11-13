import re
from datetime import date
from hmac import compare_digest

from flask import Blueprint, current_app, g, jsonify, request

from services.common.access import patient_access_filter
from services.common.app import create_service
from services.common.database import query, transaction
from services.common.security import make_token, require_auth

bp = Blueprint("identity", __name__)
VALID_ROLES = {"MEDICO", "ENFERMERO", "PADRE_MADRE"}
VALID_SEXES = {"Femenino", "Masculino", "Otro", "No especificado"}


def _account_payload(body):
    if not isinstance(body, dict):
        return None, {"body": "El cuerpo debe ser un objeto JSON."}
    errors = {}
    name = body.get("nombre")
    dni = re.sub(r"[.\s]", "", body.get("dni", "").strip()) if isinstance(body.get("dni"), str) else ""
    email = str(body.get("email", "")).strip().lower()
    password = body.get("password")
    role = body.get("role")
    registration_code = body.get("registrationCode", "")
    matricula = body.get("matricula", "")
    especialidad = body.get("especialidad", "")
    telefono = body.get("telefono", "")
    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 100:
        errors["nombre"] = "Ingresá un nombre de hasta 100 caracteres."
    if not dni.isdigit() or len(dni) not in (7, 8):
        errors["dni"] = "El DNI debe tener 7 u 8 dígitos."
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email) or len(email) > 254:
        errors["email"] = "Ingresá un correo válido."
    password_bytes = len(password.encode("utf-8")) if isinstance(password, str) else 0
    if password_bytes < 12 or password_bytes > 72:
        errors["password"] = "La contraseña debe tener entre 12 y 72 bytes."
    if not isinstance(role, str) or role not in VALID_ROLES:
        errors["role"] = "El rol seleccionado no es válido."
    if role in {"MEDICO", "ENFERMERO"}:
        if not isinstance(matricula, str) or not matricula.strip() or len(matricula.strip()) > 30:
            errors["matricula"] = "La matrícula es obligatoria y admite hasta 30 caracteres."
        if not isinstance(registration_code, str) or not registration_code:
            errors["registrationCode"] = "El código de habilitación es obligatorio."
        if role == "MEDICO" and (
            not isinstance(especialidad, str)
            or not especialidad.strip()
            or len(especialidad.strip()) > 80
        ):
            errors["especialidad"] = "La especialidad es obligatoria y admite hasta 80 caracteres."
    if role == "PADRE_MADRE" and (
        not isinstance(telefono, str) or len(telefono.strip()) > 25
    ):
        errors["telefono"] = "El teléfono admite hasta 25 caracteres."
    if errors:
        return None, errors
    return {
        "nombre": name.strip(),
        "dni": dni,
        "email": email,
        "password": password,
        "role": role,
        "matricula": matricula.strip() if isinstance(matricula, str) else "",
        "especialidad": especialidad.strip() if isinstance(especialidad, str) else "",
        "telefono": telefono.strip() or None if isinstance(telefono, str) else None,
        "registrationCode": registration_code,
    }, None


@bp.post("/auth/register")
def register():
    import bcrypt

    account, errors = _account_payload(request.get_json(silent=True))
    if errors:
        return jsonify(error="Los datos de registro no son válidos.", details=errors), 400
    role = account["role"]
    if role in {"MEDICO", "ENFERMERO"}:
        code = current_app.config.get(f"{role}_REGISTRATION_CODE", "")
        supplied = account["registrationCode"]
        if not code or not compare_digest(supplied, code):
            return jsonify(error="El código de habilitación no es válido."), 403

    try:
        password_hash = bcrypt.hashpw(
            account["password"].encode("utf-8"), bcrypt.gensalt(rounds=12)
        ).decode("ascii")
        with transaction() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """INSERT INTO usuario (nombre, dni, email, contrasena_hash, rol)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (
                        account["nombre"],
                        account["dni"],
                        account["email"],
                        password_hash,
                        role,
                    ),
                )
                user_id = cursor.lastrowid
                if role == "MEDICO":
                    cursor.execute(
                        """INSERT INTO medico (id_usuario, matricula, especialidad)
                           VALUES (%s, %s, %s)""",
                        (user_id, account["matricula"], account["especialidad"]),
                    )
                elif role == "ENFERMERO":
                    cursor.execute(
                        "INSERT INTO enfermero (id_usuario, matricula) VALUES (%s, %s)",
                        (user_id, account["matricula"]),
                    )
                else:
                    cursor.execute(
                        "INSERT INTO padre_madre (id_usuario, telefono) VALUES (%s, %s)",
                        (user_id, account["telefono"]),
                    )
        user = {"id_usuario": user_id, "rol": role}
        return jsonify(
            token=make_token(user),
            user={
                "id": user_id,
                "name": account["nombre"],
                "dni": account["dni"],
                "email": account["email"],
                "role": role,
            },
        ), 201
    except Exception as error:
        if getattr(error, "args", [None])[0] == 1062:
            return jsonify(
                error="Ya existe una cuenta con ese correo, DNI o matrícula."
            ), 409
        current_app.logger.exception("Account registration failed")
        return jsonify(error="No se pudo completar el registro."), 500


def _throttle_hash(scope, value):
    import hashlib

    return hashlib.sha256(f"{scope}\0{value}".encode("utf-8")).hexdigest()


def _locked(throttle_keys):
    for key in throttle_keys:
        row = query(
            """SELECT locked_until
               FROM login_throttle
               WHERE scope_hash = %s AND locked_until > NOW()""",
            (key,),
            one=True,
        )
        if row:
            return True
    return False


def _record_login_failure(throttle_limits):
    with transaction() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM login_throttle WHERE first_failed_at < DATE_SUB(NOW(), INTERVAL 1 DAY)"
            )
            for key, threshold in throttle_limits:
                cursor.execute(
                    """INSERT INTO login_throttle
                         (scope_hash, failed_attempts, first_failed_at, locked_until)
                       VALUES (%s, 1, NOW(), NULL)
                       ON DUPLICATE KEY UPDATE
                         locked_until = IF(
                           first_failed_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE),
                           NULL,
                           IF(failed_attempts + 1 >= %s,
                             DATE_ADD(NOW(), INTERVAL 15 MINUTE), locked_until)
                         ),
                         failed_attempts = IF(
                           first_failed_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE),
                           1, LEAST(failed_attempts + 1, 255)
                         ),
                         first_failed_at = IF(
                           first_failed_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE),
                           NOW(), first_failed_at
                         )""",
                    (key, threshold),
                )


@bp.post("/auth/login")
def login():
    import bcrypt

    body = request.get_json(silent=True)
    email = body.get("email", "").strip().lower() if isinstance(body, dict) and isinstance(body.get("email"), str) else ""
    password = body.get("password", "") if isinstance(body, dict) else ""
    if not email or not isinstance(password, str) or not password or len(password) > 72:
        return jsonify(error="Email y contraseña son obligatorios."), 400

    ip_address = request.remote_addr or "unknown"
    throttle_keys = [
        _throttle_hash("email", email),
        _throttle_hash("ip", ip_address),
    ]
    throttle_limits = [(throttle_keys[0], 5), (throttle_keys[1], 20)]
    try:
        if _locked(throttle_keys):
            current_app.logger.warning(
                "Login temporarily blocked; anonymized key=%s", throttle_keys[0][:12]
            )
            return jsonify(error="Demasiados intentos. Esperá 15 minutos antes de volver a intentar."), 429
        user = query(
            """SELECT u.id_usuario, u.nombre, u.dni, u.email, u.contrasena_hash, u.rol,
                 CASE
                   WHEN u.rol = 'MEDICO' THEN COALESCE(m.activo, FALSE)
                   WHEN u.rol = 'ENFERMERO' THEN COALESCE(e.activo, FALSE)
                   WHEN u.rol = 'PADRE_MADRE' THEN p.id_usuario IS NOT NULL
                   ELSE FALSE
                 END AS activo
               FROM usuario u
               LEFT JOIN medico m ON m.id_usuario = u.id_usuario
               LEFT JOIN enfermero e ON e.id_usuario = u.id_usuario
               LEFT JOIN padre_madre p ON p.id_usuario = u.id_usuario
               WHERE u.email = %s LIMIT 1""",
            (email,),
            one=True,
        )
        dummy_hash = bcrypt.hashpw(b"not-a-real-password", bcrypt.gensalt(rounds=12))
        stored_hash = user["contrasena_hash"].encode("ascii") if user else dummy_hash
        password_matches = bcrypt.checkpw(password.encode("utf-8"), stored_hash)
        if not user or not password_matches:
            _record_login_failure(throttle_limits)
            current_app.logger.warning(
                "Login rejected; anonymized key=%s", throttle_keys[0][:12]
            )
            return jsonify(error="Credenciales incorrectas."), 401
        if not user["activo"]:
            return jsonify(error="La cuenta no está activa o el perfil está incompleto."), 403
        with transaction() as connection:
            with connection.cursor() as cursor:
                cursor.executemany(
                    "DELETE FROM login_throttle WHERE scope_hash = %s",
                    [(key,) for key in throttle_keys],
                )
        return jsonify(
            token=make_token(user),
            user={
                "id": user["id_usuario"],
                "name": user["nombre"],
                "dni": user["dni"],
                "email": user["email"],
                "role": user["rol"],
            },
        )
    except Exception:
        current_app.logger.exception("Login processing failed")
        return jsonify(error="No se pudo completar el inicio de sesión."), 503


@bp.get("/auth/me")
@require_auth()
def current_user():
    user = g.user
    return jsonify(
        id=user["id"],
        name=user["name"],
        dni=user["dni"],
        email=user["email"],
        role=user["role"],
    )


PATIENT_SELECT = """SELECT p.id_paciente AS id, p.nombre, p.dni,
  p.fecha_nacimiento AS fechaNacimiento, p.sexo, p.alergias,
  p.enfermedades_cronicas AS enfermedadesCronicas,
  p.id_tutor_1 AS idTutor1, p.id_tutor_2 AS idTutor2, p.fecha_alta AS fechaAlta,
  t1.nombre AS tutor1Nombre, t1.dni AS tutor1Dni, t1p.telefono AS tutor1Telefono,
  t2.nombre AS tutor2Nombre, t2.dni AS tutor2Dni, t2p.telefono AS tutor2Telefono
  FROM paciente p
  LEFT JOIN usuario t1 ON t1.id_usuario = p.id_tutor_1
  LEFT JOIN padre_madre t1p ON t1p.id_usuario = p.id_tutor_1
  LEFT JOIN usuario t2 ON t2.id_usuario = p.id_tutor_2
  LEFT JOIN padre_madre t2p ON t2p.id_usuario = p.id_tutor_2"""


@bp.get("/patients")
@require_auth("MEDICO", "ENFERMERO", "PADRE_MADRE")
def list_patients():
    scope, values = patient_access_filter(g.user)
    if scope:
        rows = query(
            PATIENT_SELECT + """ WHERE 1=1""" + scope + """
                                 ORDER BY p.nombre LIMIT 100""",
            values,
        )
    else:
        rows = query(PATIENT_SELECT + " ORDER BY p.nombre LIMIT 100")
    return jsonify(data=rows)


@bp.get("/patients/tutors")
@require_auth("MEDICO")
def list_tutors():
    search = request.args.get("search", "").strip()
    if len(search) > 80:
        return jsonify(error="La búsqueda no debe superar 80 caracteres."), 400
    if not search:
        rows = query(
            """SELECT pm.id_usuario AS id, u.nombre, u.dni, pm.telefono
               FROM padre_madre pm JOIN usuario u ON u.id_usuario = pm.id_usuario
               ORDER BY u.nombre LIMIT 50"""
        )
    else:
        dni_search = search.replace(".", "").replace(" ", "")
        rows = query(
            """SELECT pm.id_usuario AS id, u.nombre, u.dni, pm.telefono
               FROM padre_madre pm JOIN usuario u ON u.id_usuario = pm.id_usuario
               WHERE u.nombre LIKE %s OR (%s <> '' AND u.dni LIKE %s)
               ORDER BY u.nombre LIMIT 50""",
            (f"%{search}%", dni_search, f"%{dni_search}%"),
        )
    return jsonify(data=rows)


def _patient_payload(body):
    if not isinstance(body, dict):
        return None
    name = body.get("nombre")
    dni = re.sub(r"[.\s]", "", body.get("dni", "").strip()) if isinstance(body.get("dni"), str) else ""
    dob = body.get("fechaNacimiento")
    sex = body.get("sexo")
    def positive_id(value):
        if isinstance(value, bool):
            return None
        if isinstance(value, int):
            return value if value > 0 else None
        if isinstance(value, str) and value.isdigit():
            return int(value) or None
        return None

    tutor1 = positive_id(body.get("idTutor1"))
    tutor2 = (
        positive_id(body.get("idTutor2"))
        if body.get("idTutor2") is not None and body.get("idTutor2") != ""
        else None
    )
    try:
        parsed_date = (
            date.fromisoformat(dob)
            if isinstance(dob, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", dob)
            else None
        )
    except ValueError:
        parsed_date = None
    if (
        not isinstance(name, str) or not name.strip() or len(name.strip()) > 100
        or not dni.isdigit() or len(dni) not in (7, 8)
        or parsed_date is None or parsed_date > date.today()
        or sex not in VALID_SEXES
        or not isinstance(tutor1, int) or tutor1 < 1
        or (tutor2 is not None and (not isinstance(tutor2, int) or tutor2 < 1 or tutor2 == tutor1))
        or (body.get("alergias") is not None and not isinstance(body.get("alergias"), str))
        or (body.get("enfermedadesCronicas") is not None
            and not isinstance(body.get("enfermedadesCronicas"), str))
        or len(body.get("alergias") or "") > 65535
        or len(body.get("enfermedadesCronicas") or "") > 65535
    ):
        return None
    return (
        name.strip(), dni, dob, sex,
        body.get("alergias") or None, body.get("enfermedadesCronicas") or None,
        tutor1, tutor2,
    )


@bp.post("/patients")
@require_auth("MEDICO")
def create_patient():
    values = _patient_payload(request.get_json(silent=True))
    if values is None:
        return jsonify(error="Los datos del paciente no son válidos."), 400
    try:
        with transaction() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """INSERT INTO paciente
                       (nombre, dni, fecha_nacimiento, sexo, alergias,
                        enfermedades_cronicas, id_tutor_1, id_tutor_2)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                    values,
                )
                patient_id = cursor.lastrowid
                cursor.execute(
                    "INSERT INTO historial_clinico (id_paciente) VALUES (%s)",
                    (patient_id,),
                )
        patient = query(PATIENT_SELECT + " WHERE p.id_paciente = %s", (patient_id,), one=True)
        return jsonify(data=patient), 201
    except Exception as error:
        if getattr(error, "args", [None])[0] == 1062:
            return jsonify(error="Ese DNI ya está registrado para otro paciente."), 409
        if getattr(error, "args", [None])[0] == 1452:
            return jsonify(error="Los tutores deben ser cuentas existentes de padre/madre."), 400
        current_app.logger.exception("Patient creation failed")
        return jsonify(error="No se pudo crear el paciente."), 500


@bp.get("/patients/<int:patient_id>")
@require_auth("MEDICO", "ENFERMERO", "PADRE_MADRE")
def get_patient(patient_id):
    parent_scope, scope_params = patient_access_filter(g.user)
    params = [patient_id, *scope_params]
    patient = query(
        PATIENT_SELECT + " WHERE p.id_paciente = %s" + parent_scope + " LIMIT 1",
        params,
        one=True,
    )
    if not patient:
        return jsonify(error="Paciente no encontrado."), 404
    return jsonify(data=patient)


@bp.put("/patients/<int:patient_id>")
@require_auth("MEDICO")
def update_patient(patient_id):
    values = _patient_payload(request.get_json(silent=True))
    if values is None:
        return jsonify(error="Los datos del paciente no son válidos."), 400
    try:
        with transaction() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """UPDATE paciente SET nombre=%s, dni=%s, fecha_nacimiento=%s,
                         sexo=%s, alergias=%s, enfermedades_cronicas=%s,
                         id_tutor_1=%s, id_tutor_2=%s WHERE id_paciente=%s""",
                    values + (patient_id,),
                )
                if cursor.rowcount == 0:
                    exists = cursor.execute(
                        "SELECT id_paciente FROM paciente WHERE id_paciente=%s",
                        (patient_id,),
                    )
                    if not exists:
                        return jsonify(error="Paciente no encontrado."), 404
        patient = query(PATIENT_SELECT + " WHERE p.id_paciente=%s LIMIT 1", (patient_id,), one=True)
        return jsonify(data=patient) if patient else (jsonify(error="Paciente no encontrado."), 404)
    except Exception as error:
        if getattr(error, "args", [None])[0] == 1062:
            return jsonify(error="Ese DNI ya está registrado para otro paciente."), 409
        if getattr(error, "args", [None])[0] == 1452:
            return jsonify(error="Los tutores deben ser cuentas existentes de padre/madre."), 400
        current_app.logger.exception("Patient update failed")
        return jsonify(error="No se pudo actualizar el paciente."), 500


def create_app():
    return create_service("identity", bp, 3001)


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=3001)
