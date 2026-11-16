import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { services } from "@/services";
import { toISODate } from "@/lib/days";
import { useNow } from "@/lib/dates";
import { btn } from "@/ui/button";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { FieldError } from "@/ui/form/FieldError";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { TextField } from "@/ui/form/TextField";
import { StepProgress } from "@/ui/StepProgress";
import { DetailHeader } from "../details/DetailHeader";
import {
  ReminderFields,
  StepsEditor,
  TargetFields,
  draftFromSuggestion,
  emptyDraft,
  toInput,
  validateReminder,
  validateTarget,
  validateTitle,
  type DraftErrors,
  type GoalDraft,
} from "./GoalFields";
import { useAccountId } from "./useAccountId";
import { useSemester } from "./useSemesterEnd";

const STEPS = ["Goal", "Target and deadline", "Action steps", "Reminders"] as const;
const CUSTOM = "custom";

/** Flow 06 "New goal": choose or write a goal, set target and deadline, add steps, optional reminders. */
export const NewGoalScreen = () => {
  const accountId = useAccountId();
  const navigate = useNavigate();
  const today = toISODate(useNow());
  const { semester, failed, reload } = useSemester();
  const suggestions = services.goals.suggestions();

  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [draft, setDraft] = useState<GoalDraft | null>(null);
  const [errors, setErrors] = useState<DraftErrors & { choice?: string }>({});
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (semester && !draft) setDraft(emptyDraft(semester.endsOn));
  }, [semester, draft]);

  // Move focus to the step heading so screen readers announce each step.
  useEffect(() => {
    if (step > 0) headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  if (failed) return <LoadError what="the semester dates" onRetry={reload} />;
  if (!semester || !draft) return <Skeleton lines={4} />;

  const patch = (p: Partial<GoalDraft>) => {
    setDraft({ ...draft, ...p });
    setErrors({});
  };

  const choose = (id: string) => {
    setChoice(id);
    setErrors({});
    const s = suggestions.find((x) => x.id === id);
    setDraft(s ? draftFromSuggestion(s, semester.endsOn) : { ...emptyDraft(semester.endsOn), title: draft.title && choice === CUSTOM ? draft.title : "" });
  };

  const next = (e: FormEvent) => {
    e.preventDefault();
    let found: typeof errors = {};
    if (step === 0) found = !choice ? { choice: "Choose a suggested goal or write your own." } : validateTitle(draft);
    if (step === 1) found = validateTarget(draft, today, true);
    if (step === 3) found = validateReminder(draft);
    if (Object.keys(found).length) {
      setErrors(found);
      const first = Object.keys(found)[0];
      const fieldId = { title: "custom-goal", targetValue: "target-value", targetUnit: "target-unit", targetText: "target-text", deadline: "deadline", time: "reminder-time" }[first ?? ""];
      if (fieldId) document.getElementById(fieldId)?.focus();
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    void save();
  };

  const save = async () => {
    setSaving(true);
    setSaveFailed(false);
    try {
      const goal = await services.goals.create(accountId, toInput(draft));
      navigate(`/for-you/goals/${goal.id}`, { replace: true, state: { notice: "created" } });
    } catch {
      setSaveFailed(true);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <DetailHeader back={{ to: "/for-you/goals", label: "My goals" }} title="New goal" />
      <StepProgress label="New goal progress" steps={STEPS} current={step} />

      <form onSubmit={next} noValidate>
        {step > 0 && (
          <h2 ref={headingRef} tabIndex={-1} className="mb-1 font-sans text-lg font-semibold text-oxford-ink outline-none">
            {STEPS[step]}
          </h2>
        )}
        {step > 0 && <p className="mb-5 text-sm text-oxford-mute">For: {draft.title}</p>}

        {step === 0 && (
          <>
            <fieldset aria-describedby={errors.choice ? "choice-error" : undefined}>
              <legend className="mb-3 font-sans text-lg font-semibold text-oxford-ink">What do you want to achieve this semester?</legend>
              <div className="space-y-2">
                {[...suggestions.map((s) => ({ id: s.id, label: s.title })), { id: CUSTOM, label: "Write my own" }].map((o) => (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3.5 transition ${
                      choice === o.id ? "border-oxford-ink ring-1 ring-oxford-ink" : "border-oxford-ink/20 hover:border-oxford-ink/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="goal-choice"
                      checked={choice === o.id}
                      onChange={() => choose(o.id)}
                      className="h-4 w-4 accent-[rgb(var(--us-ink))]"
                    />
                    <span className="font-semibold text-oxford-ink">{o.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {errors.choice && <FieldError id="choice-error">{errors.choice}</FieldError>}
            {choice === CUSTOM && (
              <TextField
                id="custom-goal"
                label="Your goal"
                maxLength={80}
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
                error={errors.title}
                wrapperClassName="mt-4"
                hint={`${draft.title.length}/80 characters`}
              />
            )}
          </>
        )}

        {step === 1 && (
          <TargetFields draft={draft} errors={errors} onChange={patch} minDate={today} semesterEnd={semester.endsOn} />
        )}

        {step === 2 && (
          <>
            <p className="mb-4 text-sm text-oxford-mute">Add the steps that will get you there. You can reorder them and tick them off later.</p>
            <StepsEditor steps={draft.steps} onChange={(steps) => patch({ steps })} />
          </>
        )}

        {step === 3 && (
          <>
            <p className="mb-4 text-sm text-oxford-mute">Optional. Reminders are off unless you turn them on.</p>
            <ReminderFields draft={draft} errors={errors} onChange={patch} />
          </>
        )}

        {saveFailed && (
          <FormAlert tone="error" title="We couldn't save your goal" className="mt-5">
            Check your connection and try again.
          </FormAlert>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(step - 1)} className={btn("secondary", "sm:w-auto")} disabled={saving}>
              Back
            </button>
          ) : (
            <span />
          )}
          <LoadingButton loading={saving} loadingLabel="Saving…" className="sm:w-auto sm:min-w-[10rem]">
            {step === STEPS.length - 1 ? "Save goal" : "Continue"}
          </LoadingButton>
        </div>
      </form>
    </div>
  );
};
