from services.identity.app import _account_payload, _patient_payload


def test_registration_rejects_short_dni_and_password():
    account, errors = _account_payload({
        "nombre": "Persona Ficticia",
        "dni": "123",
        "email": "persona@example.test",
        "password": "short",
        "role": "PADRE_MADRE",
    })

    assert account is None
    assert "dni" in errors
    assert "password" in errors


def test_patient_payload_rejects_duplicate_tutors():
    patient = _patient_payload({
        "nombre": "Paciente de Prueba",
        "dni": "12345678",
        "fechaNacimiento": "2020-01-01",
        "sexo": "Otro",
        "idTutor1": 5,
        "idTutor2": 5,
    })

    assert patient is None

