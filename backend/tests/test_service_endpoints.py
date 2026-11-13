from services.common.security import make_token
from services.clinical.app import create_app as create_clinical_app
from services.coordination.app import create_app as create_coordination_app
from services.identity.app import create_app as create_identity_app


def test_login_rejects_missing_credentials_without_database_access():
    response = create_identity_app().test_client().post(
        "/api/auth/login",
        json={"email": "", "password": ""},
    )

    assert response.status_code == 400
    assert response.json["error"]


def test_protected_clinical_and_coordination_routes_require_authentication():
    clinical = create_clinical_app().test_client()
    coordination = create_coordination_app().test_client()

    vaccine_response = clinical.get("/api/clinical/vaccines")
    notification_response = coordination.get("/api/notifications")

    assert vaccine_response.status_code == 401
    assert notification_response.status_code == 401


def _token(app, user_id, role):
    with app.app_context():
        return make_token({"id_usuario": user_id, "rol": role})


def test_patient_listing_authenticates_and_applies_parent_scope(monkeypatch):
    from services.common import security
    from services.identity import app as identity_module

    app = create_identity_app()
    monkeypatch.setattr(
        security,
        "active_user",
        lambda _user_id: {
            "id_usuario": 9,
            "nombre": "Tutor Ficticio",
            "dni": "12345678",
            "email": "tutor@example.test",
            "rol": "PADRE_MADRE",
            "activo": 1,
        },
    )
    rows = [{"id": 2, "nombre": "Paciente Ficticio", "dni": "87654321"}]
    monkeypatch.setattr(identity_module, "query", lambda *_args, **_kwargs: rows)

    response = app.test_client().get(
        "/api/patients",
        headers={"Authorization": f"Bearer {_token(app, 9, 'PADRE_MADRE')}"},
    )

    assert response.status_code == 200
    assert response.json["data"] == rows


def test_parent_is_denied_doctor_only_consultation_creation(monkeypatch):
    from services.common import security
    from services.clinical import app as clinical_module

    app = create_clinical_app()
    monkeypatch.setattr(
        security,
        "active_user",
        lambda _user_id: {
            "id_usuario": 9,
            "nombre": "Tutor Ficticio",
            "dni": "12345678",
            "email": "tutor@example.test",
            "rol": "PADRE_MADRE",
            "activo": 1,
        },
    )
    monkeypatch.setattr(
        clinical_module,
        "transaction",
        lambda: (_ for _ in ()).throw(AssertionError("database must not be accessed")),
    )

    response = app.test_client().post(
        "/api/consultations",
        headers={"Authorization": f"Bearer {_token(app, 9, 'PADRE_MADRE')}"},
        json={},
    )

    assert response.status_code == 403
    assert response.json["error"]


def test_clinical_vaccine_listing_accepts_a_valid_professional_token(monkeypatch):
    from services.common import security
    from services.clinical import app as clinical_module

    app = create_clinical_app()
    monkeypatch.setattr(
        security,
        "active_user",
        lambda _user_id: {
            "id_usuario": 3,
            "nombre": "Enfermera Ficticia",
            "dni": "11223344",
            "email": "enfermera@example.test",
            "rol": "ENFERMERO",
            "activo": 1,
        },
    )
    from datetime import date

    vaccines = [{
        "id": 1,
        "nombre": "Vacuna ficticia",
        "estado": "Pendiente",
        "fechaAplicacion": date(2026, 1, 2),
    }]
    monkeypatch.setattr(clinical_module, "query", lambda *_args, **_kwargs: vaccines)

    response = app.test_client().get(
        "/api/clinical/vaccines",
        headers={"Authorization": f"Bearer {_token(app, 3, 'ENFERMERO')}"},
    )

    assert response.status_code == 200
    assert response.json["data"][0]["fechaAplicacion"] == "2026-01-02"


def test_reminder_listing_escapes_mysql_time_format_percents(monkeypatch):
    from services.common import security
    from services.clinical import app as clinical_module

    app = create_clinical_app()
    monkeypatch.setattr(
        security,
        "active_user",
        lambda _user_id: {
            "id_usuario": 4,
            "nombre": "Médico Ficticio",
            "dni": "12345678",
            "email": "medico@example.test",
            "rol": "MEDICO",
            "activo": 1,
        },
    )
    monkeypatch.setattr(clinical_module, "_ensure_reminder_window", lambda: None)

    def execute_query(sql, params=(), one=False):
        formatted_sql = sql % tuple("1" for _ in params)
        assert "TIME_FORMAT(r.fecha_hora_programada, '%H:%i')" in formatted_sql
        return []

    monkeypatch.setattr(clinical_module, "query", execute_query)

    response = app.test_client().get(
        "/api/clinical/reminders",
        headers={"Authorization": f"Bearer {_token(app, 4, 'MEDICO')}"},
    )

    assert response.status_code == 200
    assert response.json["data"] == []


def test_openapi_spec_is_available_without_database_access():
    response = create_identity_app().test_client().get("/api/openapi.json")

    assert response.status_code == 200
    assert response.json["openapi"] == "3.0.3"
    assert "/api/clinical/vaccines/{vaccineId}" in response.json["paths"]
