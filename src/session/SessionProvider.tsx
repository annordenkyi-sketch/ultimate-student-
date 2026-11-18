import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { services, type Session, type StudentAccount } from "@/services";
import type { AccountPatch } from "@/services/types";
import { accessFor, type AccessLevel } from "./access";

interface SessionCtx {
  session: Session;
  account: StudentAccount | null;
  access: AccessLevel;
  /** Start or replace the session. `remember: false` ends it with the browser session. */
  setSession: (next: Session, remember?: boolean) => void;
  /** Replace the signed-in account with a fresh copy from a service. */
  setAccount: (account: StudentAccount) => void;
  /** Optimistic local update, also sent to the account service. */
  updateAccount: (patch: AccountPatch) => void;
  signOut: () => void;
  /** Ends the session as if it timed out; the next log-in says so. */
  expireSession: () => void;
}

const EXPIRED_KEY = "us.sessionExpired";

/** True after the session expired, until the student logs in again. */
export const sessionExpired = () => {
  try {
    return window.sessionStorage.getItem(EXPIRED_KEY) === "1";
  } catch {
    return false;
  }
};

const clearSessionExpired = () => {
  try {
    window.sessionStorage.removeItem(EXPIRED_KEY);
  } catch {
    /* ignore */
  }
};

const Ctx = createContext<SessionCtx | null>(null);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSessionState] = useState<Session>(() => services.session.restore());

  const setSession = useCallback((next: Session, remember?: boolean) => {
    if (next.status === "signedOut") services.session.signOut();
    else {
      services.session.persist(next, remember);
      clearSessionExpired();
    }
    setSessionState(next);
  }, []);

  const setAccount = useCallback((account: StudentAccount) => {
    const next: Session = { status: "signedIn", account };
    services.session.persist(next);
    setSessionState(next);
  }, []);

  const updateAccount = useCallback((patch: AccountPatch) => {
    setSessionState((prev) => {
      if (prev.status !== "signedIn") return prev;
      const next: Session = { status: "signedIn", account: { ...prev.account, ...patch } };
      services.session.persist(next);
      void services.accounts.update(prev.account.id, patch);
      return next;
    });
  }, []);

  const signOut = useCallback(() => {
    services.session.signOut();
    setSessionState({ status: "signedOut" });
  }, []);

  const expireSession = useCallback(() => {
    services.session.signOut();
    try {
      window.sessionStorage.setItem(EXPIRED_KEY, "1");
    } catch {
      /* ignore */
    }
    setSessionState({ status: "signedOut" });
  }, []);

  const value = useMemo<SessionCtx>(
    () => ({
      session,
      account: session.status === "signedIn" ? session.account : null,
      access: accessFor(session),
      setSession,
      setAccount,
      updateAccount,
      signOut,
      expireSession,
    }),
    [session, setSession, setAccount, updateAccount, signOut, expireSession],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useSession = (): SessionCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
};
