import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { services, type AppNotification, type DeliveryEvent, type SavedItem, type SavedKind } from "@/services";
import { useSession } from "./SessionProvider";

interface ActivityCtx {
  /** The notification centre. Null while loading. Guests only see public alerts they opted in to. */
  notifications: AppNotification[] | null;
  isNotificationRead: (id: string) => boolean;
  unreadCount: number;
  markNotificationsRead: (ids: string[]) => void;
  dismissNotification: (id: string) => Promise<void>;
  /** Reload the centre, e.g. after a guest opts in to alerts. */
  refreshNotifications: () => void;
  /** A notification that just arrived while the app is open, for the in-app banner. */
  banner: AppNotification | null;
  clearBanner: () => void;
  isAnnouncementRead: (id: string) => boolean;
  markAnnouncementRead: (id: string) => void;
  saved: SavedItem[];
  isSaved: (kind: SavedKind, id: string) => boolean;
  setSaved: (item: Omit<SavedItem, "savedAt">, saved: boolean) => Promise<void>;
  isRegistered: (eventId: string) => boolean;
  register: (eventId: string) => Promise<void>;
  /** Guest tapped Save: remember the item, then save it once they've signed in. */
  saveAfterSignIn: (item: Omit<SavedItem, "savedAt">) => void;
  /** The item just saved after signing in, so its page can confirm it. */
  savedAfterSignIn: { kind: SavedKind; id: string } | null;
}

const PENDING_SAVE_KEY = "us.pendingSave";

const readPendingSave = (): Omit<SavedItem, "savedAt"> | null => {
  try {
    const raw = window.sessionStorage.getItem(PENDING_SAVE_KEY);
    return raw ? (JSON.parse(raw) as Omit<SavedItem, "savedAt">) : null;
  } catch {
    return null;
  }
};

const Ctx = createContext<ActivityCtx | null>(null);

/** Per-student activity shared across screens: unread counts, read state, saved items, registrations. */
export const ActivityProvider = ({ children }: { children: ReactNode }) => {
  const { account } = useSession();
  const accountId = account?.id ?? null;
  const userKey = accountId ?? "guest";
  // Lecture notifications appear once courses are set up.
  const coursesSetUp = Boolean(account?.coursesSetUp);

  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [readAnnouncements, setReadAnnouncements] = useState<Set<string>>(new Set());
  const [saved, setSavedItems] = useState<SavedItem[]>([]);
  const [registrations, setRegistrations] = useState<Set<string>>(new Set());
  const [savedAfterSignIn, setSavedAfterSignIn] = useState<{ kind: SavedKind; id: string } | null>(null);
  const [banner, setBanner] = useState<AppNotification | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Notification centre and read state, for students and guests alike.
  useEffect(() => {
    let live = true;
    setNotifications(null);
    void Promise.all([services.notifications.list(userKey), services.activity.readNotifications(userKey)]).then(([list, read]) => {
      if (!live) return;
      setNotifications(list);
      setReadNotifications(new Set(read));
    });
    return () => {
      live = false;
    };
  }, [userKey, coursesSetUp, refreshKey]);

  // New notifications while the app is open: add to the centre, and show a banner when it's allowed.
  useEffect(
    () =>
      services.notifications.subscribe((e: DeliveryEvent) => {
        if (e.userKey !== userKey) return;
        setNotifications((prev) => [e.notification, ...(prev ?? []).filter((n) => n.id !== e.notification.id)]);
        if (e.outcome.status === "shown" && e.outcome.via === "banner") setBanner(e.notification);
      }),
    [userKey],
  );

  useEffect(() => {
    let live = true;
    void services.activity.readAnnouncements(userKey).then((ids) => live && setReadAnnouncements(new Set(ids)));
    if (!accountId) {
      setSavedItems([]);
      setRegistrations(new Set());
      return () => {
        live = false;
      };
    }
    void Promise.all([services.activity.saved(accountId), services.activity.registrations(accountId)]).then(async ([savedItems, regs]) => {
      if (!live) return;
      setSavedItems(savedItems);
      setRegistrations(new Set(regs));

      const pending = readPendingSave();
      if (!pending) return;
      try {
        window.sessionStorage.removeItem(PENDING_SAVE_KEY);
      } catch {
        /* ignore */
      }
      const next = await services.activity.setSaved(accountId, pending, true);
      if (!live) return;
      setSavedItems(next);
      setSavedAfterSignIn({ kind: pending.kind, id: pending.id });
    });
    return () => {
      live = false;
    };
  }, [accountId, userKey]);

  const markNotificationsRead = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      setReadNotifications((prev) => new Set([...prev, ...ids]));
      void services.activity.markNotificationsRead(userKey, ids);
    },
    [userKey],
  );

  const dismissNotification = useCallback(
    async (id: string) => {
      setNotifications((prev) => prev?.filter((n) => n.id !== id) ?? prev);
      await services.notifications.dismiss(userKey, id);
    },
    [userKey],
  );

  const refreshNotifications = useCallback(() => setRefreshKey((k) => k + 1), []);
  const clearBanner = useCallback(() => setBanner(null), []);

  const markAnnouncementRead = useCallback(
    (id: string) => {
      setReadAnnouncements((prev) => (prev.has(id) ? prev : new Set([...prev, id])));
      void services.activity.markAnnouncementRead(userKey, id);
    },
    [userKey],
  );

  const setSaved = useCallback(
    async (item: Omit<SavedItem, "savedAt">, value: boolean) => {
      if (!accountId) return;
      setSavedItems(await services.activity.setSaved(accountId, item, value));
    },
    [accountId],
  );

  const register = useCallback(
    async (eventId: string) => {
      if (!accountId) return;
      setRegistrations(new Set(await services.activity.register(accountId, eventId)));
    },
    [accountId],
  );

  const saveAfterSignIn = useCallback((item: Omit<SavedItem, "savedAt">) => {
    try {
      window.sessionStorage.setItem(PENDING_SAVE_KEY, JSON.stringify(item));
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<ActivityCtx>(
    () => ({
      notifications,
      isNotificationRead: (id) => readNotifications.has(id),
      unreadCount: notifications?.filter((n) => !readNotifications.has(n.id)).length ?? 0,
      markNotificationsRead,
      dismissNotification,
      refreshNotifications,
      banner,
      clearBanner,
      isAnnouncementRead: (id) => readAnnouncements.has(id),
      markAnnouncementRead,
      saved,
      isSaved: (kind, id) => saved.some((s) => s.kind === kind && s.id === id),
      setSaved,
      isRegistered: (id) => registrations.has(id),
      register,
      saveAfterSignIn,
      savedAfterSignIn,
    }),
    [notifications, readNotifications, markNotificationsRead, dismissNotification, refreshNotifications, banner, clearBanner, readAnnouncements, markAnnouncementRead, saved, setSaved, registrations, register, saveAfterSignIn, savedAfterSignIn],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useActivity = (): ActivityCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useActivity must be used inside ActivityProvider");
  return ctx;
};
