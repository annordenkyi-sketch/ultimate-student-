import { Navigate, useNavigate } from "react-router-dom";
import { useSession } from "@/session/SessionProvider";
import { EligibilityPanel } from "../EligibilityPanel";
import { AuthHeading, BackLink, StepDone } from "../parts";

export const EligibilityStep = () => {
  const { account } = useSession();
  const navigate = useNavigate();

  if (!account) return <Navigate to="/signup/level" replace />;

  if (account.verification === "verified") {
    return (
      <>
        <BackLink to="/signup/verify-email" />
        <AuthHeading title="You're verified" />
        <StepDone title="Your UG student status is confirmed" continueTo="/signup/academic">
          {account.lastVerification?.identifier ?? account.studentId ?? account.email}
        </StepDone>
      </>
    );
  }

  return (
    <>
      <BackLink to="/signup/verify-email" />
      <EligibilityPanel
        onVerified={() => navigate("/signup/academic")}
        onLimited={() => navigate("/limited")}
      />
    </>
  );
};
