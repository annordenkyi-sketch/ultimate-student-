import { Search, X } from "lucide-react";

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

/** Search box with a visible clear button. Submitting is optional (results can update as you type). */
export const SearchField = ({
  id,
  value,
  onChange,
  onSubmit,
  label = "Search",
  placeholder = "Search places, events, services…",
  autoFocus,
}: Props) => (
  <form
    role="search"
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit?.();
    }}
  >
    <label htmlFor={id} className="sr-only">
      {label}
    </label>
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-oxford-mute" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        className="h-12 w-full rounded-full border border-oxford-ink/20 bg-white pl-12 pr-12 text-base text-oxford-ink placeholder:text-oxford-mute focus:border-oxford-ink [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-oxford-mute transition hover:bg-oxford-cream hover:text-oxford-ink"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  </form>
);
