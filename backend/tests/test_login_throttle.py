import hashlib

import bcrypt

from services.identity import app as identity_module


def test_locked_login_returns_temporary_block_before_checking_credentials(monkeypatch):
    app = identity_module.create_app()
    queries = []

    def locked_query(sql, _params=(), one=False):
        queries.append(sql)
        return {"locked_until": "later"} if one else []

    monkeypatch.setattr(identity_module, "query", locked_query)

    response = app.test_client().post(
        "/api/auth/login",
        json={"email": "tutor@example.test", "password": "Fictitious-password"},
    )

    assert response.status_code == 429
    assert "15 minutos" in response.json["error"]
    assert len(queries) == 1
    assert "login_throttle" in queries[0]


def test_failed_login_records_only_hashed_email_and_ip_scopes(monkeypatch):
    app = identity_module.create_app()
    recorded = []
    monkeypatch.setattr(identity_module, "query", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(identity_module, "_record_login_failure", recorded.append)
    monkeypatch.setattr(bcrypt, "hashpw", lambda *_args: b"dummy-hash")
    monkeypatch.setattr(bcrypt, "checkpw", lambda *_args: False)

    response = app.test_client().post(
        "/api/auth/login",
        json={"email": "Tutor@Example.Test", "password": "Fictitious-password"},
        environ_base={"REMOTE_ADDR": "192.0.2.10"},
    )

    assert response.status_code == 401
    assert len(recorded) == 1
    scopes = recorded[0]
    assert scopes[0][0] == hashlib.sha256(b"email\0tutor@example.test").hexdigest()
    assert scopes[0][1] == 5
    assert scopes[1][0] == hashlib.sha256(b"ip\x00192.0.2.10").hexdigest()
    assert scopes[1][1] == 20
    assert "tutor@example.test" not in repr(scopes)
    assert "192.0.2.10" not in repr(scopes)
