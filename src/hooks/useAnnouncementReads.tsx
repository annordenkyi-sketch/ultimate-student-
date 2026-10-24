import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { storage } from "@/lib/storage";

const STORAGE_KEY = "us.announcements.read";

interface Ctx {
  readIds: string[];
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  markAllRead: (ids: string[]) => void;
}

const Context = createContext<Ctx | null>(null);

export const AnnouncementReadsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [readIds, setReadIds] = useState<string[]>(() =>
    storage.get<string[]>(STORAGE_KEY, []),
  );

  const isRead = useCallback(
    (id: string) => readIds.includes(id),
    [readIds],
  );

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      storage.set(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const markAllRead = useCallback((ids: string[]) => {
    setReadIds((prev) => {
      const next = Array.from(new Set([...prev, ...ids]));
      storage.set(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({ readIds, isRead, markRead, markAllRead }),
    [readIds, isRead, markRead, markAllRead],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useAnnouncementReads = (): Ctx => {
  const ctx = useContext(Context);
  if (!ctx)
    throw new Error(
      "useAnnouncementReads must be used inside AnnouncementReadsProvider",
    );
  return ctx;
};
