import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import { btn } from "@/ui/button";
import { AuthHeading, BackLink } from "../auth/parts";
import { semesterLabel, useSetup } from "./SetupLayout";

/** Flow 02 "Explain access": exactly what the sync reads and what it doesn't. */
export const SyncAccessStep = () => {
  const { semester } = useSetup();

  const reads = [
    `Your registered courses for ${semesterLabel(semester)}`,
    "Your lecture timetable: days, times and venues",
  ];
  const doesNotRead = [
    "Your portal password",
    "Grades, results or transcripts",
    "Fees and payment details",
    "Messages or personal documents",
  ];

  return (
    <>
      <BackLink to="/onboarding/method" />
      <AuthHeading title="Connect to the university portal">
        You'll sign in with the university and approve access. Here's what that allows.
      </AuthHeading>

      <section aria-labelledby="reads-heading" className="rounded-xl border border-oxford-rule bg-white/80 p-4">
        <h2 id="reads-heading" className="font-sans text-sm font-semibold text-oxford-ink">
          We'll read
        </h2>
        <ul className="mt-2 space-y-2">
          {reads.map((r) => (
            <li key={r} className="flex gap-2 text-sm text-oxford-ink2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-oxford-success" aria-hidden="true" />
              {r}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="not-heading" className="mt-3 rounded-xl border border-oxford-rule bg-white/80 p-4">
        <h2 id="not-heading" className="font-sans text-sm font-semibold text-oxford-ink">
          We won't read or keep
        </h2>
        <ul className="mt-2 space-y-2">
          {doesNotRead.map((r) => (
            <li key={r} className="flex gap-2 text-sm text-oxford-ink2">
              <X className="mt-0.5 h-4 w-4 shrink-0 text-oxford-mute" aria-hidden="true" />
              {r}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-4 text-sm text-oxford-mute">
        You can disconnect any time in More, under Academics.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <Link to="/onboarding/sync-connect" className={btn("primary", "w-full")}>
          Continue
        </Link>
        <Link to="/onboarding/method" className={btn("secondary", "w-full")}>
          Not now
        </Link>
      </div>
    </>
  );
};
