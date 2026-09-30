"""Check the deployed same-origin app; credentials remain in memory, never output."""
import argparse
from datetime import UTC, datetime, timedelta
from http.cookiejar import CookieJar
import json
import re
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import HTTPCookieProcessor, Request, build_opener


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("origin", help="Public HTTPS origin, without a path.")
    origin = parser.parse_args().origin.rstrip("/")
    parsed = urlsplit(origin)
    if parsed.scheme != "https" or parsed.path or parsed.username or parsed.query or parsed.fragment:
        raise SystemExit("Supply a public HTTPS origin without credentials or a path.")

    def browser():
        opener = build_opener(HTTPCookieProcessor(CookieJar()))

        def request(path, payload=None, csrf=None, request_origin=None):
            headers = {"Origin": request_origin or origin, "Accept": "application/json"}
            if csrf:
                headers["X-CSRF-Token"] = csrf
            data = None if payload is None else json.dumps(payload).encode()
            if data is not None:
                headers["Content-Type"] = "application/json"
            try:
                response = opener.open(Request(origin + path, data=data, headers=headers), timeout=15)
            except HTTPError as error:
                response = error
            with response:
                return response.code, json.load(response), response.headers

        return request

    first, second = browser(), browser()
    status, health, _ = first("/api/health")
    assert status == 200 and health["checks"]["database"] == "ready"
    assert first("/api/context")[0] == 401
    status, c, headers = first("/api/demo/session", {})
    assert status == 201 and c["decision"]["action"] == "ask"
    cookie = headers.get("Set-Cookie", "").lower()
    assert all(flag in cookie for flag in ("secure", "httponly", "samesite=lax"))
    assert headers.get("Cache-Control") == "no-store"
    first_id = c["session"]["id"]
    today = datetime.now(UTC).date()
    date = lambda days: (today + timedelta(days=days)).isoformat()

    def agrees(context):
        assert first("/api/context")[1] == context
        status, advisor, _ = first("/api/advisor-preview")
        assert status == 200 and advisor["context"] == context
        assert advisor["read_only"] is True
        evidence = {item["id"] for item in context["evidence"]}
        refs = context["situation"]["evidence_ids"] + context["decision"]["evidence_ids"]
        refs += [ref for step in context["decision"]["next_steps"] for ref in step["evidence_ids"]]
        assert set(refs) <= evidence

    def correction(action, **fields):
        nonlocal c
        status, updated, _ = first("/api/context/correction", {
            "expected_version": c["version"], "action": action, **fields,
        }, c["session"]["csrf_token"])
        assert status == 200 and updated["version"] == c["version"] + 1
        c = updated
        agrees(c)

    invalid = {"expected_version": c["version"], "action": "cancel"}
    assert first("/api/context/correction", invalid)[0] == 403
    assert first("/api/context/correction", invalid, c["session"]["csrf_token"], "https://foreign.invalid")[0] == 403
    correction("confirm", move_date=date(45))
    assert c["decision"]["action"] == "help" and len(c["decision"]["next_steps"]) == 2
    correction("change_date", move_date=date(60))
    assert c["situation"]["move_date"] == date(60)
    correction("set_reminder", remind_on=date(10))
    assert c["decision"]["reason_code"] == "REMINDER_NOT_DUE" and c["decision"]["next_steps"] == []
    correction("set_reminder", remind_on=None)
    assert c["decision"]["action"] == "help"
    assert first("/api/context/correction", {"expected_version": 1, "action": "cancel"}, c["session"]["csrf_token"])[0] == 409
    agrees(c)
    correction("cancel")
    assert c["decision"]["reason_code"] == "MOVE_CANCELLED" and c["decision"]["next_steps"] == []

    def consent(**fields):
        nonlocal c
        status, c, _ = first("/api/consent", {
            "expected_version": c["version"], **fields,
        }, c["session"]["csrf_token"])
        assert status == 200
        assert first("/api/context")[1] == c

    consent(personalization=False)
    assert c["decision"]["reason_code"] == "PERSONALIZATION_DISABLED" and c["evidence"] == []
    agrees(c)
    consent(personalization=True, synthetic_signals=False)
    assert c["situation"]["status"] == "cancelled"
    assert all(item["kind"] == "customer_correction" for item in c["evidence"])
    agrees(c)
    consent(advisor_preview=False)
    assert first("/api/advisor-preview")[0] == 403

    status, isolated, _ = second("/api/demo/session", {})
    assert status == 201 and isolated["decision"]["action"] == "ask"
    assert isolated["session"]["id"] != first_id
    assert second("/api/context/correction", {
        "expected_version": isolated["version"], "action": "cancel",
    }, c["session"]["csrf_token"])[0] == 403
    assert second("/api/context")[1] == isolated
    second("/api/demo/session", {})
    assert first("/api/context")[1] == c
    assert first("/api/unknown")[0] == 404

    def asset(path, accept="*/*"):
        with build_opener().open(Request(origin + path, headers={"Accept": accept}), timeout=15) as response:
            assert response.code == 200
            return response.read()

    html = asset("/", "text/html").decode()
    assert "<!doctype html" in html.lower() and asset("/advisor", "text/html").decode() == html
    javascript = re.search(r'src="(/assets/[^\"]+\.js)"', html)
    stylesheet = re.search(r'href="(/assets/[^\"]+\.css)"', html)
    assert javascript and stylesheet
    bundle = asset(javascript.group(1)).decode()
    assert "Plan my move" in bundle and "Help at the right time" in bundle
    assert asset(stylesheet.group(1)) and b"<svg" in asset("/kbc-logo.svg")
    print("HTTPS API checks passed: ready, ask/help, date correction, reminder pause/resume, cancellation, consent, refresh, advisor agreement, CSRF/version/origin controls and isolated sessions.")
    print("Production asset checks passed: redesigned bundle, CSS, logo and navigation. These are HTTP checks, not browser interaction or visual checks.")


if __name__ == "__main__":
    main()
