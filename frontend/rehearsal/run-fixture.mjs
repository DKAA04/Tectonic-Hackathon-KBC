// Read-only application source; this rehearsal creates isolated synthetic HTTP
// sessions and never uses or changes the operator's browser cookie.
// Run: node --experimental-strip-types rehearsal/run-fixture.mjs
import assert from 'node:assert/strict';
import { buildBriefing } from '../src/lib/presentation.ts';

const base = 'http://127.0.0.1:5173';
console.log(`Rehearsal time: ${new Date().toISOString()}`);
const moduleResponse = await fetch(`${base}/src/lib/api.ts`);
assert.equal(moduleResponse.status, 200, 'Start the local fixture Vite server first.');
assert.ok((await moduleResponse.text()).includes('"MODE": "fixture"'), 'Refusing rehearsal: local server is not verified fixture mode.');
assert.ok(new Date().toISOString().slice(0, 10) < '2026-11-10', 'These rehearsal dates need updating on or after 10 November 2026; this is not an application defect.');

function sessionClient() {
  let cookie = '';
  return async function request(path, body, csrf) {
    const response = await fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const nextCookie = response.headers.get('set-cookie');
    if (nextCookie) cookie = nextCookie.split(';')[0];
    return { status: response.status, data: await response.json() };
  };
}
const a = sessionClient();
const b = sessionClient();
let result = await a('/api/demo/session', {});
assert.equal(result.status, 201);
let c = result.data;
assert.equal(c.situation.status, 'tentative');
assert.equal(c.evidence.length, 2);
console.log('PASS initial question and two permitted evidence items');
const originalId = c.session.id;
async function correct(fields) {
  const r = await a('/api/context/correction', { expected_version: c.version, ...fields }, c.session.csrf_token);
  assert.equal(r.status, 200); c = r.data; return c;
}
async function consent(fields) {
  const r = await a('/api/consent', { expected_version: c.version, ...fields }, c.session.csrf_token);
  assert.equal(r.status, 200); c = r.data; return c;
}
await correct({ action: 'confirm', move_date: '2026-11-15', remind_on: null });
assert.deepEqual(c.decision.next_steps.map(s => s.id), ['moving-admin', 'moving-insurance']);
console.log('PASS confirm 15 November 2026; address and home-cover preparation returned');
const briefing = buildBriefing(c);
assert.match(briefing, /15 November 2026/);
assert.ok(!briefing.includes(c.session.id));
assert.ok(!briefing.includes(c.session.csrf_token));
assert.ok(!briefing.includes('correction-v2'));
console.log('PASS briefing content generation excludes session IDs, CSRF and evidence IDs (browser download not exercised)');
await correct({ action: 'change_date', move_date: '2026-11-22', remind_on: null });
const advisor = await a('/api/advisor-preview');
assert.equal(advisor.status, 200);
assert.deepEqual(advisor.data.context, c);
console.log('PASS change to 22 November 2026; advisor context and version match');
result = await a('/api/context');
assert.equal(result.status, 200);
assert.equal(result.data.session.id, originalId);
assert.deepEqual(result.data, c);
console.log('PASS existing cookie recovers corrected context without new bootstrap (HTTP refresh equivalent)');
await correct({ action: 'set_reminder', remind_on: '2026-11-10' });
assert.equal(c.decision.reason_code, 'REMINDER_NOT_DUE');
assert.deepEqual(c.decision.next_steps, []);
await correct({ action: 'set_reminder', remind_on: null });
assert.equal(c.decision.action, 'help');
assert.equal(c.decision.next_steps.length, 2);
console.log('PASS 10 November help date suppresses steps; Help me now resumes them');
await consent({ synthetic_signals: false });
assert.ok(c.evidence.every(e => e.kind === 'customer_correction'));
assert.equal(c.situation.status, 'confirmed');
console.log('PASS signal consent removes synthetic signals and preserves explicit intent');
await correct({ action: 'cancel' });
assert.equal(c.decision.reason_code, 'MOVE_CANCELLED');
assert.deepEqual(c.decision.next_steps, []);
assert.deepEqual((await a('/api/advisor-preview')).data.context, c);
console.log('PASS cancellation withdraws obsolete steps in customer and advisor contexts');
await consent({ advisor_preview: false });
result = await a('/api/advisor-preview');
assert.equal(result.status, 403);
assert.equal(result.data.error.code, 'ADVISOR_CONSENT_REQUIRED');
console.log('PASS advisor consent revocation returns exact 403 ADVISOR_CONSENT_REQUIRED');
await consent({ personalization: false });
assert.deepEqual(c.evidence, []);
assert.deepEqual(c.decision.next_steps, []);
assert.ok(!buildBriefing(c).includes('Prepare your address update checklist'));
console.log('PASS personalization revocation hides evidence/help and removes exported preparation');
const second = await b('/api/demo/session', {});
assert.equal(second.status, 201);
assert.notEqual(second.data.session.id, originalId);
assert.equal(second.data.version, 1);
assert.equal(second.data.situation.status, 'tentative');
assert.equal((await a('/api/context')).data.situation.status, 'cancelled');
console.log('PASS independent HTTP cookie sessions remain isolated (actual incognito browser pending)');
const noSignals = await b('/api/consent', { expected_version: 1, synthetic_signals: false }, second.data.session.csrf_token);
assert.equal(noSignals.status, 200);
assert.equal(noSignals.data.situation.status, 'unknown');
assert.deepEqual(noSignals.data.evidence, []);
console.log('PASS tentative signal revocation removes the inference');
console.log('REHEARSAL COMPLETE: local development fixtures only; no live deployment or visual recording verified.');
