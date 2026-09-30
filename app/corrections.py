from datetime import date, datetime, timedelta

from app.db import DemoSession
from app.errors import APIError
from app.schemas import Correction, ConsentChange


def invalid_date(field: str, message: str):
    raise APIError(422, "VALIDATION_ERROR", "Request validation failed.", [{"field": field, "message": message}])


def correct(row: DemoSession, change: Correction, now: datetime):
    state = dict(row.state)
    today = now.date()
    if change.action in {"change_date", "set_reminder"} and state["status"] != "confirmed":
        raise APIError(409, "INVALID_TRANSITION", "Confirm a move before editing its date or reminder.")
    if change.action == "cancel":
        state.update(status="cancelled", move_date=None, remind_on=None)
        summary = "Customer cancelled the move."
    else:
        if change.action in {"confirm", "change_date"}:
            if not today <= change.move_date <= today + timedelta(days=730):
                invalid_date("move_date", "Move date must be today through 730 days ahead.")
            state.update(status="confirmed", move_date=change.move_date.isoformat())
        if change.action == "confirm" or "remind_on" in change.model_fields_set:
            state["remind_on"] = change.remind_on.isoformat() if change.remind_on else None
        if state["remind_on"]:
            reminder = date.fromisoformat(state["remind_on"])
            if not today <= reminder <= date.fromisoformat(state["move_date"]):
                invalid_date("remind_on", "Reminder must be today through the move date.")
        if change.action == "confirm":
            summary = f"Customer confirmed a move on {state['move_date']}."
        elif change.action == "change_date":
            summary = f"Customer changed the move date to {state['move_date']}."
        else:
            summary = f"Customer requested moving help on {state['remind_on']}." if state["remind_on"] else "Customer cleared the moving reminder."

    version = row.version + 1
    evidence_id = f"correction-v{version}"
    state.update(source="customer", evidence_ids=[evidence_id])
    row.state = state
    row.version = version
    row.updated_at = now
    row.evidence = row.evidence[-49:] + [{
        "id": evidence_id, "kind": "customer_correction", "summary": summary, "occurred_at": now.isoformat(),
    }]
    row.history = row.history[-49:] + [{
        "version": version, "kind": "correction", "action": change.action,
        "occurred_at": now.isoformat(), "evidence_id": evidence_id,
    }]


def change_consent(row: DemoSession, change: ConsentChange, now: datetime):
    scopes = change.model_dump(exclude_unset=True, exclude={"expected_version"})
    row.consent = {**row.consent, **scopes}
    row.version += 1
    row.updated_at = now
    row.history = row.history[-49:] + [{
        "version": row.version, "kind": "consent", "action": "update",
        "occurred_at": now.isoformat(), "evidence_id": None,
    }]
