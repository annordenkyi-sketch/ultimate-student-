import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "./SessionProvider";

/** Personal deep links: log in first, then come straight back to this page. */
export const RequireSignIn = ({ children }: { children: ReactNode }) => {
  const { account } = useSession();
  const { pathname, search } = useLocation();
  if (!account) return <Navigate to={`/login?returnTo=${encodeURIComponent(pathname + search)}`} replace />;
  return <>{children}</>;
};
