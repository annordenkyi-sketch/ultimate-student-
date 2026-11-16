import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { services } from "@/services";
import { useSession } from "@/session/SessionProvider";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { TextField } from "@/ui/form/TextField";
import { isEmail } from "@/ui/form/validation";
import { AuthHeading } from "./parts";

const UG_EMAIL = /@st\.ug\.edu\.gh$/i;

const validate = (value: string): string | null => {
  const v = value.trim();
  if (!v) return "Enter your student ID or UG student email.";
  if (/^\d+$/.test(v)) return v.length === 8 ? null : "Student IDs have 8 digits.";
  if (isEmail(v)) return UG_EMAIL.test(v) ? null : "Use your UG student email, ending in @st.ug.edu.gh.";
  return "Enter an 8-digit student ID or a UG student email.";
};

interface Props {
  onVerified: () => void;
  /** Not verified or pending review. */
  onLimited: () => void;
}

/** Flow 01 "UG eligibility check": student ID or UG email against university records. */
export const EligibilityPanel = ({ onVerified, onLimited }: Props) => {
  const { account, setAccount } = useSession();
  const [identifier, setIdentifier] = useState(account?.lastVerification?.identifier ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!account) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate(identifier);
    setFieldError(problem);
    if (problem) return;

    setChecking(true);
    setFailed(false);
    try {
      const updated = await services.eligibility.check(account.id, identifier);
      setAccount(updated);
      if (updated.verification === "verified") onVerified();
      else onLimited();
    } catch {
      setFailed(true);
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col items-center py-12 text-center">
        <Loader2 className="h-9 w-9 animate-spin text-oxford-ink" aria-hidden="true" />
        <p className="mt-5 font-serif text-xl font-medium text-oxford-ink">Verifying…</p>
        <p className="mt-1 text-sm text-oxford-mute">Checking your details with university records.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <AuthHeading title="Confirm you're a UG student">
        We check your details against university records. Verified students get Home, For You,
        their timetable and lecture reminders.
      </AuthHeading>

      {failed && (
        <FormAlert tone="error" title="We couldn't reach university records" className="mb-5">
          Check your connection, then select Verify again.
        </FormAlert>
      )}

      <TextField
        id="eligibility-id"
        label="Student ID or UG email"
        autoComplete="off"
        inputMode="email"
        value={identifier}
        onChange={(e) => {
          setIdentifier(e.target.value);
          if (fieldError) setFieldError(null);
        }}
        error={fieldError ?? undefined}
        hint="Your 8-digit student ID, or your email ending in @st.ug.edu.gh."
      />

      <LoadingButton className="mt-6">Verify</LoadingButton>

      <p className="mt-5 text-center text-sm text-oxford-mute">
        Not a UG student?{" "}
        <Link
          to="/explore"
          className="font-semibold text-oxford-ink underline underline-offset-4 hover:no-underline"
        >
          Continue with public content only
        </Link>
      </p>
    </form>
  );
};
