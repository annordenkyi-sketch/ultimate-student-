import { Link } from "react-router-dom";
import { LineChart } from "lucide-react";
import { services, type CheckIn, type Goal } from "@/services";
import { useNow } from "@/lib/dates";
import { shortDay, toISODate } from "@/lib/days";
import { progressText, valueText } from "@/lib/goals";
import { useAsync } from "@/lib/useAsync";
import { btn } from "@/ui/button";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { DetailHeader } from "../details/DetailHeader";
import { ProgressChart } from "./ProgressChart";
import { useAccountId } from "./useAccountId";
import { useSemester } from "./useSemesterEnd";

/** Flow 06 "Progress": check-in timeline across goals, and a chart per goal over the semester. */
export const ProgressScreen = () => {
  const accountId = useAccountId();
  const now = useNow();
  const today = toISODate(now);
  const { semester } = useSemester();
  const { state, reload } = useAsync(
    () => Promise.all([services.goals.list(accountId), services.goals.history(accountId)]),
    [accountId],
  );

  const header = <DetailHeader back={{ to: "/for-you", label: "For You" }} title="Progress" />;
  if (state.status === "loading" || !semester) return <>{header}<Skeleton lines={5} /></>;
  if (state.status === "error") return <>{header}<LoadError what="your progress" onRetry={reload} /></>;

  const [goals, history] = state.data;
  const goalById = new Map(goals.map((g) => [g.id, g]));
  const charted = goals.filter((g) => g.status !== "archived");

  if (history.length === 0) {
    return (
      <>
        {header}
        <div className="rounded-2xl border border-dashed border-oxford-rule px-5 py-10 text-center">
          <LineChart className="mx-auto h-8 w-8 text-oxford-mute" aria-hidden="true" />
          <p className="mt-3 font-semibold text-oxford-ink">No check-ins yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-oxford-mute">
            Open a goal and choose Record progress whenever something changes. Your history will build up here.
          </p>
          <Link to={goals.length ? "/for-you/goals" : "/for-you/goals/new"} className={btn("primary", "mt-5")}>
            {goals.length ? "Go to my goals" : "Set your first goal"}
          </Link>
        </div>
      </>
    );
  }

  // Timeline grouped by month, newest first.
  const months: { label: string; items: CheckIn[] }[] = [];
  for (const c of history) {
    const label = new Date(c.at).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const group = months.find((m) => m.label === label);
    if (group) group.items.push(c);
    else months.push({ label, items: [c] });
  }

  return (
    <>
      {header}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="timeline-title">
          <h2 id="timeline-title" className="mb-3 font-sans text-lg font-semibold text-oxford-ink">
            Check-ins
          </h2>
          <div className="space-y-5">
            {months.map((m) => (
              <div key={m.label}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-oxford-mute">{m.label}</h3>
                <ol className="relative space-y-3 border-l-2 border-oxford-rule pl-5">
                  {m.items.map((c) => {
                    const goal = goalById.get(c.goalId);
                    return (
                      <li key={c.id} className="relative">
                        <span aria-hidden="true" className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-oxford-paper bg-oxford-ink" />
                        <p className="text-xs text-oxford-mute">{shortDay(toISODate(new Date(c.at)))}</p>
                        <p className="text-sm">
                          {goal ? (
                            <Link to={`/for-you/goals/${goal.id}`} className="font-semibold text-oxford-ink hover:underline">
                              {goal.title}
                            </Link>
                          ) : (
                            <span className="font-semibold text-oxford-ink">Deleted goal</span>
                          )}
                          {goal && <span className="text-oxford-ink2"> · {valueText(goal.target, c.value)}</span>}
                        </p>
                        {c.note && <p className="mt-0.5 text-sm text-oxford-ink2">{c.note}</p>}
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="charts-title">
          <h2 id="charts-title" className="mb-3 font-sans text-lg font-semibold text-oxford-ink">
            Over the semester
          </h2>
          <ul className="space-y-4">
            {charted.map((g: Goal) => (
              <li key={g.id} className="rounded-2xl border border-oxford-rule bg-white/80 p-4">
                <h3 className="font-sans text-sm font-semibold text-oxford-ink">
                  <Link to={`/for-you/goals/${g.id}`} className="hover:underline">
                    {g.title}
                  </Link>
                </h3>
                <p className="mb-2 text-xs text-oxford-mute">
                  {g.status === "completed" ? "Completed · " : ""}
                  {progressText(g)}
                </p>
                {history.some((c) => c.goalId === g.id) ? (
                  <ProgressChart goal={g} checkIns={history.filter((c) => c.goalId === g.id)} semester={semester} today={today} />
                ) : (
                  <p className="py-3 text-sm text-oxford-mute">No check-ins yet.</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
};
