export type Consent = {
  personalization: boolean;
  synthetic_signals: boolean;
  advisor_preview: boolean;
};
export type Evidence = {
  id: string;
  kind: "synthetic_signal" | "customer_correction";
  summary: string;
  occurred_at: string;
};
export type NextStep = {
  id: string;
  title: string;
  description: string;
  due_on: string;
  evidence_ids: string[];
};
export interface Context {
  api_version: "1";
  session: {
    id: string;
    synthetic: true;
    expires_at: string;
    csrf_token: string;
  };
  customer: { display_name: string; synthetic: true };
  version: number;
  updated_at: string;
  consent: Consent;
  situation: {
    type: "moving";
    status: "unknown" | "tentative" | "confirmed" | "cancelled";
    move_date: string | null;
    remind_on: string | null;
    source: "none" | "synthetic_signals" | "customer";
    evidence_ids: string[];
  };
  evidence: Evidence[];
  decision: {
    action: "ask" | "help" | "suppress";
    reason_code: string;
    message: string;
    evidence_ids: string[];
    next_steps: NextStep[];
  };
  history: {
    version: number;
    kind: "correction" | "consent";
    action: string;
    occurred_at: string;
    evidence_id: string | null;
  }[];
}
export type Correction =
  | {
      expected_version: number;
      action: "confirm" | "change_date";
      move_date: string;
      remind_on?: string | null;
    }
  | {
      expected_version: number;
      action: "set_reminder";
      remind_on: string | null;
    }
  | { expected_version: number; action: "cancel" };
export type ConsentChange = { expected_version: number } & Partial<Consent>;
export type AdvisorPreview = {
  api_version: "1";
  read_only: true;
  preview_label: string;
  context: Context;
};
export type ErrorDetail = { field: string; message: string };
