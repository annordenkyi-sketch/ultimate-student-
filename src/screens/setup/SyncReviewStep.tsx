import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { FieldError } from "@/ui/form/FieldError";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { AuthHeading, BackLink } from "../auth/parts";
import { semesterLabel, useSetup } from "./SetupLayout";

/** Flow 02 "Review imported courses": untick any that are wrong. */
export const SyncReviewStep = () => {
  const { progress, update, semester } = useSetup();
  const navigate = useNavigate();
  const [excluded, setExcluded] = useState(() => new Set(progress.excludedCodes));
  const [error, setError] = useState<string | null>(null);

  if (progress.imported.length === 0) return <Navigate to="/onboarding/sync-access" replace />;

  const selected = progress.imported.filter((c) => !excluded.has(c.code));
  const credits = selected.reduce((sum, c) => sum + c.credits, 0);

  const toggle = (code: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
    setError(null);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) {
      setError("Keep at least one course, or go back and add courses manually.");
      return;
    }
    // Keep any schedule edits already made to a course when coming back here.
    const courses = selected.map((c) => progress.courses.find((x) => x.code === c.code) ?? c);
    update({ excludedCodes: [...excluded], courses });
    navigate("/onboarding/timetable");
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <BackLink to="/onboarding/method" />
      <AuthHeading title="Check your imported courses">
        We found {progress.imported.length} courses for {semesterLabel(semester)}. Untick any that
        aren't yours.
      </AuthHeading>

      <fieldset aria-describedby={error ? "imported-error" : "imported-count"}>
        <legend className="sr-only">Imported courses</legend>
        <ul className="divide-y divide-oxford-rule overflow-hidden rounded-xl border border-oxford-rule bg-white">
          {progress.imported.map((c) => {
            const checked = !excluded.has(c.code);
            return (
              <li key={c.code}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5 transition hover:bg-oxford-cream/60">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(c.code)}
                    className="h-5 w-5 shrink-0 accent-[rgb(var(--us-ink))]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-semibold ${checked ? "text-oxford-ink" : "text-oxford-mute line-through"}`}>
                      {c.code}
                    </span>
                    <span className="block truncate text-sm text-oxford-mute">{c.title}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-oxford-mute">
                    {c.credits} credits
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <p id="imported-count" className="mt-3 text-sm text-oxford-mute" aria-live="polite">
        {selected.length} of {progress.imported.length} selected · {credits} credits
      </p>
      {error && <FieldError id="imported-error">{error}</FieldError>}

      <LoadingButton className="mt-6">Continue</LoadingButton>
    </form>
  );
};
