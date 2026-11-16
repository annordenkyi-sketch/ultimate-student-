interface Props {
  title: string;
  eyebrow?: string;
  description?: string;
  /** Build phase that replaces this placeholder screen. */
  phase?: number;
}

export const PageHeader = ({ title, eyebrow, description, phase }: Props) => (
  <header className="mb-6 md:mb-8">
    {eyebrow && (
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-oxford-mute">
        {eyebrow}
      </p>
    )}
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
      <h1 className="text-3xl font-medium md:text-4xl">{title}</h1>
      {phase !== undefined && (
        <span className="rounded-full border border-dashed border-oxford-ink/30 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-oxford-mute">
          Placeholder · Phase {phase}
        </span>
      )}
    </div>
    {description && <p className="mt-2 max-w-2xl text-oxford-mute">{description}</p>}
  </header>
);
