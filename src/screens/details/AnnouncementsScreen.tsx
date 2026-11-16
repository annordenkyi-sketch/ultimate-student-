import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { services, type AnnouncementCategory } from "@/services";
import { relativeTime, useNow } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { useActivity } from "@/session/ActivityProvider";
import { EmptyNote, LoadError, Skeleton } from "@/ui/DashCard";
import { inputClass } from "@/ui/form/TextField";
import { DetailHeader } from "./DetailHeader";

const CATEGORIES: ("All" | AnnouncementCategory)[] = ["All", "Academic", "Campus life", "Finance", "Services"];

/** Flow 03 announcements list, with search and category filters. */
export const AnnouncementsScreen = () => {
  const now = useNow(60_000);
  const { state, reload } = useAsync(() => services.content.announcements(), []);
  const { isAnnouncementRead } = useActivity();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");

  const results = useMemo(() => {
    if (state.status !== "ready") return [];
    const q = query.trim().toLowerCase();
    return state.data.filter(
      (a) =>
        (category === "All" || a.category === category) &&
        (!q || a.title.toLowerCase().includes(q) || a.source.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)),
    );
  }, [state, query, category]);

  return (
    <>
      <DetailHeader back={{ to: "/home", label: "Home" }} title="Announcements">
        News and updates from across the university.
      </DetailHeader>

      <div className="mb-5 space-y-3">
        <label htmlFor="announcement-search" className="sr-only">
          Search announcements
        </label>
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-oxford-mute" aria-hidden="true" />
          <input
            id="announcement-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search announcements"
            className={inputClass(false, "pl-11")}
          />
        </div>
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={`min-h-[40px] rounded-full border px-4 text-sm font-semibold transition ${
                category === c ? "border-oxford-ink bg-oxford-ink text-white" : "border-oxford-ink/20 bg-white text-oxford-ink hover:border-oxford-ink/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {state.status === "loading" && <Skeleton lines={5} />}
      {state.status === "error" && <LoadError what="announcements" onRetry={reload} />}
      {state.status === "ready" && (
        <>
          <p className="sr-only" aria-live="polite">
            {results.length} {results.length === 1 ? "announcement" : "announcements"}
          </p>
          {results.length === 0 ? (
            <EmptyNote>
              No announcements match{query.trim() ? ` "${query.trim()}"` : ""}
              {category !== "All" ? ` in ${category}` : ""}.
            </EmptyNote>
          ) : (
            <ul className="divide-y divide-oxford-rule/70 overflow-hidden rounded-2xl border border-oxford-rule bg-white/80">
              {results.map((a) => {
                const unread = !isAnnouncementRead(a.id);
                return (
                  <li key={a.id}>
                    <Link to={`/announcements/${a.id}`} className="flex items-start gap-3 px-4 py-4 transition hover:bg-oxford-cream md:px-5">
                      <span aria-hidden="true" className={`mt-2 h-2 w-2 shrink-0 rounded-full ${unread ? "bg-oxford-ink" : "bg-transparent"}`} />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-oxford-ink ${unread ? "font-semibold" : "font-medium"}`}>
                          {a.title}
                          {unread && <span className="sr-only"> (unread)</span>}
                        </span>
                        <span className="mt-0.5 block text-sm text-oxford-mute">{a.summary}</span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-oxford-mute">
                          <span className="rounded-full bg-oxford-sandSoft px-2 py-0.5 font-semibold text-oxford-ink">{a.category}</span>
                          {a.source} · {relativeTime(a.publishedAt, now)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </>
  );
};
