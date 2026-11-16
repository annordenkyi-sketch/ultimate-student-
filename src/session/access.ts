import type { Session } from "@/services";

/**
 * Where a session sits in flow 00.
 * - guest: not signed in, browsing public content
 * - unverified / pending: signed in, UG eligibility not approved (limited access)
 * - needsSetup: verified, semester setup not finished (resume onboarding)
 * - full: main application
 */
export type AccessLevel = "guest" | "unverified" | "pending" | "needsSetup" | "full";

export const accessFor = (session: Session): AccessLevel => {
  if (session.status === "signedOut") return "guest";
  const { verification, setupComplete } = session.account;
  if (verification === "unverified") return "unverified";
  if (verification === "pending") return "pending";
  return setupComplete ? "full" : "needsSetup";
};

export const isLimited = (level: AccessLevel): boolean =>
  level === "guest" || level === "unverified" || level === "pending";

/** Destination when the app opens, following the decision diamonds in flow 00. */
export const entryRouteFor = (level: AccessLevel): string => {
  switch (level) {
    case "guest":
      return "/welcome";
    case "unverified":
    case "pending":
      return "/explore";
    case "needsSetup":
      return "/onboarding";
    case "full":
      return "/home";
  }
};

/** Only allow in-app paths as return targets. */
export const safeReturnTo = (value: string | null): string | null => {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
};
