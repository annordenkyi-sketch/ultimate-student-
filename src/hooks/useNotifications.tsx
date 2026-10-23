import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { NotificationItem } from "@/data/types";
import { dataService } from "@/data/service";
import { STORAGE_KEYS, storage } from "@/lib/storage";

interface NotificationsCtx {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
}

const Ctx = createContext<NotificationsCtx | null>(null);

export const NotificationsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>(() =>
    storage.get<string[]>(STORAGE_KEYS.notificationsRead, []),
  );

  useEffect(() => {
    let cancelled = false;
    dataService.getNotifications().then((n) => {
      if (!cancelled) setNotifications(n);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const effective = useMemo(
    () =>
      notifications.map((n) =>
        readIds.includes(n.id) ? { ...n, read: true } : n,
      ),
    [notifications, readIds],
  );

  const unreadCount = useMemo(
    () => effective.filter((n) => !n.read).length,
    [effective],
  );

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      storage.set(STORAGE_KEYS.notificationsRead, next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const allIds = notifications.map((n) => n.id);
      const next = Array.from(new Set([...prev, ...allIds]));
      storage.set(STORAGE_KEYS.notificationsRead, next);
      return next;
    });
  }, [notifications]);

  const value = useMemo(
    () => ({ notifications: effective, unreadCount, markAsRead, markAllRead }),
    [effective, unreadCount, markAsRead, markAllRead],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useNotifications = (): NotificationsCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
};
