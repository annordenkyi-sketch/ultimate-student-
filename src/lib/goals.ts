import { GPA_SCALE } from "@/config/grading";
import type { Goal, GoalReminder, GoalTarget } from "@/services";
import { formatTarget } from "./gpa";
import { daysBetween, longDay } from "./days";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** "1 application", "2 applications", "0 clubs". Leaves units like "GPA" alone. */
const unitFor = (unit: string, value: number) => {
  if (!/^[a-z][a-z ]*[a-z]$/.test(unit)) return unit;
  if (value === 1) return unit.endsWith("s") ? unit.slice(0, -1) : unit;
  return unit.endsWith("s") ? unit : `${unit}s`;
};

/** "3.33 / 4.0" */
const gpaText = (n: number) => `${n.toFixed(2)} / ${GPA_SCALE.toFixed(1)}`;

/**
 * 0–100, how close the goal is to its target. For a GPA goal that's the
 * estimated GPA against the target GPA.
 */
export const goalPercent = (g: Pick<Goal, "target" | "progress">) => {
  const full = g.target.kind === "description" ? 100 : g.target.value;
  if (full <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((g.progress / full) * 100)));
};

/** "1 of 2 applications", "75% of the way", "3.33 / 4.0". */
export const progressText = (g: Pick<Goal, "target" | "progress">) => {
  const t = g.target;
  if (t.kind === "number") return `${num(g.progress)} of ${num(t.value)} ${unitFor(t.unit, t.value)}`;
  if (t.kind === "gpa") return g.progress > 0 ? gpaText(g.progress) : "No results yet";
  return `${Math.round(g.progress)}% of the way`;
};

/** What success looks like, in words. */
export const targetText = (t: GoalTarget) => {
  if (t.kind === "number") return `${num(t.value)} ${unitFor(t.unit, t.value)}`;
  if (t.kind === "gpa") return `${formatTarget(t.value)} / ${GPA_SCALE.toFixed(1)} GPA`;
  return t.text;
};

/** A value as recorded in a check-in for this goal. */
export const valueText = (t: GoalTarget, value: number) => {
  if (t.kind === "number") return `${num(value)} ${unitFor(t.unit, value)}`;
  if (t.kind === "gpa") return gpaText(value);
  return `${Math.round(value)}%`;
};

export const reminderText = (r: GoalReminder | null) => {
  if (!r) return "Off";
  return r.frequency === "daily" ? `Every day at ${r.time}` : `Every ${DAY_NAMES[r.day ?? 1]} at ${r.time}`;
};

/** "Due Friday 18 December · 35 days left", or overdue. */
export const deadlineText = (deadline: string, today: string) => {
  const left = daysBetween(today, deadline);
  if (left < 0) return { text: `Deadline passed on ${longDay(deadline)}`, overdue: true };
  if (left === 0) return { text: "Due today", overdue: false };
  return { text: `Due ${longDay(deadline)} · ${left} ${left === 1 ? "day" : "days"} left`, overdue: false };
};

export const nextStep = (g: Goal) => g.steps.find((s) => !s.done) ?? null;

export const DAY_OPTIONS = DAY_NAMES.map((name, i) => ({ value: i, name }));
