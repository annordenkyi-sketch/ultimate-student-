import { useEffect, useRef, useState, type FormEvent } from "react";
import { errorCodeOf, type CodeTicket } from "@/services";
import { FormAlert, alertActionClass } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { OTP_LENGTH, OtpInput, emptyOtp, type OtpHandle } from "@/ui/form/OtpInput";
import { useCountdown } from "@/ui/form/useCountdown";
import { formatCountdown } from "@/ui/form/validation";

type CodeError = "invalid" | "expired" | "incomplete" | "network";

interface Props {
  /** Resolves when the code is accepted; the caller navigates on. */
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<CodeTicket>;
  resendAfterSeconds: number;
}

/** 6-digit code entry with auto-submit, readable errors, "Try again" and a resend countdown. */
export const CodeEntry = ({ onVerify, onResend, resendAfterSeconds }: Props) => {
  const [digits, setDigits] = useState(emptyOtp);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<CodeError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { left, restart } = useCountdown(resendAfterSeconds);
  const otpRef = useRef<OtpHandle>(null);
  const lastSubmitted = useRef("");
  const code = digits.join("");

  const verify = async (value: string) => {
    lastSubmitted.current = value;
    setVerifying(true);
    setError(null);
    setNotice(null);
    try {
      await onVerify(value);
    } catch (e) {
      const c = errorCodeOf(e);
      setError(c === "invalid-code" ? "invalid" : c === "expired-code" ? "expired" : "network");
      setVerifying(false);
    }
  };

  // Submit as soon as all six digits are in.
  useEffect(() => {
    if (code.length === OTP_LENGTH && code !== lastSubmitted.current && !verifying) {
      void verify(code);
    }
  }, [code]);

  const clearAndFocus = () => {
    setDigits(emptyOtp());
    lastSubmitted.current = "";
    setError(null);
    window.setTimeout(() => otpRef.current?.focus(), 0);
  };

  const resend = async () => {
    setResending(true);
    try {
      const ticket = await onResend();
      restart(ticket.resendAfterSeconds);
      clearAndFocus();
      setNotice("We've sent a new code. Enter it below.");
    } catch {
      setError("network");
    } finally {
      setResending(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code.length < OTP_LENGTH) {
      setError("incomplete");
      otpRef.current?.focus();
      return;
    }
    void verify(code);
  };

  const resendButton = (
    <button type="button" onClick={resend} disabled={resending} className={alertActionClass}>
      {resending ? "Sending…" : "Resend code"}
    </button>
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <p id="code-label" className="mb-2 text-sm font-semibold text-oxford-ink">
        6-digit code
      </p>
      <OtpInput
        ref={otpRef}
        value={digits}
        onChange={(next) => {
          setDigits(next);
          if (error) setError(null);
        }}
        labelledBy="code-label"
        describedBy={error ? "code-error" : undefined}
        invalid={error !== null && error !== "incomplete"}
        disabled={verifying}
        autoFocus
      />

      {error === "invalid" && (
        <FormAlert
          id="code-error"
          tone="error"
          title="That code isn't right"
          className="mt-4"
          actions={
            <button type="button" onClick={clearAndFocus} className={alertActionClass}>
              Try again
            </button>
          }
        >
          Check the latest email from us and enter the 6-digit code again.
        </FormAlert>
      )}
      {error === "expired" && (
        <FormAlert id="code-error" tone="error" title="This code has expired" className="mt-4" actions={resendButton}>
          Ask for a new code, then enter it here.
        </FormAlert>
      )}
      {error === "incomplete" && (
        <FormAlert id="code-error" tone="error" title="Enter all 6 digits" className="mt-4" />
      )}
      {error === "network" && (
        <FormAlert
          id="code-error"
          tone="error"
          title="Something went wrong"
          className="mt-4"
          actions={
            <button type="button" onClick={clearAndFocus} className={alertActionClass}>
              Try again
            </button>
          }
        >
          Check your connection and try again.
        </FormAlert>
      )}
      {notice && !error && <FormAlert tone="success" title={notice} className="mt-4" />}

      <LoadingButton loading={verifying} loadingLabel="Verifying…" className="mt-6">
        Verify
      </LoadingButton>

      <p className="mt-4 text-center text-sm text-oxford-mute">
        Didn't get it?{" "}
        {left > 0 ? (
          <span>You can resend in {formatCountdown(left)}</span>
        ) : (
          resendButton
        )}
      </p>
    </form>
  );
};
