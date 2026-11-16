import type { EligibilityResult, EligibilityService, VerificationStatus } from "../types";
import { db, toPublic, wait } from "./db";

/** Test identifiers for the UG eligibility check. */
export const ELIGIBILITY_TEST_IDS = {
  verified: "10070001",
  pending: "10070002",
  notVerified: "10070003",
} as const;

const UG_STUDENT_EMAIL = /@st\.ug\.edu\.gh$/;

const resultFor = (identifier: string): EligibilityResult => {
  if (identifier === ELIGIBILITY_TEST_IDS.verified || UG_STUDENT_EMAIL.test(identifier)) {
    return "verified";
  }
  if (identifier === ELIGIBILITY_TEST_IDS.pending) return "pending";
  return "not-verified";
};

const statusFor: Record<EligibilityResult, VerificationStatus> = {
  verified: "verified",
  pending: "pending",
  "not-verified": "unverified",
};

export const mockEligibilityService: EligibilityService = {
  async check(accountId, rawIdentifier) {
    await wait(1600);
    const identifier = rawIdentifier.trim().toLowerCase();
    const result = resultFor(identifier);
    const current = db.findById(accountId);
    const updated = db.update(accountId, {
      verification: statusFor[result],
      studentId: /^\d{8}$/.test(identifier) ? identifier : current?.studentId,
      lastVerification: {
        identifier: rawIdentifier.trim(),
        result,
        checkedAt: new Date().toISOString(),
      },
    });
    return toPublic(updated);
  },
};
