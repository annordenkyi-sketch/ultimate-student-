import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCheck, ChevronLeft, Search } from "lucide-react";
import { dataService } from "@/data/service";
import type { Announcement, AnnouncementCategory } from "@/data/types";
import { useProfile } from "@/hooks/useProfile";
import { useAnnouncementReads } from "@/hooks/useAnnouncementReads";
import { Highlight } from "@/lib/highlight";

/* ───────────────────────────── Tabs ───────────────────────────── */

type Tab = "All" | "Unread" | "Academic" | "Hostels" | "Events" | "Services" | "General";

const TABS: Tab[] = [
  "All",
  "Unread",
  "Academic",
  "Hostels",
  "Events",
  "Services",
  "General",
];

const TAB_CATEGORY: Partial<Record<Tab, AnnouncementCategory>> = {
  Academic: "academic",
  Hostels: "hostels",
  Events: "events",
  Services: "services",
  General: "general",
};

const CATEGORY_TINT: Record<AnnouncementCategory, string> = {
  academic: "bg-brand-100 text-brand-700",
  hostels: "bg-amber-100 text-amber-800",
  events: "bg-sky-100 text-sky-700",
  services: "bg-rose-100 text-rose-700",
  general: "bg-slate-100 text-slate-700",
};

const CATEGORY_LABEL: Record<AnnouncementCategory, string> = {
  academic: "Academic",
  hostels: "Hostels",
  events: "Events",
  services: "Services",
  general: "General",
};

/* ───────────────────────────── Helpers ───────────────────────────── */

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/* ───────────────────────────── Row ───────────────────────────── */

interface RowProps {
  a: Announcement;
  isActive: boolean;
  isUnread: boolean;
  query: string;
  onClick: () => void;
}

const AnnouncementRow = ({ a, isActive, isUnread, query, onClick }: RowProps) => (
  <li>
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`flex w-full items-start gap-3 p-4 text-left transition ${
        isActive ? "bg-brand-50" : "hover:bg-slate-50"
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
          isUnread ? "bg-brand-600" : "bg-slate-300"
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-semibold text-slate-900">
            <Highlight text={a.title} query={query} />
          </p>
          <p className="shrink-0 text-[11px] text-slate-400">
            {new Date(a.date).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
          {a.source && (
            <span className="truncate">
              <Highlight text={a.source} query={query} />
            </span>
          )}
          {a.category && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${CATEGORY_TINT[a.category]}`}
            >
              {CATEGORY_LABEL[a.category]}
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
          <Highlight text={a.body} query={query} />
        </p>
      </div>
    </button>
  </li>
);

/* ───────────────────────────── Detail panel ───────────────────────────── */

const DetailPanel = ({
  announcement,
  onBack,
}: {
  announcement: Announcement;
  onBack: () => void;
}) => (
  <article className="flex h-full flex-col">
    {/* Mobile-only back */}
    <header className="flex items-center gap-2 border-b border-slate-100 p-4 lg:hidden">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to announcements"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <p className="text-sm font-semibold text-slate-900">Announcement</p>
    </header>

    <div className="flex-1 overflow-y-auto p-5">
      {announcement.category && (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${CATEGORY_TINT[announcement.category]}`}
        >
          {CATEGORY_LABEL[announcement.category]}
        </span>
      )}
      <h2 className="mt-3 text-xl font-bold text-slate-900">
        {announcement.title}
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        {announcement.source && (
          <>
            <span className="font-medium text-slate-700">
              {announcement.source}
            </span>
            {" · "}
          </>
        )}
        {formatDate(announcement.date)}
      </p>
      <div className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {announcement.body}
      </div>
    </div>
  </article>
);

/* ───────────────────────────── Page ───────────────────────────── */

export const AnnouncementsPage = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { isRead, markRead, markAllRead } = useAnnouncementReads();

  const [all, setAll] = useState<Announcement[] | null>(null);
  const [tab, setTab] = useState<Tab>("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    dataService.getAnnouncements(profile).then((data) => {
      if (!cancelled) {
        setAll(
          [...data].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          ),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const unreadCount = useMemo(
    () => (all ?? []).filter((a) => !isRead(a.id)).length,
    [all, isRead],
  );

  const filtered = useMemo(() => {
    if (!all) return [];
    const q = query.trim().toLowerCase();
    return all.filter((a) => {
      if (tab === "Unread" && isRead(a.id)) return false;
      const cat = TAB_CATEGORY[tab];
      if (cat && a.category !== cat) return false;
      if (q) {
        const hay = `${a.title} ${a.body} ${a.source ?? ""} ${a.category ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, tab, query, isRead]);

  const activeId = paramId ?? null;
  const active = (all ?? []).find((a) => a.id === activeId) ?? null;

  // Mark as read when opening
  useEffect(() => {
    if (active) markRead(active.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const openOne = (id: string) => navigate(`/announcements/${id}`);
  const closeOne = () => navigate("/announcements");
  const onMarkAll = () => {
    if (!all) return;
    markAllRead(all.map((a) => a.id));
  };

  // Mobile — detail replaces the list
  const detailViewVisible = Boolean(active);

  return (
    <div className="pb-4">
      {/* Header */}
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            Back to Home
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount} unread · {all?.length ?? 0} total
          </p>
        </div>
        <button
          type="button"
          onClick={onMarkAll}
          disabled={unreadCount === 0}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Mark all as read
        </button>
      </header>

      {/* Search + tabs */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search announcements…"
            aria-label="Search announcements"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500"
          />
        </div>

        <div
          role="tablist"
          aria-label="Filter"
          className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          {TABS.map((t) => {
            const isActive = tab === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(t)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
                  isActive
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {t}
                {t === "Unread" && unreadCount > 0 && (
                  <span className="ml-1 opacity-80">({unreadCount})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Split: list + detail */}
      <div className="lg:grid lg:grid-cols-[1fr_1.3fr] lg:gap-4">
        <section
          className={`${
            detailViewVisible ? "hidden lg:block" : "block"
          } rounded-xl border border-slate-200 bg-white`}
          aria-label="Announcements list"
        >
          {all == null ? (
            <ul className="divide-y divide-slate-100">
              {[0, 1, 2, 3, 4].map((i) => (
                <li key={i} className="h-20 animate-pulse bg-slate-50/60" />
              ))}
            </ul>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              {query.trim() ? (
                <>
                  No results for{" "}
                  <strong className="text-slate-900">"{query}"</strong>.
                </>
              ) : all.length === 0 ? (
                "No announcements yet."
              ) : (
                `No announcements in ${tab}.`
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <AnnouncementRow
                  key={a.id}
                  a={a}
                  isActive={a.id === activeId}
                  isUnread={!isRead(a.id)}
                  query={query}
                  onClick={() => openOne(a.id)}
                />
              ))}
            </ul>
          )}
        </section>

        {active ? (
          <aside
            className={`${
              detailViewVisible ? "block" : "hidden lg:block"
            } overflow-hidden rounded-xl border border-slate-200 bg-white lg:min-h-[400px]`}
          >
            <DetailPanel announcement={active} onBack={closeOne} />
          </aside>
        ) : (
          <aside className="hidden rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500 lg:flex lg:items-center lg:justify-center">
            Select an announcement to read the full text.
          </aside>
        )}
      </div>
    </div>
  );
};
