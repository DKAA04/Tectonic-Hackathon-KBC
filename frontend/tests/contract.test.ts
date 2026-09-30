import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer, type Server } from "node:http";
import { createFixtureMiddleware } from "../dev/fixture.ts";
import { createApi, ApiError } from "../src/lib/api.ts";
import type { Context } from "../src/lib/types.ts";

let server: Server | undefined;
let base: string;
before(async () => {
  if (process.env.KBC_TEST_BASE_URL) {
    const url = new URL(process.env.KBC_TEST_BASE_URL);
    if (
      url.protocol !== "http:" ||
      !["127.0.0.1", "localhost"].includes(url.hostname)
    )
      throw new Error(
        "External adapter tests are restricted to a local fixture server.",
      );
    base = url.origin;
    return;
  }
  const handler = createFixtureMiddleware();
  server = createServer((req, res) => {
    void handler(req, res, () => {
      res.writeHead(404);
      res.end();
    });
  });
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No test server address");
  base = `http://127.0.0.1:${address.port}`;
});
after(
  () =>
    new Promise<void>((resolve, reject) =>
      server ? server.close((e) => (e ? reject(e) : resolve())) : resolve(),
    ),
);

function browser() {
  let cookie = "";
  const calls: { path: string; init: RequestInit | undefined }[] = [];
  const transport: typeof fetch = async (input, init) => {
    const path = String(input);
    calls.push({ path, init });
    const headers = new Headers(init?.headers);
    if (cookie) headers.set("Cookie", cookie);
    const response = await fetch(base + path, { ...init, headers });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      assert.match(setCookie, /HttpOnly/);
      assert.match(setCookie, /SameSite=Lax/);
      cookie = setCookie.split(";")[0];
    }
    return response;
  };
  return { api: createApi(transport), calls, transport };
}
const future = (days: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const fails = (code: string) => (e: unknown) =>
  e instanceof ApiError && e.code === code;
function referencesResolve(c: Context) {
  const ids = new Set(c.evidence.map((e) => e.id));
  for (const ref of [
    ...c.situation.evidence_ids,
    ...c.decision.evidence_ids,
    ...c.decision.next_steps.flatMap((s) => s.evidence_ids),
  ])
    assert.ok(ids.has(ref), `Missing evidence: ${ref}`);
}

test("complete journey: create, confirm, cancel, consent and advisor recover the same session", async () => {
  const b = browser();
  await assert.rejects(b.api.getContext(), fails("SESSION_REQUIRED"));
  let c = await b.api.startSession();
  const id = c.session.id;
  assert.equal(c.situation.status, "tentative");
  assert.equal(c.decision.action, "ask");
  assert.deepEqual(
    c.evidence.map((e) => e.id),
    ["signal-goal", "signal-home-store"],
  );
  const csrf = c.session.csrf_token;
  c = await b.api.correct(
    {
      expected_version: c.version,
      action: "confirm",
      move_date: future(30),
      remind_on: null,
    },
    csrf,
  );
  assert.equal(c.version, 2);
  assert.equal(c.situation.status, "confirmed");
  assert.equal(c.decision.next_steps.length, 2);
  referencesResolve(c);
  assert.deepEqual((await b.api.getAdvisor()).context, c);
  c = await b.api.correct(
    { expected_version: c.version, action: "cancel" },
    csrf,
  );
  assert.equal(c.version, 3);
  assert.equal(c.decision.reason_code, "MOVE_CANCELLED");
  assert.deepEqual(c.decision.next_steps, []);
  assert.deepEqual((await b.api.getAdvisor()).context, c);
  c = await b.api.setConsent(
    { expected_version: c.version, personalization: false },
    csrf,
  );
  assert.equal(c.decision.reason_code, "PERSONALIZATION_DISABLED");
  assert.equal(c.situation.status, "cancelled");
  assert.deepEqual(c.evidence, []);
  assert.ok(c.history.every((h) => h.evidence_id === null));
  assert.deepEqual((await b.api.getAdvisor()).context, c);
  assert.deepEqual(await b.api.getContext(), c);
  assert.equal(c.session.id, id);
  c = await b.api.setConsent(
    { expected_version: c.version, personalization: true },
    csrf,
  );
  assert.equal(c.situation.status, "cancelled");
  assert.equal(c.decision.reason_code, "MOVE_CANCELLED");
  referencesResolve(c);
  assert.equal(
    b.calls.filter((call) => call.path === "/api/demo/session").length,
    1,
  );
  for (const call of b.calls) {
    assert.equal(call.init?.credentials, "same-origin");
    assert.equal(call.init?.cache, "no-store");
  }
  const correction = b.calls.find(
    (call) => call.path === "/api/context/correction",
  )!;
  assert.equal(new Headers(correction.init?.headers).get("X-CSRF-Token"), csrf);
  assert.deepEqual(JSON.parse(String(correction.init?.body)), {
    expected_version: 1,
    action: "confirm",
    move_date: future(30),
    remind_on: null,
  });
});

test("consent filters inferred evidence but preserves explicit customer intent", async () => {
  const b = browser();
  let c = await b.api.startSession();
  const csrf = c.session.csrf_token;
  c = await b.api.setConsent(
    { expected_version: c.version, synthetic_signals: false },
    csrf,
  );
  assert.equal(c.situation.status, "unknown");
  assert.deepEqual(c.evidence, []);
  assert.equal(c.decision.reason_code, "NO_ALLOWED_EVIDENCE");
  c = await b.api.setConsent(
    { expected_version: c.version, personalization: false },
    csrf,
  );
  c = await b.api.correct(
    { expected_version: c.version, action: "confirm", move_date: future(20) },
    csrf,
  );
  assert.equal(c.situation.status, "confirmed");
  assert.equal(c.situation.move_date, future(20));
  assert.equal(c.decision.reason_code, "PERSONALIZATION_DISABLED");
  assert.deepEqual(c.evidence, []);
  c = await b.api.setConsent(
    { expected_version: c.version, personalization: true },
    csrf,
  );
  assert.equal(c.decision.reason_code, "CONFIRMED_MOVE");
  assert.ok(c.evidence.every((e) => e.kind === "customer_correction"));
  referencesResolve(c);
  c = await b.api.setConsent(
    { expected_version: c.version, advisor_preview: false },
    csrf,
  );
  await assert.rejects(b.api.getAdvisor(), fails("ADVISOR_CONSENT_REQUIRED"));
  c = await b.api.setConsent(
    { expected_version: c.version, advisor_preview: true },
    csrf,
  );
  assert.deepEqual((await b.api.getAdvisor()).context, c);
});

test("CSRF, stale versions and separate sessions prevent invalid changes; no automatic replay", async () => {
  const a = browser();
  const b = browser();
  const ca = await a.api.startSession();
  const cb = await b.api.startSession();
  assert.notEqual(ca.session.id, cb.session.id);
  await assert.rejects(
    a.api.correct(
      { expected_version: 1, action: "cancel" },
      cb.session.csrf_token,
    ),
    fails("CSRF_INVALID"),
  );
  assert.equal((await a.api.getContext()).version, 1);
  await a.api.correct(
    { expected_version: 1, action: "cancel" },
    ca.session.csrf_token,
  );
  const before = a.calls.length;
  await assert.rejects(
    a.api.setConsent(
      { expected_version: 1, personalization: false },
      ca.session.csrf_token,
    ),
    fails("VERSION_CONFLICT"),
  );
  assert.equal(a.calls.length, before + 1);
  assert.equal((await a.api.getContext()).version, 2);
  assert.equal((await b.api.getContext()).version, 1);
  const reset = await a.api.startSession();
  assert.notEqual(reset.session.id, ca.session.id);
  assert.equal(reset.version, 1);
});

test("date/reminder validation and transitions follow the contract", async () => {
  const b = browser();
  let c = await b.api.startSession();
  const csrf = c.session.csrf_token;
  await assert.rejects(
    b.api.correct(
      { expected_version: 1, action: "change_date", move_date: future(10) },
      csrf,
    ),
    fails("INVALID_TRANSITION"),
  );
  await assert.rejects(
    b.api.correct(
      { expected_version: 1, action: "confirm", move_date: "2026-02-30" },
      csrf,
    ),
    fails("VALIDATION_ERROR"),
  );
  await assert.rejects(
    b.api.correct(
      { expected_version: 1, action: "confirm", move_date: future(731) },
      csrf,
    ),
    fails("VALIDATION_ERROR"),
  );
  c = await b.api.correct(
    {
      expected_version: 1,
      action: "confirm",
      move_date: future(30),
      remind_on: future(20),
    },
    csrf,
  );
  assert.equal(c.decision.reason_code, "REMINDER_NOT_DUE");
  await assert.rejects(
    b.api.correct(
      {
        expected_version: c.version,
        action: "change_date",
        move_date: future(10),
      },
      csrf,
    ),
    fails("VALIDATION_ERROR"),
  );
  c = await b.api.correct(
    { expected_version: c.version, action: "set_reminder", remind_on: null },
    csrf,
  );
  assert.equal(c.decision.action, "help");
  c = await b.api.correct(
    {
      expected_version: c.version,
      action: "change_date",
      move_date: future(10),
    },
    csrf,
  );
  assert.equal(c.situation.move_date, future(10));
  referencesResolve(c);
});

test("malformed requests return the documented error envelope", async () => {
  const b = browser();
  const c = await b.api.startSession();
  const cases = [
    {
      path: "/api/consent",
      body: { expected_version: 1, personalization: "false" },
      status: 422,
      code: "VALIDATION_ERROR",
    },
    {
      path: "/api/context/correction",
      body: { expected_version: 1, action: "cancel", move_date: future(1) },
      status: 422,
      code: "VALIDATION_ERROR",
    },
    {
      path: "/api/consent",
      body: {
        expected_version: 1,
        customer_id: "not-allowed",
        personalization: false,
      },
      status: 422,
      code: "VALIDATION_ERROR",
    },
    {
      path: "/api/demo/session",
      body: { text: "x".repeat(9000) },
      status: 413,
      code: "PAYLOAD_TOO_LARGE",
    },
  ];
  for (const item of cases) {
    const response = await b.transport(item.path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": c.session.csrf_token,
      },
      body: JSON.stringify(item.body),
    });
    assert.equal(response.status, item.status);
    const data = await response.json();
    assert.equal(data.error.code, item.code);
    assert.ok(Array.isArray(data.error.details));
  }
  const forbidden = await b.transport("/api/demo/session", {
    method: "POST",
    headers: {
      Origin: "https://foreign.example",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(forbidden.status, 403);
  const wrongType = await b.transport("/api/demo/session", {
    method: "POST",
    body: "{}",
  });
  assert.equal(wrongType.status, 415);
  assert.equal(
    (await b.transport("/api/advisor-preview", { method: "POST" })).status,
    405,
  );
  assert.equal((await b.transport("/api/unknown")).status, 404);
  assert.equal((await b.api.getContext()).version, 1);
});

test("live failures never bootstrap or substitute fixture data", async () => {
  let calls = 0;
  const client = createApi(async () => {
    calls++;
    return Response.json(
      {
        api_version: "1",
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Persistence temporarily unavailable.",
          details: [],
        },
      },
      { status: 503 },
    );
  });
  await assert.rejects(client.getContext(), fails("DATABASE_UNAVAILABLE"));
  assert.equal(calls, 1);
  const html = createApi(
    async () => new Response("<html>Proxy failure</html>", { status: 502 }),
  );
  await assert.rejects(html.getContext(), fails("INVALID_RESPONSE"));
  const offline = createApi(async () => {
    throw new TypeError("network");
  });
  await assert.rejects(offline.getContext(), fails("NETWORK_ERROR"));
});
