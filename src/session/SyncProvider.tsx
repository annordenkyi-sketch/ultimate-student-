import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { services, type PortalConnection, type SyncChanges } from "@/services";
import { useSession } from "./SessionProvider";

type AutoOutcome = "failed" | "not-authorised" | "changes" | null;

interface SyncCtx {
  connection: PortalConnection | null;
  /** Changes waiting for the student to review. */
  pending: SyncChanges | null;
  pendingCount: number;
  /** Result of the automatic check when the app opened, for the Home notice. */
  autoOutcome: AutoOutcome;
  dismissAuto: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<SyncCtx | null>(null);

const AUTO_KEY = "us.autoSynced";
let autoRunFor: string | null = null;

export const changeCount = (c: SyncChanges | null) => (c ? c.added.length + c.removed.length + c.changed.length : 0);

/**
 * Portal sync state shared across screens (flow 08): connection, changes
 * pending review, and an automatic check once per visit for returning students.
 */
export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const { account, access } = useSession();
  const accountId = access === "full" ? (account?.id ?? null) : null;
  const [connection, setConnection] = useState<PortalConnection | null>(null);
  const [pending, setPending] = useState<SyncChanges | null>(null);
  const [autoOutcome, setAutoOutcome] = useState<AutoOutcome>(null);

  const refresh = useCallback(async () => {
    if (!accountId) return;
    const [c, p] = await Promise.all([services.sync.connection(accountId), services.sync.pending(accountId)]);
    setConnection(c);
    setPending(p);
  }, [accountId]);

  useEffect(() => {
    setConnection(null);
    setPending(null);
    setAutoOutcome(null);
    if (!accountId) return;
    void refresh();
    // Automatic sync: once per visit, only for a connected portal. The guard
    // is outside React so a re-run effect can't start (or drop) a second check.
    let already = autoRunFor === accountId;
    try {
      already ||= window.sessionStorage.getItem(AUTO_KEY) === accountId;
      window.sessionStorage.setItem(AUTO_KEY, accountId);
    } catch {
      /* ignore */
    }
    if (already) return;
    autoRunFor = accountId;
    void (async () => {
      const conn = await services.sync.connection(accountId);
      if (conn.status !== "connected") return;
      try {
        const result = await services.sync.check(accountId);
        if (result.status === "changes") {
          await services.sync.keepPending(accountId, result.changes);
          setAutoOutcome("changes");
        } else if (result.status === "failed" || result.status === "not-authorised") {
          setAutoOutcome(result.status);
        }
      } catch {
        setAutoOutcome("failed");
      }
      await refresh();
    })();
  }, [accountId, refresh]);

  const value = useMemo<SyncCtx>(
    () => ({
      connection,
      pending,
      pendingCount: changeCount(pending),
      autoOutcome,
      dismissAuto: () => setAutoOutcome(null),
      refresh,
    }),
    [connection, pending, autoOutcome, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useSync = (): SyncCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSync must be used inside SyncProvider");
  return ctx;
};
