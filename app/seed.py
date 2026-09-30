from datetime import datetime, timedelta
import json

from app.config import ROOT


def seed_evidence(now: datetime) -> list[dict]:
    fixture = json.loads((ROOT / "fixtures" / "moving.json").read_text())
    if fixture["synthetic"] is not True:
        raise ValueError("Only synthetic fixtures are permitted.")
    return [{
        "id": signal["id"], "kind": signal["kind"], "summary": signal["summary"],
        "occurred_at": (now - timedelta(days=signal["days_ago"])).isoformat(),
    } for signal in fixture["signals"]]
