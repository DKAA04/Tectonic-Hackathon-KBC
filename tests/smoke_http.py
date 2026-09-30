"""Exercise an actual Uvicorn process against pg_virtualenv, without printing credentials."""
from datetime import UTC, datetime, timedelta
from http.cookiejar import CookieJar
import json
import os
import socket
import subprocess
import sys
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.request import HTTPCookieProcessor, Request, build_opener


def main():
    if not os.getenv("PGHOST"):
        raise SystemExit("Run: pg_virtualenv .venv/bin/python tests/smoke_http.py")
    image = sys.argv[2] if len(sys.argv) == 3 and sys.argv[1] == "--container" else None
    if sys.argv[1:] and image is None:
        raise SystemExit("Usage: smoke_http.py [--container LOCAL_IMAGE]")
    env = dict(os.environ)
    env.pop("DATABASE_URL", None)
    env.pop("RAILWAY_ENVIRONMENT_ID", None)
    env["APP_ENV"] = "development"
    with socket.socket() as available:
        available.bind(("127.0.0.1", 0))
        port = available.getsockname()[1]
    if image is None:
        subprocess.run([sys.executable, "-m", "app.db", "init"], env=env, check=True)
    origin = f"http://127.0.0.1:{port}"
    browser = build_opener(HTTPCookieProcessor(CookieJar()))

    def request(path, payload=None, csrf=None):
        headers = {"Origin": origin}
        data = None if payload is None else json.dumps(payload).encode()
        if data is not None:
            headers["Content-Type"] = "application/json"
        if csrf:
            headers["X-CSRF-Token"] = csrf
        try:
            with browser.open(Request(origin + path, data=data, headers=headers), timeout=5) as response:
                return response.status, json.load(response)
        except HTTPError as error:
            return error.code, json.load(error)

    with tempfile.TemporaryFile() as log:
        container_name = f"kbc-moment-smoke-{port}"
        command = [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(port)]
        if image:
            command = ["docker", "run", "--rm", "--network", "host", "--name", container_name,
                       "--env", "PGHOST", "--env", "PGPORT", "--env", "PGUSER", "--env", "PGPASSWORD",
                       "--env", "PGDATABASE", "--env", "APP_ENV=development", "--env", f"PORT={port}", image]
        server = subprocess.Popen(command, env=env, stdout=log, stderr=log)
        try:
            for attempt in range(50):
                if server.poll() is not None:
                    raise RuntimeError("Uvicorn stopped before readiness.")
                try:
                    status, health = request("/api/health")
                    if status == 200:
                        break
                except (URLError, ConnectionError):
                    pass
                time.sleep(0.1)
            else:
                raise RuntimeError("Uvicorn did not become ready.")
            assert health["checks"]["database"] == "ready"
            status, context = request("/api/demo/session", {})
            assert status == 201 and context["decision"]["action"] == "ask"
            csrf = context["session"]["csrf_token"]
            move_date = (datetime.now(UTC).date() + timedelta(days=45)).isoformat()
            status, confirmed = request("/api/context/correction", {"expected_version": 1, "action": "confirm", "move_date": move_date}, csrf)
            assert status == 200 and confirmed["decision"]["action"] == "help"
            status, advisor = request("/api/advisor-preview")
            assert status == 200 and advisor["context"] == confirmed
            status, cancelled = request("/api/context/correction", {"expected_version": 2, "action": "cancel"}, csrf)
            assert status == 200 and cancelled["decision"]["reason_code"] == "MOVE_CANCELLED"
            status, revoked = request("/api/consent", {"expected_version": 3, "personalization": False}, csrf)
            assert status == 200 and revoked["decision"]["reason_code"] == "PERSONALIZATION_DISABLED"
            assert revoked["evidence"] == [] and revoked["decision"]["next_steps"] == []
            assert request("/api/context")[1] == revoked
            assert request("/api/advisor-preview")[1]["context"] == revoked
            print(f"{'Container' if image else 'Uvicorn'} HTTP smoke passed: ready -> ask -> help -> cancel -> revoke -> persisted customer/advisor equality.")
        finally:
            if image:
                subprocess.run(["docker", "stop", "--time", "3", container_name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=10)
            else:
                server.terminate()
            server.wait(timeout=10)


if __name__ == "__main__":
    main()
