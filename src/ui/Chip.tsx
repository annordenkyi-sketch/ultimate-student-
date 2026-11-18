import type { ReactNode } from "react";

/** Toggle chip for filters. Large enough to tap; state is announced via aria-pressed. */
export const Chip = ({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    aria-pressed={pressed}
    onClick={onClick}
    className={`relative inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition ${
      pressed
        ? "border-oxford-ink bg-oxford-ink text-white"
        : "border-oxford-ink/20 bg-white text-oxford-ink hover:bg-oxford-cream"
    }`}
  >
    {children}
  </button>
);

/** A labelled row of chips that scrolls sideways on small screens. */
export const ChipRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div role="group" aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
    {children}
  </div>
);
