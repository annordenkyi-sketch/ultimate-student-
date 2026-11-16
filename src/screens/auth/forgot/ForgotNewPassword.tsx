import { useRef, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { errorCodeOf, services } from "@/services";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { PasswordField } from "@/ui/form/PasswordField";
import { PasswordRules } from "@/ui/form/PasswordRules";
import { isStrongPassword } from "@/ui/form/validation";
import { AuthFrame } from "../AuthFrame";
import { AuthHeading, TextLink } from "../parts";

export const ForgotNewPassword = () => {
  const navigate = useNavigate();
  const state = useLocation().state as { email?: string; resetToken?: string } | null;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<"expired" | "network" | null>(null);
  const [saving, setSaving] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  if (!state?.resetToken || !state.email) return <Navigate to="/login/forgot" replace />;
  const { email, resetToken } = state;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = {
      password: !password
        ? "Create a new password."
        : isStrongPassword(password)
          ? undefined
          : "Use at least 8 characters, including a letter and a number.",
      confirm: !confirm ? "Re-enter your new password." : confirm === password ? undefined : "Passwords don't match.",
    };
    setErrors(next);
    if (next.password) return passwordRef.current?.focus();
    if (next.confirm) return confirmRef.current?.focus();

    setSaving(true);
    setFormError(null);
    try {
      await services.auth.setNewPassword(resetToken, password);
      navigate("/login", { replace: true, state: { identifier: email, notice: "password-updated" } });
    } catch (err) {
      setFormError(errorCodeOf(err) === "invalid-reset" ? "expired" : "network");
      setSaving(false);
    }
  };

  return (
    <AuthFrame>
      <AuthHeading title="Set a new password">
        For <strong className="font-semibold text-oxford-ink">{email}</strong>.
      </AuthHeading>
      {formError === "expired" && (
        <FormAlert
          tone="error"
          title="This reset link has expired"
          className="mb-5"
          actions={<TextLink to="/login/forgot" state={{ email }}>Start again</TextLink>}
        >
          Ask for a new code to reset your password.
        </FormAlert>
      )}
      {formError === "network" && (
        <FormAlert tone="error" title="Your password wasn't changed" className="mb-5">
          Check your connection, then select Save password again.
        </FormAlert>
      )}
      <form onSubmit={onSubmit} noValidate>
        <div className="space-y-5">
          <PasswordField
            ref={passwordRef}
            id="new-password"
            label="New password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((er) => ({ ...er, password: undefined }));
            }}
            error={errors.password}
            hint={<PasswordRules password={password} />}
          />
          <PasswordField
            ref={confirmRef}
            id="new-password-confirm"
            label="Confirm new password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (errors.confirm) setErrors((er) => ({ ...er, confirm: undefined }));
            }}
            error={errors.confirm}
          />
        </div>
        <LoadingButton loading={saving} loadingLabel="Saving…" className="mt-7">
          Save password
        </LoadingButton>
      </form>
    </AuthFrame>
  );
};
