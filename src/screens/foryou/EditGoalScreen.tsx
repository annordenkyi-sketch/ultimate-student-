import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { services } from "@/services";
import { toISODate } from "@/lib/days";
import { useNow } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { btn } from "@/ui/button";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { TextField } from "@/ui/form/TextField";
import { DetailHeader, NotFound } from "../details/DetailHeader";
import {
  ReminderFields,
  StepsEditor,
  TargetFields,
  draftFromGoal,
  toInput,
  validateReminder,
  validateTarget,
  validateTitle,
  type DraftErrors,
  type GoalDraft,
} from "./GoalFields";
import { useAccountId } from "./useAccountId";
import { useSemester } from "./useSemesterEnd";

const FIELD_IDS: Record<string, string> = {
  title: "goal-title",
  targetValue: "target-value",
  targetUnit: "target-unit",
  targetText: "target-text",
  deadline: "deadline",
  time: "reminder-time",
};

/** Flow 06 "Edit": change the target, deadline, steps and reminders. */
export const EditGoalScreen = () => {
  const { id = "" } = useParams();
  const accountId = useAccountId();
  const navigate = useNavigate();
  const today = toISODate(useNow());
  const { semester } = useSemester();
  const { state, reload } = useAsync(() => services.goals.get(accountId, id), [accountId, id]);
  const [draft, setDraft] = useState<GoalDraft | null>(null);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (state.status === "ready" && state.data && !draft) setDraft(draftFromGoal(state.data.goal));
  }, [state, draft]);

  const back = { to: `/for-you/goals/${id}`, label: "Goal" };
  if (state.status === "loading") return <Skeleton lines={6} />;
  if (state.status === "error") return <LoadError what="this goal" onRetry={reload} />;
  if (!state.data) return <NotFound what="Goal" back={{ to: "/for-you/goals", label: "My goals" }} />;
  if (!draft) return <Skeleton lines={6} />;

  if (state.data.goal.status === "archived") {
    return (
      <div className="max-w-xl">
        <DetailHeader back={back} title="This goal is archived" />
        <p className="text-oxford-mute">Move it back to active from its page to make changes.</p>
      </div>
    );
  }

  const patch = (p: Partial<GoalDraft>) => {
    setDraft({ ...draft, ...p });
    setErrors({});
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    // Existing deadlines may already have passed; only a new date has to be in the future.
    const deadlineChanged = draft.deadline !== state.data!.goal.deadline;
    const found = { ...validateTitle(draft), ...validateTarget(draft, today, deadlineChanged), ...validateReminder(draft) };
    if (Object.keys(found).length) {
      setErrors(found);
      const first = Object.keys(found)[0] ?? "";
      if (FIELD_IDS[first]) document.getElementById(FIELD_IDS[first]!)?.focus();
      return;
    }
    setSaving(true);
    setFailed(false);
    try {
      await services.goals.update(accountId, id, toInput(draft));
      navigate(`/for-you/goals/${id}`, { replace: true, state: { notice: "edited" } });
    } catch {
      setFailed(true);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <DetailHeader back={back} eyebrow="Edit goal" title={state.data.goal.title} />
      <form onSubmit={submit} noValidate className="space-y-8">
        <TextField id="goal-title" label="Goal" maxLength={80} value={draft.title} onChange={(e) => patch({ title: e.target.value })} error={errors.title} />

        <section aria-labelledby="edit-target">
          <h2 id="edit-target" className="mb-3 font-sans text-lg font-semibold text-oxford-ink">
            Target and deadline
          </h2>
          <TargetFields draft={draft} errors={errors} onChange={patch} semesterEnd={semester?.endsOn ?? ""} />
        </section>

        <section aria-labelledby="edit-steps">
          <h2 id="edit-steps" className="mb-3 font-sans text-lg font-semibold text-oxford-ink">
            Action steps
          </h2>
          <StepsEditor steps={draft.steps} onChange={(steps) => patch({ steps })} />
        </section>

        <section aria-labelledby="edit-reminders">
          <h2 id="edit-reminders" className="mb-3 font-sans text-lg font-semibold text-oxford-ink">
            Reminders
          </h2>
          <ReminderFields draft={draft} errors={errors} onChange={patch} />
        </section>

        {failed && (
          <FormAlert tone="error" title="We couldn't save your changes">
            Check your connection and try again.
          </FormAlert>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link to={back.to} className={btn("secondary", "sm:w-auto")}>
            Cancel
          </Link>
          <LoadingButton loading={saving} loadingLabel="Saving…" className="sm:w-auto sm:min-w-[10rem]">
            Save changes
          </LoadingButton>
        </div>
      </form>
    </div>
  );
};
