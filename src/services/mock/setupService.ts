import { storage } from "@/lib/storage";
import type { Course, ReminderPrefs, SetupProgress, SetupService } from "../types";
import { mockClockService } from "./clockService";
import { db, toPublic, wait } from "./db";
import { writeBaseline, writeConnection } from "./syncStore";

const PROGRESS_KEY = "us.v2.setupProgress";
export const TIMETABLE_KEY = "us.v2.timetables";
export const PREFS_KEY = "us.v2.semesterPrefs";

type ByAccount<T> = Record<string, T>;

const write = <T,>(key: string, accountId: string, value: T | null) => {
  const all = storage.get<ByAccount<T>>(key, {});
  if (value === null) delete all[accountId];
  else all[accountId] = value;
  storage.set(key, all);
};

export const mockSetupService: SetupService = {
  async load(accountId) {
    await wait(250);
    return storage.get<ByAccount<SetupProgress>>(PROGRESS_KEY, {})[accountId] ?? null;
  },

  async save(accountId, progress) {
    write(PROGRESS_KEY, accountId, progress);
  },

  async saveTimetable(accountId, semesterId, courses) {
    await wait(700);
    write<{ semesterId: string; courses: Course[] }>(TIMETABLE_KEY, accountId, { semesterId, courses });
  },

  async finish(accountId, result) {
    await wait(800);
    if (!result) {
      // Skipped: keep progress at the method step so "Set up your courses" resumes there.
      const progress = storage.get<ByAccount<SetupProgress>>(PROGRESS_KEY, {})[accountId];
      if (progress) write(PROGRESS_KEY, accountId, { ...progress, step: "method" });
      return toPublic(db.update(accountId, { setupComplete: true }));
    }
    const synced = result.method === "sync";
    const importedCodes = new Set((result.imported ?? []).map((c) => c.code));
    write<{ semesterId: string; courses: Course[] }>(TIMETABLE_KEY, accountId, {
      semesterId: result.semesterId,
      courses: result.courses.map((c) => ({ ...c, origin: c.origin ?? (synced && importedCodes.has(c.code) ? "synced" : "manual") })),
    });
    if (synced) {
      // The official registration is what later syncs compare against.
      const at = mockClockService.now().toISOString();
      writeBaseline(accountId, (result.imported ?? []).map((c) => ({ ...c, origin: "synced" as const })));
      writeConnection(accountId, { status: "connected", connectedAt: at, lastSyncedAt: at });
    }
    write<{ reminders: ReminderPrefs | null; goal: string | null }>(PREFS_KEY, accountId, {
      reminders: result.reminders,
      goal: result.goal,
    });
    write<SetupProgress>(PROGRESS_KEY, accountId, null);
    return toPublic(db.update(accountId, { setupComplete: true, coursesSetUp: true }));
  },
};
