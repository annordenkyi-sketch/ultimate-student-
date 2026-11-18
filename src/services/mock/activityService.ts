import { storage } from "@/lib/storage";
import type { ActivityService, SavedItem } from "../types";
import { mockClockService } from "./clockService";
import { wait } from "./db";

const NOTIFICATION_READS = "us.v4.notificationReads";
const ANNOUNCEMENT_READS = "us.v4.announcementReads";
const SAVED = "us.v4.saved";
const REGISTRATIONS = "us.v4.registrations";

type ByUser<T> = Record<string, T>;

const read = <T,>(key: string, user: string, fallback: T): T =>
  storage.get<ByUser<T>>(key, {})[user] ?? fallback;

const write = <T,>(key: string, user: string, value: T) => {
  const all = storage.get<ByUser<T>>(key, {});
  all[user] = value;
  storage.set(key, all);
};

/** The demo student starts with a few saved items; everyone else starts with none. */
const DEMO_SAVED = (): SavedItem[] => {
  const at = (h: number) => new Date(mockClockService.now().getTime() - h * 3_600_000).toISOString();
  return [
    { kind: "event", id: "career-fair", title: "Career fair: internships and graduate roles", savedAt: at(20) },
    { kind: "place", id: "balme-library", title: "Balme Library", savedAt: at(50) },
    { kind: "announcement", id: "midsem-timetable", title: "Mid-semester examination timetable published", savedAt: at(70) },
    { kind: "service", id: "ict-help", title: "ICT help desk", savedAt: at(120) },
  ];
};

const savedFor = (accountId: string): SavedItem[] => {
  const stored = storage.get<ByUser<SavedItem[]>>(SAVED, {})[accountId];
  return stored ?? (accountId === "stu-ama" ? DEMO_SAVED() : []);
};

export const mockActivityService: ActivityService = {
  async readNotifications(accountId) {
    return read<string[]>(NOTIFICATION_READS, accountId, []);
  },
  async markNotificationsRead(accountId, ids) {
    const current = new Set(read<string[]>(NOTIFICATION_READS, accountId, []));
    ids.forEach((id) => current.add(id));
    write(NOTIFICATION_READS, accountId, [...current]);
  },
  async readAnnouncements(userKey) {
    return read<string[]>(ANNOUNCEMENT_READS, userKey, []);
  },
  async markAnnouncementRead(userKey, id) {
    const current = new Set(read<string[]>(ANNOUNCEMENT_READS, userKey, []));
    current.add(id);
    write(ANNOUNCEMENT_READS, userKey, [...current]);
  },
  async saved(accountId) {
    return savedFor(accountId);
  },
  async setSaved(accountId, item, saved) {
    await wait(250);
    const others = savedFor(accountId).filter(
      (s) => !(s.kind === item.kind && s.id === item.id),
    );
    const next = saved ? [{ ...item, savedAt: new Date().toISOString() }, ...others] : others;
    write(SAVED, accountId, next);
    return next;
  },
  async registrations(accountId) {
    return read<string[]>(REGISTRATIONS, accountId, []);
  },
  async register(accountId, eventId) {
    await wait(700);
    const next = [...new Set([...read<string[]>(REGISTRATIONS, accountId, []), eventId])];
    write(REGISTRATIONS, accountId, next);
    return next;
  },
};
