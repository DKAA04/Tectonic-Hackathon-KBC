from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictInt


class RequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Bootstrap(RequestModel):
    pass


class Consent(BaseModel):
    personalization: bool
    synthetic_signals: bool
    advisor_preview: bool


class SessionInfo(BaseModel):
    id: str
    synthetic: Literal[True] = True
    expires_at: datetime
    csrf_token: str


class Customer(BaseModel):
    display_name: Literal["Alex"] = "Alex"
    synthetic: Literal[True] = True


class Evidence(BaseModel):
    id: str
    kind: Literal["synthetic_signal", "customer_correction"]
    summary: str
    occurred_at: datetime


class Situation(BaseModel):
    type: Literal["moving"] = "moving"
    status: Literal["unknown", "tentative", "confirmed", "cancelled"]
    move_date: date | None
    remind_on: date | None
    source: Literal["none", "synthetic_signals", "customer"]
    evidence_ids: list[str]


class NextStep(BaseModel):
    id: str
    title: str
    description: str
    due_on: date
    evidence_ids: list[str]


class Decision(BaseModel):
    action: Literal["ask", "help", "suppress"]
    reason_code: Literal[
        "PERSONALIZATION_DISABLED", "MOVE_CANCELLED", "REMINDER_NOT_DUE",
        "MOVE_DATE_PASSED", "NO_ALLOWED_EVIDENCE", "AMBIGUOUS_SIGNALS", "CONFIRMED_MOVE",
    ]
    message: str
    evidence_ids: list[str]
    next_steps: list[NextStep]


class HistoryEntry(BaseModel):
    version: int
    kind: Literal["correction", "consent"]
    action: Literal["confirm", "cancel", "change_date", "set_reminder", "update"]
    occurred_at: datetime
    evidence_id: str | None


class Context(BaseModel):
    api_version: Literal["1"] = "1"
    session: SessionInfo
    customer: Customer = Field(default_factory=Customer)
    version: int
    updated_at: datetime
    consent: Consent
    situation: Situation
    evidence: list[Evidence]
    decision: Decision
    history: list[HistoryEntry]


class AdvisorPreview(BaseModel):
    api_version: Literal["1"] = "1"
    read_only: Literal[True] = True
    preview_label: str = "Advisor demo preview — synthetic session, not bank staff access"
    context: Context


class Correction(RequestModel):
    expected_version: StrictInt = Field(ge=1)
    action: Literal["confirm", "cancel", "change_date", "set_reminder"]
    move_date: date | None = None
    remind_on: date | None = None


class ConsentChange(RequestModel):
    expected_version: StrictInt = Field(ge=1)
    personalization: StrictBool | None = None
    synthetic_signals: StrictBool | None = None
    advisor_preview: StrictBool | None = None
