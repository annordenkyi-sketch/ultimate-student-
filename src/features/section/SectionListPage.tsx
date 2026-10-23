import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Search } from "lucide-react";
import { FilterBar } from "@/components/FilterBar";
import { LoadingState } from "@/components/LoadingState";
import { ListItem } from "@/components/ListItem";
import { SECTIONS, sectionById } from "@/lib/sectionConfig";
import { dataService } from "@/data/service";
import type { SectionId, SectionItem } from "@/data/types";

const PLACEHOLDERS: Partial<Record<SectionId, string>> = {
  academic: "Search deadlines, courses, exams…",
  navigation: "Search places on campus…",
  accommodation: "Search hostels…",
  services: "Search services…",
  social: "Search events and clubs…",
  opportunities: "Search opportunities…",
};

export const SectionListPage = () => {
  const { sectionId } = useParams<{ sectionId: SectionId }>();
  const [items, setItems] = useState<SectionItem[] | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const validSection = SECTIONS.find((s) => s.id === sectionId);

  useEffect(() => {
    if (!sectionId || !validSection) return;
    setItems(null);
    let cancelled = false;
    dataService.getSection(sectionId).then((data) => {
      if (!cancelled) setItems(data);
    });
    return () => {
      cancelled = true;
    };
  }, [sectionId, validSection]);

  const tags = useMemo(() => {
    if (!items) return [];
    const all = items.flatMap((i) => i.tags);
    return Array.from(new Set(all)).slice(0, 10);
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter && !item.tags.includes(filter)) return false;
      if (q) {
        const hay = `${item.title} ${item.summary} ${item.tags.join(" ")} ${
          item.location?.label ?? ""
        } ${item.contact?.office ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, filter, query]);

  if (!sectionId || !validSection) return <Navigate to="/" replace />;
  const meta = sectionById(sectionId);
  const placeholder = PLACEHOLDERS[sectionId] ?? "Search…";

  return (
    <div className="pb-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">{meta.label}</h1>
        <p className="mt-1 text-sm text-slate-500">{meta.description}.</p>
      </header>

      <div className="mb-4 space-y-3">
        <label htmlFor="section-search" className="sr-only">
          {placeholder}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="section-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500"
          />
        </div>

        {items && tags.length > 0 && (
          <FilterBar tags={tags} active={filter} onChange={setFilter} />
        )}
      </div>

      {items == null && <LoadingState rows={5} />}

      {items && filtered.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          {query.trim() ? (
            <>
              <p>
                No results for{" "}
                <strong className="text-slate-900">"{query}"</strong> in{" "}
                {meta.label}.
              </p>
              <Link
                to={`/search?q=${encodeURIComponent(query)}`}
                className="mt-2 inline-block text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                Search all of Ultimate Student →
              </Link>
            </>
          ) : (
            <p className="text-slate-500">
              Nothing matches that filter. Try another tag.
            </p>
          )}
        </div>
      )}

      {items && filtered.length > 0 && (
        <ul className="space-y-2">
          {filtered.map((item) => (
            <li key={item.id}>
              <ListItem item={item} highlightQuery={query} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
