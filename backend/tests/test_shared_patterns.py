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
