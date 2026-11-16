import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Archive, Bell, CalendarClock, CheckCircle2, LineChart, Pencil, RotateCcw, TrendingUp } from "lucide-react";
import { services, type CheckIn, type Goal } from "@/services";
import { relativeTime, useNow } from "@/lib/dates";
import { longDay, toISODate } from "@/lib/days";
import { deadlineText, goalPercent, progressText, reminderText, targetText, valueText } from "@/lib/goals";
import { formatGpa } from "@/lib/gpa";
import { useAsync } from "@/lib/useAsync";
import { btn } from "@/ui/button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { FormAlert } from "@/ui/form/FormAlert";
import { ProgressBar } from "@/ui/ProgressBar";
import { TickBox } from "@/ui/TickBox";
import { DetailSection } from "../details/ContentDetail";
import { DetailHeader, NotFound } from "../details/DetailHeader";
import { Celebration } from "./Celebration";
import { CheckInDialog } from "./CheckInDialog";
import { GpaSections } from "./GpaSections";
import { useAccountId } from "./useAccountId";

const BACK = { to: "/for-you/goals", label: "My goals" };

type Notice = { tone: "success" | "error"; title: string; body?: string } | null;

const NOTICES: Record<string, Notice> = {
  created: { tone: "success", title: "Goal saved", body: "Tick off steps as you go and record your progress from here." },
  edited: { tone: "success", title: "Changes saved" },
};

/** Flow 06 "Goal details": progress, action steps, check-ins, and updates. */
export const GoalDetailsScreen = () => {
  const { id = "" } = useParams();
  const accountId = useAccountId();
  const now = useNow();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, reload } = useAsync(() => services.goals.get(accountId, id), [accountId, id]);

  const [goal, setGoal] = useState<Goal | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [notice, setNotice] = useState<Notice>(NOTICES[(location.state as { notice?: string } | null)?.notice ?? ""] ?? null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [busy, setBusy] = useState<"complete" | "archive" | "reopen" | null>(null);

  useEffect(() => {
    if (state.status === "ready" && state.data) {
      setGoal(state.data.goal);
      setCheckIns(state.data.checkIns);
    }
  }, [state]);

  // Don't show "Goal saved" again after a refresh or coming back.
  useEffect(() => {
    if ((location.state as { notice?: string } | null)?.notice) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.status === "loading" || (state.status === "ready" && state.data && !goal)) return <Skeleton lines={6} />;
  if (state.status === "error") return <LoadError what="this goal" onRetry={reload} />;
  if (!state.data || !goal) return <NotFound what="Goal" back={BACK} />;

  const percent = goalPercent(goal);
  const today = toISODate(now);
  const due = deadlineText(goal.deadline, today);
  const active = goal.status === "active";
  const doneSteps = goal.steps.filter((s) => s.done).length;

  const run = async (kind: "complete" | "archive" | "reopen") => {
    setBusy(kind);
    setNotice(null);
    try {
      const next = await services.goals[kind](accountId, goal.id);
      setGoal(next);
      if (kind === "complete") setCelebrate(true);
      if (kind === "archive") setNotice({ tone: "success", title: "Moved to Archived", body: "Its reminders have stopped. You can move it back to active at any time." });
      if (kind === "reopen") setNotice({ tone: "success", title: "Back in your active goals", body: "Reminders stay off until you set them again in Edit." });
    } catch {
      setNotice({ tone: "error", title: "That didn't work", body: "Check your connection and try again." });
    } finally {
      setBusy(null);
    }
  };

  const toggleStep = async (stepId: string, done: boolean) => {
    const before = goal;
    setGoal({ ...goal, steps: goal.steps.map((s) => (s.id === stepId ? { ...s, done } : s)) });
    try {
      await services.goals.setStepDone(accountId, goal.id, stepId, done);
    } catch {
      setGoal(before);
      setNotice({ tone: "error", title: "We couldn't update that step", body: "Try again." });
    }
  };

  const saveCheckIn = async (value: number, note: string | null) => {
    const entry = await services.goals.checkIn(accountId, goal.id, { value, note });
    setGoal({ ...goal, progress: value });
    setCheckIns([entry, ...checkIns]);
    setCheckInOpen(false);
    setNotice({ tone: "success", title: "Progress recorded", body: `${valueText(goal.target, value)}, saved to your progress history.` });
  };

  const status =
    goal.status === "completed"
      ? `Completed ${goal.completedAt ? longDay(toISODate(new Date(goal.completedAt))) : ""}`
      : goal.status === "archived"
        ? "Archived"
        : "Active goal";

  return (
    <div>
      <DetailHeader back={BACK} eyebrow={status} title={goal.title}>
        Target: {targetText(goal.target)}
      </DetailHeader>

      {notice && (
        <FormAlert tone={notice.tone} title={notice.title} className="mb-5">
          {notice.body}
        </FormAlert>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          {goal.target.kind === "gpa" ? (
            <>
              <GpaSections
                goal={goal as Goal & { target: { kind: "gpa"; value: number } }}
                accountId={accountId}
                now={now}
                checkIns={checkIns}
                onRecorded={(entry) => {
                  if (!entry) return;
                  setGoal({ ...goal, progress: entry.value });
                  setCheckIns([entry, ...checkIns]);
                  setNotice({ tone: "success", title: "Result recorded", body: `Your estimated GPA is now ${formatGpa(entry.value)}. It's saved to your progress history.` });
                }}
              />
              {active && (
                <p className="flex items-center gap-1.5 px-1 text-sm text-oxford-mute">
                  <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {due.text}
                </p>
              )}
            </>
          ) : (
          <DetailSection id="progress" title="Progress" icon={TrendingUp}>
            <p className="flex items-baseline gap-2">
              <span className="font-serif text-4xl font-semibold text-oxford-ink">{percent}%</span>
              <span className="text-sm text-oxford-mute">{progressText(goal)}</span>
            </p>
            <div className="mt-3">
              <ProgressBar percent={percent} label={`${goal.title} progress`} />
            </div>
            {active && (
              <p className={`mt-3 flex items-center gap-1.5 text-sm ${due.overdue ? "font-semibold text-oxford-danger" : "text-oxford-mute"}`}>
                <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
                {due.text}
              </p>
            )}
            {active && (
              <button type="button" onClick={() => setCheckInOpen(true)} className={btn("primary", "mt-4 w-full sm:w-auto")}>
                Record progress
              </button>
            )}
          </DetailSection>
          )}

          <DetailSection id="steps" title={goal.steps.length ? `Action steps · ${doneSteps} of ${goal.steps.length} done` : "Action steps"}>
            {goal.steps.length === 0 ? (
              <p className="text-sm text-oxford-mute">
                No steps yet.{" "}
                {goal.status !== "archived" && (
                  <Link to={`/for-you/goals/${goal.id}/edit`} className="font-semibold text-oxford-ink underline underline-offset-4">
                    Add steps
                  </Link>
                )}
              </p>
            ) : (
              <ul className="-my-1 divide-y divide-oxford-rule/60">
                {goal.steps.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-2.5">
                    <TickBox checked={s.done} onChange={(d) => toggleStep(s.id, d)} label={s.text} disabled={goal.status === "archived"} />
                    <span className={`text-sm transition-colors ${s.done ? "text-oxford-mute line-through" : "text-oxford-ink"}`}>{s.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>
        </div>

        <aside className="space-y-5">
          <DetailSection id="updates" title="Update this goal">
            <div className="flex flex-col gap-2">
              {goal.status !== "archived" && (
                <Link to={`/for-you/goals/${goal.id}/edit`} className={btn("secondary", "w-full")}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </Link>
              )}
              {active && (
                <button type="button" onClick={() => run("complete")} disabled={busy !== null} className={btn("secondary", "w-full")}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {busy === "complete" ? "Completing…" : "Mark as completed"}
                </button>
              )}
              {active && (
                <button type="button" onClick={() => setConfirmArchive(true)} disabled={busy !== null} className={btn("secondary", "w-full")}>
                  <Archive className="h-4 w-4" aria-hidden="true" />
                  {busy === "archive" ? "Archiving…" : "Archive"}
                </button>
              )}
              {!active && (
                <button type="button" onClick={() => run("reopen")} disabled={busy !== null} className={btn("secondary", "w-full")}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  {busy === "reopen" ? "Moving…" : "Move back to active"}
                </button>
              )}
            </div>
          </DetailSection>

          <DetailSection id="reminders" title="Reminders" icon={Bell}>
            <p className="text-sm text-oxford-ink">{reminderText(goal.reminder)}</p>
            {!active && <p className="mt-1 text-sm text-oxford-mute">Reminders stop when a goal is completed or archived.</p>}
          </DetailSection>

          <DetailSection id="checkins" title="Recent check-ins" icon={LineChart}>
            {checkIns.length === 0 ? (
              <p className="text-sm text-oxford-mute">No check-ins yet.{active ? " Record your progress when something changes." : ""}</p>
            ) : (
              <ol className="space-y-3">
                {checkIns.slice(0, 5).map((c) => (
                  <li key={c.id} className="text-sm">
                    <span className="flex justify-between gap-3">
                      <span className="font-semibold text-oxford-ink">{valueText(goal.target, c.value)}</span>
                      <span className="text-oxford-mute">{relativeTime(c.at, now)}</span>
                    </span>
                    {c.note && <span className="mt-0.5 block text-oxford-ink2">{c.note}</span>}
                  </li>
                ))}
              </ol>
            )}
            <Link to="/for-you/progress" className="mt-4 inline-flex min-h-[40px] items-center text-sm font-semibold text-oxford-ink underline underline-offset-4 hover:no-underline">
              All progress
            </Link>
          </DetailSection>
        </aside>
      </div>

      {goal.target.kind !== "gpa" && <CheckInDialog goal={goal} open={checkInOpen} onClose={() => setCheckInOpen(false)} onSave={saveCheckIn} />}
      <Celebration open={celebrate} title={goal.title} onClose={() => setCelebrate(false)} />
      <ConfirmDialog
        open={confirmArchive}
        title="Archive this goal?"
        body="It moves to Archived and its reminders stop. Your progress history is kept."
        confirmLabel="Archive"
        onConfirm={() => {
          setConfirmArchive(false);
          void run("archive");
        }}
        onCancel={() => setConfirmArchive(false)}
      />
    </div>
  );
};
