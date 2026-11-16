interface Props {
  /** Accessible name, e.g. "Sign-up progress". */
  label: string;
  steps: readonly string[];
  current: number;
}

export const StepProgress = ({ label, steps, current }: Props) => (
  <nav aria-label={label} className="mb-5">
    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-oxford-mute">
      Step {current + 1} of {steps.length}
      <span aria-hidden="true"> · </span>
      <span className="sr-only">: </span>
      {steps[current]}
    </p>
    <ol
      className="mt-2 grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((s, i) => (
        <li
          key={s}
          aria-current={i === current ? "step" : undefined}
          className={`h-1.5 rounded-full transition-colors ${i <= current ? "bg-oxford-ink" : "bg-oxford-ink/15"}`}
        >
          <span className="sr-only">
            {s}
            {i < current ? ", done" : i === current ? ", current step" : ""}
          </span>
        </li>
      ))}
    </ol>
  </nav>
);
