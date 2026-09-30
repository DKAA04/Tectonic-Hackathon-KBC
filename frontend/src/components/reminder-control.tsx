import { useEffect, useState } from "react";
import { Clock3, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/drawer";
import type { Context } from "@/lib/types";
import { displayDate, draftKey, readableMessage } from "@/lib/presentation";

export function ReminderControl({
  context,
  disabled,
  busy,
  error,
  onSave,
}: {
  context: Context;
  disabled: boolean;
  busy: string;
  error?: string;
  onSave: (date: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(context.situation.remind_on || "");
  const key = draftKey(context);
  useEffect(() => {
    setOpen(false);
    setDate(context.situation.remind_on || "");
  }, [key]);
  const today = new Date().toISOString().slice(0, 10);
  const passed = context.situation.move_date! < today;
  return (
    <>
      <div className="reminder-control">
        <span className="icon-tile small">
          <Clock3 size={19} />
        </span>
        <div>
          <h3>Help at the right time</h3>
          <p>
            {context.situation.remind_on
              ? `Chosen help date: ${displayDate(context.situation.remind_on)}`
              : "Help now — no later date set"}
          </p>
          {context.decision.action === "suppress" && (
            <p>{readableMessage(context.decision.message)}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => setOpen(true)}
        >
          Manage
          <ChevronRight size={15} />
        </Button>
      </div>
      {open && (
        <Drawer
          title="When would you like help?"
          onClose={() => setOpen(false)}
        >
          {error && (
            <p className="error-panel" role="alert">
              {error}
            </p>
          )}
          {busy && (
            <p className="status-line" role="status">
              {busy}…
            </p>
          )}
          <p className="drawer-kicker">
            Move date: {displayDate(context.situation.move_date!)}
          </p>
          {passed ? (
            <p className="muted">
              Your move date has passed. Change your move date before choosing a
              future help date.
            </p>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onSave(date);
              }}
            >
              <label className="field-label" htmlFor="reminder-date">
                Show preparation help from
              </label>
              <Input
                id="reminder-date"
                type="date"
                required
                autoFocus
                min={today}
                max={context.situation.move_date!}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                disabled={disabled}
              />
              <Button
                className="drawer-submit"
                type="submit"
                disabled={disabled}
              >
                Save help date
              </Button>
            </form>
          )}
          <Button
            className="help-now-button"
            variant="outline"
            disabled={disabled}
            onClick={() => onSave(null)}
          >
            Help me now
          </Button>
          <p className="scope-note">
            This records when preparation help should appear in this workspace.
            It does not schedule or send an email, notification or message.
            Consent still controls whether help is shown.
          </p>
        </Drawer>
      )}
    </>
  );
}
