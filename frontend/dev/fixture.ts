// Development-only HTTP adapter. Never mounted by a production build or preview.
import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Context, Consent } from "../src/lib/types.ts";

class FixtureError extends Error {
  status: number;
  code: string;
  field: string | undefined;
  constructor(status: number, code: string, message: string, field?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
  }
}
const today = () => new Date().toISOString().slice(0, 10);
const invalid = (field: string, message: string): never => {
  throw new FixtureError(422, "VALIDATION_ERROR", message, field);
};
function date(value: unknown, field: string, max: string): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value ||
    value < today() ||
    value > max
  )
    invalid(field, "Choose a valid date within the permitted range.");
  return value as string;
}
function initial(): Context {
  const now = new Date().toISOString();
  return {
    api_version: "1",
    session: {
      id: randomUUID(),
      synthetic: true,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      csrf_token: randomUUID(),
    },
    customer: { display_name: "Alex", synthetic: true },
    version: 1,
    updated_at: now,
    consent: {
      personalization: true,
      synthetic_signals: true,
      advisor_preview: true,
    },
    situation: {
      type: "moving",
      status: "tentative",
      move_date: null,
      remind_on: null,
      source: "synthetic_signals",
      evidence_ids: ["signal-goal", "signal-home-store"],
    },
    evidence: [
      {
        id: "signal-goal",
        kind: "synthetic_signal",
        summary: "Alex saved a moving preparation goal in this demo.",
        occurred_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: "signal-home-store",
        kind: "synthetic_signal",
        summary:
          "A synthetic home-store visit could relate to a move or ordinary shopping.",
        occurred_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    decision: {
      action: "ask",
      reason_code: "AMBIGUOUS_SIGNALS",
      message: "Are you planning a move?",
      evidence_ids: ["signal-goal", "signal-home-store"],
      next_steps: [],
    },
    history: [],
  };
}

function present(stored: Context): Context {
  const c = structuredClone(stored);
  c.evidence = c.evidence.filter(
    (e) =>
      c.consent.personalization &&
      (e.kind === "customer_correction" || c.consent.synthetic_signals),
  );
  const allowed = new Set(c.evidence.map((e) => e.id));
  c.situation.evidence_ids = c.situation.evidence_ids.filter((id) =>
    allowed.has(id),
  );
  if (
    c.situation.source !== "customer" &&
    (!c.consent.personalization || !c.consent.synthetic_signals)
  ) {
    c.situation = {
      type: "moving",
      status: "unknown",
      source: "none",
      move_date: null,
      remind_on: null,
      evidence_ids: [],
    };
  }
  c.history = c.history.map((h) => ({
    ...h,
    evidence_id:
      h.evidence_id && allowed.has(h.evidence_id) ? h.evidence_id : null,
  }));
  const refs = c.situation.evidence_ids;
  const suppress = (
    reason_code: string,
    message: string,
    evidence_ids: string[] = refs,
  ) => {
    c.decision = {
      action: "suppress",
      reason_code,
      message,
      evidence_ids,
      next_steps: [],
    };
  };
  if (!c.consent.personalization)
    suppress("PERSONALIZATION_DISABLED", "Personalization is off.", []);
  else if (c.situation.status === "cancelled")
    suppress(
      "MOVE_CANCELLED",
      "Your move is cancelled. Moving suggestions have been withdrawn.",
    );
  else if (c.situation.status === "confirmed") {
    const move = c.situation.move_date!;
    if (move < today())
      suppress(
        "MOVE_DATE_PASSED",
        "Your move date has passed. Update it to receive relevant help.",
      );
    else if (c.situation.remind_on && c.situation.remind_on > today())
      suppress(
        "REMINDER_NOT_DUE",
        `Moving help is paused until ${c.situation.remind_on}.`,
      );
    else
      c.decision = {
        action: "help",
        reason_code: "CONFIRMED_MOVE",
        message: `Prepare for your move on ${move}.`,
        evidence_ids: refs,
        next_steps: [
          {
            id: "moving-admin",
            title: "Prepare your address update checklist",
            description:
              "List the organisations to notify when your move is confirmed. No address is changed by this demo.",
            due_on: move,
            evidence_ids: refs,
          },
          {
            id: "moving-insurance",
            title: "Review what your home cover needs for the move",
            description:
              "Prepare questions about your move date and home cover for an advisor. No product is bought or changed.",
            due_on: move,
            evidence_ids: refs,
          },
        ],
      };
  } else if (!c.evidence.length)
    suppress(
      "NO_ALLOWED_EVIDENCE",
      "There is no permitted evidence to suggest a move.",
      [],
    );
  return c;
}

export function createFixtureMiddleware() {
  const sessions = new Map<string, Context>();
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const path = req.url?.split("?")[0];
    if (!path?.startsWith("/api/")) return next();
    const send = (status: number, value: unknown) => {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(value));
    };
    try {
      const routes: Record<string, string> = {
        "/api/health": "GET",
        "/api/demo/session": "POST",
        "/api/context": "GET",
        "/api/context/correction": "POST",
        "/api/consent": "POST",
        "/api/advisor-preview": "GET",
      };
      if (!routes[path])
        throw new FixtureError(404, "NOT_FOUND", "Unknown API route.");
      if (req.method !== routes[path])
        throw new FixtureError(
          405,
          "METHOD_NOT_ALLOWED",
          "Unsupported method.",
        );
      let body: Record<string, unknown> = {};
      if (req.method === "POST") {
        if (
          req.headers.origin &&
          req.headers.origin !== `http://${req.headers.host}`
        )
          throw new FixtureError(
            403,
            "ORIGIN_FORBIDDEN",
            "Supplied Origin is not allowed.",
          );
        if (req.headers["content-type"]?.split(";")[0] !== "application/json")
          throw new FixtureError(
            415,
            "JSON_REQUIRED",
            "Write Content-Type must be application/json.",
          );
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 8192)
            throw new FixtureError(
              413,
              "PAYLOAD_TOO_LARGE",
              "Request body exceeds 8192 bytes.",
            );
          chunks.push(Buffer.from(chunk));
        }
        try {
          body = JSON.parse(Buffer.concat(chunks).toString());
        } catch {
          invalid("body", "Supply a valid JSON object.");
        }
        if (!body || typeof body !== "object" || Array.isArray(body))
          invalid("body", "Supply a JSON object.");
      }
      if (path === "/api/health")
        return send(200, {
          api_version: "1",
          status: "ready",
          checks: { database: "ready" },
          synthetic_only: true,
        });
      for (const [key, value] of sessions)
        if (Date.parse(value.session.expires_at) <= Date.now())
          sessions.delete(key);
      if (path === "/api/demo/session") {
        if (Object.keys(body).length)
          invalid("body", "Extra fields are not permitted.");
        const credential = randomUUID();
        const c = initial();
        sessions.set(credential, c);
        res.setHeader(
          "Set-Cookie",
          `kbc_moment_session=${credential}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`,
        );
        return send(201, present(c));
      }
      const credential = req.headers.cookie
        ?.split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("kbc_moment_session="))
        ?.split("=")[1];
      const stored = credential && sessions.get(credential);
      if (!stored)
        throw new FixtureError(
          401,
          "SESSION_REQUIRED",
          "Start a demo session to continue.",
        );
      if (path === "/api/advisor-preview") {
        if (!stored.consent.advisor_preview)
          throw new FixtureError(
            403,
            "ADVISOR_CONSENT_REQUIRED",
            "Advisor preview consent is off.",
          );
        return send(200, {
          api_version: "1",
          read_only: true,
          preview_label:
            "Advisor demo preview — synthetic session, not bank staff access",
          context: present(stored),
        });
      }
      if (req.method === "GET") return send(200, present(stored));
      if (req.headers["x-csrf-token"] !== stored.session.csrf_token)
        throw new FixtureError(
          403,
          "CSRF_INVALID",
          "Missing or incorrect X-CSRF-Token.",
        );
      if (
        !Number.isInteger(body.expected_version) ||
        Number(body.expected_version) < 1
      )
        invalid("expected_version", "Supply the current integer version.");
      if (body.expected_version !== stored.version)
        throw new FixtureError(
          409,
          "VERSION_CONFLICT",
          "Context changed. Fetch the latest context and retry.",
          "expected_version",
        );
      const c = structuredClone(stored);
      const now = new Date().toISOString();
      const version = c.version + 1;
      if (path === "/api/consent") {
        const scopes: (keyof Consent)[] = [
          "personalization",
          "synthetic_signals",
          "advisor_preview",
        ];
        if (!scopes.some((k) => k in body))
          invalid("body", "Supply at least one consent scope.");
        for (const k of Object.keys(body)) {
          if (k === "expected_version") continue;
          if (
            !scopes.includes(k as keyof Consent) ||
            typeof body[k] !== "boolean"
          )
            invalid(k, "Supply a supported boolean consent scope.");
          c.consent[k as keyof Consent] = body[k] as boolean;
        }
        c.history.push({
          version,
          kind: "consent",
          action: "update",
          occurred_at: now,
          evidence_id: null,
        });
      } else {
        const action = body.action;
        if (
          !["confirm", "change_date", "set_reminder", "cancel"].includes(
            String(action),
          )
        )
          invalid("action", "Unsupported correction action.");
        const fields =
          action === "cancel"
            ? ["action", "expected_version"]
            : action === "set_reminder"
              ? ["action", "expected_version", "remind_on"]
              : ["action", "expected_version", "move_date", "remind_on"];
        for (const k of Object.keys(body))
          if (!fields.includes(k))
            invalid(k, "Extra fields are not permitted.");
        if (
          (action === "change_date" || action === "set_reminder") &&
          c.situation.status !== "confirmed"
        )
          throw new FixtureError(
            409,
            "INVALID_TRANSITION",
            "Confirm a move before editing its date or reminder.",
          );
        const max = new Date(`${today()}T00:00:00Z`);
        max.setUTCDate(max.getUTCDate() + 730);
        const move =
          action === "cancel"
            ? null
            : action === "set_reminder"
              ? c.situation.move_date
              : date(
                  body.move_date,
                  "move_date",
                  max.toISOString().slice(0, 10),
                );
        if (action === "set_reminder" && !("remind_on" in body))
          invalid("remind_on", "Supply a reminder date or null.");
        const reminder =
          action === "cancel"
            ? null
            : "remind_on" in body
              ? body.remind_on
              : action === "confirm"
                ? null
                : c.situation.remind_on;
        if (reminder !== null) date(reminder, "remind_on", move!);
        const id = `correction-v${version}`;
        c.situation = {
          type: "moving",
          status: action === "cancel" ? "cancelled" : "confirmed",
          source: "customer",
          move_date: move!,
          remind_on: reminder as string | null,
          evidence_ids: [id],
        };
        const summary =
          action === "cancel"
            ? "Customer cancelled the move."
            : action === "confirm"
              ? `Customer confirmed a move on ${move}.`
              : action === "change_date"
                ? `Customer changed the move date to ${move}.`
                : reminder
                  ? `Customer requested a reminder on ${reminder}.`
                  : "Customer cleared the reminder.";
        c.evidence.push({
          id,
          kind: "customer_correction",
          summary,
          occurred_at: now,
        });
        c.history.push({
          version,
          kind: "correction",
          action: String(action),
          occurred_at: now,
          evidence_id: id,
        });
      }
      c.version = version;
      c.updated_at = now;
      c.evidence = c.evidence.slice(-50);
      c.history = c.history.slice(-50);
      sessions.set(credential!, c);
      return send(200, present(c));
    } catch (error) {
      const e =
        error instanceof FixtureError
          ? error
          : new FixtureError(
              500,
              "INTERNAL_ERROR",
              "Unexpected fixture error.",
            );
      send(e.status, {
        api_version: "1",
        error: {
          code: e.code,
          message: e.message,
          details: e.field ? [{ field: e.field, message: e.message }] : [],
        },
      });
    }
  };
}
