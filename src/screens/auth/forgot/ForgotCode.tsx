import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { services } from "@/services";
import { AuthFrame } from "../AuthFrame";
import { CodeEntry } from "../CodeEntry";
import { AuthHeading, BackLink, TextLink } from "../parts";

export const ForgotCode = () => {
  const navigate = useNavigate();
  const state = useLocation().state as { email?: string; resendAfterSeconds?: number } | null;
  const email = state?.email;

  if (!email) return <Navigate to="/login/forgot" replace />;

  return (
    <AuthFrame>
      <BackLink to="/login/forgot" />
      <AuthHeading title="Enter the reset code" takeFocus={false}>
        If <strong className="font-semibold text-oxford-ink">{email}</strong> has an account, we've
        sent a 6-digit code to it.{" "}
        <TextLink to="/login/forgot" state={{ email }}>
          Use a different email
        </TextLink>
      </AuthHeading>
      <CodeEntry
        resendAfterSeconds={state?.resendAfterSeconds ?? 60}
        onResend={() => services.auth.requestPasswordReset(email)}
        onVerify={async (code) => {
          const { resetToken } = await services.auth.confirmPasswordReset(email, code);
          navigate("/login/forgot/new-password", { state: { email, resetToken }, replace: true });
        }}
      />
    </AuthFrame>
  );
};
