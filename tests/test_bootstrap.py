from fastapi.testclient import TestClient

from app.main import create_app


def test_readiness_queries_database(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "api_version": "1", "status": "ready", "checks": {"database": "ready"}, "synthetic_only": True,
    }


def test_bootstrap_and_refresh_persist_same_synthetic_context(client, settings):
    response = client.post("/api/demo/session", json={})
    assert response.status_code == 201
    assert "HttpOnly" in response.headers["set-cookie"]
    assert "SameSite=lax" in response.headers["set-cookie"]
    context = response.json()
    assert context["version"] == 1
    assert context["session"]["synthetic"] is True
    assert context["decision"]["action"] == "ask"
    assert context["situation"]["status"] == "tentative"
    assert context["decision"]["evidence_ids"] == [item["id"] for item in context["evidence"]]
    assert client.get("/api/context").json() == context
    restarted = create_app(settings)
    with TestClient(restarted) as other:
        other.cookies.update(client.cookies)
        assert other.get("/api/context").json() == context
        assert other.get("/api/advisor-preview").json()["context"] == context


def test_context_requires_cookie(client):
    response = client.get("/api/context")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "SESSION_REQUIRED"
