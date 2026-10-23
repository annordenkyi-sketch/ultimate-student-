import { Check } from "lucide-react";

interface Props {
  steps: string[];
  current: number; // 0-indexed
}

export const OnboardingStepper = ({ steps, current }: Props) => (
  <ol
    aria-label="Onboarding progress"
    className="flex items-center gap-2 px-4 pt-4"
  >
    {steps.map((label, i) => {
      const isDone = i < current;
      const isActive = i === current;
      return (
        <li key={label} className="flex flex-1 items-center gap-2">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
              isActive
                ? "bg-brand-600 text-white"
                : isDone
                  ? "bg-brand-600 text-white"
                  : "bg-slate-200 text-slate-500"
            }`}
            aria-current={isActive ? "step" : undefined}
          >
            {isDone ? (
              <Check className="h-3 w-3" aria-hidden="true" strokeWidth={3} />
            ) : (
              i + 1
            )}
            <span className="sr-only">{label}</span>
          </span>
          {i < steps.length - 1 && (
            <span
              aria-hidden="true"
              className={`h-0.5 flex-1 rounded-full ${
                isDone ? "bg-brand-500" : "bg-slate-200"
              }`}
            />
          )}
        </li>
      );
    })}
  </ol>
);
