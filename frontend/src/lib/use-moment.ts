import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "./api";
import type { AdvisorPreview, Consent, Context } from "./types";

export function useMoment() {
  const [context, setContext] = useState<Context | null>(null);
  const [advisor, setAdvisor] = useState<AdvisorPreview | null>(null);
  const [advisorError, setAdvisorError] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("Loading your session");
  const [fresh, setFresh] = useState(false);
  const [sessionRequired, setSessionRequired] = useState(false);
  const lock = useRef(false);

  const accept = useCallback((value: Context) => {
    setContext(value);
    setFresh(true);
    setSessionRequired(false);
  }, []);

  const loadAdvisor = useCallback(
    async (value: Context) => {
      setAdvisor(null);
      setAdvisorError("");
      if (!value.consent.advisor_preview) return;
      try {
        const preview = await api.getAdvisor();
        // Another tab may have written between the customer and advisor reads.
        // The preview carries a full authoritative Context, including fresh CSRF.
        accept(preview.context);
        setAdvisor(preview);
      } catch (reason) {
        if (reason instanceof ApiError && reason.status === 401) throw reason;
        if (
          reason instanceof ApiError &&
          reason.code === "ADVISOR_CONSENT_REQUIRED"
        ) {
          accept(await api.getContext());
          setAdvisorError("Advisor preview consent is off.");
        } else
          setAdvisorError(
            "The advisor preview could not refresh. Old preview data is hidden. Use Refresh to try again.",
          );
      }
    },
    [accept],
  );

  const recover = useCallback(async () => {
    const value = await api.getContext();
    accept(value);
    await loadAdvisor(value);
  }, [accept, loadAdvisor]);

  const run = useCallback(
    async (label: string, work: () => Promise<void>, mutation = false) => {
      if (lock.current) return;
      lock.current = true;
      setBusy(label);
      setError(null);
      setNotice("");
      setAdvisor(null);
      setAdvisorError("");
      try {
        await work();
      } catch (reason) {
        const failure =
          reason instanceof ApiError
            ? reason
            : new ApiError(
                0,
                "UNEXPECTED_ERROR",
                "Something went wrong. Refresh before trying again.",
              );
        if (failure.status === 401) {
          setContext(null);
          setAdvisor(null);
          setFresh(false);
          setSessionRequired(true);
          if (mutation) setError(failure);
        } else if (failure.status === 409 || failure.code === "CSRF_INVALID") {
          setFresh(false);
          try {
            await recover();
            setError(
              new ApiError(
                failure.status,
                failure.code,
                failure.code === "CSRF_INVALID"
                  ? "Your session protection was refreshed. Review the current situation and submit your change again."
                  : "The situation changed. We loaded the latest state. Review it before submitting your change again.",
                failure.details,
              ),
            );
          } catch (refreshError) {
            setError(
              new ApiError(
                0,
                "REFRESH_REQUIRED",
                "Could not recover the latest state. Refresh before trying your change again.",
              ),
            );
            if (
              refreshError instanceof ApiError &&
              refreshError.status === 401
            ) {
              setContext(null);
              setSessionRequired(true);
            }
          }
        } else {
          setError(failure);
          if (failure.status !== 422) setFresh(false);
          else
            setAdvisorError(
              "No change was saved. Use Refresh to reload the advisor preview after correcting the input.",
            );
        }
      } finally {
        lock.current = false;
        setBusy("");
      }
    },
    [recover],
  );

  const refresh = useCallback(
    () => run("Refreshing your situation", recover),
    [run, recover],
  );
  useEffect(() => {
    void refresh();
    const onFocus = () => {
      void refresh();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const update = (label: string, request: (c: Context) => Promise<Context>) => {
    if (!context || !fresh) return;
    return run(
      label,
      async () => {
        const value = await request(context);
        accept(value);
        setNotice("Your change was saved.");
        await loadAdvisor(value);
      },
      true,
    );
  };

  return {
    context,
    advisor,
    advisorError,
    error,
    notice,
    busy,
    fresh,
    sessionRequired,
    refresh,
    start: () =>
      run(
        "Starting a new demo",
        async () => {
          const value = await api.startSession();
          accept(value);
          await loadAdvisor(value);
        },
        true,
      ),
    confirm: (move_date: string) =>
      update("Saving your move date", (c) =>
        api.correct(
          {
            expected_version: c.version,
            action:
              c.situation.status === "confirmed" ? "change_date" : "confirm",
            move_date,
            remind_on: null,
          },
          c.session.csrf_token,
        ),
      ),
    cancel: () =>
      update("Cancelling your move", (c) =>
        api.correct(
          { expected_version: c.version, action: "cancel" },
          c.session.csrf_token,
        ),
      ),
    remind: (remind_on: string | null) =>
      update("Saving your help timing", (c) =>
        api.correct(
          { expected_version: c.version, action: "set_reminder", remind_on },
          c.session.csrf_token,
        ),
      ),
    consent: (scope: keyof Consent, enabled: boolean) =>
      update("Saving your consent choice", (c) =>
        api.setConsent(
          { expected_version: c.version, [scope]: enabled },
          c.session.csrf_token,
        ),
      ),
  };
}
