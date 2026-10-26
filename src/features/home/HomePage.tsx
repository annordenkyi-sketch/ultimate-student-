import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
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
import type { Announcement, EventItem, SectionItem } from "@/data/types";
import {
  FEATURE_IMAGES,
  SECTION_IMAGES,
  unsplash,
  unsplashSrcSet,
  type UnsplashImage,
} from "@/lib/images";
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
          <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700">
            {greeting()}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
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
      <div className="mt-4">
        <SearchBar placeholder="Search campus, services, events…" />
      </div>
    </header>
  );
};

/* ───────────────────────────── Desktop greeting ───────────────────────────── */

const GreetingHeader = ({ firstName }: { firstName: string }) => (
  <header className="hidden lg:block">
    <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700">
      {greeting()}
    </p>
    <h1 className="mt-1 text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl">
      Welcome back, {firstName}.
    </h1>
    <p className="mt-2 text-sm text-slate-500">{formatToday()}</p>
  </header>
);

/* ───────────────────────────── Featured hero (rotating) ───────────────────────────── */

interface HeroSlide {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  overlay: string;
  cta: string;
  to: string;
  photo: UnsplashImage;
}

const FeaturedHero = ({
  event,
  opportunity,
  announcement,
}: {
  event: EventItem | null;
  opportunity: SectionItem | null;
  announcement: Announcement | null;
}) => {
  const slides: HeroSlide[] = [];

  if (event) {
    slides.push({
      key: `event-${event.id}`,
      eyebrow: "This week on campus",
      title: event.title,
      body: `${new Date(event.date).toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
      })} · ${event.location}`,
      overlay: "Campus",
      cta: "View event",
      to: event.sectionItemId
        ? `/section/social/${event.sectionItemId}`
        : "/section/social",
      photo: FEATURE_IMAGES.interestMusic,
    });
  }

  if (opportunity) {
    slides.push({
      key: `opp-${opportunity.id}`,
      eyebrow: "New opportunity",
      title: opportunity.title,
      body: opportunity.summary,
      overlay: "Open",
      cta: "See details",
      to: `/section/opportunities/${opportunity.id}`,
      photo: SECTION_IMAGES.opportunities,
    });
  }

  if (announcement) {
    slides.push({
      key: `ann-${announcement.id}`,
      eyebrow: "From the campus",
      title: announcement.title,
      body: announcement.body,
      overlay: "Notice",
      cta: "Read more",
      to: "/announcements",
      photo: FEATURE_IMAGES.campusGreeting,
    });
  }

  const [i, setI] = useState(0);
  const hasSlides = slides.length > 0;
  const slide = hasSlides ? slides[i % slides.length] : null;

  if (!slide) return null;

  const prev = () => setI((n) => (n - 1 + slides.length) % slides.length);
  const next = () => setI((n) => (n + 1) % slides.length);

  return (
    <section aria-label="Featured" className="relative">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="relative aspect-[16/10] md:aspect-[21/9]">
          <img
            key={slide.key}
            src={unsplash(slide.photo.photoId, 1600, 70)}
            srcSet={unsplashSrcSet(slide.photo.photoId)}
            sizes="(min-width: 1024px) 1200px, 100vw"
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />

          {/* Dark gradient for text contrast */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/35 to-slate-950/10"
          />

          {/* Oversized translucent word overlay */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-2 select-none text-center font-bold tracking-tight text-white/25"
            style={{
              fontSize: "clamp(96px, 18vw, 280px)",
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
            }}
          >
            {slide.overlay}
          </span>

          {/* Caption bottom-left */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-8">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-200">
                {slide.eyebrow}
              </p>
              <h2 className="mt-1 line-clamp-2 text-xl font-bold leading-tight text-white md:text-2xl">
                {slide.title}
              </h2>
              <p className="mt-1 line-clamp-2 text-xs text-white/85 md:text-sm">
                {slide.body}
              </p>
              <Link
                to={slide.to}
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
              >
                {slide.cta}
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>

            {slides.length > 1 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm transition hover:bg-white"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm transition hover:bg-white"
                >
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

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
                className="group flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${h.iconTint}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-700">
                    {h.tag}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-base font-bold tracking-tight text-slate-900">
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
    className="rounded-2xl border border-slate-200 bg-white p-6 md:p-10"
  >
    <div className="mb-6 flex items-end justify-between gap-6 md:mb-10">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700">
          Your week
        </p>
        <h2
          id="glance-heading"
          className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl"
        >
          Ultimate Student at a glance
        </h2>
      </div>
    </div>

    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <li key={s.key} className="border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                {s.label}
              </p>
              <Icon
                className="h-4 w-4 text-slate-300"
                aria-hidden="true"
              />
            </div>
            <Link
              to={s.to}
              className="group mt-3 inline-flex items-baseline gap-2"
            >
              <span className="text-5xl font-bold tracking-tight text-slate-900 group-hover:text-brand-700 md:text-6xl">
                {s.value}
              </span>
              <span className="text-xs font-semibold text-brand-700 group-hover:text-brand-800">
                →
              </span>
            </Link>
            <p className="mt-2 text-xs text-slate-500">{s.caption}</p>
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
      className="rounded-2xl border border-slate-200 bg-white"
    >
      <header className="flex items-end justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700">
            Updates
          </p>
          <h2
            id="ann-heading"
            className="mt-0.5 text-xl font-bold tracking-tight text-slate-900"
          >
            Announcements
          </h2>
        </div>
        <Link
          to="/announcements"
          className="text-xs font-semibold text-brand-700 hover:text-brand-800"
        >
          See all →
        </Link>
      </header>

      {items == null ? (
        <ul className="divide-y divide-slate-100">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="h-20 animate-pulse bg-slate-50/60" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-slate-500">
          Nothing to show yet.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.slice(0, 4).map((a) => {
            const unread = !isRead(a.id);
            return (
              <li key={a.id}>
                <Link
                  to={`/announcements/${a.id}`}
                  className="flex items-start gap-4 px-6 py-5 transition hover:bg-slate-50"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                      unread ? "bg-brand-600" : "bg-slate-300"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-bold tracking-tight text-slate-900">
                        {a.title}
                      </p>
                      <p className="shrink-0 text-[11px] uppercase tracking-wider text-slate-400">
                        {new Date(a.date).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    {a.source && (
                      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-amber-700">
                        {a.source}
                      </p>
                    )}
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
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
  const [featuredEvent, setFeaturedEvent] = useState<EventItem | null>(null);
  const [featuredOpp, setFeaturedOpp] = useState<SectionItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [events, anns, opps] = await Promise.all([
        dataService.getEventsThisWeek(),
        dataService.getAnnouncements(profile),
        dataService.getSection("opportunities"),
      ]);
      if (cancelled) return;
      setEventsCount(events.length);
      setAnnouncements(anns);
      setFeaturedEvent(events[0] ?? null);
      setFeaturedOpp(opps[0] ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const unreadAnnCount = useMemo(
    () => announcements.filter((a) => !isRead(a.id)).length,
    [announcements, isRead],
  );
  const latestAnn = useMemo(() => {
    const sorted = [...announcements].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return sorted[0] ?? null;
  }, [announcements]);

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
          <FeaturedHero
            event={featuredEvent}
            opportunity={featuredOpp}
            announcement={latestAnn}
          />
        </FadeIn>

        <FadeIn delay={0.1}>
          <HighlightCards campusEventsCount={eventsCount} />
        </FadeIn>

        <FadeIn delay={0.15}>
          <AtAGlance stats={stats} />
        </FadeIn>

        <FadeIn delay={0.2}>
          <AnnouncementsPanel />
        </FadeIn>

        <FadeIn delay={0.25}>
          <div className="grid gap-6 lg:grid-cols-2">
            <EventsBlock />
            <SavedBlock />
          </div>
        </FadeIn>
      </div>
    </div>
  );
};
