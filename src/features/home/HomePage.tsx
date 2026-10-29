import { useEffect, useMemo, useState } from "react";
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
    year: "numeric",
  });

const daysUntil = (iso: string): number =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));

/* ───────────────────────────── Highlight data (mock) ───────────────────────────── */

const NEXT_CLASS = {
  code: "CPEN 312",
  name: "Software Engineering",
  time: "Tue · 10:00",
  venue: "Science Block R401",
};

const TODAYS_SCHEDULE = { count: 3, nextLabel: "Next at 14:00" };

const UPCOMING_EXAM = {
  course: "Software Engineering",
  dateIso: "2026-12-05T09:00",
};

/* ───────────────────────────── Mobile header ───────────────────────────── */

const MobileHeader = ({ firstName }: { firstName: string }) => {
  const { unreadCount } = useNotifications();
  return (
    <header className="lg:hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-700">
            {greeting()}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-ink">
            {firstName}
          </h1>
        </div>
        <Link
          to="/notifications"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink hover:bg-brand-50/60"
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
      <div className="mt-4">
        <SearchBar placeholder="Search campus, services, events…" />
      </div>
    </header>
  );
};

/* ───────────────────────────── Desktop greeting ───────────────────────────── */

const GreetingHeader = ({ firstName }: { firstName: string }) => (
  <header className="hidden lg:block">
    <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-700">
      {greeting()}
    </p>
    <h1 className="mt-1 text-4xl font-bold tracking-tight text-ink lg:text-5xl">
      Welcome back, {firstName}.
    </h1>
    <p className="mt-2 text-sm text-muted">{formatToday()}</p>
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
      secondary: `${NEXT_CLASS.time} · ${NEXT_CLASS.venue}`,
      to: "/section/academic",
      cta: "Open timetable",
    },
    {
      key: "today",
      tag: "Today",
      icon: ClipboardList,
      iconTint: "bg-sky-100 text-sky-700",
      primary: `${TODAYS_SCHEDULE.count} classes`,
      secondary: TODAYS_SCHEDULE.nextLabel,
      to: "/section/academic",
      cta: "See schedule",
    },
    {
      key: "exam",
      tag: "Upcoming exam",
      icon: ClipboardList,
      iconTint: "bg-rose-100 text-rose-700",
      primary: UPCOMING_EXAM.course,
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
        Day at a glance
      </h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((h) => {
          const Icon = h.icon;
          return (
            <li key={h.key}>
              <Link
                to={h.to}
                className="group flex h-full flex-col gap-4 rounded-2xl border border-line bg-white p-5 transition hover:border-brand-300"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${h.iconTint}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-accent-700">
                    {h.tag}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-base font-bold tracking-tight text-ink">
                    {h.primary}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                    {h.secondary}
                  </p>
                </div>

                <p className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-700 group-hover:text-brand-800 hover:underline">
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

/* ───────────────────────────── At a Glance ───────────────────────────── */

interface Stat {
  key: string;
  label: string;
  value: number;
  caption: string;
  to: string;
  icon: LucideIcon;
}

const AtAGlance = ({ stats }: { stats: Stat[] }) => (
  <section
    aria-labelledby="glance-heading"
    className="rounded-2xl border border-line bg-white p-6 md:p-10"
  >
    <div className="mb-6 flex items-end justify-between gap-6 md:mb-10">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-700">
          Your week
        </p>
        <h2
          id="glance-heading"
          className="mt-1 text-3xl font-bold tracking-tight text-ink md:text-4xl"
        >
          Ultimate Student at a glance
        </h2>
      </div>
    </div>

    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <li key={s.key} className="border-t border-line pt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent-700">
                {s.label}
              </p>
              <Icon
                className="h-4 w-4 text-line"
                aria-hidden="true"
              />
            </div>
            <Link
              to={s.to}
              className="group mt-3 inline-flex items-baseline gap-2"
            >
              <span className="text-5xl font-bold tracking-tight text-ink group-hover:text-brand-700 md:text-6xl">
                {s.value}
              </span>
              <span className="text-xs font-semibold text-brand-700 group-hover:text-brand-800 hover:underline">
                →
              </span>
            </Link>
            <p className="mt-2 text-xs text-muted">{s.caption}</p>
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
      className="rounded-2xl border border-line bg-white"
    >
      <header className="flex items-end justify-between gap-4 border-b border-line/60 px-6 py-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-700">
            Updates
          </p>
          <h2
            id="ann-heading"
            className="mt-0.5 text-xl font-bold tracking-tight text-ink"
          >
            Announcements
          </h2>
        </div>
        <Link
          to="/announcements"
          className="text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline"
        >
          See all →
        </Link>
      </header>

      {items == null ? (
        <ul className="divide-y divide-line/60">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="h-20 animate-pulse bg-paper/60" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted">
          Nothing to show yet.
        </p>
      ) : (
        <ul className="divide-y divide-line/60">
          {items.slice(0, 4).map((a) => {
            const unread = !isRead(a.id);
            return (
              <li key={a.id}>
                <Link
                  to={`/announcements/${a.id}`}
                  className="flex items-start gap-4 px-6 py-5 transition hover:bg-brand-50/60"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                      unread ? "bg-brand-600" : "bg-line"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-bold tracking-tight text-ink">
                        {a.title}
                      </p>
                      <p className="shrink-0 text-[11px] uppercase tracking-wider text-muted">
                        {new Date(a.date).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    {a.source && (
                      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-accent-700">
                        {a.source}
                      </p>
                    )}
                    <p className="mt-1 line-clamp-2 text-xs text-muted">
                      {a.body}
                    </p>
                  </div>
                </Link>
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

  const unreadAnnCount = useMemo(
    () => announcements.filter((a) => !isRead(a.id)).length,
    [announcements, isRead],
  );

  const stats: Stat[] = [
    {
      key: "events",
      label: "Events this week",
      value: eventsCount,
      caption: "Lectures, meetups and sports on campus",
      to: "/section/social",
      icon: CalendarDays,
    },
    {
      key: "saved",
      label: "Saved items",
      value: saved.length,
      caption: "Hostels, events and opportunities you kept",
      to: "/saved",
      icon: Bookmark,
    },
    {
      key: "ann",
      label: "New announcements",
      value: unreadAnnCount,
      caption: "Fresh notices from across the university",
      to: "/announcements",
      icon: Megaphone,
    },
  ];

  return (
    <div>
      <MobileHeader firstName={firstName} />

      <div className="mt-6 space-y-10 lg:mt-0">
        <FadeIn>
          <GreetingHeader firstName={firstName} />
        </FadeIn>

        <FadeIn delay={0.05}>
          <HighlightCards campusEventsCount={eventsCount} />
        </FadeIn>

        <FadeIn delay={0.1}>
          <AtAGlance stats={stats} />
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
