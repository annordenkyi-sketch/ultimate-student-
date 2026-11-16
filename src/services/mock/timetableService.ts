import { storage } from "@/lib/storage";
import type { Course, LectureReminder, ReminderPrefs, Timetable, TimetableService } from "../types";
import { LECTURERS, session } from "./courseData";
import { wait } from "./db";
import { PREFS_KEY, TIMETABLE_KEY } from "./setupService";

const REMINDERS_KEY = "us.v4.lectureReminders";

type ByAccount<T> = Record<string, T>;

const course = (
  code: string,
  title: string,
  credits: number,
  sessions: Course["sessions"],
  origin: Course["origin"] = "synced",
): Course => ({
  code,
  title,
  credits,
  lecturer: LECTURERS[code],
  sessions,
  origin,
});

/**
 * Ama's sample week, synced from the portal. She added MATH 351 herself and
 * entered her own venue for CSCD 309 (the university hasn't published one). Thursday has three lectures: 10:30 (verified venue),
 * 13:30 (venue not on the map) and 16:30. Friday starts at 08:30.
 */
const AMA_TIMETABLE: Timetable = {
  semesterId: "2026-27-s1",
  courses: [
    course("CSCD 301", "Object Oriented Programming", 3, [
      session("CSCD 301", 1, "Lecture", "mon", "08:30", "10:20", "JQB 19", "Bring your laptop with the JDK installed."),
      session("CSCD 301", 2, "Tutorial", "thu", "10:30", "11:20", "JQB 19", "Tutorial on inheritance and interfaces. Attempt problem set 4 first."),
    ]),
    course("CSCD 305", "Computer Networks", 3, [
      session("CSCD 305", 1, "Lecture", "wed", "08:30", "10:20", "JQB 23"),
    ]),
    course("CSCD 309", "Operating Systems", 3, [
      { ...session("CSCD 309", 1, "Lecture", "thu", "13:30", "15:20", "Science LT 2", "Quiz on process scheduling in the first 15 minutes."), source: "personal" },
    ]),
    course("CSCD 313", "Artificial Intelligence", 3, [
      session("CSCD 313", 1, "Lecture", "thu", "16:30", "18:20", "CS Lab 1"),
    ]),
    course(
      "MATH 351",
      "Numerical Analysis",
      3,
      [{ ...session("MATH 351", 1, "Lecture", "tue", "13:30", "15:20", "Maths Room 2"), source: "personal" }],
      "manual",
    ),
    course("UGRC 220", "Introduction to African Studies", 3, [
      session("UGRC 220", 1, "Lecture", "fri", "08:30", "10:20", "Great Hall"),
    ]),
  ],
};

export const SEED: ByAccount<Timetable> = { "stu-ama": AMA_TIMETABLE };
const OTHER_SEMESTERS_KEY = "us.v7.otherSemesters";
const SEED_PREFS: ByAccount<{ reminders: ReminderPrefs | null }> = {
  "stu-ama": {
    reminders: {
      enabled: true,
      minutesBefore: 15,
      days: ["mon", "tue", "wed", "thu", "fri"],
      courseCodes: AMA_TIMETABLE.courses.map((c) => c.code),
    },
  },
};

export const timetableFor = (accountId: string): Timetable | null =>
  storage.get<ByAccount<Timetable>>(TIMETABLE_KEY, {})[accountId] ?? SEED[accountId] ?? null;

export const writeTimetable = (accountId: string, timetable: Timetable) => {
  const all = storage.get<ByAccount<Timetable>>(TIMETABLE_KEY, {});
  all[accountId] = timetable;
  storage.set(TIMETABLE_KEY, all);
};

type Prefs = { reminders: ReminderPrefs | null; goal?: string | null };

export const readReminderPrefs = (accountId: string): ReminderPrefs | null =>
  (storage.get<ByAccount<Prefs>>(PREFS_KEY, {})[accountId] ?? SEED_PREFS[accountId])?.reminders ?? null;

export const writeReminderPrefs = (accountId: string, reminders: ReminderPrefs) => {
  const all = storage.get<ByAccount<Prefs>>(PREFS_KEY, {});
  all[accountId] = { ...(all[accountId] ?? {}), reminders };
  storage.set(PREFS_KEY, all);
};

/** Removes per-lecture reminder settings for sessions that no longer exist. */
export const pruneLectureReminders = (accountId: string, keepSessionIds: Set<string>) => {
  const all = storage.get<ByAccount<Record<string, LectureReminder>>>(REMINDERS_KEY, {});
  const mine = all[accountId];
  if (!mine) return;
  all[accountId] = Object.fromEntries(Object.entries(mine).filter(([id]) => keepSessionIds.has(id)));
  storage.set(REMINDERS_KEY, all);
};

export const mockTimetableService: TimetableService = {
  async get(accountId) {
    await wait(350);
    return timetableFor(accountId);
  },

  async reminder(accountId, sessionId) {
    await wait(150);
    const override = storage.get<ByAccount<Record<string, LectureReminder>>>(REMINDERS_KEY, {})[accountId]?.[sessionId];
    if (override) return override;
    // Otherwise follow the semester reminder preferences from setup.
    const prefs =
      storage.get<ByAccount<{ reminders: ReminderPrefs | null }>>(PREFS_KEY, {})[accountId] ?? SEED_PREFS[accountId];
    const r = prefs?.reminders;
    const owner = timetableFor(accountId)?.courses.find((c) => c.sessions.some((s) => s.id === sessionId));
    const s = owner?.sessions.find((x) => x.id === sessionId);
    const applies = Boolean(r?.enabled && owner && s?.day && r.courseCodes.includes(owner.code) && r.days.includes(s.day));
    return { enabled: applies, minutesBefore: r?.minutesBefore ?? 15 };
  },

  async setReminder(accountId, sessionId, reminder) {
    await wait(300);
    const all = storage.get<ByAccount<Record<string, LectureReminder>>>(REMINDERS_KEY, {});
    all[accountId] = { ...(all[accountId] ?? {}), [sessionId]: reminder };
    storage.set(REMINDERS_KEY, all);
  },

  async saveCourses(accountId, courses, acknowledgedClashes) {
    await wait(500);
    const current = timetableFor(accountId);
    const next: Timetable = {
      semesterId: current?.semesterId ?? "2026-27-s1",
      courses,
      acknowledgedClashes: acknowledgedClashes ?? current?.acknowledgedClashes ?? [],
    };
    writeTimetable(accountId, next);
    return next;
  },

  async reminderPrefs(accountId) {
    await wait(200);
    return readReminderPrefs(accountId);
  },

  async setReminderPrefs(accountId, prefs) {
    await wait(400);
    writeReminderPrefs(accountId, prefs);
  },

  async switchSemester(accountId, semesterId) {
    await wait(600);
    const current = timetableFor(accountId);
    const others = storage.get<ByAccount<Record<string, Timetable>>>(OTHER_SEMESTERS_KEY, {});
    const mine = others[accountId] ?? {};
    if (current) mine[current.semesterId] = current;
    const next = mine[semesterId] ?? { semesterId, courses: [], acknowledgedClashes: [] };
    delete mine[semesterId];
    others[accountId] = mine;
    storage.set(OTHER_SEMESTERS_KEY, others);
    writeTimetable(accountId, next);
    return next;
  },
};
