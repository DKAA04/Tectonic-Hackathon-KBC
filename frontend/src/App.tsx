import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Download,
  Home,
  LockKeyhole,
  MapPin,
  MessageSquare,
  Pencil,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { fixtureMode } from "@/lib/api";
import { useMoment } from "@/lib/use-moment";
import {
  buildBriefing,
  changeLabel,
  displayDate,
  displayTime,
  draftKey,
  readableMessage,
  situationLabel,
} from "@/lib/presentation";
import type { Consent, Context } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/drawer";
import { ReminderControl } from "@/components/reminder-control";

type Moment = ReturnType<typeof useMoment>;
type Panel =
  | "date"
  | "cancel"
  | "privacy"
  | "evidence"
  | "history"
  | "reset"
  | "moving-admin"
  | "moving-insurance"
  | null;

function AdvisorSummary({
  moment: m,
  expanded = false,
}: {
  moment: Moment;
  expanded?: boolean;
}) {
  const c = m.advisor?.context;
  return (
    <Card className="workspace-card advisor-card">
      <div className="section-heading">
        <span className="icon-tile small">
          <MessageSquare size={19} />
        </span>
        <div>
          <p className="eyebrow">Same session · read-only</p>
          <h2>Advisor preview</h2>
        </div>
      </div>
      {!m.fresh ? (
        <p className="muted">Waiting for the current situation.</p>
      ) : !m.context?.consent.advisor_preview ? (
        <div className="empty-compact">
          <LockKeyhole size={22} />
          <h3>Preview consent is off</h3>
          <p>Manage this in Privacy & consent in the customer view.</p>
        </div>
      ) : m.advisorError ? (
        <p role="alert" className="muted">
          {m.advisorError}
        </p>
      ) : !c ? (
        <p role="status" className="muted">
          Refreshing the shared situation…
        </p>
      ) : (
        <>
          <div className="advisor-person">
            <span className="avatar">A</span>
            <div>
              <h3>{c.customer.display_name}</h3>
              <p className="muted">{situationLabel(c)}</p>
            </div>
          </div>
          {c.situation.move_date && (
            <p className="detail-line">
              <CalendarDays size={16} />
              {displayDate(c.situation.move_date)}
            </p>
          )}
          <div className="summary-section">
            <p className="eyebrow">What changed</p>
            <p>
              {c.history.length
                ? changeLabel(c.history[c.history.length - 1].action)
                : "Awaiting Alex’s confirmation"}
            </p>
            <p className="muted">{readableMessage(c.decision.message)}</p>
          </div>
          <div className="summary-section">
            <p className="eyebrow">Active preparation</p>
            {c.decision.next_steps.length ? (
              <ul className="advisor-steps">
                {c.decision.next_steps.map((step) => (
                  <li key={step.id}>
                    <Check size={15} />
                    <span>{step.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No active suggestions.</p>
            )}
          </div>
          <div className="update-stamp">
            <span className="status-dot" />
            Last change {displayTime(c.updated_at)}
          </div>
          {expanded && (
            <details className="metadata">
              <summary>Context & decision details</summary>
              <dl>
                <dt>Context version</dt>
                <dd>{c.version}</dd>
                <dt>Decision</dt>
                <dd>{c.decision.reason_code}</dd>
                <dt>Personalization</dt>
                <dd>{c.consent.personalization ? "On" : "Off"}</dd>
              </dl>
            </details>
          )}
        </>
      )}
      <p className="scope-note">Demo preview, not bank staff access.</p>
    </Card>
  );
}

const checklist = [
  {
    title: "List the organisations to notify",
    detail:
      "Consider your bank, employer, municipality, utilities, internet provider and subscriptions.",
  },
  {
    title: "Prepare your address details",
    detail:
      "Have your new address, moving date and relevant customer references ready. Keep these details outside this prototype.",
  },
  {
    title: "Review the remaining updates",
    detail:
      "Check each organisation’s official process and note what still needs to be done.",
  },
];
const scopes: { key: keyof Consent; title: string; description: string }[] = [
  {
    key: "personalization",
    title: "Personalization",
    description: "Use permitted context for relevant preparation steps.",
  },
  {
    key: "synthetic_signals",
    title: "Synthetic signals",
    description: "Include the example goal and home-store signals.",
  },
  {
    key: "advisor_preview",
    title: "Advisor preview",
    description: "Show this session in the read-only demo preview.",
  },
];

export default function App() {
  const m = useMoment();
  const c = m.context;
  const [view, setView] = useState<"customer" | "advisor">("customer");
  const [panel, setPanel] = useState<Panel>(null);
  const [moveDate, setMoveDate] = useState("");
  const [draft, setDraft] = useState<{ key: string; ticks: number[] }>({
    key: "",
    ticks: [],
  });
  const [downloadNotice, setDownloadNotice] = useState("");
  const key = c ? draftKey(c) : "";
  const ticks = draft.key === key ? draft.ticks : [];
  const disabled = Boolean(m.busy) || !m.fresh;
  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(`${today}T00:00:00Z`);
  maxDate.setUTCDate(maxDate.getUTCDate() + 730);

  useEffect(() => {
    setPanel((value) => (value === "privacy" ? value : null));
    setDraft({ key, ticks: [] });
    setMoveDate(c?.situation.move_date || "");
    setDownloadNotice("");
  }, [key]);
  useEffect(() => {
    if (!m.fresh) {
      setPanel(null);
      setDraft({ key: "", ticks: [] });
    }
  }, [m.fresh]);

  const open = (value: Panel) => {
    setMoveDate(c?.situation.move_date || "");
    setPanel(value);
  };
  const saveBriefing = () => {
    if (!c || disabled) return;
    const url = URL.createObjectURL(
      new Blob([buildBriefing(c)], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "kbc-moment-preparation-briefing.txt";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloadNotice(
      "Local briefing download prepared. Nothing was sent to an advisor.",
    );
  };
  const activeStep = c?.decision.next_steps.find((step) => step.id === panel);
  const panelAllowed =
    c &&
    m.fresh &&
    ((panel !== "moving-admin" && panel !== "moving-insurance") || activeStep);
  const titles: Record<Exclude<Panel, null>, string> = {
    date:
      c?.situation.status === "confirmed"
        ? "Change your move date"
        : "Plan your move",
    cancel: "Cancel your moving moment",
    privacy: "Privacy & consent",
    evidence: "Why this moment?",
    history: "Your changes",
    reset: "Start a new demo",
    "moving-admin": "Your address checklist",
    "moving-insurance": "Prepare your home-cover questions",
  };

  return (
    <div className="banking-workspace">
      <header className="app-header">
        <div className="header-inner">
          <a href="/" className="brand" aria-label="KBC Moment home">
            <img src="/kbc-logo.svg" alt="KBC" />
            <span>Moment</span>
          </a>
          <nav aria-label="Workspace view" className="view-switch">
            <button
              aria-pressed={view === "customer"}
              onClick={() => {
                setView("customer");
                setPanel(null);
              }}
            >
              Customer
            </button>
            <button
              aria-pressed={view === "advisor"}
              onClick={() => {
                setView("advisor");
                setPanel(null);
              }}
            >
              Advisor
            </button>
          </nav>
          <span className="header-prototype">
            Hackathon prototype · synthetic data
          </span>
          <div className="profile">
            <span className="avatar">A</span>
            <span>{c?.customer.display_name || "Alex"}</span>
          </div>
        </div>
      </header>
      <div className="environment-strip">
        <div>
          <span className="mobile-prototype">
            Hackathon prototype · synthetic data
          </span>
          <span className={fixtureMode ? "fixture-label" : "live-label"}>
            {fixtureMode ? "Development fixtures" : "Live API"}
            <span className="environment-detail">
              {" "}
              · No banking transactions
            </span>
          </span>
        </div>
      </div>
      <main className="workspace-container">
        <div className="workspace-toolbar">
          <p>
            <Home size={14} />
            My moments
            <ChevronRight size={14} />
            <strong>
              {view === "customer" ? "Moving home" : "Advisor preview"}
            </strong>
          </p>
          <Button
            variant="ghost"
            size="sm"
            disabled={Boolean(m.busy)}
            onClick={() => void m.refresh()}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
        </div>
        {(m.busy || m.notice) && (
          <p className="status-line" role="status" aria-live="polite">
            {m.busy ? (
              `${m.busy}…`
            ) : (
              <>
                <Check size={15} />
                {m.notice}
              </>
            )}
          </p>
        )}
        {m.error && (
          <div role="alert" className="error-panel">
            <strong>{m.error.message}</strong>
            {m.error.details.map((detail, i) => (
              <p key={i}>
                {detail.field}: {readableMessage(detail.message)}
              </p>
            ))}
            {!m.fresh && !m.sessionRequired && (
              <p>Refresh to verify the current state before continuing.</p>
            )}
          </div>
        )}
        {!c ? (
          <section className="move-hero welcome-hero">
            <div>
              <p className="eyebrow">Welcome to KBC Moment</p>
              <h1>
                Your move,
                <br />
                organised.
              </h1>
              <p className="hero-message">
                A little preparation. A clear next step.
                <br />A plan that changes when your life does.
              </p>
              {m.sessionRequired ? (
                <Button
                  disabled={Boolean(m.busy)}
                  onClick={() => void m.start()}
                >
                  Start Alex’s demo
                  <ArrowRight size={17} />
                </Button>
              ) : (
                !m.busy && (
                  <Button onClick={() => void m.refresh()}>
                    Retry connection
                  </Button>
                )
              )}
              <p className="scope-note">
                Explore a synthetic moving journey. Nothing is sent to a bank.
              </p>
            </div>
            <div className="hero-art" aria-hidden="true">
              <Home />
              <span>
                <MapPin size={24} />
              </span>
            </div>
          </section>
        ) : !m.fresh ? (
          <Card className="workspace-card">
            <h1>Let’s reconnect before continuing</h1>
            <p className="muted">
              Previous suggestions are hidden until the current situation is
              verified.
            </p>
          </Card>
        ) : view === "advisor" ? (
          <div className="advisor-expanded">
            <section className="page-intro">
              <p className="eyebrow">Read-only workspace</p>
              <h1>One shared understanding.</h1>
              <p className="muted">
                Alex’s current situation, decisions and changes, read from the
                same session.
              </p>
            </section>
            <AdvisorSummary moment={m} expanded />
          </div>
        ) : (
          <div className="workspace-grid">
            <div className="customer-column">
              <section className="move-hero">
                <div className="hero-copy">
                  <div className="situation-badge">
                    <span className="status-dot" />
                    {situationLabel(c)}
                  </div>
                  <h1>Your move, organised.</h1>
                  <p className="hero-message">
                    {readableMessage(c.decision.message)}
                  </p>
                  {c.situation.move_date && (
                    <div className="hero-date">
                      <CalendarDays size={17} />
                      <strong>{displayDate(c.situation.move_date)}</strong>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        onClick={() => open("date")}
                      >
                        <Pencil size={13} />
                        Change date
                      </Button>
                    </div>
                  )}
                  <div className="hero-actions">
                    {c.situation.status !== "confirmed" && (
                      <Button disabled={disabled} onClick={() => open("date")}>
                        {c.situation.status === "cancelled"
                          ? "Plan a new move"
                          : "Plan my move"}
                        <ArrowRight size={16} />
                      </Button>
                    )}
                    {c.situation.status !== "cancelled" && (
                      <Button
                        variant="ghost"
                        disabled={disabled}
                        onClick={() => open("cancel")}
                      >
                        {c.situation.status === "tentative"
                          ? "I’m not moving"
                          : "Cancel move"}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <Home />
                  <span>
                    <MapPin size={24} />
                  </span>
                </div>
              </section>
              <section className="preparation-section">
                <div className="section-title">
                  <h2>Your next steps</h2>
                  <Button
                    variant="outline"
                    disabled={disabled}
                    onClick={saveBriefing}
                    title="Download a local text briefing. Nothing is sent to an advisor."
                  >
                    <Download size={15} />
                    Save briefing
                  </Button>
                </div>
                {c.decision.next_steps.length ? (
                  <div className="action-grid">
                    {c.decision.next_steps.map((step) => (
                      <Card
                        key={step.id}
                        className="workspace-card action-card"
                      >
                        <span className="icon-tile">
                          {step.id === "moving-insurance" ? (
                            <ShieldCheck />
                          ) : (
                            <ClipboardList />
                          )}
                        </span>
                        <h3>{step.title}</h3>
                        <p className="muted">
                          {step.id === "moving-admin"
                            ? "Get your organisations and address details ready in one simple checklist."
                            : step.id === "moving-insurance"
                              ? "Bring the right questions to your next conversation."
                              : readableMessage(step.description)}
                        </p>
                        <p className="task-date">
                          <CalendarDays size={14} />
                          For {displayDate(step.due_on)}
                        </p>
                        {["moving-admin", "moving-insurance"].includes(
                          step.id,
                        ) ? (
                          <Button
                            variant="outline"
                            disabled={disabled}
                            onClick={() => open(step.id as Panel)}
                          >
                            {step.id === "moving-admin"
                              ? "Open checklist"
                              : "Prepare questions"}
                            <ArrowRight size={15} />
                          </Button>
                        ) : (
                          <p className="scope-note">
                            {readableMessage(step.description)}
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="workspace-card empty-plan">
                    <span className="icon-tile">
                      <ClipboardList />
                    </span>
                    <div>
                      <h3>
                        {c.situation.status === "cancelled"
                          ? "Your old suggestions are withdrawn"
                          : c.decision.action === "ask"
                            ? "A useful plan starts with you"
                            : "Preparation help is paused"}
                      </h3>
                      <p className="muted">
                        {c.decision.action === "ask"
                          ? "Select Plan my move to confirm your date. We’ll then show your preparation steps here."
                          : readableMessage(c.decision.message)}
                      </p>
                    </div>
                  </Card>
                )}
              </section>
              {c.situation.status === "confirmed" && (
                <ReminderControl
                  context={c}
                  disabled={disabled}
                  busy={m.busy}
                  error={m.error?.message}
                  onSave={(date) => {
                    void m.remind(date);
                  }}
                />
              )}
              {downloadNotice && (
                <p role="status" className="status-line">
                  {downloadNotice}
                </p>
              )}
              <div className="workspace-links">
                <button onClick={() => open("evidence")}>
                  <ClipboardList size={16} />
                  Why this moment?
                  <ChevronRight size={16} />
                </button>
                <button onClick={() => open("history")}>
                  <RefreshCw size={16} />
                  Your changes
                  <ChevronRight size={16} />
                </button>
                <button onClick={() => open("privacy")}>
                  <LockKeyhole size={16} />
                  Privacy & consent
                  <ChevronRight size={16} />
                </button>
              </div>
              {!c.consent.personalization && (
                <p className="privacy-status">
                  <LockKeyhole size={15} />
                  Personalization is off. Your explicit choices are kept.
                </p>
              )}
            </div>
            <aside className="advisor-column">
              <AdvisorSummary moment={m} />
              <div className="reassurance">
                <ShieldCheck size={21} />
                <p>
                  <strong>Your plans. Your say.</strong>
                  <br />A correction changes both views. You can cancel or
                  change consent at any time.
                </p>
              </div>
            </aside>
          </div>
        )}
        <footer className="workspace-footer">
          <span>KBC Moment · Hackathon concept</span>
          {c && (
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => open("reset")}
            >
              Reset demo
            </Button>
          )}
        </footer>
      </main>
      {panel && panelAllowed && (
        <Drawer title={titles[panel]} onClose={() => setPanel(null)}>
          {m.error && (
            <p className="error-panel" role="alert">
              {m.error.message}
            </p>
          )}
          {m.busy && (
            <p role="status" className="status-line">
              {m.busy}…
            </p>
          )}
          {panel === "date" && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void m.confirm(moveDate);
              }}
            >
              <span className="icon-tile">
                <CalendarDays />
              </span>
              <h3 className="drawer-intro">
                A date helps us prepare the right next steps.
              </h3>
              <label className="field-label" htmlFor="move-date">
                {c.situation.status === "confirmed"
                  ? "New move date"
                  : "Planned move date"}
              </label>
              <Input
                id="move-date"
                type="date"
                autoFocus
                required
                min={today}
                max={maxDate.toISOString().slice(0, 10)}
                value={moveDate}
                onChange={(event) => setMoveDate(event.target.value)}
                disabled={disabled}
              />
              <p className="scope-note">
                Choose today through the next 730 days. Saving requests
                preparation help now and clears an existing reminder date.
              </p>
              <Button
                className="drawer-submit"
                type="submit"
                disabled={disabled}
              >
                {c.situation.status === "confirmed"
                  ? "Save move date"
                  : "Confirm & build my plan"}
                <ArrowRight size={16} />
              </Button>
            </form>
          )}
          {panel === "cancel" && (
            <>
              <p>
                Cancelling withdraws moving suggestions from your workspace and
                the advisor preview.
              </p>
              <p className="scope-note">
                You can confirm a new move later if your plans change.
              </p>
              <Button
                disabled={disabled}
                className="drawer-submit"
                onClick={() => void m.cancel()}
              >
                <X size={16} />
                Confirm cancellation
              </Button>
            </>
          )}
          {panel === "reset" && (
            <>
              <p>
                Create a fresh synthetic session for this browser? Your current
                local preparation draft will be cleared.
              </p>
              <Button
                disabled={disabled}
                className="drawer-submit"
                onClick={() => void m.start()}
              >
                Start a new demo
              </Button>
            </>
          )}
          {panel === "privacy" && (
            <>
              <p className="muted">
                Choose how this synthetic context is used. Turning a scope off
                stops its use; it does not delete the stored demo context.
              </p>
              <div className="consent-list">
                {scopes.map((scope) => (
                  <label key={scope.key} className="consent-row">
                    <span>
                      <strong>{scope.title}</strong>
                      <small>{scope.description}</small>
                    </span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={c.consent[scope.key]}
                      disabled={disabled}
                      onChange={(event) =>
                        void m.consent(scope.key, event.target.checked)
                      }
                    />
                  </label>
                ))}
              </div>
            </>
          )}
          {panel === "evidence" && (
            <>
              <p className="muted">
                Only evidence currently permitted by your consent is shown.
              </p>
              {c.evidence.length ? (
                <ul className="evidence-list">
                  {c.evidence.map((item) => (
                    <li key={item.id}>
                      <span className="eyebrow">
                        {item.kind === "customer_correction"
                          ? "Your correction"
                          : "Synthetic signal"}
                      </span>
                      <p>{readableMessage(item.summary)}</p>
                      <small>{displayTime(item.occurred_at)}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-compact">
                  No permitted evidence is available.
                </p>
              )}
              <details className="metadata">
                <summary>Technical context</summary>
                <p>
                  Context version {c.version} · {c.decision.reason_code}
                </p>
              </details>
            </>
          )}
          {panel === "history" && (
            <>
              {c.history.length ? (
                <ol className="evidence-list">
                  {[...c.history].reverse().map((item) => (
                    <li key={item.version}>
                      <strong>{changeLabel(item.action)}</strong>
                      <p className="muted">{displayTime(item.occurred_at)}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No changes yet. Your decisions will appear here.</p>
              )}
            </>
          )}
          {panel === "moving-admin" && activeStep && (
            <>
              <p className="drawer-kicker">
                Preparing for {displayDate(c.situation.move_date!)}
              </p>
              <p className="draft-notice">
                Unsaved draft progress · kept only while this page and context
                stay unchanged.
              </p>
              <div className="checklist">
                {checklist.map((item, i) => (
                  <label key={item.title}>
                    <input
                      type="checkbox"
                      checked={ticks.includes(i)}
                      onChange={(event) =>
                        setDraft({
                          key,
                          ticks: event.target.checked
                            ? [...ticks, i]
                            : ticks.filter((index) => index !== i),
                        })
                      }
                    />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.detail}</small>
                    </span>
                  </label>
                ))}
              </div>
              <p className="scope-note">
                This is preparation only. No address has been updated at KBC or
                any other organisation.
              </p>
            </>
          )}
          {panel === "moving-insurance" && activeStep && (
            <>
              <p className="drawer-kicker">
                Questions for your move on {displayDate(c.situation.move_date!)}
              </p>
              <ol className="question-list">
                <li>
                  What should I check about my current home cover before{" "}
                  {displayDate(c.situation.move_date!)}?
                </li>
                <li>
                  What details will you need about the new home and the moving
                  date?
                </li>
                <li>
                  If I have access to both homes for a while, what should I ask
                  about that overlap?
                </li>
                <li>What should I check about belongings during the move?</li>
                <li>
                  Which documents and next steps should I prepare before any
                  change?
                </li>
              </ol>
              <p className="scope-note">
                A conversation guide only. It does not confirm cover,
                eligibility or prices, and does not buy or change a policy.
              </p>
            </>
          )}
        </Drawer>
      )}
    </div>
  );
}
