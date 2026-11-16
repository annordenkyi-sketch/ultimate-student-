import { useLocation } from "react-router-dom";
import { useSession } from "./SessionProvider";

export interface Unlock {
  /** Where to go: choose entry for guests, verification for unverified, status for pending. */
  to: string;
  label: string;
}

/** How the current user unlocks personal features. Guests return to this page after signing in. */
export const useUnlock = (): Unlock | null => {
  const { access } = useSession();
  const location = useLocation();

  switch (access) {
    case "guest": {
      const returnTo = encodeURIComponent(location.pathname + location.search);
      return { to: `/start?returnTo=${returnTo}`, label: "Sign in or register" };
    }
    case "unverified":
      return { to: "/verify", label: "Verify eligibility" };
    case "pending":
      return { to: "/limited", label: "View verification status" };
    default:
      return null;
  }
};
