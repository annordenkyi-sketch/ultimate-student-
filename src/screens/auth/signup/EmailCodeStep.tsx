import { Navigate, useNavigate } from "react-router-dom";
import { services } from "@/services";
import { useSession } from "@/session/SessionProvider";
import { CodeEntry } from "../CodeEntry";
import { AuthHeading, BackLink, StepDone, TextLink } from "../parts";
import { useSignup } from "./SignupLayout";

export const EmailCodeStep = () => {
  const { draft } = useSignup();
  const { account, setSession } = useSession();
  const navigate = useNavigate();

  if (account) {
    return (
      <>
        <BackLink to="/signup/account" />
        <AuthHeading title="Email confirmed" />
        <StepDone title="Your email is verified" continueTo="/signup/eligibility">
          {account.email}
        </StepDone>
      </>
    );
  }
  if (!draft.codeSentTo) return <Navigate to="/signup/account" replace />;

  const email = draft.codeSentTo;

  return (
    <>
      <BackLink to="/signup/account" />
      <AuthHeading title="Check your email" takeFocus={false}>
        We sent a 6-digit code to <strong className="font-semibold text-oxford-ink">{email}</strong>.{" "}
        <TextLink to="/signup/account">Change email</TextLink>
      </AuthHeading>
      <CodeEntry
        resendAfterSeconds={draft.resendAfterSeconds}
        onResend={() => services.auth.resendSignUpCode(email)}
        onVerify={async (code) => {
          const created = await services.auth.confirmSignUp(email, code);
          setSession({ status: "signedIn", account: created }, true);
          navigate("/signup/eligibility");
        }}
      />
    </>
  );
};
