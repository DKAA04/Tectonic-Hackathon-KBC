from datetime import date

from app.policy import project


def test_future_reminder_due_day_and_passed_date():
    state = {"status": "confirmed", "source": "customer", "move_date": "2026-11-15",
             "remind_on": "2026-10-20", "evidence_ids": ["correction-v2"]}
    consent = {"personalization": True, "synthetic_signals": False, "advisor_preview": True}
    evidence = [{"id": "correction-v2", "kind": "customer_correction", "summary": "Synthetic confirmation",
                 "occurred_at": "2026-09-30T17:30:00Z"}]
    _, _, before = project(state, consent, evidence, date(2026, 10, 19))
    assert before["reason_code"] == "REMINDER_NOT_DUE"
    _, _, due = project(state, consent, evidence, date(2026, 10, 20))
    assert due["action"] == "help"
    _, _, past = project(state, consent, evidence, date(2026, 11, 16))
    assert past["reason_code"] == "MOVE_DATE_PASSED"
    assert past["next_steps"] == []
