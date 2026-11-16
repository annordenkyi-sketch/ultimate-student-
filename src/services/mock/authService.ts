import { storage } from "@/lib/storage";
import {
  ServiceError,
  type AuthService,
  type SignUpInput,
  type StudentAccount,
} from "../types";
import { db, toPublic, wait } from "./db";

/** Fixed codes for testing: any other 6 digits count as wrong. */
export const TEST_CODE = "123456";
export const EXPIRED_TEST_CODE = "000000";
const RESEND_AFTER_SECONDS = 60;

const PENDING_KEY = "us.v2.pendingSignups";
type PendingSignups = Record<string, SignUpInput>;

const checkCode = (code: string) => {
  if (code === EXPIRED_TEST_CODE) throw new ServiceError("expired-code");
  if (code !== TEST_CODE) throw new ServiceError("invalid-code");
};

const RESET_PREFIX = "mock-reset:";

export const mockAuthService: AuthService = {
  async logIn(identifier, password) {
    await wait(800);
    const account = db.findByIdentifier(identifier);
    if (!account || account.password !== password) {
      throw new ServiceError("invalid-credentials");
    }
    return toPublic(account);
  },

  async startSignUp(input) {
    await wait(900);
    const email = input.email.trim().toLowerCase();
    if (db.findByIdentifier(email)) throw new ServiceError("email-taken");
    const pending = storage.get<PendingSignups>(PENDING_KEY, {});
    storage.set(PENDING_KEY, { ...pending, [email]: { ...input, email } });
    return { resendAfterSeconds: RESEND_AFTER_SECONDS };
  },

  async resendSignUpCode() {
    await wait(700);
    return { resendAfterSeconds: RESEND_AFTER_SECONDS };
  },

  async confirmSignUp(email, code) {
    await wait(900);
    checkCode(code);
    const key = email.trim().toLowerCase();
    const pending = storage.get<PendingSignups>(PENDING_KEY, {});
    const signup = pending[key];
    if (!signup) throw new ServiceError("expired-code");

    const account: StudentAccount = {
      id: `stu-${Date.now()}`,
      name: signup.name.trim(),
      email: key,
      studyLevel: signup.studyLevel,
      verification: "unverified",
      setupComplete: false,
      coursesSetUp: false,
      academic: null,
      lastVerification: null,
    };
    db.insert({ ...account, password: signup.password });
    delete pending[key];
    storage.set(PENDING_KEY, pending);
    return account;
  },

  async requestPasswordReset() {
    await wait(800);
    return { resendAfterSeconds: RESEND_AFTER_SECONDS };
  },

  async confirmPasswordReset(email, code) {
    await wait(800);
    checkCode(code);
    return { resetToken: `${RESET_PREFIX}${email.trim().toLowerCase()}` };
  },

  async setNewPassword(resetToken, password) {
    await wait(800);
    if (!resetToken.startsWith(RESET_PREFIX)) throw new ServiceError("invalid-reset");
    const account = db.findByIdentifier(resetToken.slice(RESET_PREFIX.length));
    if (account) db.update(account.id, { password });
  },

  async changePassword(accountId, current, next) {
    await wait(800);
    const account = db.findById(accountId);
    if (!account || account.password !== current) throw new ServiceError("invalid-credentials");
    db.update(accountId, { password: next });
  },

  async signOutOtherDevices() {
    // The mock keeps one session per browser, so there's nothing else to end.
    await wait(700);
  },
};
