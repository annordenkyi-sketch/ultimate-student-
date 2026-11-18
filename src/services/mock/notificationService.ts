import { linkFor } from "@/lib/notifications";
import { storage } from "@/lib/storage";
import type {
  AppNotification,
  DeliveryEvent,
  DeliveryOutcome,
  NotificationCategory,
  NotificationService,
  QuietHours,
} from "../types";
import { mockClockService } from "./clockService";
import { notificationsAt } from "./contentData";
import { SEED_ACCOUNTS, db, wait } from "./db";
import { browserDeviceService, canShowSystemNotifications } from "./deviceService";
import { mockSettingsService } from "./supportService";

// Notification delivery (flow 09), mocked in one place. A real backend would
// create these server-side and push them; the rules are the same.

const STORE_KEY = "us.v8.notifications";
const QUIET_KEY = "us.v8.quietHours";
const GUEST_ALERTS_KEY = "us.v8.guestAlerts";
const GUEST = "guest";

const PUBLIC: NotificationCategory[] = ["news", "events"];
const DEFAULT_QUIET: QuietHours = { enabled: false, from: "22:00", to: "07:00" };

interface Store {
  items: AppNotification[];
}

const now = () => mockClockService.now();
const listeners = new Set<(e: DeliveryEvent) => void>();

const load = (userKey: string): Store => {
  const all = storage.get<Record<string, Store>>(STORE_KEY, {});
  const existing = all[userKey];
  if (existing) return existing;
  // First visit: the demo accounts start with sample notifications; everyone else with none.
  const seeded =
    userKey !== GUEST && SEED_ACCOUNTS.some((a) => a.id === userKey)
      ? notificationsAt(now(), Boolean(db.findById(userKey)?.coursesSetUp))
      : [];
  const fresh = { items: seeded };
  all[userKey] = fresh;
  storage.set(STORE_KEY, all);
  return fresh;
};

const save = (userKey: string, store: Store) => {
  const all = storage.get<Record<string, Store>>(STORE_KEY, {});
  all[userKey] = store;
  storage.set(STORE_KEY, all);
};

const minutes = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Quiet hours may cross midnight (22:00 → 07:00). */
export const inQuietHours = (q: QuietHours, at: Date) => {
  if (!q.enabled) return false;
  const t = at.getHours() * 60 + at.getMinutes();
  const from = minutes(q.from);
  const to = minutes(q.to);
  return from <= to ? t >= from && t < to : t >= from || t < to;
};

const readQuiet = (accountId: string): QuietHours => ({
  ...DEFAULT_QUIET,
  ...(storage.get<Record<string, QuietHours>>(QUIET_KEY, {})[accountId] ?? {}),
});

const showSystemNotification = (n: AppNotification) => {
  try {
    const shown = new Notification(n.title, { body: n.body, tag: n.id });
    shown.onclick = () => {
      window.focus();
      window.location.assign(linkFor(n.target));
    };
  } catch {
    /* some browsers only allow notifications from a service worker */
  }
};

export const mockNotificationService: NotificationService = {
  async list(userKey) {
    await wait(250);
    if (userKey === GUEST && !storage.get(GUEST_ALERTS_KEY, false)) return [];
    return [...load(userKey).items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async dismiss(userKey, id) {
    await wait(150);
    const store = load(userKey);
    save(userKey, { items: store.items.filter((n) => n.id !== id) });
  },

  async deliver(userKey, draft) {
    await wait(200);
    const skip = (reason: Extract<DeliveryOutcome, { status: "skipped" }>["reason"]) => ({
      notification: null,
      outcome: { status: "skipped", reason } as DeliveryOutcome,
    });

    // 1. Who can get it. Guests only get public alerts, and only if they opted in.
    if (userKey === GUEST) {
      if (!PUBLIC.includes(draft.category)) return skip("not-for-guests");
      if (!storage.get(GUEST_ALERTS_KEY, false)) return skip("guest-not-opted-in");
    } else {
      const account = db.findById(userKey);
      if (account?.verification !== "verified" && !PUBLIC.includes(draft.category)) return skip("needs-verification");
      // 2. The student's own settings.
      const prefs = await mockSettingsService.notificationPrefs(userKey);
      if (!prefs[draft.category]) return skip("category-off");
    }

    // 3. Store it in the notification centre.
    const notification: AppNotification = {
      ...draft,
      id: `n-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now().toISOString(),
    };
    const store = load(userKey);
    save(userKey, { items: [notification, ...store.items] });

    // 4. Deliver it, if allowed.
    let outcome: DeliveryOutcome;
    if (userKey !== GUEST && inQuietHours(readQuiet(userKey), now())) {
      outcome = { status: "centre-only", reason: "quiet-hours" };
    } else if (browserDeviceService.notificationPermission() !== "granted") {
      outcome = { status: "centre-only", reason: "permission" };
    } else if (typeof document !== "undefined" && document.visibilityState === "hidden" && canShowSystemNotifications()) {
      showSystemNotification(notification);
      outcome = { status: "shown", via: "system" };
    } else {
      outcome = { status: "shown", via: "banner" };
    }

    listeners.forEach((l) => l({ userKey, notification, outcome }));
    return { notification, outcome };
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  async quietHours(accountId) {
    await wait(150);
    return readQuiet(accountId);
  },

  async setQuietHours(accountId, q) {
    await wait(250);
    const all = storage.get<Record<string, QuietHours>>(QUIET_KEY, {});
    all[accountId] = q;
    storage.set(QUIET_KEY, all);
  },

  guestAlerts: () => storage.get(GUEST_ALERTS_KEY, false),
  setGuestAlerts: (on) => storage.set(GUEST_ALERTS_KEY, on),
};
