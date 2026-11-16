import { Navigate, useNavigate } from "react-router-dom";
import { useSession } from "@/session/SessionProvider";
import { AcademicForm } from "./AcademicForm";
import { AuthFrame } from "./AuthFrame";

/** Academic profile for a verified student who hasn't filled it in yet. */
export const AcademicProfileScreen = () => {
  const { account } = useSession();
  const navigate = useNavigate();

  if (!account) return <Navigate to="/start" replace />;
  if (account.verification !== "verified") return <Navigate to="/verify" replace />;

  return (
    <AuthFrame>
      <AcademicForm onSaved={() => navigate("/onboarding", { replace: true })} />
    </AuthFrame>
  );
};
