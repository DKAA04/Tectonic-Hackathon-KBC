"""Deterministic policy; consent filters evidence before inference and delivery."""
from datetime import date


def project(state: dict, consent: dict, evidence: list[dict], today: date):
    permitted = [] if not consent["personalization"] else [
        item for item in evidence
        if item["kind"] == "customer_correction" or consent["synthetic_signals"]
    ]
    ids = {item["id"] for item in permitted}
    references = [item for item in state.get("evidence_ids", []) if item in ids]
    situation = {
        "type": "moving", "status": state["status"], "move_date": state["move_date"],
        "remind_on": state["remind_on"], "source": state["source"], "evidence_ids": references,
    }
    if state["source"] != "customer":
        references = [item["id"] for item in permitted if item["kind"] == "synthetic_signal"]
        situation.update(status="tentative" if references else "unknown",
                         source="synthetic_signals" if references else "none", evidence_ids=references)

    decision = {"action": "suppress", "reason_code": "NO_ALLOWED_EVIDENCE",
                "message": "There is no permitted evidence to suggest a move.",
                "evidence_ids": [], "next_steps": []}
    if not consent["personalization"]:
        decision.update(reason_code="PERSONALIZATION_DISABLED", message="Personalization is off.")
    elif state["status"] == "cancelled":
        decision.update(reason_code="MOVE_CANCELLED",
                        message="Your move is cancelled. Moving suggestions have been withdrawn.",
                        evidence_ids=references)
    elif state["status"] == "confirmed":
        move_date = date.fromisoformat(state["move_date"])
        reminder = date.fromisoformat(state["remind_on"]) if state["remind_on"] else None
        decision["evidence_ids"] = references
        if move_date < today:
            decision.update(reason_code="MOVE_DATE_PASSED",
                            message="Your move date has passed. Update it to receive relevant help.")
        elif reminder and reminder > today:
            decision.update(reason_code="REMINDER_NOT_DUE",
                            message=f"Moving help is paused until {reminder.isoformat()}.")
        else:
            decision.update(action="help", reason_code="CONFIRMED_MOVE",
                            message=f"Prepare for your move on {move_date.isoformat()}.",
                            next_steps=[
                                {"id": "moving-admin", "title": "Prepare your address update checklist",
                                 "description": "List the organisations to notify when your move is confirmed. No address is changed by this demo.",
                                 "due_on": state["move_date"], "evidence_ids": references},
                                {"id": "moving-insurance", "title": "Review what your home cover needs for the move",
                                 "description": "Prepare questions about your move date and home cover for an advisor. No product is bought or changed.",
                                 "due_on": state["move_date"], "evidence_ids": references},
                            ])
    elif references:
        decision.update(action="ask", reason_code="AMBIGUOUS_SIGNALS",
                        message="Are you planning a move?", evidence_ids=references)
    return situation, permitted[-50:], decision
