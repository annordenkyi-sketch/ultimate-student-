import { Navigate, useNavigate } from "react-router-dom";
import { useSession } from "@/session/SessionProvider";
import { AuthFrame } from "./AuthFrame";
import { EligibilityPanel } from "./EligibilityPanel";
import { BackLink } from "./parts";

/** UG eligibility check for a signed-in student who isn't verified yet. */
export const VerifyScreen = () => {
  const { account } = useSession();
  const navigate = useNavigate();

  if (!account) return <Navigate to="/start" replace />;
  if (account.verification === "verified") return <Navigate to="/" replace />;

  return (
    <AuthFrame>
      <BackLink to="/limited" />
      <EligibilityPanel
        onVerified={() => navigate("/academic-profile", { replace: true })}
        onLimited={() => navigate("/limited", { replace: true })}
      />
    </AuthFrame>
  );
};
