import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ListPlus, Loader2, RefreshCw, type LucideIcon } from "lucide-react";
import { FormAlert } from "@/ui/form/FormAlert";
import { AuthHeading, BackLink } from "../auth/parts";
import { semesterLabel, useSetup } from "./SetupLayout";

const OptionCard = ({
  icon: Icon,
  title,
  body,
  badge,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  badge?: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full items-start gap-4 rounded-xl border border-oxford-ink/20 bg-white p-4 text-left transition hover:border-oxford-ink/50 hover:shadow-sm"
  >
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-oxford-sandSoft text-oxford-ink">
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-oxford-ink">{title}</span>
        {badge && (
          <span className="rounded-full bg-oxford-ink px-2 py-0.5 text-[11px] font-semibold text-white">
            {badge}
          </span>
        )}
      </span>
      <span className="mt-0.5 block text-sm text-oxford-mute">{body}</span>
    </span>
    <ChevronRight
      className="mt-3 h-5 w-5 shrink-0 text-oxford-mute transition group-hover:translate-x-0.5"
      aria-hidden="true"
    />
  </button>
);

export const MethodStep = () => {
  const { update, semester, skip } = useSetup();
  const navigate = useNavigate();
  const [skipping, setSkipping] = useState(false);
  const [skipFailed, setSkipFailed] = useState(false);

  const onSkip = async () => {
    setSkipping(true);
    setSkipFailed(false);
    try {
      await skip();
    } catch {
      setSkipFailed(true);
      setSkipping(false);
    }
  };

  return (
    <>
      <BackLink to="/onboarding/semester" />
      <AuthHeading title="How do you want to add your courses?">
        For {semesterLabel(semester)}.
      </AuthHeading>

      <div className="space-y-3">
        <OptionCard
          icon={RefreshCw}
          title="Sync from the university portal"
          badge="Recommended"
          body="Import your registered courses and lecture times in one go."
          onClick={() => {
            update({ method: "sync" });
            navigate("/onboarding/sync-access");
          }}
        />
        <OptionCard
          icon={ListPlus}
          title="Add courses manually"
          body="Search the course list and add your courses one by one."
          onClick={() => {
            update({ method: "manual" });
            navigate("/onboarding/manual");
          }}
        />
      </div>

      {skipFailed && (
        <FormAlert tone="error" title="We couldn't skip setup" className="mt-5">
          Check your connection and try again.
        </FormAlert>
      )}

      <div className="mt-6 border-t border-oxford-rule pt-5 text-center">
        <button
          type="button"
          onClick={onSkip}
          disabled={skipping}
          aria-busy={skipping || undefined}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md px-3 text-sm font-semibold text-oxford-ink underline underline-offset-4 hover:no-underline disabled:opacity-60"
        >
          {skipping && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {skipping ? "Skipping…" : "Skip for now"}
        </button>
        <p className="mt-1 text-xs text-oxford-mute">
          Go to Home and set up your courses later.
        </p>
      </div>
    </>
  );
};
