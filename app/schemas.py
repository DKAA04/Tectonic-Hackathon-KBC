from datetime import date, datetime
import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictInt, field_validator, model_validator


class RequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Bootstrap(RequestModel):
    pass


class ErrorDetail(BaseModel):
    field: str
    message: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: list[ErrorDetail]


class ErrorEnvelope(BaseModel):
    api_version: Literal["1"] = "1"
    error: ErrorBody


class HealthChecks(BaseModel):
    database: Literal["ready", "unavailable"]


class Health(BaseModel):
    api_version: Literal["1"] = "1"
    status: Literal["ready", "not_ready"]
    checks: HealthChecks
    synthetic_only: Literal[True] = True


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

    @field_validator("move_date", "remind_on", mode="before")
    @classmethod
    def date_wire_format(cls, value):
        if value is not None and (not isinstance(value, str) or re.fullmatch(r"\d{4}-\d{2}-\d{2}", value) is None):
            raise ValueError("Dates must use YYYY-MM-DD.")
        return value

    @model_validator(mode="after")
    def action_fields(self):
        if self.action in {"confirm", "change_date"} and self.move_date is None:
            raise ValueError("This correction requires move_date.")
        if self.action == "cancel" and self.model_fields_set & {"move_date", "remind_on"}:
            raise ValueError("Cancellation must not include dates.")
        if self.action == "set_reminder":
            if "remind_on" not in self.model_fields_set or "move_date" in self.model_fields_set:
                raise ValueError("set_reminder requires remind_on and must not include move_date.")
        return self


class ConsentChange(RequestModel):
    expected_version: StrictInt = Field(ge=1)
    personalization: StrictBool | None = None
    synthetic_signals: StrictBool | None = None
    advisor_preview: StrictBool | None = None

    @model_validator(mode="after")
    def explicit_scopes(self):
        fields = self.model_fields_set - {"expected_version"}
        if not fields or any(getattr(self, field) is None for field in fields):
            raise ValueError("Supply at least one boolean consent scope; null is not allowed.")
        return self
