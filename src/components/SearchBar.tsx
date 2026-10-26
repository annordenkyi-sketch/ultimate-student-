import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface Props {
  autoFocus?: boolean;
  placeholder?: string;
}

export const SearchBar = ({
  autoFocus,
  placeholder = "Search Ultimate Student",
}: Props) => {
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="flex w-full items-center gap-2 rounded-xl border border-line bg-white px-3 py-1.5 transition focus-within:border-brand-500"
    >
      <Search className="h-4 w-4 text-muted" aria-hidden="true" />
      <label htmlFor="global-search" className="sr-only">
        Search Ultimate Student
      </label>
      <input
        id="global-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="min-w-0 flex-1 border-0 bg-transparent py-1.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-0"
      />
      <button
        type="submit"
        className="hidden rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 active:scale-95 sm:inline-block"
      >
        Search
      </button>
    </form>
  );
};
