import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";
import { FieldError } from "./FieldError";
import { inputClass } from "./TextField";

export interface ComboOption {
  value: string;
  label: string;
}

interface Props {
  id: string;
  label: string;
  options: ComboOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

/** Searchable single-select (ARIA 1.2 combobox with a listbox popup). */
export const Combobox = ({
  id,
  label,
  options,
  value,
  onChange,
  placeholder,
  hint,
  error,
  disabled,
}: Props) => {
  const selected = options.find((o) => o.value === value) ?? null;
  const [query, setQuery] = useState(selected?.label ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const listId = `${id}-listbox`;
  const labelId = `${id}-label`;

  // Show the chosen option's label whenever the list is closed.
  useEffect(() => {
    if (!open) setQuery(selected?.label ?? "");
  }, [open, selected?.label]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q === selected?.label.toLowerCase()) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, selected?.label]);

  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(filtered.length - 1, 0)));
  }, [filtered.length]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (option: ComboOption) => {
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActive(Math.max(0, filtered.findIndex((o) => o.value === value)));
        } else {
          setActive((a) => Math.min(a + 1, filtered.length - 1));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (open) setActive((a) => Math.max(a - 1, 0));
        break;
      case "Enter":
        if (open && filtered[active]) {
          e.preventDefault();
          choose(filtered[active]);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
    }
  };

  const activeOption = open ? filtered[active] : undefined;
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="relative">
      <label id={labelId} htmlFor={id} className="block text-sm font-semibold text-oxford-ink">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={activeOption ? `${id}-opt-${activeOption.value}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onClick={() => setOpen(true)}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
          className={inputClass(Boolean(error), "cursor-pointer pr-11")}
        />
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-oxford-mute"
          aria-hidden="true"
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-oxford-ink/15 bg-white shadow-lg">
          {filtered.length > 0 ? (
            <ul ref={listRef} id={listId} role="listbox" aria-labelledby={labelId} className="max-h-64 overflow-auto py-1">
              {filtered.map((o, i) => (
                <li
                  key={o.value}
                  id={`${id}-opt-${o.value}`}
                  data-index={i}
                  role="option"
                  aria-selected={o.value === value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(o)}
                  onMouseMove={() => setActive(i)}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-sm text-oxford-ink ${
                    i === active ? "bg-oxford-sandSoft" : ""
                  }`}
                >
                  {o.label}
                  {o.value === value && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </li>
              ))}
            </ul>
          ) : (
            <p id={listId} role="status" className="px-3.5 py-3 text-sm text-oxford-mute">
              No matches for "{query.trim()}"
            </p>
          )}
        </div>
      )}

      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-oxford-mute">
          {hint}
        </p>
      )}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
};
