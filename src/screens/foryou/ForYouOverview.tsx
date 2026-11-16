import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarCheck, LineChart, Sparkles, Target, type LucideIcon } from "lucide-react";
import { services } from "@/services";
import { relativeTime, useNow } from "@/lib/dates";
import { fromISODate, toISODate, weekStartOf } from "@/lib/days";
import { goalPercent } from "@/lib/goals";
import { useAsync } from "@/lib/useAsync";
import { useSession } from "@/session/SessionProvider";
import { btn } from "@/ui/button";
import { DashCard, LoadError, Skeleton } from "@/ui/DashCard";
import { PageHeader } from "@/ui/PageHeader";
import { ProgressBar } from "@/ui/ProgressBar";
import { GoalCard } from "./GoalCard";
import { useAccountId } from "./useAccountId";

const Stat = ({ label, value, children }: { label: string; value: string; children?: ReactNode }) => (
  <div className="rounded-2xl border border-oxford-rule bg-white/80 p-4">
    <dt className="text-xs font-semibold uppercase tracking-wider text-oxford-mute">{label}</dt>
    <dd className="mt-1 font-serif text-3xl font-semibold leading-none text-oxford-ink">{value}</dd>
    {children}
  </div>
);

/** Flow 06 "For You overview": personal summary, the four areas, goals and this week. */
export const ForYouOverview = () => {
  const accountId = useAccountId();
  const { account } = useSession();
  const now = useNow();
  const reduce = useReducedMotion();
  const week = weekStartOf(now);
  const today = toISODate(now);
  const { state, reload } = useAsync(
    () => Promise.all([services.goals.list(accountId), services.plan.week(accountId, week), services.goals.history(accountId)]),
    [accountId, week],
  );

  const firstName = account?.name.split(" ")[0] ?? "";
  const header = <PageHeader title="For You" description={`Your goals for this semester${firstName ? `, ${firstName}` : ""}, and what's next.`} />;

  if (state.status === "loading") return <>{header}<Skeleton lines={5} /></>;
  if (state.status === "error") return <>{header}<LoadError what="For You" onRetry={reload} /></>;

  const [goals, tasks, history] = state.data;
  const active = goals.filter((g) => g.status === "active");
  const doneTasks = tasks.filter((t) => t.done).length;
  const overall = active.length ? Math.round(active.reduce((sum, g) => sum + goalPercent(g), 0) / active.length) : null;
  const lastCheckIn = history[0];
  const upcoming = tasks.filter((t) => !t.done && t.date >= today).slice(0, 5);

  const areas: { to: string; icon: LucideIcon; title: string; detail: string }[] = [
    { to: "/for-you/goals", icon: Target, title: "My goals", detail: active.length ? `${active.length} active` : goals.length ? "None active" : "None yet" },
    { to: "/for-you/progress", icon: LineChart, title: "Progress", detail: lastCheckIn ? `Last check-in: ${relativeTime(lastCheckIn.at, now)}` : "No check-ins yet" },
    { to: "/for-you/plan", icon: CalendarCheck, title: "Weekly plan", detail: tasks.length ? `${doneTasks} of ${tasks.length} done this week` : "Nothing planned this week" },
    { to: "/for-you/opportunities", icon: Sparkles, title: "Opportunities", detail: "Matched to your goals and programme" },
  ];

  return (
    <>
      {header}

      {goals.length === 0 ? (
        <section aria-labelledby="first-goal" className="mb-6 rounded-2xl border border-oxford-rule bg-white/80 p-6 text-center md:p-8">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-oxford-sandSoft text-oxford-ink">
            <Target className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 id="first-goal" className="mt-4 text-2xl font-medium">
            Set your first goal
          </h2>
          <p className="mx-auto mt-2 max-w-md text-oxford-mute">
            Pick one thing you want to achieve this semester. You can break it into steps and check in as you go.
          </p>
          <Link to="/for-you/goals/new" className={btn("primary", "mt-6")}>
            Set your first goal
          </Link>
        </section>
      ) : (
        <dl className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          <Stat label="Active goals" value={String(active.length)} />
          <Stat label="Tasks done this week" value={tasks.length ? `${doneTasks} of ${tasks.length}` : "0"}>
            {tasks.length === 0 && <p className="mt-2 text-xs text-oxford-mute">Nothing planned yet</p>}
          </Stat>
          <div className="col-span-2 md:col-span-1">
            <Stat label="Overall progress" value={overall === null ? "–" : `${overall}%`}>
              {overall === null && <p className="mt-2 text-xs text-oxford-mute">No active goals</p>}
              {overall !== null && (
                <div className="mt-3">
                  <ProgressBar percent={overall} label="Overall progress across active goals" size="sm" />
                  <p className="mt-1.5 text-xs text-oxford-mute">Average across your active goals</p>
                </div>
              )}
            </Stat>
          </div>
        </dl>
      )}

      <nav aria-label="For You areas">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {areas.map((a, i) => (
            <motion.li
              key={a.to}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                to={a.to}
                className="flex h-full flex-col gap-3 rounded-2xl border border-oxford-rule bg-white/80 p-4 transition hover:-translate-y-0.5 hover:border-oxford-ink/30 motion-reduce:hover:translate-y-0 sm:p-5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-oxford-sandSoft text-oxford-ink">
                  <a.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-semibold text-oxford-ink">{a.title}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-oxford-mute">{a.detail}</span>
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <DashCard id="active-goals" title="Active goals" action={goals.length ? { to: "/for-you/goals", label: "All goals" } : undefined} order={2}>
          {active.length === 0 ? (
            <div className="text-sm text-oxford-mute">
              <p>{goals.length ? "No active goals right now." : "Goals you set will appear here."}</p>
              <Link to="/for-you/goals/new" className="mt-2 inline-flex min-h-[40px] items-center font-semibold text-oxford-ink underline underline-offset-4">
                Set a goal
              </Link>
            </div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {active.slice(0, 4).map((g) => (
                <li key={g.id} className="min-w-0">
                  <GoalCard goal={g} now={now} />
                </li>
              ))}
            </ul>
          )}
        </DashCard>

        <DashCard id="this-week" title="Coming up this week" action={{ to: "/for-you/plan", label: "Plan" }} order={3}>
          {upcoming.length === 0 ? (
            <p className="text-sm text-oxford-mute">{tasks.length ? "Everything planned for the rest of the week is done." : "Nothing planned yet. Add tasks in your weekly plan."}</p>
          ) : (
            <ul className="space-y-2.5">
              {upcoming.map((t) => {
                const goal = goals.find((g) => g.id === t.goalId);
                return (
                  <li key={t.id} className="text-sm">
                    <span className="block text-xs font-semibold text-oxford-mute">
                      {t.date === today ? "Today" : fromISODate(t.date).toLocaleDateString("en-GB", { weekday: "long" })}
                      {t.time ? ` · ${t.time}` : ""}
                    </span>
                    <span className="block text-oxford-ink">{t.title}</span>
                    {goal && <span className="block text-xs text-oxford-mute">For: {goal.title}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </DashCard>
      </div>
    </>
  );
};
