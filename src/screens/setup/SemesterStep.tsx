import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/session/SessionProvider";
import { FieldError } from "@/ui/form/FieldError";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { AuthHeading, BackLink } from "../auth/parts";
import { useSetup } from "./SetupLayout";

const choiceClass = (selected: boolean) =>
  `flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3.5 transition ${
    selected ? "border-oxford-ink ring-1 ring-oxford-ink" : "border-oxford-ink/20 hover:border-oxford-ink/40"
  }`;

export const SemesterStep = () => {
  const { progress, update, semesters } = useSetup();
  const { account } = useSession();
  const navigate = useNavigate();

  const initial =
    semesters.find((s) => s.id === progress.semesterId) ?? semesters.find((s) => s.current) ?? semesters[0];
  const years = [...new Set(semesters.map((s) => s.academicYear))];
  const [year, setYear] = useState(initial?.academicYear ?? years[0] ?? "");
  const [semesterId, setSemesterId] = useState<string | null>(initial?.id ?? null);
  const [error, setError] = useState<string | null>(null);

  const terms = semesters.filter((s) => s.academicYear === year);

  const chooseYear = (y: string) => {
    setYear(y);
    const term = semesters.find((s) => s.id === semesterId)?.term;
    setSemesterId(semesters.find((s) => s.academicYear === y && s.term === term)?.id ?? null);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!semesterId) {
      setError("Choose a semester to continue.");
      return;
    }
    // A different semester means a different course list, so start courses afresh.
    if (semesterId !== progress.semesterId) {
      update({ semesterId, method: null, imported: [], excludedCodes: [], courses: [], acknowledgedClashes: [] });
    }
    navigate("/onboarding/method");
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      {account?.setupComplete && <BackLink to="/home" label="Home" />}
      <AuthHeading title="Which semester are you setting up?">
        We've picked the current semester. Change it if you need to.
      </AuthHeading>

      <fieldset>
        <legend className="text-sm font-semibold text-oxford-ink">Academic year</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {years.map((y) => (
            <label key={y} className={choiceClass(year === y)}>
              <input
                type="radio"
                name="academic-year"
                checked={year === y}
                onChange={() => chooseYear(y)}
                className="h-4 w-4 accent-[rgb(var(--us-ink))]"
              />
              <span className="font-semibold text-oxford-ink">{y}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6" aria-describedby={error ? "semester-error" : undefined}>
        <legend className="text-sm font-semibold text-oxford-ink">Semester</legend>
        <div className="mt-2 space-y-2">
          {terms.map((s) => (
            <label key={s.id} className={choiceClass(semesterId === s.id)}>
              <input
                type="radio"
                name="semester"
                checked={semesterId === s.id}
                onChange={() => {
                  setSemesterId(s.id);
                  setError(null);
                }}
                className="h-4 w-4 accent-[rgb(var(--us-ink))]"
              />
              <span className="flex-1 font-semibold text-oxford-ink">{s.term}</span>
              {s.current && (
                <span className="rounded-full bg-oxford-sand px-2.5 py-0.5 text-xs font-semibold text-oxford-ink">
                  Current
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>
      {error && <FieldError id="semester-error">{error}</FieldError>}

      <LoadingButton className="mt-7">Continue</LoadingButton>
    </form>
  );
};
