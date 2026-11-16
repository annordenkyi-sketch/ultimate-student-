import { Link } from "react-router-dom";
import { AlertTriangle, CloudOff, Link2Off, X } from "lucide-react";
import { useSync } from "@/session/SyncProvider";
import { btn } from "@/ui/button";

/** Flow 08 on Home: what the automatic sync found when the app opened. */
export const SyncNotice = () => {
  const { pendingCount, autoOutcome, dismissAuto } = useSync();

  if (pendingCount > 0) {
    return (
      <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-oxford-gold/60 bg-oxford-gold/10 p-4">
        <p className="flex items-start gap-2 text-sm text-oxford-ink">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-oxford-ink2" aria-hidden="true" />
          <span>
            <strong className="font-semibold">Your university timetable has changed.</strong> {pendingCount}{" "}
            {pendingCount === 1 ? "change is" : "changes are"} waiting for your review.
          </span>
        </p>
        <Link to="/more/academics/sync?review=pending" className={btn("primary")}>
          Review changes
        </Link>
      </div>
    );
  }

  if (autoOutcome !== "failed" && autoOutcome !== "not-authorised") return null;
  const failed = autoOutcome === "failed";
  return (
    <div role="status" className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-oxford-rule bg-white/80 p-4">
      <p className="flex min-w-0 flex-1 items-start gap-2 text-sm text-oxford-ink">
        {failed ? (
          <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-oxford-ink2" aria-hidden="true" />
        ) : (
          <Link2Off className="mt-0.5 h-4 w-4 shrink-0 text-oxford-ink2" aria-hidden="true" />
        )}
        <span>
          {failed
            ? "We couldn't check the student portal for timetable changes. Your courses are as they were."
            : "The student portal needs your permission again to keep your courses in step."}
        </span>
      </p>
      <Link to={failed ? "/more/academics/sync" : "/more/self-service"} className={btn("secondary")}>
        {failed ? "Try again" : "Reconnect"}
      </Link>
      <button
        type="button"
        onClick={dismissAuto}
        aria-label="Dismiss"
        className="flex h-11 w-11 items-center justify-center rounded-full text-oxford-mute transition hover:bg-oxford-cream hover:text-oxford-ink"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};
