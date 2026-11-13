import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, send_file
from flask_cors import CORS
from flask.json.provider import DefaultJSONProvider
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_swagger_ui import get_swaggerui_blueprint

from .database import close_db, database_config

BACKEND_ROOT = Path(__file__).resolve().parents[2]
REPOSITORY_ROOT = BACKEND_ROOT.parent
load_dotenv(BACKEND_ROOT / ".env")


class PediaCareJSONProvider(DefaultJSONProvider):
    @staticmethod
    def default(value):
        from datetime import date, datetime, time

        if isinstance(value, datetime):
            return value.strftime("%Y-%m-%d %H:%M:%S")
        if isinstance(value, (date, time)):
            return value.isoformat()
        return DefaultJSONProvider.default(value)


def create_service(name, blueprint, port):
    secret = os.getenv("JWT_SECRET", "")
    environment = os.getenv("APP_ENV", "production").strip().lower()
    if not secret or (len(secret) < 32 and environment != "development"):
        raise RuntimeError(
            "JWT_SECRET debe tener al menos 32 caracteres fuera del entorno development."
        )

    app = Flask(name)
    if len(secret) < 32:
        app.logger.warning(
            "JWT_SECRET corto habilitado solo para desarrollo; no usar con datos reales."
        )
    app.json = PediaCareJSONProvider(app)
    app.config.update(database_config())
    app.config["JWT_SECRET"] = secret
    app.config["MEDICO_REGISTRATION_CODE"] = os.getenv("MEDICO_REGISTRATION_CODE", "")
    app.config["ENFERMERO_REGISTRATION_CODE"] = os.getenv("ENFERMERO_REGISTRATION_CODE", "")
    app.config["MAX_CONTENT_LENGTH"] = 1024 * 1024
    trusted_proxy_count = int(os.getenv("TRUSTED_PROXY_COUNT", "0"))
    if trusted_proxy_count:
        app.wsgi_app = ProxyFix(
            app.wsgi_app,
            x_for=trusted_proxy_count,
            x_proto=trusted_proxy_count,
            x_host=trusted_proxy_count,
        )
    app.teardown_appcontext(close_db)
    app.register_blueprint(blueprint, url_prefix="/api")

    origins = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]
    CORS(app, resources={r"/api/*": {"origins": origins}}, allow_headers=[
        "Authorization", "Content-Type", "X-Registration-Code"
    ], methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])

    app.config["SWAGGER_URL"] = "/api/docs"
    app.config["API_URL"] = "/api/openapi.json"
    app.register_blueprint(
        get_swaggerui_blueprint(
            app.config["SWAGGER_URL"],
            app.config["API_URL"],
            config={"displayRequestDuration": True, "persistAuthorization": True},
        )
    )

    @app.get("/api/openapi.json")
    def openapi_spec():
        return send_file(REPOSITORY_ROOT / "docs" / "openapi.json", mimetype="application/json")

    @app.after_request
    def security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify(error="Recurso no encontrado"), 404

    @app.errorhandler(413)
    def too_large(_error):
        return jsonify(error="El cuerpo de la solicitud supera el tamaño permitido."), 413

    @app.errorhandler(HTTPException)
    def http_error(error):
        return jsonify(error=error.description), error.code

    @app.errorhandler(Exception)
    def unhandled(error):
        app.logger.exception("Unhandled request error")
        return jsonify(error="Ocurrió un error interno."), 500

    app.logger.setLevel(logging.INFO)
    app.config["PORT"] = port
    return app
