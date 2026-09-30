import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Home,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { fixtureMode } from "@/lib/api";
import { useMoment } from "@/lib/use-moment";
import type { Consent, Context } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
const statusLabel = (c: Context) =>
  ({
    unknown: "No inferred situation",
    tentative: "Tentative · please confirm",
    confirmed: "Confirmed by you",
    cancelled: "Cancelled by you",
  })[c.situation.status];

function EvidenceList({ context }: { context: Context }) {
  const ids = new Set([
    ...context.situation.evidence_ids,
    ...context.decision.evidence_ids,
  ]);
  const evidence = context.evidence.filter((item) => ids.has(item.id));
  return (
    <section aria-labelledby="evidence-title">
      <div className="eyebrow">Always explainable</div>
      <h2 id="evidence-title" className="mt-2 text-xl font-semibold">
        What this is based on
      </h2>
      {evidence.length ? (
        <ul className="mt-5 space-y-5">
          {evidence.map((item) => (
            <li
              key={item.id}
              className="flex gap-3 border-t border-slate-100 pt-4"
            >
              <span className="mt-1 size-2 shrink-0 rounded-full bg-teal-600" />
              <div>
                <p className="leading-relaxed">{item.summary}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.kind === "customer_correction"
                    ? "Your correction"
                    : "Synthetic signal"}{" "}
                  ·{" "}
                  {new Intl.DateTimeFormat("en-GB", {
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                  }).format(new Date(item.occurred_at))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-slate-500">
          {context.consent.personalization
            ? "There is no permitted evidence for this situation."
            : "Evidence is hidden while personalization is off."}
        </p>
      )}
    </section>
  );
}

function Preparation({ context }: { context: Context }) {
  return (
    <section aria-labelledby="steps-title">
      <div className="eyebrow">One step at a time</div>
      <h2 id="steps-title" className="mt-2 text-2xl font-semibold">
        Your preparation plan
      </h2>
      {context.decision.next_steps.length ? (
        <ol className="mt-5 space-y-5">
          {context.decision.next_steps.map((step, i) => (
            <li key={step.id} className="border-t border-slate-100 pt-5">
              <div className="mb-2 flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-800">
                  {i + 1}
                </span>
                <h3 className="font-semibold leading-relaxed">{step.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-500">
                {step.description}
              </p>
              <p className="mt-3 flex items-center gap-2 text-xs font-medium text-teal-800">
                <CalendarDays size={14} />
                By {formatDate(step.due_on)}
              </p>
              <details className="mt-3 text-xs text-slate-500">
                <summary className="cursor-pointer">Why this step?</summary>
                <ul className="mt-2 space-y-1">
                  {context.evidence
                    .filter((e) => step.evidence_ids.includes(e.id))
                    .map((e) => (
                      <li key={e.id}>{e.summary}</li>
                    ))}
                </ul>
              </details>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-5 rounded-xl bg-slate-50 p-5">
          <p className="font-medium">
            {context.situation.status === "cancelled"
              ? "Outdated suggestions withdrawn"
              : context.decision.action === "ask"
                ? "Your plan starts with your say"
                : "No suggestions right now"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {context.decision.action === "ask"
              ? "Confirm your move date to see relevant preparation steps."
              : context.decision.message}
          </p>
        </div>
      )}
    </section>
  );
}

const scopes: { key: keyof Consent; title: string; description: string }[] = [
  {
    key: "personalization",
    title: "Personalization",
    description: "Use permitted context to suggest relevant next steps.",
  },
  {
    key: "synthetic_signals",
    title: "Synthetic signals",
    description: "Include the example signals in this demo.",
  },
  {
    key: "advisor_preview",
    title: "Advisor demo preview",
    description: "Show this session in the read-only preview.",
  },
];

export default function App() {
  const m = useMoment();
  const c = m.context;
  const [view, setView] = useState<"customer" | "advisor">("customer");
  const [moveDate, setMoveDate] = useState("");
  const [cancelReview, setCancelReview] = useState(false);
  const [resetReview, setResetReview] = useState(false);
  const [dateError, setDateError] = useState("");
  const disabled = Boolean(m.busy) || !m.fresh;
  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(`${today}T00:00:00Z`);
  maxDate.setUTCDate(maxDate.getUTCDate() + 730);

  useEffect(() => {
    setMoveDate(c?.situation.move_date || "");
    setCancelReview(false);
    setResetReview(false);
    setDateError("");
  }, [c?.session.id, c?.version, c?.situation.move_date]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 md:px-10">
          <a
            href="/"
            aria-label="KBC Moment home"
            className="flex items-center gap-3 text-inherit no-underline"
          >
            <span className="rounded-lg bg-teal-800 px-3 py-2 text-xl font-bold text-white">
              KBC
            </span>
            <span className="text-xl font-semibold tracking-tight">
              Moment<span className="text-teal-600">.</span>
            </span>
          </a>
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck size={18} />
            <span className="hidden sm:inline">Your life. Your say.</span>
          </span>
        </div>
      </header>
      <div
        className={
          fixtureMode
            ? "mode-banner bg-amber-50 text-amber-950"
            : "mode-banner bg-teal-50 text-teal-950"
        }
      >
        <strong>
          {fixtureMode ? "Development fixture mode" : "Live API mode"}
        </strong>
        <span>
          {" "}
          · Synthetic demo only · No banking connection or transactions
        </span>
      </div>
      <main className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Home size={16} />
            Your space
            <ChevronRight size={14} />
            <span className="text-teal-800">Life moments</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {c && (
              <Button
                variant="outline"
                onClick={() =>
                  setView(view === "customer" ? "advisor" : "customer")
                }
              >
                {view === "customer"
                  ? "Advisor demo preview"
                  : "Back to customer view"}
                <ArrowRight size={16} />
              </Button>
            )}
            <Button
              variant="ghost"
              disabled={Boolean(m.busy)}
              onClick={() => void m.refresh()}
            >
              <RefreshCw size={15} />
              Refresh
            </Button>
          </div>
        </div>

        <div aria-live="polite" aria-atomic="true">
          {m.busy && (
            <p className="mb-5 text-sm text-teal-800" role="status">
              {m.busy}…
            </p>
          )}
          {m.notice && (
            <p
              role="status"
              className="mb-5 flex items-center gap-2 text-sm text-teal-800"
            >
              <Check size={17} />
              {m.notice}
            </p>
          )}
        </div>
        {m.error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950"
          >
            <p className="font-medium">{m.error.message}</p>
            {m.error.details.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-sm">
                {m.error.details.map((detail, i) => (
                  <li key={i}>
                    {detail.field}: {detail.message}
                  </li>
                ))}
              </ul>
            )}
            {!m.fresh && !m.sessionRequired && (
              <p className="mt-2 text-sm">
                Controls are paused until Refresh retrieves the current state.
                No demo data will be substituted.
              </p>
            )}
          </div>
        )}

        {!c ? (
          <Card className="mx-auto max-w-3xl gap-6 p-8 md:p-12">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Sparkles size={28} />
            </span>
            <div>
              <div className="eyebrow">A little clarity for what’s next</div>
              <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
                Correct once.
                <br />
                Be understood everywhere.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-500">
                Meet Alex, a synthetic customer who might be planning a move.
                Explore how a correction changes the next step — and the next
                conversation.
              </p>
            </div>
            {m.sessionRequired ? (
              <Button
                className="w-fit bg-teal-800 text-white hover:bg-teal-900"
                disabled={Boolean(m.busy)}
                onClick={() => void m.start()}
              >
                Start synthetic demo
                <ArrowRight size={17} />
              </Button>
            ) : (
              !m.busy && (
                <Button className="w-fit" onClick={() => void m.refresh()}>
                  Retry connection
                </Button>
              )
            )}
            <p className="text-xs leading-relaxed text-slate-500">
              Starting creates an independent synthetic session for this
              browser.{" "}
              {fixtureMode
                ? "Fixture state survives page refresh while this development server runs."
                : "Your existing session is recovered automatically on refresh."}
            </p>
          </Card>
        ) : !m.fresh ? (
          <Card className="p-8">
            <h1 className="text-2xl font-semibold">
              Let’s reconnect before continuing
            </h1>
            <p className="text-slate-500">
              Your previous suggestions are hidden until we can verify the
              current situation.
            </p>
          </Card>
        ) : view === "advisor" ? (
          <>
            <section className="mb-8">
              <div className="eyebrow">Read-only · same session</div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                A shared understanding.
              </h1>
              <p className="mt-3 text-slate-500">
                Advisor demo preview — synthetic session, not bank staff access.
              </p>
            </section>
            {!c.consent.advisor_preview ? (
              <Card className="p-8">
                <LockKeyhole className="text-teal-700" />
                <h2 className="text-2xl font-semibold">
                  Preview consent is off
                </h2>
                <p className="text-slate-500">
                  Return to the customer view to manage consent. No advisor
                  context is shown.
                </p>
              </Card>
            ) : m.advisorError ? (
              <Card role="alert" className="p-8">
                <p>{m.advisorError}</p>
              </Card>
            ) : !m.advisor ? (
              <Card className="p-8" role="status">
                Refreshing the advisor context…
              </Card>
            ) : (
              <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
                <Card className="gap-6 p-7">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {m.advisor.context.customer.display_name} · Synthetic
                    </Badge>
                    <Badge variant="outline">
                      Context version {m.advisor.context.version}
                    </Badge>
                    <Badge variant="outline">Read-only</Badge>
                  </div>
                  <h2 className="text-2xl font-semibold">
                    {statusLabel(m.advisor.context)}
                  </h2>
                  <p className="text-lg">
                    {m.advisor.context.decision.message}
                  </p>
                  {m.advisor.context.situation.move_date && (
                    <p className="text-sm text-slate-500">
                      Move date:{" "}
                      {formatDate(m.advisor.context.situation.move_date)}
                    </p>
                  )}
                  <EvidenceList context={m.advisor.context} />
                  <details className="border-t pt-4 text-sm text-slate-500">
                    <summary className="cursor-pointer">
                      Decision details
                    </summary>
                    <dl className="mt-3 space-y-2">
                      <div>
                        <dt className="font-semibold">Action</dt>
                        <dd>{m.advisor.context.decision.action}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold">Reason</dt>
                        <dd>{m.advisor.context.decision.reason_code}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold">Updated</dt>
                        <dd>
                          {new Date(
                            m.advisor.context.updated_at,
                          ).toLocaleString()}
                        </dd>
                      </div>
                    </dl>
                  </details>
                </Card>
                <Card className="p-7">
                  <Preparation context={m.advisor.context} />
                </Card>
              </div>
            )}
          </>
        ) : (
          <>
            <section className="mb-8">
              <div className="eyebrow">A little clarity for what’s next</div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                Life moves. We’re here with you.
              </h1>
              <p className="mt-4 text-lg text-slate-500">
                Hi {c.customer.display_name}, you decide what fits your life —
                and what doesn’t.
              </p>
            </section>
            <div className="grid items-start gap-6 lg:grid-cols-[1.45fr_1fr]">
              <div className="space-y-6">
                <Card className="gap-0 overflow-hidden p-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-100 bg-teal-50 px-7 py-4">
                    <span className="flex items-center gap-2 font-semibold text-teal-900">
                      <Home size={18} />
                      Your moving moment
                    </span>
                    <Badge variant="outline" className="bg-white text-teal-900">
                      {statusLabel(c)}
                    </Badge>
                  </div>
                  <div className="p-7">
                    <h2 className="text-2xl font-semibold leading-snug">
                      {c.decision.message}
                    </h2>
                    {c.situation.status === "tentative" && (
                      <p className="mt-3 leading-relaxed text-slate-500">
                        The signals could mean a move, or something else
                        entirely. Only you know your story.
                      </p>
                    )}
                    {c.situation.move_date && (
                      <p className="mt-3 flex items-center gap-2 text-teal-900">
                        <CalendarDays size={18} />
                        Your move date: {formatDate(c.situation.move_date)}
                      </p>
                    )}
                    <form
                      className="mt-6 border-t border-slate-100 pt-5"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!moveDate) {
                          setDateError("Choose a move date first.");
                          return;
                        }
                        setDateError("");
                        void m.confirm(moveDate);
                      }}
                    >
                      <label
                        htmlFor="move-date"
                        className="text-sm font-semibold"
                      >
                        {c.situation.status === "confirmed"
                          ? "Change your move date"
                          : c.situation.status === "cancelled"
                            ? "Plans changed again? Confirm a new move"
                            : "When are you planning to move?"}
                      </label>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Input
                          id="move-date"
                          aria-describedby="date-help"
                          aria-invalid={Boolean(dateError)}
                          type="date"
                          required
                          min={today}
                          max={maxDate.toISOString().slice(0, 10)}
                          value={moveDate}
                          onChange={(event) => {
                            setMoveDate(event.target.value);
                            setDateError("");
                          }}
                          disabled={disabled}
                          className="h-11 w-full bg-white sm:w-48"
                        />
                        <Button
                          disabled={disabled}
                          type="submit"
                          className="h-11 bg-teal-800 px-5 text-white hover:bg-teal-900"
                        >
                          <Check size={17} />
                          {c.situation.status === "confirmed"
                            ? "Save new date"
                            : "Confirm move date"}
                        </Button>
                      </div>
                      <p id="date-help" className="mt-2 text-xs text-slate-500">
                        Today through the next two years. Saving a date requests
                        preparation help now.
                      </p>
                      {dateError && (
                        <p role="alert" className="mt-2 text-sm text-red-700">
                          {dateError}
                        </p>
                      )}
                    </form>
                    {c.situation.status !== "cancelled" && (
                      <div className="mt-5">
                        {cancelReview ? (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm">
                              Cancel this moving moment and withdraw its
                              suggestions?
                            </p>
                            <div className="mt-3 flex flex-wrap gap-3">
                              <Button
                                disabled={disabled}
                                onClick={() => void m.cancel()}
                              >
                                Yes, cancel the move
                              </Button>
                              <Button
                                disabled={disabled}
                                variant="outline"
                                onClick={() => setCancelReview(false)}
                              >
                                Keep this moment
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            disabled={disabled}
                            variant="ghost"
                            className="text-slate-600"
                            onClick={() => setCancelReview(true)}
                          >
                            <X size={16} />
                            {c.situation.status === "tentative"
                              ? "I’m not moving"
                              : "Cancel this move"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
                <Card className="p-7">
                  <EvidenceList context={c} />
                </Card>
              </div>
              <aside className="space-y-6">
                <Card className="p-7">
                  <Preparation context={c} />
                </Card>
                <Card className="gap-5 bg-[#edf5f2] p-7">
                  <div>
                    <LockKeyhole size={22} className="mb-3 text-teal-700" />
                    <h2 className="text-xl font-semibold">You’re in control</h2>
                  </div>
                  <div className="space-y-5">
                    {scopes.map((scope) => (
                      <div
                        key={scope.key}
                        className="flex items-start justify-between gap-4"
                      >
                        <div>
                          <p
                            id={`${scope.key}-label`}
                            className="text-sm font-semibold"
                          >
                            {scope.title}
                          </p>
                          <p
                            id={`${scope.key}-help`}
                            className="mt-1 max-w-64 text-xs leading-relaxed text-slate-600"
                          >
                            {scope.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={c.consent[scope.key]}
                          aria-labelledby={`${scope.key}-label`}
                          aria-describedby={`${scope.key}-help`}
                          disabled={disabled}
                          onClick={() =>
                            void m.consent(scope.key, !c.consent[scope.key])
                          }
                          className={`mt-1 flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-transparent p-0.5 transition-colors disabled:cursor-wait disabled:opacity-60 ${c.consent[scope.key] ? "justify-end bg-teal-800" : "justify-start bg-slate-400"}`}
                        >
                          <span className="size-5 rounded-full bg-white shadow-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="border-t border-teal-900/10 pt-4 text-xs leading-relaxed text-slate-600">
                    Turning consent off stops its use; it does not delete the
                    saved synthetic context. Your explicit corrections remain
                    yours.
                  </p>
                </Card>
              </aside>
            </div>
          </>
        )}
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5 text-xs text-slate-500">
          <span>KBC Moment · Tectonic hackathon concept</span>
          {c && (
            <div className="flex flex-wrap items-center gap-3">
              {resetReview ? (
                <>
                  <span>Replace this browser’s demo session?</span>
                  <Button
                    size="sm"
                    disabled={Boolean(m.busy)}
                    onClick={() => void m.start()}
                  >
                    Start a new demo
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={Boolean(m.busy)}
                    onClick={() => setResetReview(false)}
                  >
                    Keep session
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={Boolean(m.busy)}
                  onClick={() => setResetReview(true)}
                >
                  Reset synthetic demo
                </Button>
              )}
            </div>
          )}
        </footer>
      </main>
    </div>
  );
}
