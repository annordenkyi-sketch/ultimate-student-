import { storage } from "@/lib/storage";
import type { NotificationCategory, SettingsService, SupportService } from "../types";
import { wait } from "./db";
import { FAQS, UG_PORTALS } from "./moreData";

const NOTIFICATION_PREFS = "us.v7.notificationPrefs";

const DEFAULT_PREFS: Record<NotificationCategory, boolean> = {
  lectures: true,
  news: true,
  events: true,
  deadlines: true,
  goals: true,
};

export const mockSupportService: SupportService = {
  async faqs() {
    await wait(250);
    return FAQS;
  },
  async portals() {
    await wait(200);
    return UG_PORTALS;
  },
  async report() {
    await wait(900);
    // A reference the student can quote if they get in touch.
    return { reference: `US-${Date.now().toString(36).slice(-6).toUpperCase()}` };
  },
};

export const mockSettingsService: SettingsService = {
  async notificationPrefs(accountId) {
    await wait(200);
    return { ...DEFAULT_PREFS, ...(storage.get<Record<string, Partial<Record<NotificationCategory, boolean>>>>(NOTIFICATION_PREFS, {})[accountId] ?? {}) };
  },
  async setNotificationPref(accountId, category, on) {
    await wait(250);
    const all = storage.get<Record<string, Partial<Record<NotificationCategory, boolean>>>>(NOTIFICATION_PREFS, {});
    all[accountId] = { ...(all[accountId] ?? {}), [category]: on };
    storage.set(NOTIFICATION_PREFS, all);
  },
};
