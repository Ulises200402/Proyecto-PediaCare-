import os
import uuid

import pymysql
import pytest

from services.identity.app import create_app


@pytest.fixture(scope="module")
def e2e_app():
    if os.getenv("PEDIACARE_E2E") != "1":
        pytest.skip("Set PEDIACARE_E2E=1 to enable MySQL-backed E2E tests.")

    app = create_app()
    database_name = app.config["DB_NAME"]
    if not database_name.casefold().endswith("_test"):
        pytest.fail("Database-backed E2E requires DB_NAME to end in _test.")

    with _connect(app) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT DATABASE()")
            assert cursor.fetchone()[0] == database_name

    return app


def _connect(app):
    return pymysql.connect(
        host=app.config["DB_HOST"],
        port=app.config["DB_PORT"],
        user=app.config["DB_USER"],
        password=app.config["DB_PASSWORD"],
        database=app.config["DB_NAME"],
        charset="utf8mb4",
        connect_timeout=5,
    )


def _account_payload():
    suffix = uuid.uuid4().hex
    dni = str(int(suffix[:8], 16) % 100_000_000).zfill(8)
    return {
        "nombre": "Cuenta E2E Ficticia",
        "dni": dni,
        "email": f"pediacare-e2e-{suffix}@example.test",
        "password": "SyntheticPassw0rd!",
        "role": "PADRE_MADRE",
    }


def _remove_account(app, email):
    with _connect(app) as connection:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM usuario WHERE email = %s", (email,))
        connection.commit()


def test_parent_registration_login_and_identity_round_trip(e2e_app):
    client = e2e_app.test_client()
    account = _account_payload()
    try:
        registration = client.post("/api/auth/register", json=account)
        assert registration.status_code == 201

        login = client.post(
            "/api/auth/login",
            json={"email": account["email"], "password": account["password"]},
        )
        assert login.status_code == 200

        identity = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {login.json['token']}"},
        )
        assert identity.status_code == 200
        assert identity.json["email"] == account["email"]
        assert identity.json["role"] == "PADRE_MADRE"
    finally:
        _remove_account(e2e_app, account["email"])


def test_duplicate_registration_is_rejected_without_duplicate_account(e2e_app):
    client = e2e_app.test_client()
    account = _account_payload()
    duplicate = {**account, "dni": str((int(account["dni"]) + 1) % 100_000_000).zfill(8)}
    try:
        first = client.post("/api/auth/register", json=account)
        assert first.status_code == 201

        second = client.post("/api/auth/register", json=duplicate)
        assert second.status_code == 409

        with _connect(e2e_app) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT COUNT(*) FROM usuario WHERE email = %s",
                    (account["email"],),
                )
                assert cursor.fetchone()[0] == 1
    finally:
        _remove_account(e2e_app, account["email"])
