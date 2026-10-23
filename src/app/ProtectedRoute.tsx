import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { profile } = useProfile();
  const location = useLocation();
  if (!profile) {
    return <Navigate to="/welcome" replace state={{ from: location }} />;
  }
  return <>{children}</>;
};
