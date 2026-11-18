import { openStatus } from "@/lib/hours";
import type { ContentService, Recommendation } from "../types";
import { mockClockService } from "./clockService";
import { liveAnnouncements, liveEvents, livePlaces, liveServices } from "./liveContent";
import { wait } from "./db";
import { mockTimetableService } from "./timetableService";

const now = () => mockClockService.now();

const WEEK_MS = 7 * 86_400_000;

/**
 * Students: venues from their own timetable first. Everyone: events in the
 * next seven days, then places and services that are open right now.
 */
const recommendationsFor = async (accountId: string | null): Promise<Recommendation[]> => {
  const at = now();
  const recs: Recommendation[] = [];

  if (accountId) {
    const timetable = await mockTimetableService.get(accountId);
    const seen = new Set<string>();
    for (const course of timetable?.courses ?? []) {
      for (const s of course.sessions) {
        const place = s.placeId ? livePlaces(at).find((p) => p.id === s.placeId) : undefined;
        if (!place || seen.has(place.id)) continue;
        seen.add(place.id);
        recs.push({ kind: "place", id: place.id, title: place.name, subtitle: place.category, reason: `Venue of ${course.code}` });
      }
    }
    recs.splice(3);
  }

  liveEvents(at)
    .filter((e) => new Date(e.endsAt) > at && new Date(e.startsAt).getTime() - at.getTime() < WEEK_MS)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 2)
    .forEach((e) => recs.push({ kind: "event", id: e.id, title: e.title, subtitle: e.venue, reason: "Coming up this week" }));

  const openPlaces = livePlaces(at).filter((p) => p.category === "Food" && openStatus(p.periods, at).state === "open");
  openPlaces.slice(0, 1).forEach((p) =>
    recs.push({ kind: "place", id: p.id, title: p.name, subtitle: p.category, reason: openStatus(p.periods, at).label }),
  );

  liveServices(at).filter((s) => s.periods && openStatus(s.periods, at).state === "open")
    .slice(0, 1)
    .forEach((s) => recs.push({ kind: "service", id: s.id, title: s.name, subtitle: s.category, reason: openStatus(s.periods, at).label }));

  return recs;
};

export const mockContentService: ContentService = {
  async announcements() {
    await wait(400);
    return liveAnnouncements(now());
  },
  async announcement(id) {
    await wait(300);
    return liveAnnouncements(now()).find((a) => a.id === id) ?? null;
  },
  async events() {
    await wait(400);
    return liveEvents(now()).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  },
  async event(id) {
    await wait(300);
    return liveEvents(now()).find((e) => e.id === id) ?? null;
  },
  async universityServices() {
    await wait(300);
    return liveServices(now());
  },
  async universityService(id) {
    await wait(300);
    return liveServices(now()).find((s) => s.id === id) ?? null;
  },
  async recommendations(accountId) {
    await wait(350);
    return recommendationsFor(accountId);
  },
};
