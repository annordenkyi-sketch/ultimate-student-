import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Info, LineChart, TrendingUp } from "lucide-react";
import { ASSESSMENT_WEIGHTS, GPA_SCALE } from "@/config/grading";
import { services, type CheckIn, type CourseResultInput, type Goal } from "@/services";
import { toISODate } from "@/lib/days";
import { formatGpa, formatTarget, gapText, gpaOutlook, summariseGpa, type GpaOutlook, type GpaSummary } from "@/lib/gpa";
import { useAsync } from "@/lib/useAsync";
import { btn } from "@/ui/button";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { DetailSection } from "../details/ContentDetail";
import { GpaBar } from "./GpaBar";
import { GpaResultDialog } from "./GpaResultDialog";
import { ProgressChart } from "./ProgressChart";
import { useSemester } from "./useSemesterEnd";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The plain-language line on what's needed to reach the target. */
const outlookText = (o: GpaOutlook, targetValue: number, s: GpaSummary, gpa: number | null) => {
  const target = formatTarget(targetValue);
  const scope = s.counted === 0 ? `across your ${plural(s.total, "course")}` : `in your remaining ${plural(s.total - s.counted, "course")}`;
  switch (o.kind) {
    case "needs":
      return `To reach ${target}, you need an average of ${o.grade} ${scope}.`;
    case "secured":
      return `You're set to reach ${target} whatever grades you get ${scope}.`;
    case "unreachable":
      return `${target} is no longer reachable this semester. Even straight A's ${scope} would give ${formatGpa(o.best)} at most. You could change the target in Edit.`;
    case "all-counted":
      return o.met
        ? `Every course has results, and your estimate meets your target of ${target}.`
        : `Every course has results. You're ${formatGpa(Math.max(0, targetValue - (gpa ?? 0)))} below ${target}, so your remaining assessments are where you can close the gap.`;
  }
};

/**
 * GPA goal: estimated GPA from the student's course results (credit-weighted),
 * target and gap, what's needed, how it has moved, and a per-course breakdown.
 */
export const GpaSections = ({
  goal,
  accountId,
  now,
  checkIns,
  onRecorded,
}: {
  goal: Goal & { target: { kind: "gpa"; value: number } };
  accountId: string;
  now: Date;
  checkIns: CheckIn[];
  onRecorded: (checkIn: CheckIn | null) => void;
}) => {
  const { semester } = useSemester();
  const { state, reload } = useAsync(
    () => Promise.all([services.timetable.get(accountId), services.goals.results(accountId)]),
    [accountId],
  );
  const [open, setOpen] = useState(false);
  const active = goal.status === "active";
  const target = goal.target.value;
  const today = toISODate(now);

  if (state.status === "loading" || !semester) {
    return (
      <DetailSection id="progress" title="GPA" icon={TrendingUp}>
        <Skeleton lines={3} />
      </DetailSection>
    );
  }
  if (state.status === "error") {
    return (
      <DetailSection id="progress" title="GPA" icon={TrendingUp}>
        <LoadError what="your course results" onRetry={reload} />
      </DetailSection>
    );
  }

  const [timetable, results] = state.data;
  const courses = timetable?.courses ?? [];
  const summary = summariseGpa(courses, results);
  const gpa = summary.gpa;
  const inProgress = today <= semester.endsOn;
  const title = inProgress ? "Estimated GPA so far" : "Semester GPA";

  if (courses.length === 0) {
    return (
      <DetailSection id="progress" title="GPA" icon={TrendingUp}>
        <p className="text-sm text-oxford-ink">Your GPA is worked out from your registered courses and their credits.</p>
        <p className="mt-1 text-sm text-oxford-mute">Add your courses first, then record results as they come in.</p>
        <Link to="/onboarding" className={btn("primary", "mt-4")}>
          Set up your courses
        </Link>
      </DetailSection>
    );
  }

  const save = async (input: CourseResultInput, note: string | null) => {
    const { checkIn } = await services.goals.recordResult(accountId, goal.id, input, note);
    setOpen(false);
    reload();
    onRecorded(checkIn);
  };

  const outlook = gpaOutlook(summary, target);

  return (
    <>
      <DetailSection id="progress" title={title} icon={TrendingUp}>
        <dl className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-oxford-cream/70 px-3 py-2.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-oxford-mute">{inProgress ? "Estimated" : "Current"}</dt>
            <dd className="mt-1 whitespace-nowrap font-serif text-xl font-semibold leading-none text-oxford-ink sm:text-3xl">
              {gpa === null ? "–" : formatGpa(gpa)}
              <span className="ml-0.5 font-sans text-[11px] font-medium text-oxford-mute sm:ml-1 sm:text-xs">/{GPA_SCALE.toFixed(1)}</span>
            </dd>
          </div>
          <div className="rounded-xl bg-oxford-cream/70 px-3 py-2.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-oxford-mute">Target</dt>
            <dd className="mt-1 whitespace-nowrap font-serif text-xl font-semibold leading-none text-oxford-ink sm:text-3xl">
              {formatTarget(target)}
              <span className="ml-0.5 font-sans text-[11px] font-medium text-oxford-mute sm:ml-1 sm:text-xs">/{GPA_SCALE.toFixed(1)}</span>
            </dd>
          </div>
          <div className="rounded-xl bg-oxford-cream/70 px-3 py-2.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-oxford-mute">Gap</dt>
            <dd className={`mt-1.5 text-sm font-semibold leading-tight ${gpa !== null && gpa >= target ? "text-oxford-success" : "text-oxford-ink"}`}>
              {gapText(gpa, target)}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-sm text-oxford-mute">
          {summary.counted === 0
            ? `No results yet for your ${plural(summary.total, "course")}.`
            : `Based on ${summary.counted} of ${plural(summary.total, "course")} (${summary.countedCredits} of ${summary.totalCredits} credits).`}
        </p>

        <div className="mt-4">
          <GpaBar gpa={gpa} target={target} label={title} />
        </div>

        <p className="mt-4 flex gap-2.5 rounded-xl border border-oxford-rule bg-white p-3 text-sm text-oxford-ink">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-oxford-ink2" aria-hidden="true" />
          {outlookText(outlook, target, summary, gpa)}
        </p>

        {active && (
          <button type="button" onClick={() => setOpen(true)} className={btn("primary", "mt-4 w-full sm:w-auto")}>
            Record progress
          </button>
        )}
      </DetailSection>

      <DetailSection id="gpa-chart" title="How your GPA has moved" icon={LineChart}>
        {checkIns.length === 0 ? (
          <p className="text-sm text-oxford-mute">Each result you record adds a point here.</p>
        ) : (
          <ProgressChart goal={goal} checkIns={checkIns} semester={semester} today={today} />
        )}
      </DetailSection>

      <DetailSection id="gpa-courses" title="Courses" icon={BookOpen}>
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Grade so far in each course</caption>
            <thead>
              <tr className="text-xs text-oxford-mute">
                <th scope="col" className="px-1 py-2 font-semibold">Course</th>
                <th scope="col" className="hidden px-1 py-2 text-right font-semibold sm:table-cell">Credits</th>
                <th scope="col" className="px-1 py-2 text-right font-semibold">Grade</th>
                <th scope="col" className="px-1 py-2 text-right font-semibold">Points</th>
              </tr>
            </thead>
            <tbody>
              {summary.courses.map((s) => (
                <tr key={s.course.code} className="border-t border-oxford-rule/60 align-top">
                  <th scope="row" className="px-1 py-2.5 font-normal">
                    <span className="block font-semibold text-oxford-ink">{s.course.code}</span>
                    <span className="block text-xs text-oxford-mute">{s.course.title}</span>
                    <span className="block text-xs text-oxford-mute sm:hidden">{s.course.credits} credits</span>
                  </th>
                  <td className="hidden px-1 py-2.5 text-right text-oxford-ink2 sm:table-cell">{s.course.credits}</td>
                  {s.grade === null ? (
                    <td colSpan={2} className="px-1 py-2.5 text-right text-oxford-mute">
                      No results yet
                    </td>
                  ) : (
                    <>
                      <td className="px-1 py-2.5 text-right">
                        <span className="block font-semibold text-oxford-ink">{s.grade}</span>
                        <span className="block whitespace-nowrap text-xs text-oxford-mute">{Math.round(s.mark!)}% so far</span>
                      </td>
                      <td className="px-1 py-2.5 text-right font-semibold text-oxford-ink">{s.points!.toFixed(1)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-oxford-mute">
          GPA = total (grade points × credits) ÷ total credits, counting only courses with results. Assignments count{" "}
          {ASSESSMENT_WEIGHTS.assignment}%, the mid-semester exam {ASSESSMENT_WEIGHTS.midsem}% and the final exam{" "}
          {ASSESSMENT_WEIGHTS.final}% of a course's mark; until all are in, the recorded ones are scaled up.
        </p>
      </DetailSection>

      <GpaResultDialog open={open} courses={courses} results={results} onClose={() => setOpen(false)} onSave={save} />
    </>
  );
};
