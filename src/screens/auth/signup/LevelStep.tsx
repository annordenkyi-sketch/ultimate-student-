import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { StudyLevel } from "@/services";
import { useSession } from "@/session/SessionProvider";
import { FieldError } from "@/ui/form/FieldError";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { AuthHeading, BackLink } from "../parts";
import { useSignup } from "./SignupLayout";

const LEVELS: { value: StudyLevel; label: string; body: string }[] = [
  { value: "undergraduate", label: "Undergraduate", body: "Bachelor's degree, diploma or certificate." },
  { value: "postgraduate", label: "Postgraduate", body: "Master's, MPhil or PhD." },
];

export const LevelStep = () => {
  const { draft, update } = useSignup();
  const { account, updateAccount } = useSession();
  const navigate = useNavigate();
  const [choice, setChoice] = useState<StudyLevel | null>(account?.studyLevel ?? draft.studyLevel);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!choice) {
      setError("Choose your study level to continue.");
      document.querySelector<HTMLInputElement>('input[name="study-level"]')?.focus();
      return;
    }
    update({ studyLevel: choice });
    if (account && account.studyLevel !== choice) updateAccount({ studyLevel: choice });
    navigate("/signup/account");
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <BackLink to="/start" />
      <AuthHeading title="What are you studying?">
        This sets the programmes and levels you'll choose from later.
      </AuthHeading>

      <fieldset aria-describedby={error ? "level-error" : undefined}>
        <legend className="sr-only">Study level</legend>
        <div className="space-y-3">
          {LEVELS.map((l) => {
            const selected = choice === l.value;
            return (
              <label
                key={l.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-4 transition ${
                  selected
                    ? "border-oxford-ink ring-1 ring-oxford-ink"
                    : "border-oxford-ink/20 hover:border-oxford-ink/40"
                }`}
              >
                <input
                  type="radio"
                  name="study-level"
                  value={l.value}
                  checked={selected}
                  onChange={() => {
                    setChoice(l.value);
                    setError(null);
                  }}
                  className="mt-1 h-4 w-4 accent-[rgb(var(--us-ink))]"
                />
                <span>
                  <span className="block font-semibold text-oxford-ink">{l.label}</span>
                  <span className="block text-sm text-oxford-mute">{l.body}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {error && <FieldError id="level-error">{error}</FieldError>}

      <LoadingButton className="mt-6">Continue</LoadingButton>
    </form>
  );
};
