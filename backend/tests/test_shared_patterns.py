import pytest
from flask import Blueprint

from services.common.access import patient_access_filter
from services.common.events import NotificationEventBus
from services.common.app import create_service


def test_patient_access_strategy_scopes_parents_but_not_professionals():
    clause, params = patient_access_filter(
        {"id": 12, "role": "PADRE_MADRE"}
    )
    unrestricted_clause, unrestricted_params = patient_access_filter(
        {"id": 4, "role": "MEDICO"}
    )

    assert clause == " AND (p.id_tutor_1=%s OR p.id_tutor_2=%s)"
    assert params == (12, 12)
    assert unrestricted_clause == ""
    assert unrestricted_params == ()


def test_notification_observers_receive_events_in_registration_order():
    bus = NotificationEventBus()
    received = []
    bus.subscribe(lambda _connection, event: received.append(("first", event["kind"])))
    bus.subscribe(lambda _connection, event: received.append(("second", event["kind"])))

    bus.publish(None, {"kind": "consulta"})

    assert received == [("first", "consulta"), ("second", "consulta")]


def test_short_jwt_secret_is_allowed_only_in_development(monkeypatch, caplog):
    monkeypatch.setenv("JWT_SECRET", "1234")
    monkeypatch.setenv("APP_ENV", "development")

    app = create_service("test-development", Blueprint("development", __name__), 3100)

    assert app.config["JWT_SECRET"] == "1234"
    assert "solo para desarrollo" in caplog.text


def test_short_jwt_secret_is_rejected_outside_development(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "1234")
    monkeypatch.setenv("APP_ENV", "production")

    with pytest.raises(RuntimeError, match="32 caracteres"):
        create_service("test-production", Blueprint("production", __name__), 3101)


def test_authenticated_api_access_is_logged_without_request_payload(caplog, monkeypatch):
    import logging

    from services.common import security
    from services.common.security import make_token
    from services.identity.app import create_app as create_identity_app

    monkeypatch.setenv("JWT_SECRET", "test-secret-with-at-least-thirty-two-characters")
    app = create_identity_app()
    user = {
        "id_usuario": 8,
        "nombre": "Tutor Ficticio",
        "dni": "12345678",
        "email": "tutor@example.test",
        "rol": "PADRE_MADRE",
        "activo": 1,
    }
    monkeypatch.setattr(security, "active_user", lambda _user_id: user)
    with app.app_context():
        token = make_token(user)

    with caplog.at_level(logging.INFO, logger=app.logger.name):
        response = app.test_client().get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

    audit_lines = [
        record.getMessage()
        for record in caplog.records
        if "audit actor_id=" in record.getMessage()
    ]
    assert response.status_code == 200
    assert len(audit_lines) == 1
    assert "actor_id=8" in audit_lines[0]
    assert "actor_role=PADRE_MADRE" in audit_lines[0]
    assert "endpoint=identity.current_user" in audit_lines[0]
    assert "method=GET" in audit_lines[0]
    assert "status=200" in audit_lines[0]
    assert token not in audit_lines[0]
    assert user["email"] not in audit_lines[0]
    assert user["nombre"] not in audit_lines[0]
