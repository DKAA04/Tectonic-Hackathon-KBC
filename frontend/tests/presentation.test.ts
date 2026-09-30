import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildBriefing,
  displayDate,
  draftKey,
  readableMessage,
} from "../src/lib/presentation.ts";
import type { Context } from "../src/lib/types.ts";

const context: Context = {
  api_version: "1",
  version: 2,
  updated_at: "2026-09-30T18:00:00Z",
  session: {
    id: "NEVER_EXPORT_SESSION",
    csrf_token: "NEVER_EXPORT_CSRF",
    synthetic: true,
    expires_at: "2026-10-01T18:00:00Z",
  },
  customer: { display_name: "Alex", synthetic: true },
  consent: {
    personalization: true,
    synthetic_signals: true,
    advisor_preview: true,
  },
  situation: {
    type: "moving",
    status: "confirmed",
    source: "customer",
    move_date: "2026-11-15",
    remind_on: null,
    evidence_ids: ["PRIVATE_EVIDENCE_ID"],
  },
  evidence: [
    {
      id: "PRIVATE_EVIDENCE_ID",
      kind: "customer_correction",
      summary: "NEVER_EXPORT_EVIDENCE",
      occurred_at: "2026-09-30T18:00:00Z",
    },
  ],
  decision: {
    action: "help",
    reason_code: "CONFIRMED_MOVE",
    message: "Prepare for your move on 2026-11-15.",
    evidence_ids: ["PRIVATE_EVIDENCE_ID"],
    next_steps: [
      {
        id: "moving-admin",
        title: "Prepare your address update checklist",
        description: "Prepare for 2026-11-15.",
        due_on: "2026-11-15",
        evidence_ids: ["PRIVATE_EVIDENCE_ID"],
      },
    ],
  },
  history: [],
};

test("briefing allowlist excludes session credentials, evidence and revoked suggestions", () => {
  const text = buildBriefing(context);
  assert.match(text, /15 November 2026/);
  assert.match(text, /Prepare your address update checklist/);
  assert.doesNotMatch(
    text,
    /NEVER_EXPORT|PRIVATE_EVIDENCE_ID|2026-11-15|csrf|expires_at/,
  );
  const revoked = structuredClone(context);
  revoked.consent.personalization = false;
  // Defensive test: even an unsanitized context must not export revoked steps.
  const hidden = buildBriefing(revoked);
  assert.doesNotMatch(
    hidden,
    /Prepare your address update checklist|NEVER_EXPORT/,
  );
  assert.match(hidden, /15 November 2026/);
  revoked.situation.source = "synthetic_signals";
  revoked.situation.status = "tentative";
  assert.doesNotMatch(buildBriefing(revoked), /15 November 2026/);
  revoked.consent.personalization = true;
  revoked.consent.synthetic_signals = false;
  assert.doesNotMatch(buildBriefing(revoked), /15 November 2026/);
  const cancelled = structuredClone(context);
  cancelled.situation.status = "cancelled";
  assert.doesNotMatch(
    buildBriefing(cancelled),
    /Prepare your address update checklist/,
  );
});

test("dates are readable and local draft identity invalidates on context or timing changes", () => {
  assert.equal(displayDate("2026-11-15"), "15 November 2026");
  assert.equal(
    readableMessage(context.decision.message),
    "Prepare for your move on 15 November 2026.",
  );
  const original = draftKey(context);
  for (const change of [
    (c: Context) => {
      c.version++;
    },
    (c: Context) => {
      c.consent.personalization = false;
    },
    (c: Context) => {
      c.consent.advisor_preview = false;
    },
    (c: Context) => {
      c.situation.move_date = "2026-11-16";
    },
    (c: Context) => {
      c.situation.remind_on = "2026-11-01";
    },
    (c: Context) => {
      c.decision.reason_code = "REMINDER_NOT_DUE";
    },
    (c: Context) => {
      c.decision.next_steps = [];
    },
    (c: Context) => {
      c.session.id = "ANOTHER_SESSION";
    },
  ]) {
    const changed = structuredClone(context);
    change(changed);
    assert.notEqual(draftKey(changed), original);
  }
});
