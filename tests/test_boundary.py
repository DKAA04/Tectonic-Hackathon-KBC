from dataclasses import replace
from datetime import UTC, datetime, timedelta
from hashlib import sha256

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event

from app.db import DemoSession
from app.main import create_app
from app.security import COOKIE_NAME
from tests.test_journey import start, write, date_in


def test_sessions_are_isolated_and_cannot_address_other_customer(application, client):
    a = start(client)
    with TestClient(application) as second:
        b = start(second)
        assert a["session"]["id"] != b["session"]["id"]
        assert a["session"]["csrf_token"] != b["session"]["csrf_token"]
        cross_csrf = client.post("/api/context/correction", json={"expected_version": 1, "action": "cancel"},
                                 headers={"X-CSRF-Token": b["session"]["csrf_token"]})
        assert cross_csrf.status_code == 403
        assert client.get("/api/context").json() == a
        injection = write(second, b, "/api/consent", personalization=False, session_id=a["session"]["id"])
        assert injection.status_code == 422
        assert second.get("/api/context").json() == b
        assert second.get(f"/api/context/{a['session']['id']}").status_code == 404
        own = second.get("/api/context", params={"customer_id": a["session"]["id"]}).json()
        assert own["session"]["id"] == b["session"]["id"]
        cancelled = write(client, a, "/api/context/correction", action="cancel").json()
        assert cancelled["situation"]["status"] == "cancelled"
        assert second.get("/api/context").json() == b
        assert second.get("/api/advisor-preview").json()["context"] == b
        previous_cookie = client.cookies.get(COOKIE_NAME)
        reset = start(client)
        assert reset["session"]["id"] != a["session"]["id"]
        assert reset["decision"]["action"] == "ask"
        assert second.get("/api/context").json() == b
        with TestClient(application) as original:
            original.cookies.set(COOKIE_NAME, previous_cookie)
            assert original.get("/api/context").json() == cancelled


def test_session_id_is_not_credential_and_database_has_only_hash(application, client):
    initial = start(client)
    credential = client.cookies.get(COOKIE_NAME)
    with application.state.database.sessions() as db:
        row = db.get(DemoSession, initial["session"]["id"])
        assert row.token_hash == sha256(credential.encode()).hexdigest()
        assert row.token_hash != credential
    client.cookies.clear()
    client.cookies.set(COOKIE_NAME, initial["session"]["id"])
    assert client.get("/api/context").status_code == 401


def test_expired_session_fails_reads_and_writes(application, client):
    initial = start(client)
    with application.state.database.sessions.begin() as db:
        row = db.get(DemoSession, initial["session"]["id"])
        row.expires_at = datetime.now(UTC) - timedelta(seconds=1)
    assert client.get("/api/context").status_code == 401
    assert client.get("/api/advisor-preview").status_code == 401
    assert write(client, initial, "/api/context/correction", action="cancel").status_code == 401


def test_csrf_required_and_wrong_token_does_not_change_version(client):
    initial = start(client)
    for token in [None, "wrong", "x" * 129]:
        headers = {} if token is None else {"X-CSRF-Token": token}
        response = client.post("/api/consent", json={"expected_version": 1, "personalization": False}, headers=headers)
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "CSRF_INVALID"
        assert client.get("/api/context").json() == initial


def test_cross_origin_bootstrap_and_writes_are_rejected(client):
    rejected = client.post("/api/demo/session", json={}, headers={"Origin": "https://foreign.example"})
    assert rejected.status_code == 403
    assert COOKIE_NAME not in client.cookies
    initial = start(client)
    foreign = client.post("/api/context/correction", json={"expected_version": 1, "action": "cancel"},
                          headers={"Origin": "https://foreign.example", "X-CSRF-Token": initial["session"]["csrf_token"]})
    assert foreign.status_code == 403
    assert foreign.json()["error"]["code"] == "ORIGIN_FORBIDDEN"
    assert client.get("/api/context").json() == initial
    same = client.post("/api/consent", json={"expected_version": 1, "personalization": False},
                      headers={"Origin": "http://testserver", "X-CSRF-Token": initial["session"]["csrf_token"]})
    assert same.status_code == 200


def test_configured_vite_origin_bootstraps_without_enabling_cors(settings):
    app = create_app(replace(settings, allowed_origins=("http://localhost:5173",)))
    with TestClient(app) as client:
        response = client.post("/api/demo/session", json={}, headers={"Origin": "http://localhost:5173"})
        assert response.status_code == 201
        assert "access-control-allow-origin" not in response.headers


@pytest.mark.parametrize("path,payload", [
    ("/api/demo/session", {"customer_id": "other"}),
    ("/api/consent", {"expected_version": 1}),
    ("/api/consent", {"expected_version": 1, "personalization": "false"}),
    ("/api/consent", {"expected_version": 1, "personalization": 0}),
    ("/api/consent", {"expected_version": 1, "personalization": None}),
    ("/api/consent", {"expected_version": True, "personalization": False}),
    ("/api/context/correction", {"expected_version": 1, "action": "invented"}),
    ("/api/context/correction", {"expected_version": 1, "action": "confirm"}),
    ("/api/context/correction", {"expected_version": 1, "action": "confirm", "move_date": "2026-02-30"}),
    ("/api/context/correction", {"expected_version": 1, "action": "confirm", "move_date": 1800000000}),
    ("/api/context/correction", {"expected_version": 1, "action": "cancel", "move_date": None}),
    ("/api/context/correction", {"expected_version": 1, "action": "set_reminder"}),
    ("/api/context/correction", {"expected_version": 1, "action": "confirm", "move_date": "<script>alert(1)</script>"}),
])
def test_invalid_payloads_are_bounded_structured_and_do_not_mutate(client, path, payload):
    initial = start(client)
    response = client.post(path, json=payload, headers={"X-CSRF-Token": initial["session"]["csrf_token"]})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert "<script>" not in response.text
    for detail in response.json()["error"]["details"]:
        assert set(detail) == {"field", "message"}
    assert client.get("/api/context").json() == initial


@pytest.mark.parametrize("payload", [
    {"action": "confirm", "move_date": date_in(-1)},
    {"action": "confirm", "move_date": date_in(731)},
    {"action": "confirm", "move_date": date_in(30), "remind_on": date_in(31)},
    {"action": "confirm", "move_date": date_in(30), "remind_on": date_in(-1)},
])
def test_out_of_range_dates_do_not_mutate(client, payload):
    initial = start(client)
    response = write(client, initial, "/api/context/correction", **payload)
    assert response.status_code == 422
    assert client.get("/api/context").json() == initial


@pytest.mark.parametrize("payload", [
    {"action": "change_date", "move_date": date_in(30)},
    {"action": "set_reminder", "remind_on": None},
])
def test_unconfirmed_date_edits_are_rejected(client, payload):
    initial = start(client)
    response = write(client, initial, "/api/context/correction", **payload)
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "INVALID_TRANSITION"
    assert client.get("/api/context").json() == initial


def test_json_required_size_limit_and_invalid_json(client):
    assert client.post("/api/demo/session", content="{}", headers={"Content-Type": "text/plain"}).status_code == 415
    oversized = client.post("/api/demo/session", content='{"padding":"' + "x" * 8192 + '"}',
                            headers={"Content-Type": "application/json"})
    assert oversized.status_code == 413
    assert oversized.json()["error"]["code"] == "PAYLOAD_TOO_LARGE"
    malformed = client.post("/api/demo/session", content="{", headers={"Content-Type": "application/json"})
    assert malformed.status_code == 422


def test_health_does_not_report_ready_for_missing_schema(settings):
    app = create_app(settings)

    @event.listens_for(app.state.database.engine, "connect")
    def missing_schema(connection, record):
        with connection.cursor() as cursor:
            cursor.execute("SET search_path TO moment_intentionally_absent_schema")
        connection.commit()

    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.status_code == 503
        assert response.json()["checks"]["database"] == "unavailable"
        unavailable = client.post("/api/demo/session", json={})
        assert unavailable.status_code == 503
        assert unavailable.json()["error"]["code"] == "DATABASE_UNAVAILABLE"
        assert "moment_demo_sessions" not in unavailable.text


def test_production_cookie_is_secure(settings):
    app = create_app(replace(settings, secure_cookie=True))
    with TestClient(app, base_url="https://testserver") as client:
        response = client.post("/api/demo/session", json={})
        assert response.status_code == 201
        assert "Secure" in response.headers["set-cookie"]
        assert client.get("/api/context").status_code == 200
