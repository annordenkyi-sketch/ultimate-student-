interface Props {
  tags: string[];
  active: string | null;
  onChange: (tag: string | null) => void;
}

export const FilterBar = ({ tags, active, onChange }: Props) => {
  if (tags.length === 0) return null;
  return (
    <div
      role="group"
      aria-label="Filter"
      className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-2"
    >
      <button
        type="button"
        aria-pressed={active === null}
        onClick={() => onChange(null)}
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
          active === null
            ? "bg-brand-600 text-white"
            : "bg-paper text-ink hover:bg-line"
        }`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          aria-pressed={active === tag}
          onClick={() => onChange(tag)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
            active === tag
              ? "bg-brand-600 text-white"
              : "bg-paper text-ink hover:bg-line"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
};
