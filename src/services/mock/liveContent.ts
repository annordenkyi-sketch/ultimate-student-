import { inAudience, isLive, toAnnouncement, toCourse, toEvent, toPlace, toService } from "@/lib/cms";
import type {
  Announcement,
  CampusEvent,
  CampusPlace,
  ContentItem,
  Course,
  EventPayload,
  NewsPayload,
  PlacePayload,
  ServicePayload,
  TimetablePayload,
  UniversityService,
} from "../types";
import { PLACES, ROUTABLE } from "./campusData";
import { allItems } from "./cmsStore";
import { UNIVERSITY_SERVICES } from "./contentData";
import { CATALOGUE, VENUE_PLACES } from "./courseData";
import { mockSessionService } from "./sessionService";

// What students see right now (flow 10): published, not expired, not
// unpublished, and meant for them. Everything in the student app reads
// content through here, so Admin changes show up straight away.

/** The signed-in student's level and programme, for audience rules. Guests see "All students" only. */
const viewer = () => {
  const s = mockSessionService.restore();
  if (s.status !== "signedIn" || !s.account.academic) return null;
  return { level: s.account.academic.level, programmeId: s.account.academic.programmeId };
};

const visible = (at: Date, type: ContentItem["type"], respectAudience = true) => {
  const who = viewer();
  return allItems(at).filter((i) => i.type === type && isLive(i, at) && (!respectAudience || inAudience(i.live!.meta.audience, who)));
};

export const livePlaces = (at: Date): CampusPlace[] =>
  visible(at, "place", false).map((i) => toPlace(i.id, i.live!.payload as PlacePayload, PLACES.find((p) => p.id === i.id)));

const placeNamer = (at: Date) => {
  const places = livePlaces(at);
  return (id: string) => places.find((p) => p.id === id)?.name ?? null;
};

/** Places with a verified walking path: shipped ones as before, staff-added ones once their path is checked. */
export const isRoutable = (at: Date, id: string) => {
  const item = allItems(at).find((i) => i.id === id && i.type === "place");
  if (!item?.live) return false;
  return PLACES.some((p) => p.id === id) && !item.versions.some((v) => v.number > 1) ? ROUTABLE.has(id) : (item.live.payload as PlacePayload).pathChecked;
};

export const liveAnnouncements = (at: Date): Announcement[] =>
  visible(at, "news")
    .map((i) => toAnnouncement(i.id, i.live!.payload as NewsPayload, i.live!.meta, i.live!.publishedAt ?? i.updatedAt))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export const liveEvents = (at: Date): CampusEvent[] => {
  const name = placeNamer(at);
  return visible(at, "event").map((i) => toEvent(i.id, i.live!.payload as EventPayload, name));
};

export const liveServices = (at: Date): UniversityService[] => {
  const name = placeNamer(at);
  return visible(at, "service").map((i) => toService(i.id, i.live!.payload as ServicePayload, name, UNIVERSITY_SERVICES.find((s) => s.id === i.id)));
};

/** The course catalogue, with published timetable updates applied (new courses added). */
export const liveCatalogue = (at: Date): Course[] => {
  const updates = allItems(at)
    .filter((i) => i.type === "timetable" && isLive(i, at))
    .map((i) => toCourse(i.live!.payload as TimetablePayload, (venue) => VENUE_PLACES[venue] ?? null));
  const byCode = new Map(updates.map((c) => [c.code, c]));
  const merged = CATALOGUE.map((c) => {
    const u = byCode.get(c.code);
    return u ? { ...c, ...u, lecturer: u.lecturer ?? c.lecturer } : c;
  });
  return [...merged, ...updates.filter((u) => !CATALOGUE.some((c) => c.code === u.code))];
};
