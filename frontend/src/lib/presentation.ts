import type { Context } from "./types.ts";

export function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
export function readableMessage(value: string) {
  return value.replace(/\b\d{4}-\d{2}-\d{2}\b/g, (date) =>
    Number.isFinite(Date.parse(date)) ? displayDate(date) : date,
  );
}
export const displayTime = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
export const situationLabel = (c: Context) =>
  ({
    unknown: "No inferred move",
    tentative: "A possible move",
    confirmed: "Move confirmed",
    cancelled: "Move cancelled",
  })[c.situation.status];
export const changeLabel = (action: string) =>
  ({
    confirm: "Move confirmed",
    change_date: "Move date changed",
    cancel: "Move cancelled",
    set_reminder: "Help timing changed",
    update: "Consent preferences updated",
  })[action] || "Context updated";

// Any accepted context change invalidates local preparation drafts. Time-driven
// suppression also invalidates drafts even without a version increment.
export const draftKey = (c: Context) =>
  [
    c.session.id,
    c.version,
    c.decision.reason_code,
    c.situation.move_date,
    c.situation.remind_on,
    JSON.stringify(c.consent),
    c.decision.next_steps.map((s) => s.id).join(","),
  ].join(":");

// Deliberate allowlist: never serialize Context, session metadata or evidence.
export function buildBriefing(c: Context): string {
  const explicit = c.situation.source === "customer";
  const permitted =
    explicit || (c.consent.personalization && c.consent.synthetic_signals);
  const steps =
    c.consent.personalization &&
    c.situation.status === "confirmed" &&
    c.decision.action === "help"
      ? c.decision.next_steps
      : [];
  const lines = [
    "KBC Moment — personal preparation briefing",
    "Hackathon prototype · synthetic data",
    "",
    `Situation: ${permitted ? situationLabel(c) : "No inferred move"}`,
    `Move date: ${permitted && c.situation.move_date ? displayDate(c.situation.move_date) : "Not set"}`,
    `Personalization: ${c.consent.personalization ? "On" : "Off"}`,
    `Requested help timing: ${c.situation.status !== "confirmed" ? "Not applicable" : permitted && c.situation.remind_on ? displayDate(c.situation.remind_on) : "Help now"}`,
    "",
    "Permitted preparation steps",
    ...steps.flatMap((step, i) => [
      `${i + 1}. ${step.title}`,
      readableMessage(step.description),
      `For ${displayDate(step.due_on)}`,
      "",
    ]),
    ...(steps.length ? [] : ["No active preparation suggestions.", ""]),
    "This is a local preparation document, not a message to a bank advisor.",
    "No address, insurance policy or financial product has been changed.",
    "Checklist draft progress is not included. This snapshot is not updated after download.",
  ];
  return lines.join("\n");
}
