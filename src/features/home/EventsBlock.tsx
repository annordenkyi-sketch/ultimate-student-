import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import type { EventItem } from "@/data/types";
import { dataService } from "@/data/service";
import { LoadingState } from "@/components/LoadingState";

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

const DateBlock = ({ iso }: { iso: string }) => {
  const d = new Date(iso);
  const day = d.toLocaleDateString(undefined, { weekday: "short" });
  const date = d.getDate();
  const month = d.toLocaleDateString(undefined, { month: "short" });
  return (
    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700">
      <span className="text-[10px] font-semibold uppercase tracking-wider">
        {day}
      </span>
      <span className="text-lg font-bold leading-none">{date}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider">
        {month}
      </span>
    </div>
  );
};

export const EventsBlock = () => {
  const [items, setItems] = useState<EventItem[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    dataService.getEventsThisWeek().then((data) => {
      if (!cancelled) setItems(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (items == null) return <LoadingState rows={2} label="Loading events" />;
  if (items.length === 0) return null;

  const visible = items.slice(0, 4);
  const hasMore = items.length > visible.length;

  return (
    <section
      aria-labelledby="events-heading"
      className="rounded-xl border border-slate-200 bg-white"
    >
      <header className="border-b border-slate-100 px-4 py-3">
        <h2
          id="events-heading"
          className="text-sm font-semibold text-slate-900"
        >
          This week
        </h2>
      </header>

      <ul className="divide-y divide-slate-100">
        {visible.map((e) => {
          const to = e.sectionItemId
            ? `/section/social/${e.sectionItemId}`
            : "/section/social";
          return (
            <li key={e.id}>
              <Link
                to={to}
                className="flex items-start gap-3 p-3 transition hover:bg-slate-50"
              >
                <DateBlock iso={e.date} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {e.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatTime(e.date)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    <span className="truncate">{e.location}</span>
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {(hasMore || visible.length > 0) && (
        <footer className="border-t border-slate-100 px-4 py-3 text-right">
          <Link
            to="/section/social"
            className="text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            See all
          </Link>
        </footer>
      )}
    </section>
  );
};
