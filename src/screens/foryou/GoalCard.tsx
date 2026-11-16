import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, CheckCircle2 } from "lucide-react";
import type { Goal } from "@/services";
import { toISODate } from "@/lib/days";
import { deadlineText, goalPercent, nextStep, progressText, targetText } from "@/lib/goals";
import { gapText } from "@/lib/gpa";
import { ProgressBar } from "@/ui/ProgressBar";
import { GpaBar } from "./GpaBar";

/** Goal summary: title, target, deadline, progress and the next action step. */
export const GoalCard = ({ goal, now }: { goal: Goal; now: Date }) => {
  const percent = goalPercent(goal);
  const due = deadlineText(goal.deadline, toISODate(now));
  const next = nextStep(goal);

  return (
    <Link
      to={`/for-you/goals/${goal.id}`}
      className="group flex h-full flex-col rounded-2xl border border-oxford-rule bg-white/80 p-5 transition hover:border-oxford-ink/30"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="font-semibold leading-snug text-oxford-ink">{goal.title}</span>
        {goal.status === "completed" && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-oxford-gold/20 px-2.5 py-0.5 text-xs font-semibold text-oxford-ink">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Completed
          </span>
        )}
      </span>
      <span className="mt-1 text-sm text-oxford-mute">Target: {targetText(goal.target)}</span>

      {goal.target.kind === "gpa" ? (
        <span className="mt-3 block">
          <GpaBar gpa={goal.progress > 0 ? goal.progress : null} target={goal.target.value} label={`${goal.title}: estimated GPA`} />
          <span className="mt-1 flex justify-between gap-2 text-xs font-semibold text-oxford-ink2">
            <span>{goal.progress > 0 ? `Estimated ${progressText(goal)}` : "No results yet"}</span>
            <span>{gapText(goal.progress > 0 ? goal.progress : null, goal.target.value)}</span>
          </span>
        </span>
      ) : (
        <span className="mt-4 block">
          <ProgressBar percent={percent} label={`${goal.title} progress`} />
          <span className="mt-1.5 flex justify-between gap-2 text-xs font-semibold text-oxford-ink2">
            <span>{progressText(goal)}</span>
            <span>{percent}%</span>
          </span>
        </span>
      )}

      {goal.status === "active" && (
        <span className={`mt-3 flex items-center gap-1.5 text-xs ${due.overdue ? "font-semibold text-oxford-danger" : "text-oxford-mute"}`}>
          <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {due.text}
        </span>
      )}

      {goal.status === "active" && (
        <span className="mt-auto block pt-4">
          <span className="flex items-center justify-between gap-2 border-t border-oxford-rule/70 pt-3 text-sm">
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-oxford-mute">Next step</span>
              <span className="block truncate text-oxford-ink">{next ? next.text : "All steps done. Record your progress."}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-oxford-mute transition group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0" aria-hidden="true" />
          </span>
        </span>
      )}
    </Link>
  );
};
