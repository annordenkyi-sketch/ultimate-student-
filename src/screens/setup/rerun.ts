import { services, type ReminderPrefs } from "@/services";

const RERUN_KEY = "us.setupRerun";

/** True while a finished student is re-running course setup from Academics. */
export const isRerunning = (accountId: string | undefined) => {
  try {
    return Boolean(accountId) && window.sessionStorage.getItem(RERUN_KEY) === accountId;
  } catch {
    return false;
  }
};

export const endRerun = () => {
  try {
    window.sessionStorage.removeItem(RERUN_KEY);
  } catch {
    /* ignore */
  }
};

/** Starts setup again for a semester. The current courses stay until the new setup is saved. */
export const startRerun = async (accountId: string, semesterId: string, reminders: ReminderPrefs | null) => {
  await services.setup.save(accountId, {
    step: "method",
    semesterId,
    method: null,
    imported: [],
    excludedCodes: [],
    courses: [],
    acknowledgedClashes: [],
    reminders,
    goal: null,
  });
  try {
    window.sessionStorage.setItem(RERUN_KEY, accountId);
  } catch {
    /* ignore */
  }
};
