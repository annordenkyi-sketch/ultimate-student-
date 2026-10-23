import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Profile } from "@/data/types";
import { STORAGE_KEYS, storage } from "@/lib/storage";

interface ProfileCtx {
  profile: Profile | null;
  setProfile: (p: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  clearProfile: () => void;
}

const Ctx = createContext<ProfileCtx | null>(null);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfileState] = useState<Profile | null>(() =>
    storage.get<Profile | null>(STORAGE_KEYS.profile, null),
  );

  const setProfile = useCallback((p: Profile) => {
    storage.set(STORAGE_KEYS.profile, p);
    setProfileState(p);
  }, []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfileState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      storage.set(STORAGE_KEYS.profile, next);
      return next;
    });
  }, []);

  const clearProfile = useCallback(() => {
    storage.remove(STORAGE_KEYS.profile);
    setProfileState(null);
  }, []);

  const value = useMemo(
    () => ({ profile, setProfile, updateProfile, clearProfile }),
    [profile, setProfile, updateProfile, clearProfile],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useProfile = (): ProfileCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
};
