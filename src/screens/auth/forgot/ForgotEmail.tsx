import { useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { services } from "@/services";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { TextField } from "@/ui/form/TextField";
import { isEmail } from "@/ui/form/validation";
import { AuthFrame } from "../AuthFrame";
import { AuthHeading, BackLink } from "../parts";

export const ForgotEmail = () => {
  const navigate = useNavigate();
  const incoming = (useLocation().state ?? {}) as { identifier?: string; email?: string };
  const prefill = incoming.email ?? (isEmail(incoming.identifier ?? "") ? incoming.identifier! : "");
  const [email, setEmail] = useState(prefill);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = !email.trim()
      ? "Enter the email on your account."
      : isEmail(email)
        ? null
        : "Enter a valid email address, like name@example.com.";
    setError(problem);
    if (problem) return inputRef.current?.focus();

    setSending(true);
    setFailed(false);
    try {
      const normalised = email.trim().toLowerCase();
      const ticket = await services.auth.requestPasswordReset(normalised);
      navigate("/login/forgot/code", {
        state: { email: normalised, resendAfterSeconds: ticket.resendAfterSeconds },
      });
    } catch {
      setFailed(true);
      setSending(false);
    }
  };

  return (
    <AuthFrame>
      <BackLink to="/login" label="Back to log in" />
      <AuthHeading title="Reset your password">
        Enter the email on your account and we'll send you a 6-digit code.
      </AuthHeading>
      {failed && (
        <FormAlert tone="error" title="We couldn't send a code" className="mb-5">
          Check your connection, then select Send code again.
        </FormAlert>
      )}
      <form onSubmit={onSubmit} noValidate>
        <TextField
          ref={inputRef}
          id="reset-email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          error={error ?? undefined}
        />
        <LoadingButton loading={sending} loadingLabel="Sending code…" className="mt-6">
          Send code
        </LoadingButton>
      </form>
    </AuthFrame>
  );
};
