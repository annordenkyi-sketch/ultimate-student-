import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { GPA_SCALE } from "@/config/grading";
import type { Goal, GoalInput, SuggestedGoal } from "@/services";
import { DAY_OPTIONS } from "@/lib/goals";
import { TextField, inputClass } from "@/ui/form/TextField";

export interface GoalDraft {
  title: string;
  targetKind: "number" | "description" | "gpa";
  targetValue: string;
  targetUnit: string;
  targetText: string;
  deadline: string;
  steps: { key: string; id?: string; text: string; done?: boolean }[];
  remindersOn: boolean;
  frequency: "daily" | "weekly";
  time: string;
  day: number;
}

export type DraftErrors = Partial<Record<"title" | "targetValue" | "targetUnit" | "targetText" | "deadline" | "time", string>>;

let keySeq = 0;
const stepKey = () => `k${++keySeq}`;

const REMINDER_DEFAULTS = { remindersOn: false, frequency: "weekly" as const, time: "08:00", day: 1 };

export const emptyDraft = (deadline: string): GoalDraft => ({
  title: "",
  targetKind: "description",
  targetValue: "",
  targetUnit: "",
  targetText: "",
  deadline,
  steps: [],
  ...REMINDER_DEFAULTS,
});

export const draftFromSuggestion = (s: SuggestedGoal, deadline: string): GoalDraft => ({
  ...emptyDraft(deadline),
  title: s.title,
  targetKind: s.target.kind,
  targetValue: s.target.kind === "description" ? "" : String(s.target.value),
  targetUnit: s.target.kind === "number" ? s.target.unit : "",
  targetText: s.target.kind === "description" ? s.target.text : "",
  steps: s.steps.map((text) => ({ key: stepKey(), text })),
});

export const draftFromGoal = (g: Goal): GoalDraft => ({
  title: g.title,
  targetKind: g.target.kind,
  targetValue: g.target.kind === "description" ? "" : String(g.target.value),
  targetUnit: g.target.kind === "number" ? g.target.unit : "",
  targetText: g.target.kind === "description" ? g.target.text : "",
  deadline: g.deadline,
  steps: g.steps.map((s) => ({ key: stepKey(), id: s.id, text: s.text, done: s.done })),
  remindersOn: Boolean(g.reminder),
  frequency: g.reminder?.frequency ?? REMINDER_DEFAULTS.frequency,
  time: g.reminder?.time ?? REMINDER_DEFAULTS.time,
  day: g.reminder?.day ?? REMINDER_DEFAULTS.day,
});

export const toInput = (d: GoalDraft): GoalInput => ({
  title: d.title.trim(),
  target:
    d.targetKind === "number"
      ? { kind: "number", value: Number(d.targetValue), unit: d.targetUnit.trim() }
      : d.targetKind === "gpa"
        ? { kind: "gpa", value: Number(d.targetValue) }
        : { kind: "description", text: d.targetText.trim() },
  deadline: d.deadline,
  steps: d.steps.map(({ id, text, done }) => ({ id, text, done })),
  reminder: d.remindersOn ? { frequency: d.frequency, time: d.time, day: d.frequency === "weekly" ? d.day : null } : null,
});

export const validateTitle = (d: GoalDraft): DraftErrors =>
  d.title.trim() ? {} : { title: "Write your goal, or pick one of the suggestions." };

export const validateTarget = (d: GoalDraft, today: string, isNew: boolean): DraftErrors => {
  const e: DraftErrors = {};
  if (d.targetKind === "gpa") {
    const n = Number(d.targetValue);
    if (!d.targetValue.trim() || !Number.isFinite(n)) e.targetValue = `Enter a target GPA, for example 3.5.`;
    else if (n > GPA_SCALE) e.targetValue = `GPA is out of ${GPA_SCALE.toFixed(1)}. Enter a target of ${GPA_SCALE.toFixed(1)} or less.`;
    else if (n <= 0) e.targetValue = `Enter a target above 0, up to ${GPA_SCALE.toFixed(1)}.`;
  } else if (d.targetKind === "number") {
    const n = Number(d.targetValue);
    if (!d.targetValue.trim() || !Number.isFinite(n) || n <= 0) e.targetValue = "Enter a number above 0.";
    if (!d.targetUnit.trim()) e.targetUnit = "Say what you're counting, for example \"applications\".";
  } else if (!d.targetText.trim()) {
    e.targetText = "Describe what success looks like.";
  }
  if (!d.deadline) e.deadline = "Choose a deadline.";
  else if (isNew && d.deadline < today) e.deadline = "Choose today or a later date.";
  return e;
};

export const validateReminder = (d: GoalDraft): DraftErrors => (d.remindersOn && !d.time ? { time: "Choose a time." } : {});

// ── Target and deadline ──────────────────────────────────────────────

export const TargetFields = ({
  draft,
  errors,
  onChange,
  minDate,
  semesterEnd,
}: {
  draft: GoalDraft;
  errors: DraftErrors;
  onChange: (patch: Partial<GoalDraft>) => void;
  minDate?: string;
  semesterEnd: string;
}) => (
  <div className="space-y-5">
    <fieldset>
      <legend className="text-sm font-semibold text-oxford-ink">What does success look like?</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {(
          [
            ["number", "A number to reach"],
            ["description", "A description"],
            ["gpa", `A GPA (out of ${GPA_SCALE.toFixed(1)})`],
          ] as const
        ).map(([kind, label]) => (
          <label
            key={kind}
            className={`flex min-h-[48px] cursor-pointer items-center gap-2.5 rounded-xl border bg-white px-3.5 text-sm font-semibold transition ${
              draft.targetKind === kind ? "border-oxford-ink ring-1 ring-oxford-ink" : "border-oxford-ink/20 hover:border-oxford-ink/40"
            }`}
          >
            <input
              type="radio"
              name="target-kind"
              checked={draft.targetKind === kind}
              onChange={() => onChange({ targetKind: kind })}
              className="h-4 w-4 accent-[rgb(var(--us-ink))]"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>

    {draft.targetKind === "gpa" ? (
      <TextField
        id="target-value"
        label="Target GPA"
        inputMode="decimal"
        value={draft.targetValue}
        onChange={(e) => onChange({ targetValue: e.target.value })}
        error={errors.targetValue}
        wrapperClassName="max-w-[12rem]"
        hint={`Out of ${GPA_SCALE.toFixed(1)}. Your GPA is worked out from the course results you record.`}
      />
    ) : draft.targetKind === "number" ? (
      <div className="grid grid-cols-[7rem_1fr] gap-3">
        <TextField
          id="target-value"
          label="Target"
          inputMode="decimal"
          value={draft.targetValue}
          onChange={(e) => onChange({ targetValue: e.target.value })}
          error={errors.targetValue}
        />
        <TextField
          id="target-unit"
          label="Counting"
          placeholder="e.g. applications"
          value={draft.targetUnit}
          maxLength={40}
          onChange={(e) => onChange({ targetUnit: e.target.value })}
          error={errors.targetUnit}
        />
      </div>
    ) : (
      <TextField
        id="target-text"
        label="Success looks like"
        placeholder="e.g. No missed lectures this semester"
        value={draft.targetText}
        maxLength={120}
        onChange={(e) => onChange({ targetText: e.target.value })}
        error={errors.targetText}
        hint="You'll record how far along you are as a percentage."
      />
    )}

    <TextField
      id="deadline"
      type="date"
      label="Deadline"
      value={draft.deadline}
      min={minDate}
      onChange={(e) => onChange({ deadline: e.target.value })}
      error={errors.deadline}
      hint={draft.deadline === semesterEnd ? "The end of this semester." : undefined}
    />
  </div>
);

// ── Action steps ─────────────────────────────────────────────────────

const iconButton =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-oxford-mute transition hover:bg-oxford-cream hover:text-oxford-ink disabled:opacity-30 disabled:hover:bg-transparent";

export const StepsEditor = ({ steps, onChange }: { steps: GoalDraft["steps"]; onChange: (steps: GoalDraft["steps"]) => void }) => {
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const addRef = useRef<HTMLInputElement>(null);
  const MAX = 10;

  const move = (i: number, by: -1 | 1) => {
    const next = [...steps];
    const [item] = next.splice(i, 1);
    next.splice(i + by, 0, item!);
    onChange(next);
    setNote(`Moved "${item!.text}" to position ${i + by + 1}.`);
  };

  const add = () => {
    if (!text.trim() || steps.length >= MAX) return;
    onChange([...steps, { key: stepKey(), text: text.trim() }]);
    setNote(`Added "${text.trim()}".`);
    setText("");
    addRef.current?.focus();
  };

  return (
    <div>
      {steps.length === 0 ? (
        <p className="rounded-xl border border-dashed border-oxford-rule px-4 py-5 text-center text-sm text-oxford-mute">
          No steps yet. Small, specific steps are easier to start.
        </p>
      ) : (
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={s.key} className="flex items-center gap-1 rounded-xl border border-oxford-rule bg-white py-1 pl-3 pr-1">
              <span className="w-5 shrink-0 text-sm font-semibold text-oxford-mute" aria-hidden="true">
                {i + 1}.
              </span>
              <label htmlFor={`step-${s.key}`} className="sr-only">
                Step {i + 1}
              </label>
              <input
                id={`step-${s.key}`}
                value={s.text}
                maxLength={100}
                onChange={(e) => onChange(steps.map((x) => (x.key === s.key ? { ...x, text: e.target.value } : x)))}
                className="min-h-[44px] min-w-0 flex-1 bg-transparent text-sm text-oxford-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-oxford-ink/30 rounded"
              />
              <button type="button" className={iconButton} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move step ${i + 1} up`}>
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={iconButton}
                disabled={i === steps.length - 1}
                onClick={() => move(i, 1)}
                aria-label={`Move step ${i + 1} down`}
              >
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={iconButton}
                onClick={() => {
                  onChange(steps.filter((x) => x.key !== s.key));
                  setNote(`Removed "${s.text}".`);
                }}
                aria-label={`Remove step ${i + 1}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-3 flex gap-2">
        <label htmlFor="new-step" className="sr-only">
          New step
        </label>
        <input
          id="new-step"
          ref={addRef}
          value={text}
          maxLength={100}
          disabled={steps.length >= MAX}
          placeholder={steps.length >= MAX ? `Up to ${MAX} steps` : "Add a step"}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className={inputClass(false, "flex-1")}
        />
        <button
          type="button"
          onClick={add}
          disabled={!text.trim() || steps.length >= MAX}
          className="inline-flex min-h-[48px] shrink-0 items-center gap-1.5 rounded-lg border border-oxford-ink/20 bg-white px-4 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {note}
      </p>
    </div>
  );
};

// ── Reminders ────────────────────────────────────────────────────────

export const ReminderFields = ({
  draft,
  errors,
  onChange,
}: {
  draft: GoalDraft;
  errors: DraftErrors;
  onChange: (patch: Partial<GoalDraft>) => void;
}) => (
  <div>
    <div className="flex items-center justify-between gap-4 rounded-xl border border-oxford-rule bg-white px-4 py-3">
      <span>
        <span id="reminders-label" className="block font-semibold text-oxford-ink">
          Remind me about this goal
        </span>
        <span className="block text-sm text-oxford-mute">{draft.remindersOn ? "On" : "Off"}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={draft.remindersOn}
        aria-labelledby="reminders-label"
        onClick={() => onChange({ remindersOn: !draft.remindersOn })}
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${draft.remindersOn ? "bg-oxford-ink" : "bg-oxford-ink/20"}`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${draft.remindersOn ? "left-7" : "left-1"}`}
        />
      </button>
    </div>

    {draft.remindersOn && (
      <div className="mt-4 space-y-4">
        <fieldset>
          <legend className="text-sm font-semibold text-oxford-ink">How often</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["daily", "weekly"] as const).map((f) => (
              <label
                key={f}
                className={`flex min-h-[48px] cursor-pointer items-center gap-2.5 rounded-xl border bg-white px-3.5 text-sm font-semibold transition ${
                  draft.frequency === f ? "border-oxford-ink ring-1 ring-oxford-ink" : "border-oxford-ink/20 hover:border-oxford-ink/40"
                }`}
              >
                <input
                  type="radio"
                  name="frequency"
                  checked={draft.frequency === f}
                  onChange={() => onChange({ frequency: f })}
                  className="h-4 w-4 accent-[rgb(var(--us-ink))]"
                />
                {f === "daily" ? "Daily" : "Weekly"}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          {draft.frequency === "weekly" && (
            <div>
              <label htmlFor="reminder-day" className="block text-sm font-semibold text-oxford-ink">
                Day
              </label>
              <select
                id="reminder-day"
                value={draft.day}
                onChange={(e) => onChange({ day: Number(e.target.value) })}
                className={inputClass(false, "mt-1.5")}
              >
                {DAY_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <TextField
            id="reminder-time"
            type="time"
            label="Time"
            value={draft.time}
            onChange={(e) => onChange({ time: e.target.value })}
            error={errors.time}
          />
        </div>
      </div>
    )}
  </div>
);
