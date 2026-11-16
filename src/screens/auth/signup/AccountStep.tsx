import { useRef, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { errorCodeOf, services } from "@/services";
import { useSession } from "@/session/SessionProvider";
import { Checkbox } from "@/ui/form/Checkbox";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { PasswordField } from "@/ui/form/PasswordField";
import { PasswordRules } from "@/ui/form/PasswordRules";
import { TextField } from "@/ui/form/TextField";
import { isEmail, isStrongPassword } from "@/ui/form/validation";
import { AuthHeading, BackLink, StepDone, TextLink } from "../parts";
import { useSignup, type SignupDraft } from "./SignupLayout";

type Field = "name" | "email" | "password" | "confirm" | "terms";
type Errors = Partial<Record<Field, string>>;
const ORDER: Field[] = ["name", "email", "password", "confirm", "terms"];

const validateField = (field: Field, d: SignupDraft): string | undefined => {
  switch (field) {
    case "name":
      return d.name.trim().length >= 2 ? undefined : "Enter your full name.";
    case "email":
      if (!d.email.trim()) return "Enter your email address.";
      return isEmail(d.email) ? undefined : "Enter a valid email address, like name@example.com.";
    case "password":
      if (!d.password) return "Create a password.";
      return isStrongPassword(d.password)
        ? undefined
        : "Use at least 8 characters, including a letter and a number.";
    case "confirm":
      if (!d.confirm) return "Re-enter your password.";
      return d.confirm === d.password ? undefined : "Passwords don't match.";
    case "terms":
      return d.terms ? undefined : "Accept the terms to create your account.";
  }
};

export const AccountStep = () => {
  const { draft, update } = useSignup();
  const { account } = useSession();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<"email-taken" | "network" | null>(null);
  const refs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});

  if (account) {
    return (
      <>
        <BackLink to="/signup/level" />
        <AuthHeading title="Your account is set up" />
        <StepDone title={account.name} continueTo="/signup/verify-email">
          {account.email}
        </StepDone>
      </>
    );
  }
  if (!draft.studyLevel) return <Navigate to="/signup/level" replace />;

  const set = (patch: Partial<SignupDraft>, field: Field) => {
    update(patch);
    const next = { ...draft, ...patch };
    // Re-check as they type once a field has been visited, so errors clear promptly.
    if (touched[field] || errors[field]) {
      setErrors((er) => ({ ...er, [field]: validateField(field, next) }));
    }
    if (field === "password" && (touched.confirm || errors.confirm)) {
      setErrors((er) => ({ ...er, confirm: validateField("confirm", next) }));
    }
    if (field === "email") setFormError(null);
  };

  const blur = (field: Field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((er) => ({ ...er, [field]: validateField(field, draft) }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    for (const f of ORDER) next[f] = validateField(f, draft);
    setErrors(next);
    setTouched({ name: true, email: true, password: true, confirm: true, terms: true });
    const firstInvalid = ORDER.find((f) => next[f]);
    if (firstInvalid) {
      refs.current[firstInvalid]?.focus();
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const email = draft.email.trim().toLowerCase();
      const ticket = await services.auth.startSignUp({
        name: draft.name.trim(),
        email,
        password: draft.password,
        studyLevel: draft.studyLevel!,
      });
      update({ email, codeSentTo: email, resendAfterSeconds: ticket.resendAfterSeconds });
      navigate("/signup/verify-email");
    } catch (err) {
      const code = errorCodeOf(err);
      setFormError(code === "email-taken" ? "email-taken" : "network");
      if (code === "email-taken") refs.current.email?.focus();
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <BackLink to="/signup/level" />
      <AuthHeading title="Create your account">
        You'll use this to log in. We'll email you a code to confirm it.
      </AuthHeading>

      {formError === "email-taken" && (
        <FormAlert
          tone="error"
          title="That email already has an account"
          className="mb-5"
          actions={
            <TextLink to="/login" state={{ identifier: draft.email.trim() }}>
              Log in instead
            </TextLink>
          }
        >
          Log in with it, or use a different email.
        </FormAlert>
      )}
      {formError === "network" && (
        <FormAlert tone="error" title="We couldn't create your account" className="mb-5">
          Check your connection, then select Create account again.
        </FormAlert>
      )}

      <div className="space-y-5">
        <TextField
          ref={(el) => {
            refs.current.name = el;
          }}
          id="signup-name"
          label="Full name"
          autoComplete="name"
          value={draft.name}
          onChange={(e) => set({ name: e.target.value }, "name")}
          onBlur={() => blur("name")}
          error={errors.name}
        />
        <TextField
          ref={(el) => {
            refs.current.email = el;
          }}
          id="signup-email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={draft.email}
          onChange={(e) => set({ email: e.target.value }, "email")}
          onBlur={() => blur("email")}
          error={errors.email ?? (formError === "email-taken" ? "This email already has an account." : undefined)}
        />
        <PasswordField
          ref={(el) => {
            refs.current.password = el;
          }}
          id="signup-password"
          label="Password"
          autoComplete="new-password"
          value={draft.password}
          onChange={(e) => set({ password: e.target.value }, "password")}
          onBlur={() => blur("password")}
          error={errors.password}
          hint={<PasswordRules password={draft.password} />}
        />
        <PasswordField
          ref={(el) => {
            refs.current.confirm = el;
          }}
          id="signup-confirm"
          label="Confirm password"
          autoComplete="new-password"
          value={draft.confirm}
          onChange={(e) => set({ confirm: e.target.value }, "confirm")}
          onBlur={() => blur("confirm")}
          error={errors.confirm}
        />
        <Checkbox
          ref={(el) => {
            refs.current.terms = el;
          }}
          id="signup-terms"
          checked={draft.terms}
          onChange={(checked) => {
            update({ terms: checked });
            if (touched.terms || errors.terms) {
              setErrors((er) => ({ ...er, terms: checked ? undefined : validateField("terms", { ...draft, terms: false }) }));
            }
          }}
          error={errors.terms}
        >
          I agree to the Terms of Use and Privacy Policy.
        </Checkbox>
      </div>

      <LoadingButton loading={submitting} loadingLabel="Creating account…" className="mt-7">
        Create account
      </LoadingButton>
    </form>
  );
};
