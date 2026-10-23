import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SectionId } from "@/data/types";
import { STORAGE_KEYS, storage } from "@/lib/storage";

export interface SavedRef {
  section: SectionId;
  itemId: string;
  savedAt: string;
}

interface SavedCtx {
  saved: SavedRef[];
  isSaved: (section: SectionId, itemId: string) => boolean;
  toggleSaved: (section: SectionId, itemId: string) => boolean; // returns new state
}

const Ctx = createContext<SavedCtx | null>(null);

export const SavedProvider = ({ children }: { children: ReactNode }) => {
  const [saved, setSaved] = useState<SavedRef[]>(() =>
    storage.get<SavedRef[]>(STORAGE_KEYS.saved, []),
  );

  const isSaved = useCallback(
    (section: SectionId, itemId: string) =>
      saved.some((s) => s.section === section && s.itemId === itemId),
    [saved],
  );

  const toggleSaved = useCallback(
    (section: SectionId, itemId: string) => {
      let newState = false;
      setSaved((prev) => {
        const existingIdx = prev.findIndex(
          (s) => s.section === section && s.itemId === itemId,
        );
        const next =
          existingIdx >= 0
            ? prev.filter((_, i) => i !== existingIdx)
            : [...prev, { section, itemId, savedAt: new Date().toISOString() }];
        newState = existingIdx < 0;
        storage.set(STORAGE_KEYS.saved, next);
        return next;
      });
      return newState;
    },
    [],
  );

  const value = useMemo(
    () => ({ saved, isSaved, toggleSaved }),
    [saved, isSaved, toggleSaved],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useSaved = (): SavedCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSaved must be used inside SavedProvider");
  return ctx;
};
