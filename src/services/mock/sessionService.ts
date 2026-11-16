import type { Session, SessionService } from "../types";

const KEY = "us.v3.session";

const read = (store: Storage): unknown => {
  try {
    const raw = store.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const isSession = (value: unknown): value is Session => {
  if (!value || typeof value !== "object") return false;
  const v = value as { status?: unknown; account?: unknown };
  if (v.status === "signedOut") return true;
  return v.status === "signedIn" && typeof v.account === "object" && v.account !== null;
};

const clear = () => {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
};

/** "Remember me" keeps the session in localStorage; otherwise it ends with the browser session. */
export const mockSessionService: SessionService = {
  restore() {
    const saved = read(localStorage) ?? read(sessionStorage);
    return isSession(saved) ? saved : { status: "signedOut" };
  },
  persist(session, remember) {
    try {
      const keep = remember ?? sessionStorage.getItem(KEY) === null;
      const raw = JSON.stringify(session);
      clear();
      (keep ? localStorage : sessionStorage).setItem(KEY, raw);
    } catch {
      /* storage unavailable */
    }
  },
  signOut: clear,
};
