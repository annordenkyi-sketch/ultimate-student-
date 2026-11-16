import { useRef, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { errorCodeOf, services } from "@/services";
import { accessFor, safeReturnTo } from "@/session/access";
import { useSession } from "@/session/SessionProvider";
import { Checkbox } from "@/ui/form/Checkbox";
import { FormAlert, alertActionClass } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { PasswordField } from "@/ui/form/PasswordField";
import { TextField } from "@/ui/form/TextField";
import { AuthFrame } from "./AuthFrame";
import { AuthHeading, BackLink, TextLink } from "./parts";

interface LoginState {
  identifier?: string;
  notice?: "password-updated";
}

interface Errors {
  identifier?: string;
  password?: string;
}

export const LoginScreen = () => {
  const { account, setSession } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo"));
  const incoming = (location.state ?? {}) as LoginState;

  const [identifier, setIdentifier] = useState(incoming.identifier ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<"invalid" | "network" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  if (account) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {
      identifier: identifier.trim() ? undefined : "Enter your email or student ID.",
      password: password ? undefined : "Enter your password.",
    };
    setErrors(next);
    if (next.identifier) return identifierRef.current?.focus();
    if (next.password) return passwordRef.current?.focus();

    setSubmitting(true);
    setFormError(null);
    try {
      const signedIn = await services.auth.logIn(identifier, password);
      const session = { status: "signedIn" as const, account: signedIn };
      setSession(session, remember);
      // Flow 01: route by verification and setup status.
      const level = accessFor(session);
      if (level === "full") navigate(returnTo ?? "/home", { replace: true });
      else if (level === "needsSetup") navigate("/onboarding", { replace: true });
      else navigate("/limited", { replace: true });
    } catch (err) {
      setFormError(errorCodeOf(err) === "invalid-credentials" ? "invalid" : "network");
      setSubmitting(false);
    }
  };

  const tryAgain = () => {
    setPassword("");
    setFormError(null);
    passwordRef.current?.focus();
  };

  return (
    <AuthFrame>
      <BackLink to={returnTo ? `/start?returnTo=${encodeURIComponent(returnTo)}` : "/start"} />
      <AuthHeading title="Log in">
        {returnTo
          ? "Log in and we'll take you back to where you were."
          : "Welcome back. Use your email or student ID."}
      </AuthHeading>

      {incoming.notice === "password-updated" && !formError && (
        <FormAlert tone="success" title="Password updated" className="mb-5">
          Log in with your new password.
        </FormAlert>
      )}
      {formError === "invalid" && (
        <FormAlert
          tone="error"
          title="Those details don't match"
          className="mb-5"
          actions={
            <>
              <button type="button" onClick={tryAgain} className={alertActionClass}>
                Try again
              </button>
              <TextLink to="/login/forgot" state={{ identifier }}>
                Forgot password?
              </TextLink>
            </>
          }
        >
          Check your email or student ID and password, then try again.
        </FormAlert>
      )}
      {formError === "network" && (
        <FormAlert tone="error" title="We couldn't log you in" className="mb-5">
          Check your connection, then select Log in again.
        </FormAlert>
      )}

      <form onSubmit={onSubmit} noValidate>
        <div className="space-y-5">
          <TextField
            ref={identifierRef}
            id="login-identifier"
            label="Email or student ID"
            autoComplete="username"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (errors.identifier) setErrors((er) => ({ ...er, identifier: undefined }));
            }}
            error={errors.identifier}
          />
          <PasswordField
            ref={passwordRef}
            id="login-password"
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((er) => ({ ...er, password: undefined }));
            }}
            error={errors.password}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Checkbox id="login-remember" checked={remember} onChange={setRemember}>
            Remember me
          </Checkbox>
          <TextLink to="/login/forgot" state={{ identifier }}>
            Forgot password?
          </TextLink>
        </div>

        <LoadingButton loading={submitting} loadingLabel="Logging in…" className="mt-6">
          Log in
        </LoadingButton>
      </form>

      <p className="mt-6 border-t border-oxford-rule pt-5 text-center text-sm text-oxford-mute">
        New to Ultimate Student? <TextLink to="/signup/level">Sign up</TextLink>
      </p>
    </AuthFrame>
  );
};
