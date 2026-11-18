import { ServiceError, type PortalService } from "../types";
import { PORTAL_IMPORT_CODES, clone } from "./courseData";
import { mockClockService } from "./clockService";
import { liveCatalogue } from "./liveContent";
import { wait } from "./db";

/** Portal passwords for testing the sync path. Any other password is "wrong details". */
export const PORTAL_TEST_PASSWORDS = {
  success: "Password1",
  syncFailure: "SyncFail1",
} as const;

export const mockPortalService: PortalService = {
  async authorize(studentId, password) {
    await wait(1200);
    if (!studentId.trim()) throw new ServiceError("portal-auth-failed");
    if (password === PORTAL_TEST_PASSWORDS.success) return { token: "portal-ok" };
    if (password === PORTAL_TEST_PASSWORDS.syncFailure) return { token: "portal-sync-fails" };
    throw new ServiceError("portal-auth-failed");
  },
  async importRegistration(token) {
    await wait(1500);
    if (token !== "portal-ok") throw new ServiceError("sync-failed");
    return clone(liveCatalogue(mockClockService.now()).filter((c) => PORTAL_IMPORT_CODES.includes(c.code)));
  },
};
