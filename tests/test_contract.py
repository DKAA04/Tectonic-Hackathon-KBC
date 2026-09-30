from datetime import UTC, datetime
import json
from pathlib import Path
import re

from app.schemas import AdvisorPreview, Context, ErrorEnvelope
from tests.test_journey import write


def examples():
    text = (Path(__file__).resolve().parents[1] / "docs" / "API_CONTRACT.md").read_text()
    return [json.loads(block) for block in re.findall(r"```json\n(.*?)\n```", text, flags=re.S)]


def test_published_examples_match_wire_response(client, monkeypatch):
    blocks = examples()
    initial_example = next(block for block in blocks if "session" in block)
    confirm_payload = next(block for block in blocks if block.get("action") == "confirm")
    confirmed_fragment = next(block for block in blocks if "situation" in block and "session" not in block)
    advisor_example = next(block for block in blocks if "preview_label" in block)
    error_example = next(block for block in blocks if "error" in block)
    Context.model_validate(initial_example)
    AdvisorPreview.model_validate(advisor_example)
    ErrorEnvelope.model_validate(error_example)

    instant = [datetime(2026, 9, 30, 17, 30, tzinfo=UTC)]
    monkeypatch.setattr("app.main.utcnow", lambda: instant[0])
    response = client.post("/api/demo/session", json={})
    assert response.status_code == 201
    initial = response.json()
    initial_example["session"]["id"] = initial["session"]["id"]
    initial_example["session"]["csrf_token"] = initial["session"]["csrf_token"]
    assert initial == initial_example

    instant[0] = datetime(2026, 9, 30, 17, 31, tzinfo=UTC)
    confirmed = write(client, initial, "/api/context/correction", **{k: v for k, v in confirm_payload.items() if k != "expected_version"}).json()
    assert {field: confirmed[field] for field in confirmed_fragment} == confirmed_fragment
    instant[0] = datetime(2026, 9, 30, 17, 32, tzinfo=UTC)
    revoked = write(client, confirmed, "/api/consent", personalization=False).json()
    advisor_example["context"]["session"]["id"] = initial["session"]["id"]
    advisor_example["context"]["session"]["csrf_token"] = initial["session"]["csrf_token"]
    actual = client.get("/api/advisor-preview").json()
    assert actual == advisor_example
    assert actual["context"] == revoked


def test_openapi_documents_cookie_csrf_and_error_envelope(client):
    schema = client.get("/api/openapi.json").json()
    cookie = schema["components"]["securitySchemes"]["DemoSessionCookie"]
    assert cookie == {"type": "apiKey", "in": "cookie", "name": "kbc_moment_session"}
    operation = schema["paths"]["/api/context/correction"]["post"]
    assert operation["security"] == [{"DemoSessionCookie": []}]
    assert any(item["name"] == "X-CSRF-Token" and item["required"] for item in operation["parameters"])
    assert operation["responses"]["422"]["content"]["application/json"]["schema"]["$ref"].endswith("/ErrorEnvelope")
