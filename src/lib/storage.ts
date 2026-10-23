// Minimal typed localStorage wrapper. Safe on the server / in SSR.

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = typeof window !== "undefined"
        ? window.localStorage.getItem(key)
        : null;
      if (raw == null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      /* ignore quota / privacy mode */
    }
  },
  remove(key: string): void {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch {
      /* ignore */
    }
  },
};

export const STORAGE_KEYS = {
  profile: "us.profile",
  saved: "us.saved",
  checklist: "us.checklist",
  notificationsRead: "us.notifications.read",
} as const;
