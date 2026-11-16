import type {
  Course,
  CourseSession,
  PortalConnection,
  SessionChange,
  SessionSnapshot,
  SyncChanges,
  SyncService,
  SyncSummary,
  Timetable,
} from "../types";
import { mockClockService } from "./clockService";
import { CATALOGUE, VENUE_PLACES, clone } from "./courseData";
import { wait } from "./db";
import { mockPortalService } from "./portalService";
import {
  readBaseline,
  readConnection,
  readPending,
  setSyncScenario,
  syncScenario,
  writeBaseline,
  writeConnection,
  writePending,
} from "./syncStore";
import {
  pruneLectureReminders,
  readReminderPrefs,
  timetableFor,
  writeReminderPrefs,
  writeTimetable,
} from "./timetableService";

const DEMO = "stu-ama";
const now = () => mockClockService.now();
const daysAgo = (d: number) => new Date(now().getTime() - d * 86_400_000).toISOString();

// ── Starting state ────────────────────────────────────────────────────

/** Official version of a course: the catalogue's sessions where we have them. */
const officialCopy = (c: Course): Course => {
  const listed = CATALOGUE.find((x) => x.code === c.code);
  return clone({
    ...c,
    origin: "synced",
    sessions: (listed?.sessions ?? c.sessions).map((s) => ({ ...s, source: "official" as const })),
  });
};

const connectionFor = (accountId: string): PortalConnection =>
  readConnection(accountId) ??
  (accountId === DEMO
    ? { status: "connected", connectedAt: daysAgo(70), lastSyncedAt: daysAgo(3) }
    : { status: "not-connected", connectedAt: null, lastSyncedAt: null });

const baselineFor = (accountId: string): Course[] => {
  const saved = readBaseline(accountId);
  if (saved) return saved;
  // Fall back to the synced courses as they are now.
  return (timetableFor(accountId)?.courses ?? []).filter((c) => c.origin === "synced").map(officialCopy);
};

// ── What the portal returns, per test case ─────────────────────────────

const snapshot = (s: CourseSession): SessionSnapshot => ({ day: s.day, start: s.start, end: s.end, venue: s.venue });
const placed = (s: CourseSession) => Boolean(s.day && s.start && s.end);

/** Courses the portal adds in the test cases, with times that fit around the demo week. */
const EXTRA_COURSES = (): Course[] => {
  const pick = (code: string, override?: Partial<CourseSession>) => {
    const c = clone(CATALOGUE.find((x) => x.code === code)!);
    if (override) c.sessions = [{ ...c.sessions[0]!, ...override }];
    return { ...c, origin: "synced" as const };
  };
  return [
    pick("CSCD 303"),
    pick("CSCD 307", { day: "wed", start: "10:30", end: "12:20", venue: "JQB 19", placeId: "jqb" }),
    pick("STAT 301"),
    pick("ECON 201"),
  ];
};

const portalRegistration = (baseline: Course[], timetable: Timetable | null, conflict: boolean): Course[] => {
  const portal = clone(baseline);
  const mine = timetable?.courses ?? [];

  // A venue change on the first course's first timetabled session.
  const venueTarget = portal.flatMap((c) => c.sessions).find(placed);
  if (venueTarget) {
    venueTarget.venue = venueTarget.venue === "N Block LT 2" ? "JQB 23" : "N Block LT 2";
    venueTarget.placeId = VENUE_PLACES[venueTarget.venue] ?? null;
  }

  // A time change, on a session the student set their own time for if there is one.
  const personalIds = new Set(mine.flatMap((c) => c.sessions).filter((s) => s.source === "personal").map((s) => s.id));
  const timeTarget =
    portal.flatMap((c) => c.sessions).find((s) => personalIds.has(s.id) && placed(s) && s !== venueTarget) ??
    portal.slice(1).flatMap((c) => c.sessions).find((s) => placed(s) && s !== venueTarget);
  if (timeTarget?.start && timeTarget.end) {
    const shift = (t: string) => `${String(Number(t.slice(0, 2)) + 1).padStart(2, "0")}${t.slice(2)}`;
    timeTarget.start = shift(timeTarget.start);
    timeTarget.end = shift(timeTarget.end);
  }

  // The last course not otherwise changed is dropped from the registration.
  const keep = new Set([venueTarget?.id, timeTarget?.id]);
  const removable = [...portal].reverse().find((c) => !c.sessions.some((s) => keep.has(s.id)));
  const withoutRemoved = portal.filter((c) => c !== removable);

  // Two newly registered courses.
  const present = new Set(mine.map((c) => c.code));
  const added = EXTRA_COURSES().filter((c) => !present.has(c.code)).slice(0, 2);
  if (conflict && added[0]) {
    // Make the first one overlap the student's first lecture of the week.
    const order = ["mon", "tue", "wed", "thu", "fri", "sat"];
    const first = mine
      .flatMap((c) => c.sessions)
      .filter(placed)
      .sort((a, b) => order.indexOf(a.day!) - order.indexOf(b.day!) || a.start!.localeCompare(b.start!))[0];
    if (first) added[0].sessions = [{ ...added[0].sessions[0]!, day: first.day, start: first.start, end: first.end }];
  }
  return [...withoutRemoved, ...added];
};

const diff = (baseline: Course[], portal: Course[], timetable: Timetable | null): Omit<SyncChanges, "checkedAt"> => {
  const before = new Map(baseline.map((c) => [c.code, c]));
  const after = new Map(portal.map((c) => [c.code, c]));
  const mineSessions = new Map((timetable?.courses ?? []).flatMap((c) => c.sessions).map((s) => [s.id, s]));

  const changed: SessionChange[] = [];
  for (const [code, next] of after) {
    const prev = before.get(code);
    if (!prev) continue;
    for (const s of next.sessions) {
      const old = prev.sessions.find((x) => x.id === s.id);
      if (!old) continue;
      const timeDiff = old.day !== s.day || old.start !== s.start || old.end !== s.end;
      const venueDiff = old.venue !== s.venue;
      if (!timeDiff && !venueDiff) continue;
      changed.push({
        courseCode: code,
        courseTitle: next.title,
        sessionId: s.id,
        kind: s.kind,
        what: timeDiff && venueDiff ? "time and venue" : timeDiff ? "time" : "venue",
        from: snapshot(old),
        to: snapshot(s),
        personal: mineSessions.get(s.id)?.source === "personal",
      });
    }
  }
  return {
    added: portal.filter((c) => !before.has(c.code)),
    removed: baseline.filter((c) => !after.has(c.code)),
    changed,
  };
};

// ── Service ───────────────────────────────────────────────────────────

export const mockSyncService: SyncService = {
  async connection(accountId) {
    await wait(200);
    return connectionFor(accountId);
  },

  async connect(accountId, studentId, password) {
    await mockPortalService.authorize(studentId, password);
    const prev = connectionFor(accountId);
    const next: PortalConnection = { status: "connected", connectedAt: now().toISOString(), lastSyncedAt: prev.lastSyncedAt };
    writeConnection(accountId, next);
    if (!readBaseline(accountId)) writeBaseline(accountId, baselineFor(accountId));
    // The portal authorises us again, so the "not authorised" test case is over.
    if (syncScenario() === "not-authorised") setSyncScenario("no-changes");
    return next;
  },

  async disconnect(accountId) {
    await wait(600);
    const next: PortalConnection = { ...connectionFor(accountId), status: "not-connected" };
    writeConnection(accountId, next);
    writePending(accountId, null);
    return next;
  },

  async check(accountId) {
    await wait(1400);
    const connection = connectionFor(accountId);
    const scenario = syncScenario();
    if (connection.status !== "connected") return { status: "not-authorised", connection };
    if (scenario === "not-authorised") {
      const expired: PortalConnection = { ...connection, status: "expired" };
      writeConnection(accountId, expired);
      return { status: "not-authorised", connection: expired };
    }
    if (scenario === "failed") return { status: "failed", lastSyncedAt: connection.lastSyncedAt };

    const timetable = timetableFor(accountId);
    const baseline = baselineFor(accountId);
    const portal = scenario === "no-changes" ? baseline : portalRegistration(baseline, timetable, scenario === "conflict");
    const found = diff(baseline, portal, timetable);
    if (!found.added.length && !found.removed.length && !found.changed.length) {
      const at = now().toISOString();
      writeConnection(accountId, { ...connection, lastSyncedAt: at });
      writePending(accountId, null);
      return { status: "up-to-date", lastSyncedAt: at };
    }
    return { status: "changes", changes: { ...found, checkedAt: now().toISOString() } };
  },

  async pending(accountId) {
    await wait(150);
    return readPending(accountId);
  },

  async keepPending(accountId, changes) {
    await wait(300);
    writePending(accountId, changes);
  },

  async apply(accountId, changes) {
    await wait(900);
    const timetable = timetableFor(accountId) ?? { semesterId: "2026-27-s1", courses: [], acknowledgedClashes: [] };
    let courses = clone(timetable.courses);
    let baseline = clone(baselineFor(accountId));
    const summary: SyncSummary = { added: 0, removed: 0, venuesChanged: 0, timesChanged: 0, keptPersonal: 0 };

    for (const c of changes.added) {
      baseline.push(officialCopy(c));
      if (courses.some((x) => x.code === c.code)) continue; // already added by hand: keep theirs
      courses.push({ ...clone(c), origin: "synced", sessions: c.sessions.map((s) => ({ ...s, source: "official" as const })) });
      summary.added++;
    }

    const removedCodes = new Set(changes.removed.map((c) => c.code));
    baseline = baseline.filter((c) => !removedCodes.has(c.code));
    const before = courses.length;
    // Courses the student added themselves stay.
    courses = courses.filter((c) => !(removedCodes.has(c.code) && c.origin !== "manual"));
    summary.removed = before - courses.length;

    for (const ch of changes.changed) {
      const official = baseline.flatMap((c) => c.sessions).find((s) => s.id === ch.sessionId);
      if (official) Object.assign(official, ch.to, { placeId: ch.to.venue ? (VENUE_PLACES[ch.to.venue] ?? null) : null });
      const mine = courses.flatMap((c) => c.sessions).find((s) => s.id === ch.sessionId);
      if (!mine) continue;
      if (mine.source === "personal") {
        summary.keptPersonal++;
        continue;
      }
      Object.assign(mine, ch.to, { placeId: ch.to.venue ? (VENUE_PLACES[ch.to.venue] ?? null) : null });
      if (ch.what !== "venue") summary.timesChanged++;
      if (ch.what !== "time") summary.venuesChanged++;
    }

    const next: Timetable = { ...timetable, courses };
    writeTimetable(accountId, next);
    writeBaseline(accountId, baseline);

    // Keep lecture reminders in step: new courses join, removed sessions go.
    const prefs = readReminderPrefs(accountId);
    if (prefs) {
      const codes = new Set(prefs.courseCodes.filter((c) => !removedCodes.has(c) || courses.some((x) => x.code === c)));
      changes.added.forEach((c) => codes.add(c.code));
      const days = new Set(prefs.days);
      changes.added.flatMap((c) => c.sessions).forEach((s) => s.day && days.add(s.day));
      writeReminderPrefs(accountId, { ...prefs, courseCodes: [...codes], days: [...days] });
    }
    pruneLectureReminders(accountId, new Set(courses.flatMap((c) => c.sessions.map((s) => s.id))));

    writeConnection(accountId, { ...connectionFor(accountId), lastSyncedAt: now().toISOString() });
    writePending(accountId, null);
    // The portal now matches what was applied.
    setSyncScenario("no-changes");
    return { timetable: next, summary };
  },
};
