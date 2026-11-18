import { eventFrom, inAudience, newsFrom, placeFrom, serviceFrom, titleOf } from "@/lib/cms";
import { storage } from "@/lib/storage";
import type {
  AdminUser,
  AuditAction,
  AuditEntry,
  ContentItem,
  ContentMeta,
  ContentPayload,
  ContentType,
  ContentVersion,
  NewsPayload,
  NotificationDraft,
  EventPayload,
} from "../types";
import { PLACES, ROUTABLE } from "./campusData";
import { mockClockService } from "./clockService";
import { UNIVERSITY_SERVICES, announcementsAt, eventsAt } from "./contentData";
import { db } from "./db";
import { mockNotificationService } from "./notificationService";
import { timetableFor } from "./timetableService";

// The one content store shared by Admin (flow 10) and the student app.
// Content that ships with the app appears as published items; only items
// staff create or change are stored. Publishing here changes what students see.

const ITEMS_KEY = "us.v9.cms";
const AUDIT_KEY = "us.v9.audit";
const USERS_KEY = "us.v9.adminUsers";
const SEEDED_KEY = "us.v9.cmsSeeded";

export const SYSTEM = "system";
export const ADMIN_PASSWORD = "Password1";

const SEED_USERS: AdminUser[] = [
  { id: "adm-super", name: "Efua Asante", email: "super@ug.edu.gh", role: "super-admin" },
  { id: "adm-editor", name: "Kwame Boateng", email: "editor@ug.edu.gh", role: "editor" },
  { id: "adm-reviewer", name: "Abena Sarpong", email: "reviewer@ug.edu.gh", role: "reviewer" },
  { id: "adm-staff", name: "Yaw Ofori", email: "staff@ug.edu.gh", role: null },
];

export const readUsers = (): AdminUser[] => storage.get<AdminUser[] | null>(USERS_KEY, null) ?? SEED_USERS;
export const writeUsers = (users: AdminUser[]) => storage.set(USERS_KEY, users);
export const userName = (id: string) => (id === SYSTEM ? "University content team" : (readUsers().find((u) => u.id === id)?.name ?? "Staff"));

const now = () => mockClockService.now();
const iso = (offsetHours: number) => new Date(now().getTime() + offsetHours * 3_600_000).toISOString();

// ── Versions ──────────────────────────────────────────────────────────

export const newVersion = (number: number, payload: ContentPayload, meta: ContentMeta, createdBy: string, status: ContentVersion["status"], at = iso(0)): ContentVersion => ({
  number,
  payload,
  meta,
  status,
  createdBy,
  createdAt: at,
  submittedAt: null,
  reviewedBy: null,
  reviewedAt: null,
  comment: null,
  publishedAt: status === "published" ? at : null,
});

/** Keep the item's version list in step with its live and working versions. */
export const withVersion = (item: ContentItem, v: ContentVersion): ContentItem => ({
  ...item,
  versions: item.versions.some((x) => x.number === v.number) ? item.versions.map((x) => (x.number === v.number ? v : x)) : [...item.versions, v],
});

const published = (id: string, type: ContentType, payload: ContentPayload, meta: ContentMeta, at: string): ContentItem => {
  const v = newVersion(1, payload, meta, SYSTEM, "published", at);
  return { id, type, live: v, working: null, publishAt: null, expiresAt: null, unpublished: false, versions: [v], createdBy: SYSTEM, updatedAt: at };
};

// ── Content that ships with the app ───────────────────────────────────

const ALL = { kind: "all" } as const;
const baseItems = (at: Date): ContentItem[] => [
  ...announcementsAt(at).map((a) => published(a.id, "news", newsFrom(a), { source: a.source, audience: ALL, notify: false }, a.publishedAt)),
  ...eventsAt(at).map((e) => published(e.id, "event", eventFrom(e), { source: e.organiser, audience: ALL, notify: false }, iso(-72))),
  ...UNIVERSITY_SERVICES.map((s) => published(s.id, "service", serviceFrom(s), { source: s.location === "Online" ? "University of Ghana" : s.location, audience: ALL, notify: false }, iso(-24 * 30))),
  ...PLACES.map((p) => published(p.id, "place", placeFrom(p, ROUTABLE.has(p.id)), { source: "Physical Development and Municipal Services", audience: ALL, notify: false }, iso(-24 * 60))),
];

// ── Storage ───────────────────────────────────────────────────────────

const readStored = (): Record<string, ContentItem> => storage.get<Record<string, ContentItem>>(ITEMS_KEY, {});
const writeStored = (items: Record<string, ContentItem>) => storage.set(ITEMS_KEY, items);

export const saveItem = (item: ContentItem) => {
  const all = readStored();
  all[item.id] = { ...item, updatedAt: iso(0) };
  writeStored(all);
  return all[item.id]!;
};

export const removeItem = (id: string) => {
  const all = readStored();
  delete all[id];
  writeStored(all);
};

export const audit = (actorId: string, action: AuditAction, item: { id: string; title: string } | null, detail: string, at = iso(0)) => {
  const entries = storage.get<AuditEntry[]>(AUDIT_KEY, []);
  entries.unshift({ id: `a-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, at, actor: userName(actorId), action, itemId: item?.id ?? null, itemTitle: item?.title ?? "", detail });
  storage.set(AUDIT_KEY, entries.slice(0, 300));
};

export const readAudit = (): AuditEntry[] => storage.get<AuditEntry[]>(AUDIT_KEY, []);

// ── Publishing ────────────────────────────────────────────────────────

/** Make the approved working version live. The previous live version is kept in history. */
export const promote = (item: ContentItem, at: string): ContentItem => {
  const w = item.working;
  if (!w) return item;
  let next: ContentItem = item;
  if (item.live) next = withVersion(next, { ...item.live, status: "superseded" });
  const live: ContentVersion = { ...w, status: "published", publishedAt: at };
  next = withVersion({ ...next, live, working: null, publishAt: null, unpublished: false }, live);
  return next;
};

const NOTIFY_CATEGORY = { news: "news", event: "events", timetable: "lectures" } as const;

/** Linked notifications for students in the audience, when the editor chose to notify. */
export const notifyPublished = async (item: ContentItem): Promise<number> => {
  const v = item.live;
  if (!v || !v.meta.notify || !(item.type in NOTIFY_CATEGORY)) return 0;
  const title = titleOf(item.type, v.payload);
  let draft: NotificationDraft;
  let courseCode: string | null = null;
  if (item.type === "news") {
    draft = { category: "news", type: "update", title: `New from ${v.meta.source}`, body: title, target: { kind: "announcement", id: item.id } };
  } else if (item.type === "event") {
    const e = v.payload as EventPayload;
    draft = { category: "events", type: "update", title: `New event: ${e.title}`, body: `${e.date} at ${e.start}${e.venue ? `, ${e.venue}` : ""}.`, target: { kind: "event", id: item.id } };
  } else {
    const t = v.payload as unknown as { courseCode: string; courseTitle: string };
    courseCode = t.courseCode.trim();
    draft = { category: "lectures", type: "update", title: `${courseCode} timetable updated`, body: `${t.courseTitle}: check the new times and venues.`, target: { kind: "lecture", id: `${courseCode.replace(/\s+/g, "")}-1` } };
  }

  let sent = 0;
  for (const account of db.all()) {
    if (account.verification !== "verified") continue;
    const viewer = account.academic ? { level: account.academic.level, programmeId: account.academic.programmeId } : null;
    if (!inAudience(v.meta.audience, viewer)) continue;
    // Timetable changes only go to students taking the course.
    if (courseCode && !timetableFor(account.id)?.courses.some((c) => c.code === courseCode)) continue;
    const { notification } = await mockNotificationService.deliver(account.id, draft);
    if (notification) sent++;
  }
  if (item.type !== "timetable" && v.meta.audience.kind === "all") await mockNotificationService.deliver("guest", draft);
  return sent;
};

/** Scheduled items whose time has come go live (checked whenever content is read). */
const settle = (at: Date) => {
  const all = readStored();
  let changed = false;
  for (const item of Object.values(all)) {
    if (item.working?.status === "approved" && item.publishAt && new Date(item.publishAt) <= at) {
      const next = promote(item, item.publishAt);
      all[item.id] = next;
      changed = true;
      audit(SYSTEM, "publish", { id: item.id, title: titleOf(item.type, next.live!.payload) }, "Published on schedule");
      void notifyPublished(next);
    }
  }
  if (changed) writeStored(all);
};

// ── Sample workflow, so every state can be shown ──────────────────────

const ensureSeeded = (at: Date) => {
  if (storage.get(SEEDED_KEY, false)) return;
  storage.set(SEEDED_KEY, true);
  const day = (offsetDays: number, time: string) => {
    const d = new Date(at);
    d.setDate(d.getDate() + offsetDays);
    const pad = (n: number) => String(n).padStart(2, "0");
    return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time };
  };
  const meta = (source: string, notify = false): ContentMeta => ({ source, audience: { kind: "all" }, notify });
  const items: ContentItem[] = [];
  const add = (item: ContentItem) => items.push(item);

  // Draft (editor).
  const draftNews: NewsPayload = { title: "Library opens on Sunday afternoons", summary: "From next month, reading rooms open 13:00–18:00 on Sundays.", body: "The Balme Library will open its ground-floor reading rooms on Sunday afternoons.\n\nBorrowing and printing are not available on Sundays.", category: "Services", link: "", attachmentName: "" };
  let v = newVersion(1, draftNews, meta("Balme Library"), "adm-editor", "draft", iso(-5));
  add({ id: "news-library-sundays", type: "news", live: null, working: v, publishAt: null, expiresAt: null, unpublished: false, versions: [v], createdBy: "adm-editor", updatedAt: iso(-5) });

  // In review (editor submitted).
  const reviewNews: NewsPayload = { title: "Add and drop period extended", summary: "You can add or drop courses until Friday.", body: "The add and drop period for this semester has been extended to Friday at 17:00.\n\nMake changes on the student portal. Speak to your academic adviser if you're unsure.", category: "Academic", link: "https://www.ug.edu.gh", attachmentName: "" };
  v = { ...newVersion(1, reviewNews, meta("Registrar's Office", true), "adm-editor", "in-review", iso(-6)), submittedAt: iso(-3) };
  add({ id: "news-add-drop", type: "news", live: null, working: v, publishAt: null, expiresAt: null, unpublished: false, versions: [v], createdBy: "adm-editor", updatedAt: iso(-3) });

  // Returned for correction.
  const hack = day(9, "09:00");
  const returnedEvent: EventPayload = { title: "Campus hackathon", description: "Build an app that makes campus life easier. Teams of up to four.", category: "Tech", date: hack.date, start: "09:00", end: "17:00", placeId: "", venue: "", organiser: "Computer Science Students' Association", registration: true, capacity: "" };
  v = { ...newVersion(1, returnedEvent, meta("Department of Computer Science"), "adm-editor", "returned", iso(-30)), submittedAt: iso(-28), reviewedBy: "adm-reviewer", reviewedAt: iso(-20), comment: "Please add the venue and a capacity. Also check the date doesn't clash with mid-semester exams." };
  add({ id: "event-hackathon", type: "event", live: null, working: v, publishAt: null, expiresAt: null, unpublished: false, versions: [v], createdBy: "adm-editor", updatedAt: iso(-20) });

  // Approved and scheduled.
  const debate = day(5, "16:00");
  const scheduledEvent: EventPayload = { title: "Inter-faculty debate final", description: "Law takes on Social Sciences in this year's debate final. Free entry.", category: "Culture", date: debate.date, start: "16:00", end: "18:00", placeId: "great-hall", venue: "Great Hall", organiser: "Students' Representative Council", registration: false, capacity: "" };
  v = { ...newVersion(1, scheduledEvent, meta("Students' Representative Council", true), "adm-editor", "approved", iso(-50)), submittedAt: iso(-48), reviewedBy: "adm-reviewer", reviewedAt: iso(-26) };
  const publishOn = day(2, "09:00");
  add({ id: "event-debate-final", type: "event", live: null, working: v, publishAt: new Date(`${publishOn.date}T09:00:00`).toISOString(), expiresAt: null, unpublished: false, versions: [v], createdBy: "adm-editor", updatedAt: iso(-26) });

  // Published, now expired.
  const expiredNews: NewsPayload = { title: "Freshers' week programme", summary: "Talks, tours and the welcome durbar.", body: "Here's everything happening during freshers' week.", category: "Campus life", link: "", attachmentName: "" };
  v = newVersion(1, expiredNews, meta("Students' Representative Council"), "adm-editor", "published", iso(-24 * 40));
  add({ id: "news-freshers-week", type: "news", live: v, working: null, publishAt: null, expiresAt: iso(-24), unpublished: false, versions: [v], createdBy: "adm-editor", updatedAt: iso(-24) });

  // Published, with a correction waiting for review (the live version stays up).
  const base = baseItems(at).find((i) => i.id === "library-hours")!;
  const corrected: NewsPayload = { ...(base.live!.payload as NewsPayload), summary: "Open until 23:00 on weekdays during the examination period.", body: `${(base.live!.payload as NewsPayload).body}\n\nOn weekdays the library now stays open until 23:00.` };
  const correction = { ...newVersion(2, corrected, base.live!.meta, "adm-editor", "in-review", iso(-2)), submittedAt: iso(-1) };
  add(withVersion({ ...base, working: correction }, correction));

  const all = readStored();
  for (const item of items) all[item.id] = item;
  writeStored(all);

  // Matching audit trail, oldest first.
  const log: [string, AuditAction, string, string, string, number][] = [
    ["adm-editor", "create", "news-freshers-week", "Freshers' week programme", "Created draft", -24 * 41],
    ["adm-super", "publish", "news-freshers-week", "Freshers' week programme", "Published, expires after freshers' week", -24 * 40],
    ["adm-editor", "submit", "event-debate-final", "Inter-faculty debate final", "Submitted for review", -48],
    ["adm-editor", "submit", "event-hackathon", "Campus hackathon", "Submitted for review", -28],
    ["adm-reviewer", "approve", "event-debate-final", "Inter-faculty debate final", "Approved", -26],
    ["adm-reviewer", "schedule", "event-debate-final", "Inter-faculty debate final", `Scheduled for ${new Date(`${publishOn.date}T09:00:00`).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, -26],
    ["adm-reviewer", "return", "event-hackathon", "Campus hackathon", "Returned: Please add the venue and a capacity. Also check the date doesn't clash with mid-semester exams.", -20],
    ["adm-editor", "create", "news-library-sundays", "Library opens on Sunday afternoons", "Created draft", -5],
    ["adm-editor", "submit", "news-add-drop", "Add and drop period extended", "Submitted for review", -3],
    ["adm-editor", "submit", "library-hours", "Library opening hours extended for exams", "Submitted correction (version 2)", -1],
  ];
  for (const [actor, action, id, title, detail, h] of log) audit(actor, action, { id, title }, detail, iso(h));
};

/** Every content item: shipped content plus staff changes, with schedules settled. */
export const allItems = (at = now()): ContentItem[] => {
  ensureSeeded(at);
  settle(at);
  const stored = readStored();
  const base = baseItems(at).filter((i) => !stored[i.id]);
  return [...Object.values(stored), ...base];
};

export const findItem = (id: string, at = now()) => allItems(at).find((i) => i.id === id) ?? null;
