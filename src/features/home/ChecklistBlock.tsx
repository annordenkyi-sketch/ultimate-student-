import { Link } from "react-router-dom";
import { ListChecks } from "lucide-react";
import { useChecklist } from "@/hooks/useChecklist";
import { PressableDiv } from "@/components/Motion";

export const ChecklistBlock = () => {
  const { progress } = useChecklist();
  const pct =
    progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100);
  const complete = progress.done === progress.total && progress.total > 0;

  return (
    <section aria-labelledby="checklist-heading" className="px-5 py-4">
      <h2
        id="checklist-heading"
        className="mb-3 text-sm font-semibold text-slate-900 display"
      >
        Orientation checklist
      </h2>
      <PressableDiv>
        <Link
          to="/saved?tab=checklist"
          className="block rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-lift"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-brand-100">
                <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                Get set up for the semester
              </p>
              <p className="mt-1 text-lg font-semibold leading-tight display">
                {complete
                  ? "You're all set."
                  : `${progress.done} of ${progress.total} done`}
              </p>
            </div>
            <span
              className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
              aria-hidden="true"
            >
              {pct}%
            </span>
          </div>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Checklist progress"
          >
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </Link>
      </PressableDiv>
    </section>
  );
};
