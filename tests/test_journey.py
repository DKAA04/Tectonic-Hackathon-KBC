from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from threading import Barrier

from fastapi.testclient import TestClient


def date_in(days):
    return (datetime.now(UTC).date() + timedelta(days=days)).isoformat()


def start(client):
    response = client.post("/api/demo/session", json={})
    assert response.status_code == 201
    return response.json()


def write(client, context, path, **payload):
    return client.post(path, json={"expected_version": context["version"], **payload},
                       headers={"X-CSRF-Token": context["session"]["csrf_token"]})


def assert_evidence_links(context):
    ids = {entry["id"] for entry in context["evidence"]}
    assert set(context["situation"]["evidence_ids"]) <= ids
    assert set(context["decision"]["evidence_ids"]) <= ids
    for step in context["decision"]["next_steps"]:
        assert step["evidence_ids"]
        assert set(step["evidence_ids"]) <= ids
    for item in context["history"]:
        assert item["evidence_id"] is None or item["evidence_id"] in ids


def test_confirm_cancel_both_channels_and_reload(client, application):
    initial = start(client)
    confirmed = write(client, initial, "/api/context/correction", action="confirm", move_date=date_in(45))
    assert confirmed.status_code == 200
    confirmed = confirmed.json()
    assert confirmed["version"] == 2
    assert confirmed["situation"]["status"] == "confirmed"
    assert confirmed["decision"]["action"] == "help"
    assert confirmed["decision"]["evidence_ids"] == ["correction-v2"]
    assert len(confirmed["decision"]["next_steps"]) == 2
    assert_evidence_links(confirmed)
    assert client.get("/api/advisor-preview").json()["context"] == confirmed
    cancelled = write(client, confirmed, "/api/context/correction", action="cancel")
    assert cancelled.status_code == 200
    cancelled = cancelled.json()
    assert cancelled["version"] == 3
    assert cancelled["situation"]["status"] == "cancelled"
    assert cancelled["situation"]["move_date"] is None
    assert cancelled["decision"]["reason_code"] == "MOVE_CANCELLED"
    assert cancelled["decision"]["next_steps"] == []
    assert_evidence_links(cancelled)
    assert client.get("/api/context").json() == cancelled
    assert client.get("/api/advisor-preview").json()["context"] == cancelled
    # Fresh client/application request using the original browser's cookie.
    with TestClient(application) as reloaded:
        reloaded.cookies.update(client.cookies)
        assert reloaded.get("/api/context").json() == cancelled


def test_cancel_cannot_be_overridden_by_stale_confirmation(client):
    initial = start(client)
    cancelled = write(client, initial, "/api/context/correction", action="cancel").json()
    stale = write(client, initial, "/api/context/correction", action="confirm", move_date=date_in(30))
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "VERSION_CONFLICT"
    assert client.get("/api/context").json() == cancelled


def test_revocation_filters_both_channels_and_restoration_preserves_cancellation(client):
    initial = start(client)
    cancelled = write(client, initial, "/api/context/correction", action="cancel").json()
    revoked = write(client, cancelled, "/api/consent", personalization=False)
    assert revoked.status_code == 200
    revoked = revoked.json()
    assert revoked["evidence"] == []
    assert revoked["situation"]["status"] == "cancelled"
    assert revoked["situation"]["evidence_ids"] == []
    assert revoked["decision"] == {
        "action": "suppress", "reason_code": "PERSONALIZATION_DISABLED", "message": "Personalization is off.",
        "evidence_ids": [], "next_steps": [],
    }
    assert_evidence_links(revoked)
    assert client.get("/api/advisor-preview").json()["context"] == revoked
    assert client.get("/api/context").json() == revoked
    restored = write(client, revoked, "/api/consent", personalization=True).json()
    assert restored["situation"]["status"] == "cancelled"
    assert restored["decision"]["reason_code"] == "MOVE_CANCELLED"


def test_signal_scope_is_applied_before_inference_and_explicit_intent_still_works(client):
    initial = start(client)
    revoked = write(client, initial, "/api/consent", synthetic_signals=False).json()
    assert revoked["situation"]["status"] == "unknown"
    assert revoked["evidence"] == []
    assert revoked["decision"]["reason_code"] == "NO_ALLOWED_EVIDENCE"
    assert client.get("/api/advisor-preview").json()["context"] == revoked
    confirmed = write(client, revoked, "/api/context/correction", action="confirm", move_date=date_in(30)).json()
    assert confirmed["decision"]["action"] == "help"
    assert all(item["kind"] == "customer_correction" for item in confirmed["evidence"])
    assert_evidence_links(confirmed)


def test_correction_while_personalization_off_is_persisted(client):
    initial = start(client)
    revoked = write(client, initial, "/api/consent", personalization=False).json()
    assert revoked["situation"]["status"] == "unknown"
    confirmed = write(client, revoked, "/api/context/correction", action="confirm", move_date=date_in(30)).json()
    assert confirmed["situation"]["status"] == "confirmed"
    assert confirmed["decision"]["action"] == "suppress"
    assert confirmed["evidence"] == []
    enabled = write(client, confirmed, "/api/consent", personalization=True).json()
    assert enabled["decision"]["action"] == "help"
    assert enabled["situation"]["move_date"] == date_in(30)


def test_advisor_consent_revocation_and_get_only(client):
    initial = start(client)
    revoked = write(client, initial, "/api/consent", advisor_preview=False).json()
    forbidden = client.get("/api/advisor-preview")
    assert forbidden.status_code == 403
    assert forbidden.json()["error"]["code"] == "ADVISOR_CONSENT_REQUIRED"
    assert client.get("/api/context").json() == revoked
    mutation = client.post("/api/advisor-preview", json={})
    assert mutation.status_code == 405
    assert mutation.json()["error"]["code"] == "METHOD_NOT_ALLOWED"


def test_date_changes_reminder_pause_and_clear(client):
    initial = start(client)
    confirmed = write(client, initial, "/api/context/correction", action="confirm", move_date=date_in(45)).json()
    changed = write(client, confirmed, "/api/context/correction", action="change_date", move_date=date_in(60)).json()
    assert changed["situation"]["move_date"] == date_in(60)
    paused = write(client, changed, "/api/context/correction", action="set_reminder", remind_on=date_in(15)).json()
    assert paused["decision"]["reason_code"] == "REMINDER_NOT_DUE"
    assert paused["decision"]["next_steps"] == []
    assert client.get("/api/advisor-preview").json()["context"] == paused
    invalid = write(client, paused, "/api/context/correction", action="change_date", move_date=date_in(10))
    assert invalid.status_code == 422
    assert client.get("/api/context").json() == paused
    cleared = write(client, paused, "/api/context/correction", action="set_reminder", remind_on=None).json()
    assert cleared["decision"]["action"] == "help"
    assert_evidence_links(cleared)


def test_simultaneous_writes_have_one_winner(application, client):
    initial = start(client)
    barrier = Barrier(2)

    def submit(action):
        with TestClient(application) as browser:
            browser.cookies.update(client.cookies)
            barrier.wait(timeout=5)
            payload = {"action": action}
            if action == "confirm":
                payload["move_date"] = date_in(30)
            return write(browser, initial, "/api/context/correction", **payload)

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(submit, ["confirm", "cancel"]))
    assert sorted(result.status_code for result in results) == [200, 409]
    winner = next(result.json() for result in results if result.status_code == 200)
    persisted = client.get("/api/context").json()
    assert persisted == winner
    assert persisted["version"] == 2
    assert len(persisted["history"]) == 1
