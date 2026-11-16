import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarDays, Megaphone, SearchX } from "lucide-react";
import { services, type SearchQuery, type SearchType } from "@/services";
import { relativeTime, time24, dayLabel, useNow } from "@/lib/dates";
import { Highlight } from "@/lib/highlight";
import { useAsync } from "@/lib/useAsync";
import { useWalkTimes } from "@/lib/useWalkTimes";
import { btn } from "@/ui/button";
import { Chip, ChipRow } from "@/ui/Chip";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { OpenBadge } from "@/ui/OpenBadge";
import { PageHeader } from "@/ui/PageHeader";
import { PLACE_ICONS } from "@/ui/placeIcons";
import { SearchField } from "@/ui/SearchField";
import { SERVICE_ICONS } from "@/ui/serviceIcons";
import { WalkTime } from "@/ui/WalkTime";

const TYPES: { id: SearchType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "place", label: "Places" },
  { id: "event", label: "Events" },
  { id: "service", label: "Services" },
  { id: "announcement", label: "News" },
];

const SUGGESTIONS = ["library", "food", "ATM", "careers", "fees", "hospital"];

const readQuery = (p: URLSearchParams): SearchQuery => {
  const type = p.get("type");
  const date = p.get("date");
  return {
    text: p.get("q") ?? "",
    type: TYPES.some((t) => t.id === type) ? (type as SearchQuery["type"]) : "all",
    category: p.get("cat"),
    openNow: p.get("open") === "1",
    date: date === "today" || date === "week" ? date : "any",
  };
};

const writeQuery = (q: SearchQuery): URLSearchParams => {
  const p = new URLSearchParams();
  if (q.text.trim()) p.set("q", q.text.trim());
  if (q.type !== "all") p.set("type", q.type);
  if (q.category) p.set("cat", q.category);
  if (q.openNow) p.set("open", "1");
  if (q.date !== "any") p.set("date", q.date);
  return p;
};

/** Flow 04 "Universal search": places, events, services and news, with filters. */
export const SearchScreen = () => {
  const [params, setParams] = useSearchParams();
  const query = readQuery(params);
  const [text, setText] = useState(query.text);
  const now = useNow();

  const update = (patch: Partial<SearchQuery>) => setParams(writeQuery({ ...query, ...patch }), { replace: true });

  // Results follow the typing, with a short pause.
  useEffect(() => {
    if (text.trim() === query.text.trim()) return;
    const t = window.setTimeout(() => update({ text }), 250);
    return () => window.clearTimeout(t);
  });

  const filtersOn = query.type !== "all" || Boolean(query.category) || query.openNow || query.date !== "any";
  const active = Boolean(query.text.trim()) || filtersOn;
  const key = params.toString();
  const { state, reload } = useAsync(() => (active ? services.search.query(query) : Promise.resolve(null)), [key]);

  const results = state.status === "ready" ? state.data : null;
  const placeIds = useMemo(() => results?.places.map((p) => p.id) ?? [], [results]);
  const walk = useWalkTimes(placeIds);
  const total = results ? results.places.length + results.events.length + results.services.length + results.announcements.length : 0;

  const clearFilters = () => setParams(writeQuery({ text: query.text, type: "all", category: null, openNow: false, date: "any" }), { replace: true });
  const showOpenNow = query.type === "all" || query.type === "place" || query.type === "service";
  const words = query.text;

  return (
    <>
      <PageHeader title="Search" description="Places, events, services and news." />

      <div className="max-w-2xl">
        <SearchField id="universal-search" value={text} onChange={setText} onSubmit={() => update({ text })} autoFocus={!query.text} />
      </div>

      <div className="mt-4 space-y-3">
        <ChipRow label="Type">
          {TYPES.map((t) => (
            <Chip key={t.id} pressed={query.type === t.id} onClick={() => update({ type: t.id, category: null, date: "any", openNow: t.id === "event" || t.id === "announcement" ? false : query.openNow })}>
              {t.label}
            </Chip>
          ))}
        </ChipRow>

        <div className="flex flex-wrap items-center gap-2">
          {query.type !== "all" && (
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-oxford-ink">
              Category
              <select
                value={query.category ?? ""}
                onChange={(e) => update({ category: e.target.value || null })}
                className="min-h-[40px] rounded-full border border-oxford-ink/20 bg-white px-3 text-sm font-medium text-oxford-ink"
              >
                <option value="">Any</option>
                {services.search.categories(query.type).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          )}
          {showOpenNow && (
            <Chip pressed={query.openNow} onClick={() => update({ openNow: !query.openNow })}>
              Open now
            </Chip>
          )}
          {query.type === "event" && (
            <ChipRow label="Date">
              {(["any", "today", "week"] as const).map((d) => (
                <Chip key={d} pressed={query.date === d} onClick={() => update({ date: d })}>
                  {d === "any" ? "Any date" : d === "today" ? "Today" : "This week"}
                </Chip>
              ))}
            </ChipRow>
          )}
          {filtersOn && (
            <button type="button" onClick={clearFilters} className="min-h-[40px] px-2 text-sm font-semibold text-oxford-ink underline underline-offset-4 hover:no-underline">
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="mt-6" aria-live="polite">
        {!active && (
          <div>
            <p className="text-sm text-oxford-mute">Search by name, or try:</p>
            <Suggestions onPick={(s) => { setText(s); update({ text: s }); }} />
          </div>
        )}
        {active && state.status === "loading" && <Skeleton lines={4} />}
        {active && state.status === "error" && <LoadError what="search results" onRetry={reload} />}
        {results && total === 0 && (
          <div className="rounded-2xl border border-dashed border-oxford-rule px-5 py-8 text-center">
            <SearchX className="mx-auto h-8 w-8 text-oxford-mute" aria-hidden="true" />
            <h2 className="mt-3 font-sans text-lg font-semibold text-oxford-ink">
              {query.text.trim() ? `No results for "${query.text.trim()}"` : "Nothing matches these filters"}
            </h2>
            <ul className="mx-auto mt-2 max-w-sm space-y-1 text-sm text-oxford-mute">
              <li>Check the spelling, or use fewer words.</li>
              {filtersOn && <li>Clear the filters to search everything.</li>}
            </ul>
            {filtersOn && (
              <button type="button" onClick={clearFilters} className={btn("primary", "mt-5")}>
                Clear filters
              </button>
            )}
            <div className="mt-5">
              <p className="text-sm text-oxford-mute">Or try:</p>
              <Suggestions center onPick={(s) => { setText(s); update({ text: s, type: "all", category: null, openNow: false, date: "any" }); }} />
            </div>
          </div>
        )}
        {results && total > 0 && (
          <div className="space-y-6">
            <p className="sr-only">{total} results</p>
            {results.places.length > 0 && (
              <ResultGroup id="r-places" title="Places" count={results.places.length}>
                {results.places.map((p) => {
                  const Icon = PLACE_ICONS[p.category];
                  return (
                    <ResultRow key={p.id} to={`/places/${p.id}`} icon={<Icon className="h-5 w-5" aria-hidden="true" />}>
                      <Title><Highlight text={p.name} query={words} /></Title>
                      <Meta>
                        {p.category} · <OpenBadge periods={p.periods} now={now} size="xs" />
                        {walk?.[p.id] != null && <WalkTime minutes={walk[p.id]!} />}
                      </Meta>
                    </ResultRow>
                  );
                })}
              </ResultGroup>
            )}
            {results.events.length > 0 && (
              <ResultGroup id="r-events" title="Events" count={results.events.length}>
                {results.events.map((e) => {
                  const start = new Date(e.startsAt);
                  return (
                    <ResultRow key={e.id} to={`/events/${e.id}`} icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}>
                      <Title><Highlight text={e.title} query={words} /></Title>
                      <Meta>
                        {dayLabel(start, now)}, {time24(start)} · <Highlight text={e.venue} query={words} />
                      </Meta>
                    </ResultRow>
                  );
                })}
              </ResultGroup>
            )}
            {results.services.length > 0 && (
              <ResultGroup id="r-services" title="Services" count={results.services.length}>
                {results.services.map((s) => {
                  const Icon = SERVICE_ICONS[s.icon];
                  return (
                    <ResultRow key={s.id} to={`/services/${s.id}`} icon={<Icon className="h-5 w-5" aria-hidden="true" />}>
                      <Title><Highlight text={s.name} query={words} /></Title>
                      <Meta>
                        {s.category}
                        {s.periods && <> · <OpenBadge periods={s.periods} now={now} size="xs" /></>}
                      </Meta>
                    </ResultRow>
                  );
                })}
              </ResultGroup>
            )}
            {results.announcements.length > 0 && (
              <ResultGroup id="r-news" title="News" count={results.announcements.length}>
                {results.announcements.map((a) => (
                  <ResultRow key={a.id} to={`/announcements/${a.id}`} icon={<Megaphone className="h-5 w-5" aria-hidden="true" />}>
                    <Title><Highlight text={a.title} query={words} /></Title>
                    <Meta>
                      {a.source} · {relativeTime(a.publishedAt, now)}
                    </Meta>
                    <span className="mt-1 block text-sm text-oxford-ink2"><Highlight text={a.summary} query={words} /></span>
                  </ResultRow>
                ))}
              </ResultGroup>
            )}
          </div>
        )}
      </div>
    </>
  );
};

const Suggestions = ({ onPick, center = false }: { onPick: (s: string) => void; center?: boolean }) => (
  <ul className={`mt-2 flex flex-wrap gap-2 ${center ? "justify-center" : ""}`}>
    {SUGGESTIONS.map((s) => (
      <li key={s}>
        <button
          type="button"
          onClick={() => onPick(s)}
          className="inline-flex min-h-[40px] items-center rounded-full border border-oxford-ink/20 bg-white px-4 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream"
        >
          {s}
        </button>
      </li>
    ))}
  </ul>
);

const ResultGroup = ({ id, title, count, children }: { id: string; title: string; count: number; children: ReactNode }) => (
  <section aria-labelledby={id}>
    <h2 id={id} className="mb-2 flex items-baseline gap-2 font-sans text-base font-semibold text-oxford-ink">
      {title}
      <span className="text-sm font-medium text-oxford-mute">{count}</span>
    </h2>
    <ul className="divide-y divide-oxford-rule/70 rounded-2xl border border-oxford-rule bg-white/80">{children}</ul>
  </section>
);

const ResultRow = ({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) => (
  <li>
    <Link to={to} className="flex items-start gap-3 px-4 py-3.5 transition first:rounded-t-2xl last:rounded-b-2xl hover:bg-oxford-cream">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-oxford-sandSoft text-oxford-ink">{icon}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </Link>
  </li>
);

const Title = ({ children }: { children: ReactNode }) => (
  <span className="block font-semibold leading-snug text-oxford-ink">{children}</span>
);

const Meta = ({ children }: { children: ReactNode }) => (
  <span className="mt-0.5 flex flex-wrap items-center gap-x-1 text-sm text-oxford-mute">{children}</span>
);
