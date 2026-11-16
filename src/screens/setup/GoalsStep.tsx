import { useState, type FormEvent } from "react";
import { FieldError } from "@/ui/form/FieldError";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { TextField } from "@/ui/form/TextField";
import { AuthHeading, BackLink } from "../auth/parts";
import { useSetup } from "./SetupLayout";

const SUGGESTED = [
  "Attend every lecture",
  "Hand in every assignment on time",
  "Keep up with readings each week",
  "Join a club or society",
];
const CUSTOM = "custom";

/** Flow 02 "Semester goals or skip". The full goals feature arrives in For You (Phase 6). */
export const GoalsStep = () => {
  const { progress, finish } = useSetup();
  const savedGoal = progress.goal;
  const [choice, setChoice] = useState<string | null>(
    savedGoal ? (SUGGESTED.includes(savedGoal) ? savedGoal : CUSTOM) : null,
  );
  const [custom, setCustom] = useState(savedGoal && !SUGGESTED.includes(savedGoal) ? savedGoal : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "skip" | null>(null);
  const [failed, setFailed] = useState(false);

  const run = async (kind: "save" | "skip", goal: string | null) => {
    setBusy(kind);
    setFailed(false);
    try {
      await finish(goal);
    } catch {
      setFailed(true);
      setBusy(null);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!choice) {
      setError("Choose a goal, write your own, or skip.");
      return;
    }
    if (choice === CUSTOM && !custom.trim()) {
      setError("Write your goal, or pick one of the suggestions.");
      document.getElementById("custom-goal")?.focus();
      return;
    }
    void run("save", choice === CUSTOM ? custom.trim() : choice);
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <BackLink to="/onboarding/reminders" />
      <AuthHeading title="Set a goal for this semester">
        Optional. You'll be able to track it in For You.
      </AuthHeading>

      {failed && (
        <FormAlert tone="error" title="We couldn't finish setting up" className="mb-5">
          Check your connection and try again.
        </FormAlert>
      )}

      <fieldset aria-describedby={error ? "goal-error" : undefined}>
        <legend className="sr-only">Semester goal</legend>
        <div className="space-y-2">
          {[...SUGGESTED, CUSTOM].map((g) => {
            const selected = choice === g;
            return (
              <label
                key={g}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3.5 transition ${
                  selected ? "border-oxford-ink ring-1 ring-oxford-ink" : "border-oxford-ink/20 hover:border-oxford-ink/40"
                }`}
              >
                <input
                  type="radio"
                  name="goal"
                  checked={selected}
                  onChange={() => {
                    setChoice(g);
                    setError(null);
                  }}
                  className="h-4 w-4 accent-[rgb(var(--us-ink))]"
                />
                <span className="font-semibold text-oxford-ink">{g === CUSTOM ? "Write my own" : g}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {choice === CUSTOM && (
        <TextField
          id="custom-goal"
          label="Your goal"
          maxLength={120}
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value);
            setError(null);
          }}
          wrapperClassName="mt-4"
          hint={`${custom.length}/120 characters`}
        />
      )}
      {error && <FieldError id="goal-error">{error}</FieldError>}

      <div className="mt-7 flex flex-col gap-3">
        <LoadingButton loading={busy === "save"} loadingLabel="Finishing…" disabled={busy !== null}>
          Save goal and finish
        </LoadingButton>
        <LoadingButton
          type="button"
          variant="secondary"
          loading={busy === "skip"}
          loadingLabel="Finishing…"
          disabled={busy !== null}
          onClick={() => void run("skip", null)}
        >
          Skip
        </LoadingButton>
      </div>
    </form>
  );
};
