import { isOpenNow } from "@/lib/hours";
import type {
  AnnouncementCategory,
  EventCategory,
  PlaceCategory,
  SearchService,
  SearchType,
  ServiceCategory,
} from "../types";
import { PLACES } from "./campusData";
import { mockClockService } from "./clockService";
import { UNIVERSITY_SERVICES, announcementsAt, eventsAt } from "./contentData";
import { wait } from "./db";

const CATEGORIES: Record<SearchType, string[]> = {
  place: ["Food", "Lecture halls", "Libraries", "Offices", "ATMs", "Health", "Hostels", "Sports"] satisfies PlaceCategory[],
  event: ["Careers", "Tech", "Sports", "Wellbeing", "Culture"] satisfies EventCategory[],
  service: ["Study and IT", "Health", "Money"] satisfies ServiceCategory[],
  announcement: ["Academic", "Campus life", "Finance", "Services"] satisfies AnnouncementCategory[],
};

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const words = (text: string) => text.toLowerCase().split(/\s+/).filter(Boolean);

/** Every word of the query appears somewhere in the item's text. */
const matches = (query: string[], ...fields: (string | null | undefined)[]) => {
  if (!query.length) return true;
  const hay = fields.filter(Boolean).join(" ").toLowerCase();
  return query.every((w) => hay.includes(w));
};

/** Title matches first, then everything else in its original order. */
const titleFirst = <T,>(items: T[], title: (t: T) => string, query: string[]) =>
  query.length
    ? [...items].sort((a, b) => Number(matches(query, title(b))) - Number(matches(query, title(a))))
    : items;

export const mockSearchService: SearchService = {
  categories: (type) => CATEGORIES[type],

  async query({ text, type, category, openNow, date }) {
    await wait(350);
    const now = mockClockService.now();
    const q = words(text);
    const want = (t: SearchType) => type === "all" || type === t;
    const inCategory = (t: SearchType, c: string) => type !== t || !category || c === category;
    const weekEnd = now.getTime() + 7 * 86_400_000;

    const places = want("place")
      ? PLACES.filter(
          (p) =>
            inCategory("place", p.category) &&
            (!openNow || isOpenNow(p.periods, now)) &&
            matches(q, p.name, p.category, p.summary, ...p.description),
        )
      : [];

    const services = want("service")
      ? UNIVERSITY_SERVICES.filter(
          (s) =>
            inCategory("service", s.category) &&
            (!openNow || isOpenNow(s.periods, now)) &&
            matches(q, s.name, s.shortName, s.category, s.summary, s.location, ...s.description),
        )
      : [];

    // "Open now" only applies to things with opening hours.
    const events =
      want("event") && !openNow
        ? eventsAt(now)
            .filter((e) => {
              const start = new Date(e.startsAt);
              if (new Date(e.endsAt) < now) return false;
              if (date === "today" && !isSameDay(start, now)) return false;
              if (date === "week" && start.getTime() > weekEnd) return false;
              return inCategory("event", e.category) && matches(q, e.title, e.category, e.venue, e.organiser, ...e.description);
            })
            .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        : [];

    const announcements =
      want("announcement") && !openNow && date === "any"
        ? announcementsAt(now).filter(
            (a) => inCategory("announcement", a.category) && matches(q, a.title, a.source, a.category, a.summary, ...a.body),
          )
        : [];

    return {
      places: titleFirst(places, (p) => p.name, q),
      events: titleFirst(events, (e) => e.title, q),
      services: titleFirst(services, (s) => s.name, q),
      announcements: titleFirst(announcements, (a) => a.title, q),
    };
  },
};
