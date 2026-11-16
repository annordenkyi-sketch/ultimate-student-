import { storage } from "@/lib/storage";
import type { ClockService } from "../types";

const KEY = "us.dev.clock";

interface Override {
  /** Local date-time to pretend it is, e.g. "2026-11-12T10:00:00". */
  at: string;
  /** Real time when the override was set, so the fake clock keeps ticking. */
  setAt: number;
}

/** Real time, unless a test time is set from the dev "Test states" panel. */
export const mockClockService: ClockService = {
  now() {
    const o = storage.get<Override | null>(KEY, null);
    if (!o) return new Date();
    return new Date(new Date(o.at).getTime() + (Date.now() - o.setAt));
  },
};

export const setTestTime = (at: string | null) => {
  if (at) storage.set<Override>(KEY, { at, setAt: Date.now() });
  else storage.remove(KEY);
};

export const testTime = (): string | null => storage.get<Override | null>(KEY, null)?.at ?? null;
