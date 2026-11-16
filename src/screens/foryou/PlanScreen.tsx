import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarCheck, ChevronLeft, ChevronRight, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { services, type Goal, type PlanTask, type TaskInput } from "@/services";
import { useNow } from "@/lib/dates";
import { addDays, fromISODate, toISODate, weekStartOf } from "@/lib/days";
import { nextStep } from "@/lib/goals";
import { useAsync } from "@/lib/useAsync";
import { btn } from "@/ui/button";
import { DashCard, LoadError, Skeleton } from "@/ui/DashCard";
import { TickBox } from "@/ui/TickBox";
import { DetailHeader } from "../details/DetailHeader";
import { TaskDialog } from "./TaskDialog";
import { useAccountId } from "./useAccountId";

const weekLabel = (start: string) => {
  const a = fromISODate(start);
  const b = fromISODate(addDays(start, 6));
  const sameMonth = a.getMonth() === b.getMonth();
  const left = a.toLocaleDateString("en-GB", sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" });
  return `${left} – ${b.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
};

const iconBtn =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-oxford-mute transition hover:bg-oxford-cream hover:text-oxford-ink";

type Editing = { mode: "add"; initial: TaskInput } | { mode: "edit"; id: string; initial: TaskInput } | null;

/** Flow 06 "Weekly plan": personal tasks by day, linked to goals. */
export const PlanScreen = () => {
  const accountId = useAccountId();
  const now = useNow();
  const reduce = useReducedMotion();
  const today = toISODate(now);
  const thisWeek = weekStartOf(now);
  const [params, setParams] = useSearchParams();
  const requested = params.get("week");
  const week = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? weekStartOf(fromISODate(requested)) : thisWeek;

  const tasksQuery = useAsync(() => services.plan.week(accountId, week), [accountId, week]);
  const goalsQuery = useAsync(() => services.goals.list(accountId), [accountId]);
  const [local, setLocal] = useState<{ week: string; tasks: PlanTask[] } | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [status, setStatus] = useState<{ text: string; failed?: boolean } | null>(null);

  const tasks = local?.week === week ? local.tasks : tasksQuery.state.status === "ready" ? tasksQuery.state.data : null;
  const setTasks = (next: PlanTask[]) => setLocal({ week, tasks: next });
  const activeGoals = goalsQuery.state.status === "ready" ? goalsQuery.state.data.filter((g) => g.status === "active") : [];
  const allGoals = goalsQuery.state.status === "ready" ? goalsQuery.state.data : [];
  const goalTitle = (id: string | null) => allGoals.find((g) => g.id === id)?.title ?? null;

  const goToWeek = (start: string) => {
    setLocal(null);
    setStatus(null);
    setParams(start === thisWeek ? {} : { week: start }, { replace: true });
  };

  const defaultDay = today >= week && today <= addDays(week, 6) ? today : week;
  const openAdd = (preset?: Partial<TaskInput>) =>
    setEditing({ mode: "add", initial: { title: "", date: defaultDay, time: null, goalId: null, ...preset } });

  const sorted = (list: PlanTask[]) =>
    [...list].sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "99").localeCompare(b.time ?? "99"));

  const save = async (input: TaskInput) => {
    if (!tasks || !editing) return;
    if (editing.mode === "add") {
      const task = await services.plan.add(accountId, input);
      const inWeek = task.date >= week && task.date <= addDays(week, 6);
      if (inWeek) setTasks(sorted([...tasks, task]));
      setStatus({ text: `Added "${task.title}".` });
    } else {
      const task = await services.plan.update(accountId, editing.id, input);
      setTasks(sorted(tasks.map((t) => (t.id === task.id ? task : t))));
      setStatus({ text: "Task saved." });
    }
    setEditing(null);
  };

  const toggle = async (task: PlanTask, done: boolean) => {
    if (!tasks) return;
    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, done } : t)));
    try {
      await services.plan.update(accountId, task.id, { done });
    } catch {
      setTasks(tasks);
      setStatus({ text: "We couldn't update that task. Try again.", failed: true });
    }
  };

  const remove = async (task: PlanTask) => {
    if (!tasks) return;
    setTasks(tasks.filter((t) => t.id !== task.id));
    try {
      await services.plan.remove(accountId, task.id);
      setStatus({ text: `Deleted "${task.title}".` });
    } catch {
      setTasks(tasks);
      setStatus({ text: "We couldn't delete that task. Try again.", failed: true });
    }
  };

  const done = tasks?.filter((t) => t.done).length ?? 0;
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const suggestions = activeGoals.map((g) => ({ goal: g, step: nextStep(g) })).filter((x): x is { goal: Goal; step: NonNullable<ReturnType<typeof nextStep>> } => x.step !== null);

  return (
    <>
      <DetailHeader back={{ to: "/for-you", label: "For You" }} title="Weekly plan" />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => goToWeek(addDays(week, -7))} className={iconBtn} aria-label="Previous week">
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <h2 className="min-w-[11rem] text-center font-sans text-base font-semibold text-oxford-ink" aria-live="polite">
            {week === thisWeek ? "This week" : weekLabel(week)}
            {week === thisWeek && <span className="block text-xs font-medium text-oxford-mute">{weekLabel(week)}</span>}
          </h2>
          <button type="button" onClick={() => goToWeek(addDays(week, 7))} className={iconBtn} aria-label="Next week">
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
          {week !== thisWeek && (
            <button type="button" onClick={() => goToWeek(thisWeek)} className="ml-1 min-h-[44px] px-2 text-sm font-semibold text-oxford-ink underline underline-offset-4 hover:no-underline">
              This week
            </button>
          )}
        </div>
        <button type="button" onClick={() => openAdd()} className={btn("primary")} disabled={!tasks}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add task
        </button>
      </div>

      <p role="status" className={`mb-3 min-h-[1.25rem] text-sm font-semibold ${status?.failed ? "text-oxford-danger" : "text-oxford-success"}`}>
        {status?.text}
      </p>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          {tasksQuery.state.status === "loading" && !tasks && <Skeleton lines={5} />}
          {tasksQuery.state.status === "error" && <LoadError what="your plan" onRetry={tasksQuery.reload} />}
          {tasks &&
            (tasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-oxford-rule px-5 py-10 text-center">
                <CalendarCheck className="mx-auto h-8 w-8 text-oxford-mute" aria-hidden="true" />
                <p className="mt-3 font-semibold text-oxford-ink">Nothing planned for this week</p>
                <p className="mt-1 text-sm text-oxford-mute">Add the tasks you want to get done, and link them to a goal if you like.</p>
                <button type="button" onClick={() => openAdd()} className={btn("primary", "mt-5")}>
                  Add a task
                </button>
              </div>
            ) : (
              <>
                <p className="mb-3 text-sm text-oxford-mute">
                  {done} of {tasks.length} done
                </p>
                <ol className="space-y-4">
                  {days.map((d) => {
                    const dayTasks = tasks.filter((t) => t.date === d);
                    // Finished tasks settle below the ones still to do.
                    const ordered = [...dayTasks.filter((t) => !t.done), ...dayTasks.filter((t) => t.done)];
                    const date = fromISODate(d);
                    return (
                      <li key={d} className="rounded-2xl border border-oxford-rule bg-white/80 px-4 py-3">
                        <h3 className="flex items-center gap-2 font-sans text-sm font-semibold text-oxford-ink">
                          {date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
                          {d === today && <span className="rounded-full bg-oxford-ink px-2 py-0.5 text-[11px] font-semibold text-white">Today</span>}
                        </h3>
                        {ordered.length === 0 ? (
                          <p className="py-1.5 text-sm text-oxford-mute">Nothing planned</p>
                        ) : (
                          <ul className="mt-1">
                            <AnimatePresence initial={false}>
                              {ordered.map((t) => {
                                const goal = goalTitle(t.goalId);
                                return (
                                  <motion.li
                                    key={t.id}
                                    layout={!reduce}
                                    initial={reduce ? false : { opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={reduce ? undefined : { opacity: 0, height: 0 }}
                                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                    className="flex items-center gap-3 py-1.5"
                                  >
                                    <TickBox checked={t.done} onChange={(v) => toggle(t, v)} label={t.title} />
                                    <span className="min-w-0 flex-1">
                                      <span className={`block text-sm ${t.done ? "text-oxford-mute line-through" : "text-oxford-ink"}`}>{t.title}</span>
                                      {(t.time || goal) && (
                                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-oxford-mute">
                                          {t.time && <span>{t.time}</span>}
                                          {goal && (
                                            <Link to={`/for-you/goals/${t.goalId}`} className="inline-flex items-center gap-1 font-semibold text-oxford-ink2 hover:underline">
                                              <Target className="h-3 w-3" aria-hidden="true" />
                                              {goal}
                                            </Link>
                                          )}
                                        </span>
                                      )}
                                    </span>
                                    <button
                                      type="button"
                                      className={iconBtn}
                                      aria-label={`Edit ${t.title}`}
                                      onClick={() => setEditing({ mode: "edit", id: t.id, initial: { title: t.title, date: t.date, time: t.time, goalId: t.goalId } })}
                                    >
                                      <Pencil className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                    <button type="button" className={iconBtn} aria-label={`Delete ${t.title}`} onClick={() => remove(t)}>
                                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                  </motion.li>
                                );
                              })}
                            </AnimatePresence>
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </>
            ))}
        </div>

        <aside>
          <DashCard id="next-steps-title" title="Next steps from your goals">
            {goalsQuery.state.status === "loading" && <Skeleton lines={2} />}
            {goalsQuery.state.status === "error" && <LoadError what="your goals" onRetry={goalsQuery.reload} />}
            {goalsQuery.state.status === "ready" &&
              (suggestions.length === 0 ? (
                <p className="text-sm text-oxford-mute">
                  {activeGoals.length === 0 ? (
                    <>
                      No active goals.{" "}
                      <Link to="/for-you/goals/new" className="font-semibold text-oxford-ink underline underline-offset-4">
                        Set a goal
                      </Link>
                    </>
                  ) : (
                    "Every step of your active goals is done."
                  )}
                </p>
              ) : (
                <ul className="space-y-3">
                  {suggestions.map(({ goal, step }) => (
                    <li key={goal.id} className="rounded-xl border border-oxford-rule bg-white p-3">
                      <p className="text-xs font-semibold text-oxford-mute">{goal.title}</p>
                      <p className="mt-0.5 text-sm text-oxford-ink">{step.text}</p>
                      <button
                        type="button"
                        onClick={() => openAdd({ title: step.text, goalId: goal.id })}
                        disabled={!tasks}
                        className="mt-2 inline-flex min-h-[40px] items-center gap-1.5 text-sm font-semibold text-oxford-ink underline underline-offset-4 hover:no-underline"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Add to this week
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
          </DashCard>
        </aside>
      </div>

      {editing && (
        <TaskDialog
          open
          mode={editing.mode}
          initial={editing.initial}
          weekStart={week}
          goals={allGoals.filter((g) => g.status === "active" || g.id === editing.initial.goalId)}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </>
  );
};
