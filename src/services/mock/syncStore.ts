import { storage } from "@/lib/storage";
import type { Course, PortalConnection, SyncChanges } from "../types";

// Storage for portal sync (flow 08), shared by the setup and sync mocks.

const CONNECTION_KEY = "us.v7.portalConnection";
/** The official registration as of the last successful sync; changes are found against this. */
const BASELINE_KEY = "us.v7.syncBaseline";
const PENDING_KEY = "us.v7.syncPending";
const SCENARIO_KEY = "us.dev.sync";

type ByAccount<T> = Record<string, T>;

const read = <T,>(key: string, accountId: string): T | undefined => storage.get<ByAccount<T>>(key, {})[accountId];
const write = <T,>(key: string, accountId: string, value: T | null) => {
  const all = storage.get<ByAccount<T>>(key, {});
  if (value === null) delete all[accountId];
  else all[accountId] = value;
  storage.set(key, all);
};

export const readConnection = (accountId: string) => read<PortalConnection>(CONNECTION_KEY, accountId);
export const writeConnection = (accountId: string, c: PortalConnection) => write(CONNECTION_KEY, accountId, c);

export const readBaseline = (accountId: string) => read<Course[]>(BASELINE_KEY, accountId);
export const writeBaseline = (accountId: string, courses: Course[]) => write(BASELINE_KEY, accountId, courses);

export const readPending = (accountId: string) => read<SyncChanges>(PENDING_KEY, accountId) ?? null;
export const writePending = (accountId: string, changes: SyncChanges | null) => write(PENDING_KEY, accountId, changes);

/**
 * Test cases for the portal sync, chosen in the dev Test states panel:
 *   no-changes       the portal matches the last sync
 *   changes          2 courses added, 1 removed, 1 venue and 1 time changed
 *   conflict         as "changes", but an added course overlaps an existing lecture
 *   failed           the portal can't be reached
 *   not-authorised   the portal no longer authorises access
 */
export type SyncScenario = "no-changes" | "changes" | "conflict" | "failed" | "not-authorised";

export const syncScenario = (): SyncScenario => storage.get<SyncScenario>(SCENARIO_KEY, "changes");
export const setSyncScenario = (s: SyncScenario) => storage.set(SCENARIO_KEY, s);
