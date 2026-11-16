import { Navigate, useNavigate } from "react-router-dom";
import { useSession } from "@/session/SessionProvider";
import { AcademicForm } from "../AcademicForm";
import { BackLink } from "../parts";

export const AcademicStep = () => {
  const { account } = useSession();
  const navigate = useNavigate();

  if (!account) return <Navigate to="/signup/level" replace />;
  if (account.verification !== "verified") return <Navigate to="/signup/eligibility" replace />;

  return (
    <>
      <BackLink to="/signup/eligibility" />
      <AcademicForm onSaved={() => navigate("/onboarding")} />
    </>
  );
};
