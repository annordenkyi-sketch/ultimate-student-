import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Bell,
  Bookmark,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useNotifications } from "@/hooks/useNotifications";
import { useSaved } from "@/hooks/useSaved";
import { useAnnouncementReads } from "@/hooks/useAnnouncementReads";
import { dataService } from "@/data/service";
import type { Announcement } from "@/data/types";
import { SearchBar } from "@/components/SearchBar";
import { FadeIn } from "@/components/Motion";
import { EventsBlock } from "./EventsBlock";
import { SavedBlock } from "./SavedBlock";

/* ───────────────────────────── Helpers ───────────────────────────── */

const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const formatToday = (): string =>
  new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const daysUntil = (iso: string): number =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));

/* ───────────────────────────── Highlight data (mock) ───────────────────────────── */

const NEXT_CLASS = {
  code: "CPEN 312",
  name: "Software Engineering",
  time: "Tue · 10:00 – 12:00",
  venue: "Science Block R401",
  walkMinutes: 6,
};

const TODAYS_SCHEDULE = {
  count: 3,
  nextLabel: "Discrete Mathematics · 14:00",
};

const UPCOMING_EXAM = {
  course: "CPEN 312 · Software Engineering",
  dateIso: "2026-12-05T09:00",
  venue: "Science Block Hall",
};

/* ───────────────────────────── Mobile header ───────────────────────────── */

const MobileHeader = ({ firstName }: { firstName: string }) => {
  const { unreadCount } = useNotifications();
  return (
    <header className="lg:hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{greeting()}</p>
          <h1 className="text-xl font-bold text-slate-900">{firstName}</h1>
        </div>
        <Link
          to="/notifications"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white"
            >
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
      <div className="mt-3">
        <SearchBar placeholder="Search campus, services, events…" />
      </div>
    </header>
  );
};

/* ───────────────────────────── Greeting ───────────────────────────── */

const GreetingHeader = ({ firstName }: { firstName: string }) => (
  <header>
    <p className="text-xs font-medium text-slate-500">{formatToday()}</p>
    <h1 className="mt-1 text-2xl font-bold text-slate-900 lg:text-3xl">
      {greeting()}, {firstName}
    </h1>
  </header>
);

/* ───────────────────────────── Highlight cards ───────────────────────────── */

interface Highlight {
  key: string;
  tag: string;
  icon: LucideIcon;
  iconTint: string;
  primary: string;
  secondary: string;
  to: string;
  cta: string;
}

const HighlightCards = ({ campusEventsCount }: { campusEventsCount: number }) => {
  const examIn = daysUntil(UPCOMING_EXAM.dateIso);
  const items: Highlight[] = [
    {
      key: "next-class",
      tag: "Next class",
      icon: CalendarClock,
      iconTint: "bg-brand-100 text-brand-700",
      primary: NEXT_CLASS.name,
      secondary: "Tue · 10:00",
      to: "/section/academic",
      cta: "Open timetable",
    },
    {
      key: "today",
      tag: "Today",
      icon: ClipboardList,
      iconTint: "bg-sky-100 text-sky-700",
      primary: `${TODAYS_SCHEDULE.count} classes`,
      secondary: "Next at 14:00",
      to: "/section/academic",
      cta: "See all",
    },
    {
      key: "exam",
      tag: "Upcoming exam",
      icon: ClipboardList,
      iconTint: "bg-rose-100 text-rose-700",
      primary: "Software Engineering",
      secondary: `In ${examIn} days`,
      to: "/section/academic",
      cta: "Open exams",
    },
    {
      key: "campus",
      tag: "Campus",
      icon: Activity,
      iconTint: "bg-emerald-100 text-emerald-700",
      primary: `${campusEventsCount} ${
        campusEventsCount === 1 ? "event" : "events"
      }`,
      secondary: "This week",
      to: "/section/social",
      cta: "See what's on",
    },
  ];

  return (
    <section aria-labelledby="highlights-heading">
      <h2 id="highlights-heading" className="sr-only">
        At a glance
      </h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((h) => {
          const Icon = h.icon;
          return (
            <li key={h.key}>
              <Link
                to={h.to}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${h.iconTint}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {h.tag}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {h.primary}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                    {h.secondary}
                  </p>
                </div>

                <p className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-700 group-hover:text-brand-800">
                  {h.cta}
                  <ChevronRight className="h-3 w-3" aria-hidden="true" />
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

/* ───────────────────────────── Summary cards ───────────────────────────── */

interface SummaryCard {
  key: string;
  count: number;
  label: string;
  to: string;
  icon: LucideIcon;
}

const SummaryCards = ({ cards }: { cards: SummaryCard[] }) => (
  <section aria-labelledby="summary-heading">
    <h2 id="summary-heading" className="sr-only">
      Summary
    </h2>
    <ul className="grid grid-cols-3 gap-2 sm:gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <li key={c.key}>
            <Link
              to={c.to}
              className="group flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:bg-slate-50 sm:p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <Icon
                  className="h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <ChevronRight
                  className="h-3 w-3 text-slate-300 transition group-hover:text-slate-500"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {c.count}
              </p>
              <p className="text-[11px] leading-tight text-slate-500 sm:text-xs">
                {c.label}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  </section>
);

/* ───────────────────────────── Announcements panel ───────────────────────────── */

const AnnouncementsPanel = () => {
  const { profile } = useProfile();
  const { isRead } = useAnnouncementReads();
  const [items, setItems] = useState<Announcement[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    dataService.getAnnouncements(profile).then((data) => {
      if (!cancelled) {
        setItems(
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

  return (
    <section
      aria-labelledby="ann-heading"
      className="rounded-xl border border-slate-200 bg-white"
    >
      <header className="flex items-baseline justify-between border-b border-slate-100 px-4 py-3">
        <h2 id="ann-heading" className="text-sm font-semibold text-slate-900">
          Announcements
        </h2>
        <Link
          to="/announcements"
          className="text-xs font-semibold text-brand-700 hover:text-brand-800"
        >
          See all
        </Link>
      </header>

      {items == null ? (
        <ul className="divide-y divide-slate-100">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="h-16 animate-pulse bg-slate-50/60" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-500">
          Nothing to show yet.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.slice(0, 4).map((a) => {
            const unread = !isRead(a.id);
            return (
              <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                <span
                  aria-hidden="true"
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    unread ? "bg-brand-600" : "bg-slate-300"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {a.title}
                    </p>
                    <p className="shrink-0 text-[11px] text-slate-400">
                      {new Date(a.date).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                    {a.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

/* ───────────────────────────── Page ───────────────────────────── */

export const HomePage = () => {
  const { profile } = useProfile();
  const { saved } = useSaved();
  const { isRead } = useAnnouncementReads();
  const firstName = profile?.name.split(" ")[0] || "there";

  const [eventsCount, setEventsCount] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [events, anns] = await Promise.all([
        dataService.getEventsThisWeek(),
        dataService.getAnnouncements(profile),
      ]);
      if (cancelled) return;
      setEventsCount(events.length);
      setAnnouncements(anns);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const unreadAnnCount = announcements.filter((a) => !isRead(a.id)).length;

  const summaryCards: SummaryCard[] = [
    {
      key: "events",
      count: eventsCount,
      label: "Events this week",
      to: "/section/social",
      icon: CalendarDays,
    },
    {
      key: "saved",
      count: saved.length,
      label: "Saved items",
      to: "/saved",
      icon: Bookmark,
    },
    {
      key: "ann",
      count: unreadAnnCount,
      label: "New announcements",
      to: "/announcements",
      icon: Megaphone,
    },
  ];

  return (
    <div>
      <MobileHeader firstName={firstName} />

      <div className="mt-6 space-y-8 lg:mt-0">
        <FadeIn>
          <GreetingHeader firstName={firstName} />
        </FadeIn>

        <FadeIn delay={0.05}>
          <HighlightCards campusEventsCount={eventsCount} />
        </FadeIn>

        <FadeIn delay={0.1}>
          <SummaryCards cards={summaryCards} />
        </FadeIn>

        <FadeIn delay={0.15}>
          <AnnouncementsPanel />
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="grid gap-6 lg:grid-cols-2">
            <EventsBlock />
            <SavedBlock />
          </div>
        </FadeIn>
      </div>
    </div>
  );
};
