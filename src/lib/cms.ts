import type {
  Announcement,
  Audience,
  CampusEvent,
  CampusPlace,
  ContentItem,
  ContentMeta,
  ContentPayload,
  ContentType,
  Course,
  DisplayStatus,
  EventPayload,
  HoursRow,
  NewsPayload,
  OpeningPeriod,
  PlacePayload,
  ServiceIcon,
  ServicePayload,
  TimetablePayload,
  UniversityService,
} from "@/services";

// Pure helpers for admin content (flow 10), shared by the admin screens and
// the services that publish into the student app.

export const TYPE_LABEL: Record<ContentType, string> = {
  news: "News",
  event: "Event",
  service: "Service",
  place: "Place",
  timetable: "Timetable",
};

export const STATUS_LABEL: Record<DisplayStatus, string> = {
  draft: "Draft",
  "in-review": "In review",
  returned: "Returned",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  expired: "Expired",
  unpublished: "Unpublished",
};

// ── Opening hours ─────────────────────────────────────────────────────

const DAY_SETS: Record<HoursRow["days"], { label: string; days: number[] }> = {
  weekdays: { label: "Monday to Friday", days: [1, 2, 3, 4, 5] },
  "mon-sat": { label: "Monday to Saturday", days: [1, 2, 3, 4, 5, 6] },
  "every-day": { label: "Every day", days: [0, 1, 2, 3, 4, 5, 6] },
  sat: { label: "Saturday", days: [6] },
  sun: { label: "Sunday", days: [0] },
};

export const DAY_SET_OPTIONS = Object.entries(DAY_SETS).map(([id, v]) => ({ id: id as HoursRow["days"], label: v.label }));

export const rowsToHours = (rows: HoursRow[]) =>
  rows.map((r) => ({
    days: DAY_SETS[r.days].label,
    time: r.closed ? "Closed" : r.open === "00:00" && r.close === "24:00" ? "Open 24 hours" : `${r.open}–${r.close}`,
  }));

export const rowsToPeriods = (rows: HoursRow[]): OpeningPeriod[] | null => {
  const open = rows.filter((r) => !r.closed && r.open && r.close);
  return open.length ? open.map((r) => ({ days: DAY_SETS[r.days].days, open: r.open, close: r.close })) : null;
};

export const periodsToRows = (periods: OpeningPeriod[] | null): HoursRow[] =>
  (periods ?? []).map((p) => {
    const key = (Object.keys(DAY_SETS) as HoursRow["days"][]).find(
      (k) => DAY_SETS[k].days.length === p.days.length && DAY_SETS[k].days.every((d) => p.days.includes(d)),
    );
    return { days: key ?? "weekdays", open: p.open, close: p.close, closed: false };
  });

// ── Payload ⇄ student-facing content ──────────────────────────────────

const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

const pad = (n: number) => String(n).padStart(2, "0");
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
/** ISO time from a form's date and time. Empty while the date or time is incomplete. */
const at = (date: string, time: string) => {
  const d = new Date(`${date}T${time || "00:00"}:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
};

export const newsFrom = (a: Announcement): NewsPayload => ({
  title: a.title,
  summary: a.summary,
  body: a.body.join("\n\n"),
  category: a.category,
  link: a.link ?? "",
  attachmentName: a.attachmentName ?? "",
});

export const toAnnouncement = (id: string, p: NewsPayload, meta: ContentMeta, publishedAt: string): Announcement => ({
  id,
  title: p.title,
  source: meta.source,
  category: p.category,
  publishedAt,
  summary: p.summary,
  body: paragraphs(p.body),
  link: p.link || null,
  attachmentName: p.attachmentName || null,
});

export const eventFrom = (e: CampusEvent): EventPayload => {
  const start = new Date(e.startsAt);
  return {
    title: e.title,
    description: e.description.join("\n\n"),
    category: e.category,
    date: localDate(start),
    start: localTime(start),
    end: localTime(new Date(e.endsAt)),
    placeId: e.placeId ?? "",
    venue: e.venue,
    organiser: e.organiser,
    registration: e.registration === "required",
    capacity: e.capacity ? String(e.capacity) : "",
  };
};

export const toEvent = (id: string, p: EventPayload, placeName: (id: string) => string | null): CampusEvent => ({
  id,
  title: p.title,
  category: p.category,
  startsAt: at(p.date, p.start),
  endsAt: at(p.date, p.end),
  venue: p.venue || (p.placeId ? (placeName(p.placeId) ?? "") : ""),
  placeId: p.placeId || null,
  organiser: p.organiser,
  description: paragraphs(p.description),
  registration: p.registration ? "required" : "none",
  capacity: p.registration && p.capacity ? Number(p.capacity) : null,
});

const ICON_FOR: Record<ServicePayload["category"], ServiceIcon> = { "Study and IT": "portal", Health: "health", Money: "fees" };

export const serviceFrom = (s: UniversityService): ServicePayload => ({
  name: s.name,
  shortName: s.shortName,
  category: s.category,
  summary: s.summary,
  description: s.description.join("\n\n"),
  hours: periodsToRows(s.periods),
  phone: s.phone ?? "",
  email: s.email ?? "",
  placeId: s.placeId ?? "",
  website: s.website ?? "",
});

export const toService = (
  id: string,
  p: ServicePayload,
  placeName: (id: string) => string | null,
  base?: UniversityService,
): UniversityService => ({
  id,
  name: p.name,
  category: p.category,
  shortName: p.shortName || p.name,
  icon: base?.icon ?? ICON_FOR[p.category],
  summary: p.summary,
  description: paragraphs(p.description),
  hours: p.hours.length ? rowsToHours(p.hours) : [{ days: "Online", time: "Available any time" }],
  periods: rowsToPeriods(p.hours),
  phone: p.phone || null,
  email: p.email || null,
  location: p.placeId ? (placeName(p.placeId) ?? "On campus") : "Online",
  placeId: p.placeId || null,
  website: p.website || null,
});

export const placeFrom = (pl: CampusPlace, routable: boolean): PlacePayload => ({
  name: pl.name,
  category: pl.category,
  summary: pl.summary,
  description: pl.description.join("\n\n"),
  photo: pl.photoUrl ?? "",
  hours: periodsToRows(pl.periods),
  lat: pl.lat,
  lng: pl.lng,
  entrances: [pl.entrance, ...(pl.otherEntrances ?? [])],
  pathChecked: routable,
});

export const toPlace = (id: string, p: PlacePayload, base?: CampusPlace): CampusPlace => {
  const [first, ...rest] = p.entrances;
  return {
    id,
    name: p.name,
    category: p.category,
    summary: p.summary,
    description: paragraphs(p.description),
    lat: p.lat ?? 0,
    lng: p.lng ?? 0,
    entrance: first ?? { lat: p.lat ?? 0, lng: p.lng ?? 0, label: "Main entrance" },
    otherEntrances: rest,
    hours: p.hours.length ? rowsToHours(p.hours) : (base?.hours ?? []),
    periods: p.hours.length ? rowsToPeriods(p.hours) : (base?.periods ?? null),
    phone: base?.phone ?? null,
    email: base?.email ?? null,
    website: base?.website ?? null,
    photoId: p.photo ? null : (base?.photoId ?? null),
    photoUrl: p.photo || null,
  };
};

export const toCourse = (p: TimetablePayload, venuePlace: (venue: string) => string | null): Course => ({
  code: p.courseCode.trim(),
  title: p.courseTitle.trim(),
  credits: Number(p.credits) || 0,
  lecturer: p.sessions.find((s) => s.lecturer)?.lecturer,
  sessions: p.sessions.map((s, i) => ({
    id: `${p.courseCode.replace(/\s+/g, "")}-${i + 1}`,
    kind: s.kind,
    day: s.day || null,
    start: s.start || null,
    end: s.end || null,
    venue: s.venue || null,
    placeId: s.venue ? venuePlace(s.venue) : null,
    source: "official",
  })),
});

// ── Status, titles, audience ──────────────────────────────────────────

export const titleOf = (type: ContentType, p: ContentPayload): string => {
  if (type === "timetable") {
    const t = p as TimetablePayload;
    return [t.courseCode, t.courseTitle].filter(Boolean).join(" · ") || "Untitled timetable";
  }
  const named = p as { title?: string; name?: string };
  return named.title || named.name || "Untitled";
};

export const itemTitle = (item: ContentItem) => {
  const v = item.working ?? item.live ?? item.versions[item.versions.length - 1];
  return v ? titleOf(item.type, v.payload) : "Untitled";
};

export const isExpired = (item: ContentItem, now: Date) => Boolean(item.expiresAt && new Date(item.expiresAt) <= now);

/** One status for lists: what's happening to the item now. */
export const displayStatus = (item: ContentItem, now: Date): DisplayStatus => {
  const w = item.working;
  if (w) {
    if (w.status === "approved") return item.publishAt ? "scheduled" : "approved";
    if (w.status === "in-review" || w.status === "returned" || w.status === "draft") {
      // A correction to something already live is shown by its own status.
      return w.status;
    }
  }
  if (!item.live) return "draft";
  if (item.unpublished) return "unpublished";
  return isExpired(item, now) ? "expired" : "published";
};

/** Students can currently see this item. */
export const isLive = (item: ContentItem, now: Date) => Boolean(item.live) && !item.unpublished && !isExpired(item, now);

export const expiresLabel = (item: ContentItem, now: Date): string | null => {
  if (!item.expiresAt) return null;
  const end = new Date(item.expiresAt);
  if (end <= now) return "Expired";
  // Calendar days, so an item expiring at the end of Friday says "in 3 days" on Tuesday.
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(end) - day(now)) / 86_400_000);
  return days === 0 ? "Expires today" : days === 1 ? "Expires tomorrow" : `Expires in ${days} days`;
};

export const audienceLabel = (a: Audience, programmeName: (id: string) => string = (id) => id) =>
  a.kind === "all" ? "All students" : a.kind === "levels" ? a.levels.join(", ") || "No levels chosen" : a.programmeIds.map(programmeName).join(", ") || "No programmes chosen";

/** Can this student see content for this audience? Guests only see "All students". */
export const inAudience = (a: Audience, viewer: { level?: string; programmeId?: string } | null) => {
  if (a.kind === "all") return true;
  if (!viewer) return false;
  return a.kind === "levels" ? Boolean(viewer.level && a.levels.includes(viewer.level)) : Boolean(viewer.programmeId && a.programmeIds.includes(viewer.programmeId));
};

// ── Required fields ───────────────────────────────────────────────────

export interface CheckItem {
  field: string;
  label: string;
  ok: boolean;
}

const filled = (v: string | null | undefined) => Boolean(v && v.trim());
const TIME = /^\d{2}:\d{2}$/;

/** What must be complete before an item can be submitted for review. */
export const checklist = (type: ContentType, p: ContentPayload, meta: ContentMeta): CheckItem[] => {
  const items: CheckItem[] = [];
  const add = (field: string, label: string, ok: boolean) => items.push({ field, label, ok });

  if (type === "news") {
    const n = p as NewsPayload;
    add("title", "Title", filled(n.title));
    add("summary", "Short summary", filled(n.summary));
    add("body", "Body text", filled(n.body));
    add("link", "Link starts with https:// (if given)", !n.link || /^https?:\/\//.test(n.link));
  } else if (type === "event") {
    const e = p as EventPayload;
    add("title", "Title", filled(e.title));
    add("description", "Description", filled(e.description));
    add("date", "Date", /^\d{4}-\d{2}-\d{2}$/.test(e.date));
    add("start", "Start and end time, end after start", TIME.test(e.start) && TIME.test(e.end) && e.end > e.start);
    add("venue", "Venue (a place, or a venue name)", filled(e.placeId) || filled(e.venue));
    add("organiser", "Organiser", filled(e.organiser));
    add("capacity", "Capacity (when registration is on)", !e.registration || Number(e.capacity) > 0);
  } else if (type === "service") {
    const s = p as ServicePayload;
    add("name", "Name", filled(s.name));
    add("summary", "Short summary", filled(s.summary));
    add("description", "Description", filled(s.description));
    add("contact", "Phone or email", filled(s.phone) || filled(s.email));
    add("website", "Official link starts with https:// (if given)", !s.website || /^https?:\/\//.test(s.website));
  } else if (type === "place") {
    const pl = p as PlacePayload;
    add("name", "Name", filled(pl.name));
    add("summary", "Short summary", filled(pl.summary));
    add("location", "Location on the map", pl.lat !== null && pl.lng !== null);
    add("entrances", "At least one entrance", pl.entrances.length > 0);
    add("pathChecked", "Walking path checked", pl.pathChecked);
  } else {
    const t = p as TimetablePayload;
    add("semesterId", "Semester", filled(t.semesterId));
    add("courseCode", "Course code and title", filled(t.courseCode) && filled(t.courseTitle));
    add("credits", "Credits", Number(t.credits) > 0);
    add("sessions", "At least one complete session", t.sessions.some((s) => s.day && TIME.test(s.start) && TIME.test(s.end) && s.end > s.start));
    add("sourceDocument", "Official schedule source attached", filled(t.sourceDocument));
    add("sourceChecked", "Schedule checked against the source", t.sourceChecked);
  }
  add("source", "Content source", filled(meta.source));
  add("audience", "Audience", meta.audience.kind === "all" || (meta.audience.kind === "levels" ? meta.audience.levels.length > 0 : meta.audience.programmeIds.length > 0));
  if (meta.expiresOn && meta.publishOn) add("expiresOn", "Expiry on or after the publish date", meta.expiresOn >= meta.publishOn.slice(0, 10));
  return items;
};

// ── What changed between versions ─────────────────────────────────────

export interface FieldChange {
  field: string;
  before: string;
  after: string;
}

const show = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "(empty)";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length === 0 ? "(none)" : `${v.length} ${v.length === 1 ? "item" : "items"}: ${v.map((x) => (typeof x === "object" ? Object.values(x as object).filter((y) => typeof y !== "number").join(" ") : String(x))).join("; ")}`;
  if (typeof v === "object") return JSON.stringify(v);
  const text = String(v);
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
};

const FIELD_LABEL: Record<string, string> = {
  attachmentName: "Attachment",
  placeId: "Place",
  shortName: "Short name",
  pathChecked: "Walking path checked",
  sourceDocument: "Schedule source",
  sourceChecked: "Checked against source",
  courseCode: "Course code",
  courseTitle: "Course title",
  semesterId: "Semester",
  programmeId: "Programme",
  lat: "Latitude",
  lng: "Longitude",
};

const label = (k: string) => FIELD_LABEL[k] ?? k.charAt(0).toUpperCase() + k.slice(1);

export const diffVersions = (
  before: { payload: ContentPayload; meta: ContentMeta } | null,
  after: { payload: ContentPayload; meta: ContentMeta },
): FieldChange[] => {
  if (!before) return [];
  const changes: FieldChange[] = [];
  const a = before.payload as unknown as Record<string, unknown>;
  const b = after.payload as unknown as Record<string, unknown>;
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (JSON.stringify(a[k]) === JSON.stringify(b[k])) continue;
    const x = a[k];
    const y = b[k];
    if (typeof x === "string" && typeof y === "string") {
      // Long text: start both excerpts just before the first difference, so the change is visible.
      let p = 0;
      while (p < x.length && p < y.length && x[p] === y[p]) p++;
      const from = p > 60 ? x.lastIndexOf(" ", p - 30) + 1 : 0;
      const cut = (s: string) => (from > 0 ? `…${s.slice(from)}` : s);
      changes.push({ field: label(k), before: show(cut(x)), after: show(cut(y)) });
    } else changes.push({ field: label(k), before: show(x), after: show(y) });
  }
  if (before.meta.source !== after.meta.source) changes.push({ field: "Source", before: show(before.meta.source), after: show(after.meta.source) });
  if (JSON.stringify(before.meta.audience) !== JSON.stringify(after.meta.audience))
    changes.push({ field: "Audience", before: audienceLabel(before.meta.audience), after: audienceLabel(after.meta.audience) });
  return changes;
};

// ── Blank forms ───────────────────────────────────────────────────────

export const emptyPayload = (type: ContentType, defaults: { semesterId?: string } = {}): ContentPayload => {
  switch (type) {
    case "news":
      return { title: "", summary: "", body: "", category: "Academic", link: "", attachmentName: "" };
    case "event":
      return { title: "", description: "", category: "Careers", date: "", start: "", end: "", placeId: "", venue: "", organiser: "", registration: false, capacity: "" };
    case "service":
      return { name: "", shortName: "", category: "Study and IT", summary: "", description: "", hours: [{ days: "weekdays", open: "08:00", close: "17:00", closed: false }], phone: "", email: "", placeId: "", website: "" };
    case "place":
      return { name: "", category: "Offices", summary: "", description: "", photo: "", hours: [], lat: null, lng: null, entrances: [], pathChecked: false };
    case "timetable":
      return { semesterId: defaults.semesterId ?? "", programmeId: "", courseCode: "", courseTitle: "", credits: "3", sessions: [], sourceDocument: "", sourceChecked: false };
  }
};

export const emptyMeta = (): ContentMeta => ({ source: "", audience: { kind: "all" }, notify: false });
