interface Props {
  rows?: number;
  label?: string;
}

export const LoadingState = ({ rows = 3, label = "Loading" }: Props) => (
  <div className="space-y-2 px-4 py-3" aria-busy="true" aria-live="polite">
    <span className="sr-only">{label}</span>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="h-16 animate-pulse rounded-xl bg-paper"
      />
    ))}
  </div>
);
