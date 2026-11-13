from functools import wraps

import jwt
from flask import current_app, g, jsonify, request

from .database import query

VALID_ROLES = {"MEDICO", "ENFERMERO", "PADRE_MADRE"}


def make_token(user):
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": str(user["id_usuario"]),
            "rol": user["rol"],
            "iat": now,
            "exp": now + timedelta(hours=1),
            "iss": "pedia-care",
            "aud": "pedia-care-api",
        },
        current_app.config["JWT_SECRET"],
        algorithm="HS256",
    )


def active_user(user_id):
    return query(
        """SELECT u.id_usuario, u.nombre, u.dni, u.email, u.rol,
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
           WHERE u.id_usuario = %s LIMIT 1""",
        (user_id,),
        one=True,
    )


def require_auth(*roles):
    def decorate(handler):
        @wraps(handler)
        def wrapped(*args, **kwargs):
            authorization = request.headers.get("Authorization", "")
            scheme, separator, token = authorization.partition(" ")
            if scheme.lower() != "bearer" or not separator or not token:
                return jsonify(error="Se requiere autenticación."), 401
            try:
                payload = jwt.decode(
                    token,
                    current_app.config["JWT_SECRET"],
                    algorithms=["HS256"],
                    issuer="pedia-care",
                    audience="pedia-care-api",
                    options={"require": ["sub", "exp", "iat", "iss", "aud"]},
                )
                user_id = int(payload["sub"])
                role = payload.get("rol")
                if user_id < 1 or role not in VALID_ROLES:
                    raise jwt.InvalidTokenError("invalid identity")
            except (jwt.PyJWTError, TypeError, ValueError):
                return jsonify(error="El token no es válido o expiró."), 401

            try:
                user = active_user(user_id)
            except Exception:
                current_app.logger.exception("Authentication account lookup failed")
                return jsonify(error="No se pudo validar la sesión."), 503

            if not user or not user["activo"] or user["rol"] != role:
                return jsonify(error="La cuenta no está activa o ya no existe."), 401
            g.user = {
                "id": user["id_usuario"],
                "role": user["rol"],
                "name": user["nombre"],
                "dni": user["dni"],
                "email": user["email"],
            }
            if roles and g.user["role"] not in roles:
                return jsonify(error="No tenés permisos para esta acción."), 403
            return handler(*args, **kwargs)

        return wrapped

    return decorate


def require_registration_code():
    from hmac import compare_digest

    expected = {
        "MEDICO": current_app.config.get("MEDICO_REGISTRATION_CODE", ""),
        "ENFERMERO": current_app.config.get("ENFERMERO_REGISTRATION_CODE", ""),
    }.get(g.user["role"], "")
    supplied = request.headers.get("X-Registration-Code", "")
    if not expected or not supplied or not compare_digest(supplied, expected):
        return jsonify(
            error="El código de registro no es válido. Solicitá el código vigente al dueño del software."
        ), 403
    return None
