from fastapi.testclient import TestClient
from dataclasses import replace

from app.main import create_app


def test_spa_navigation_assets_and_api_errors_remain_separate(settings, tmp_path):
    (tmp_path / "index.html").write_text("<!doctype html><title>Synthetic test build</title>")
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "app.js").write_text("console.log('synthetic test asset')")
    app = create_app(replace(settings, frontend_dir=tmp_path))
    with TestClient(app) as client:
        for path in ["/", "/advisor", "/customer/moving"]:
            response = client.get(path, headers={"Accept": "text/html"})
            assert response.status_code == 200
            assert "Synthetic test build" in response.text
        assert client.get("/assets/app.js").status_code == 200
        assert client.get("/assets/missing.js", headers={"Accept": "text/html"}).status_code == 404
        unknown = client.get("/api/unknown", headers={"Accept": "text/html"})
        assert unknown.status_code == 404
        assert unknown.json()["error"]["code"] == "NOT_FOUND"
        assert client.get("/api/health").json()["status"] == "ready"
        assert client.get("/api/context").status_code == 401
        assert client.get("/api/openapi.json").status_code == 200
        assert client.get("/api/docs").status_code == 200
        assert client.get("/api/openapi.json").headers["cache-control"] == "no-store"
        assert client.post("/advisor", json={}).status_code == 405


def test_static_path_traversal_cannot_escape_build_directory(settings, tmp_path):
    dist = tmp_path / "dist"
    dist.mkdir()
    (tmp_path / "outside.txt").write_text("PRIVATE TEST FILE")
    app = create_app(replace(settings, frontend_dir=dist))
    with TestClient(app) as client:
        response = client.get("/%2e%2e/outside.txt")
        assert response.status_code == 404
        assert "PRIVATE TEST FILE" not in response.text
