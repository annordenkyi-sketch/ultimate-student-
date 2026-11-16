import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, CloudOff, Link2Off, Loader2, Minus, PencilLine, Plus, RefreshCw } from "lucide-react";
import { services, type Course, type SessionSnapshot, type SyncChanges, type SyncSummary, type PortalConnection } from "@/services";
import { relativeTime, relativeTimeInline, useNow } from "@/lib/dates";
import { useSession } from "@/session/SessionProvider";
import { useSync } from "@/session/SyncProvider";
import { btn } from "@/ui/button";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { ClashList } from "../../setup/ClashList";
import { dayName, findClashes, placedSessions } from "../../setup/timetable";
import { ConnectPortalDialog } from "../ConnectPortalDialog";
import { PersonalSection, SectionHeader } from "../MoreLayout";

type Phase =
  | { k: "checking" }
  | { k: "not-authorised"; connection: PortalConnection }
  | { k: "failed"; lastSyncedAt: string | null }
  | { k: "up-to-date"; lastSyncedAt: string }
  | { k: "review"; changes: SyncChanges; fromPending: boolean }
  | { k: "kept" }
  | { k: "conflicts"; courses: Course[]; acknowledged: string[]; summary: SyncSummary }
  | { k: "done"; summary: SyncSummary };

const BACK = { to: "/more/academics", label: "Academics" };

const when = (s: SessionSnapshot) =>
  s.day && s.start && s.end ? `${dayName(s.day)} ${s.start}–${s.end}` : "Time not published";

/** "2 courses added, 1 venue changed". */
export const summaryText = (s: SyncSummary) => {
  const parts: string[] = [];
  const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
  if (s.added) parts.push(n(s.added, "course added", "courses added"));
  if (s.removed) parts.push(n(s.removed, "course removed", "courses removed"));
  if (s.venuesChanged) parts.push(n(s.venuesChanged, "venue changed", "venues changed"));
  if (s.timesChanged) parts.push(n(s.timesChanged, "time changed", "times changed"));
  return parts.length ? parts.join(", ") : "No changes applied";
};

/** Flow 08 "Returning student sync": check, review, apply, resolve, summary. */
export const SyncFlowScreen = () => (
  <PersonalSection title="Sync with the student portal" includes={["Keep your courses and timetable in step with the university"]}>
    <SyncFlow />
  </PersonalSection>
);

const SyncFlow = () => {
  const { account } = useSession();
  const accountId = account!.id;
  const sync = useSync();
  const now = useNow();
  const [params] = useSearchParams();
  const [phase, setPhase] = useState<Phase>({ k: "checking" });
  const [connectOpen, setConnectOpen] = useState(false);
  const [busy, setBusy] = useState<"apply" | "keep" | "confirm" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const run = useCallback(async () => {
    setError(null);
    setPhase({ k: "checking" });
    try {
      const r = await services.sync.check(accountId);
      if (r.status === "not-authorised") setPhase({ k: "not-authorised", connection: r.connection });
      else if (r.status === "failed") setPhase({ k: "failed", lastSyncedAt: r.lastSyncedAt });
      else if (r.status === "up-to-date") setPhase({ k: "up-to-date", lastSyncedAt: r.lastSyncedAt });
      else setPhase({ k: "review", changes: r.changes, fromPending: false });
    } catch {
      const c = await services.sync.connection(accountId).catch(() => null);
      setPhase({ k: "failed", lastSyncedAt: c?.lastSyncedAt ?? null });
    }
    void sync.refresh();
  }, [accountId, sync]);

  // Open pending changes straight away, otherwise check the portal.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (params.get("review") === "pending") {
      void services.sync.pending(accountId).then((p) => (p ? setPhase({ k: "review", changes: p, fromPending: true }) : run()));
    } else void run();
  }, [accountId, params, run]);

  // Announce each new step.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [phase.k]);

  const accept = async (changes: SyncChanges) => {
    setBusy("apply");
    setError(null);
    try {
      const { timetable, summary } = await services.sync.apply(accountId, changes);
      const ack = timetable.acknowledgedClashes ?? [];
      const unresolved = findClashes(placedSessions(timetable.courses)).filter((c) => !ack.includes(c.id));
      setPhase(unresolved.length ? { k: "conflicts", courses: timetable.courses, acknowledged: ack, summary } : { k: "done", summary });
      void sync.refresh();
    } catch {
      setError("The changes weren't applied. Your timetable is as it was. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const keep = async (changes: SyncChanges) => {
    setBusy("keep");
    try {
      await services.sync.keepPending(accountId, changes);
      await sync.refresh();
      setPhase({ k: "kept" });
    } finally {
      setBusy(null);
    }
  };

  const Heading = ({ children }: { children: ReactNode }) => (
    <h2 ref={headingRef} tabIndex={-1} className="font-serif text-2xl font-medium text-oxford-ink outline-none">
      {children}
    </h2>
  );

  const Card = ({ icon, tone = "info", children }: { icon: ReactNode; tone?: "info" | "warn" | "ok"; children: ReactNode }) => (
    <div
      className={`rounded-2xl border p-5 ${
        tone === "warn" ? "border-oxford-danger/30 bg-oxford-danger/5" : tone === "ok" ? "border-oxford-success/30 bg-oxford-success/5" : "border-oxford-rule bg-white/80"
      }`}
    >
      <div className="flex gap-3">
        <span className="mt-1 shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <SectionHeader title="Sync with the student portal" back={BACK} />

      {phase.k === "checking" && (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-oxford-rule bg-white/80 p-5">
          <Loader2 className="h-5 w-5 animate-spin text-oxford-ink" aria-hidden="true" />
          <span>
            <span className="block font-semibold text-oxford-ink">Checking the student portal…</span>
            <span className="block text-sm text-oxford-mute">Comparing your registration with your timetable.</span>
          </span>
        </div>
      )}

      {phase.k === "not-authorised" && (
        <Card icon={<Link2Off className="h-5 w-5 text-oxford-ink2" aria-hidden="true" />}>
          <Heading>{phase.connection.status === "expired" ? "The portal needs your permission again" : "Your portal isn't connected"}</Heading>
          <p className="mt-2 text-sm text-oxford-ink2">
            {phase.connection.status === "expired"
              ? "The student portal no longer lets us read your registration. Your courses stay exactly as they are."
              : "Your courses were set up manually and stay as they are. Connect the student portal to keep them in step with the university."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => setConnectOpen(true)} className={btn("primary")}>
              {phase.connection.status === "expired" ? "Reconnect" : "Connect portal"}
            </button>
            <Link to={BACK.to} className={btn("secondary")}>
              Keep my courses as they are
            </Link>
          </div>
        </Card>
      )}

      {phase.k === "failed" && (
        <Card tone="warn" icon={<CloudOff className="h-5 w-5 text-oxford-danger" aria-hidden="true" />}>
          <Heading>We couldn't reach the student portal</Heading>
          <p className="mt-2 text-sm text-oxford-ink2">Nothing has changed: your courses and timetable are as they were.</p>
          <p className="mt-1 text-sm text-oxford-mute">
            {phase.lastSyncedAt
              ? `Last successful sync: ${relativeTime(phase.lastSyncedAt, now)} (${new Date(phase.lastSyncedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })})`
              : "No successful sync yet."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={run} className={btn("primary")}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
            <Link to={BACK.to} className={btn("secondary")}>
              Back to Academics
            </Link>
          </div>
        </Card>
      )}

      {phase.k === "up-to-date" && (
        <Card tone="ok" icon={<CheckCircle2 className="h-5 w-5 text-oxford-success" aria-hidden="true" />}>
          <Heading>Everything is up to date</Heading>
          <p className="mt-2 text-sm text-oxford-ink2">Your courses and timetable match the student portal.</p>
          <p className="mt-1 text-sm text-oxford-mute">Last synced: {relativeTime(phase.lastSyncedAt, now)}</p>
          <Link to={BACK.to} className={btn("primary", "mt-4")}>
            Done
          </Link>
        </Card>
      )}

      {phase.k === "review" && (
        <ReviewChanges
          changes={phase.changes}
          fromPending={phase.fromPending}
          heading={<Heading>Review changes</Heading>}
          busy={busy}
          error={error}
          onAccept={() => accept(phase.changes)}
          onKeep={() => keep(phase.changes)}
        />
      )}

      {phase.k === "kept" && (
        <Card icon={<AlertTriangle className="h-5 w-5 text-oxford-ink2" aria-hidden="true" />}>
          <Heading>Saved for later</Heading>
          <p className="mt-2 text-sm text-oxford-ink2">
            Nothing has been changed. The changes stay as "Pending review", and Academics shows a reminder until you review them.
          </p>
          <Link to={BACK.to} className={btn("primary", "mt-4")}>
            Back to Academics
          </Link>
        </Card>
      )}

      {phase.k === "conflicts" && (
        <div className="space-y-4">
          <Heading>Sort out an overlap</Heading>
          <p className="text-sm text-oxford-ink2">
            The changes are applied, but two sessions now overlap. Change or remove one, or keep both if you know they overlap.
          </p>
          {blocked && (
            <FormAlert tone="error" title="Sort out the overlap first">
              Change or remove one of the sessions, or tick "Keep both".
            </FormAlert>
          )}
          <ClashList
            courses={phase.courses}
            acknowledged={phase.acknowledged}
            onCoursesChange={(courses) => setPhase({ ...phase, courses })}
            onAcknowledgedChange={(ids) => {
              setPhase({ ...phase, acknowledged: ids });
              setBlocked(false);
            }}
          />
          <LoadingButton
            type="button"
            loading={busy === "confirm"}
            loadingLabel="Saving…"
            className="sm:w-auto"
            onClick={async () => {
              const left = findClashes(placedSessions(phase.courses)).filter((c) => !phase.acknowledged.includes(c.id));
              if (left.length) {
                setBlocked(true);
                return;
              }
              setBusy("confirm");
              await services.timetable.saveCourses(accountId, phase.courses, phase.acknowledged);
              setBusy(null);
              setPhase({ k: "done", summary: phase.summary });
            }}
          >
            Confirm timetable
          </LoadingButton>
        </div>
      )}

      {phase.k === "done" && (
        <Card tone="ok" icon={<CheckCircle2 className="h-5 w-5 text-oxford-success" aria-hidden="true" />}>
          <Heading>Your timetable is up to date</Heading>
          <p className="mt-2 font-semibold text-oxford-ink">{summaryText(phase.summary)}.</p>
          {phase.summary.keptPersonal > 0 && (
            <p className="mt-1 text-sm text-oxford-ink2">
              {phase.summary.keptPersonal === 1 ? "1 session keeps" : `${phase.summary.keptPersonal} sessions keep`} the time and venue you set yourself.
            </p>
          )}
          <p className="mt-1 text-sm text-oxford-ink2">Lecture reminders now match your new timetable, and Home is up to date.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/more/academics?tab=timetable" className={btn("primary")}>
              View timetable
            </Link>
            <Link to="/home" className={btn("secondary")}>
              Go to Home
            </Link>
          </div>
        </Card>
      )}

      <ConnectPortalDialog
        open={connectOpen}
        reconnect={phase.k === "not-authorised" && phase.connection.status === "expired"}
        onClose={() => setConnectOpen(false)}
        onConnected={() => {
          setConnectOpen(false);
          void run();
        }}
      />
    </div>
  );
};

const Section = ({ id, title, icon, count, children }: { id: string; title: string; icon: ReactNode; count: number; children: ReactNode }) =>
  count === 0 ? null : (
    <section aria-labelledby={id} className="rounded-2xl border border-oxford-rule bg-white/80 p-5">
      <h3 id={id} className="flex items-center gap-2 font-sans text-base font-semibold text-oxford-ink">
        {icon}
        {title} <span className="font-medium text-oxford-mute">{count}</span>
      </h3>
      <ul className="mt-3 divide-y divide-oxford-rule/70">{children}</ul>
    </section>
  );

const ReviewChanges = ({
  changes,
  fromPending,
  heading,
  busy,
  error,
  onAccept,
  onKeep,
}: {
  changes: SyncChanges;
  fromPending: boolean;
  heading: ReactNode;
  busy: "apply" | "keep" | "confirm" | null;
  error: string | null;
  onAccept: () => void;
  onKeep: () => void;
}) => {
  const now = useNow();
  return (
    <div className="space-y-4">
      {heading}
      <p className="text-sm text-oxford-ink2">
        The university's registration has changed since your last sync{fromPending ? ` (found ${relativeTimeInline(changes.checkedAt, now)})` : ""}.
        Nothing changes until you accept. Your own times, venues and courses you added yourself are kept.
      </p>

      <Section id="added-title" title="Added" count={changes.added.length} icon={<Plus className="h-4 w-4 text-oxford-success" aria-hidden="true" />}>
        {changes.added.map((c) => (
          <li key={c.code} className="py-2.5 text-sm">
            <span className="mr-2 rounded-full bg-oxford-success/10 px-2 py-0.5 text-xs font-semibold text-oxford-success">Added</span>
            <span className="font-semibold text-oxford-ink">{c.code}</span> <span className="text-oxford-ink2">· {c.title} · {c.credits} credits</span>
            <ul className="mt-1 text-oxford-mute">
              {c.sessions.map((s) => (
                <li key={s.id}>
                  {s.kind}: {when(s)}
                  {s.venue ? ` · ${s.venue}` : ""}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </Section>

      <Section id="removed-title" title="Removed" count={changes.removed.length} icon={<Minus className="h-4 w-4 text-oxford-danger" aria-hidden="true" />}>
        {changes.removed.map((c) => (
          <li key={c.code} className="py-2.5 text-sm">
            <span className="mr-2 rounded-full bg-oxford-danger/10 px-2 py-0.5 text-xs font-semibold text-oxford-danger">Removed</span>
            <span className="font-semibold text-oxford-ink">{c.code}</span> <span className="text-oxford-ink2">· {c.title}</span>
            <p className="mt-1 text-oxford-mute">No longer on your registration. It comes off your timetable and its reminders stop.</p>
          </li>
        ))}
      </Section>

      <Section id="changed-title" title="Changed" count={changes.changed.length} icon={<PencilLine className="h-4 w-4 text-oxford-ink2" aria-hidden="true" />}>
        {changes.changed.map((ch) => (
          <li key={ch.sessionId} className="py-2.5 text-sm">
            <span className="mr-2 rounded-full bg-oxford-gold/20 px-2 py-0.5 text-xs font-semibold text-oxford-ink">
              {ch.what === "venue" ? "Venue changed" : ch.what === "time" ? "Time changed" : "Time and venue changed"}
            </span>
            <span className="font-semibold text-oxford-ink">
              {ch.courseCode} {ch.kind}
            </span>{" "}
            <span className="text-oxford-ink2">· {ch.courseTitle}</span>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-oxford-ink2">
              <span className="text-oxford-mute line-through decoration-oxford-mute/60">
                {ch.what === "venue" ? ch.from.venue ?? "No venue" : when(ch.from)}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-oxford-mute" aria-label="changes to" />
              <span className="font-semibold text-oxford-ink">{ch.what === "venue" ? ch.to.venue ?? "No venue" : when(ch.to)}</span>
              {ch.what === "time and venue" && <span>· {ch.to.venue ?? "No venue"}</span>}
            </p>
            {ch.personal && (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-oxford-ink">
                <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
                You set your own time and venue for this. Yours stays.
              </p>
            )}
          </li>
        ))}
      </Section>

      {error && <FormAlert tone="error" title={error} />}

      <div className="flex flex-col gap-3 sm:flex-row">
        <LoadingButton type="button" onClick={onAccept} loading={busy === "apply"} loadingLabel="Applying…" disabled={busy !== null} className="sm:w-auto">
          Accept changes
        </LoadingButton>
        <LoadingButton type="button" variant="secondary" onClick={onKeep} loading={busy === "keep"} loadingLabel="Saving…" disabled={busy !== null} className="sm:w-auto">
          Not now
        </LoadingButton>
      </div>
    </div>
  );
};
