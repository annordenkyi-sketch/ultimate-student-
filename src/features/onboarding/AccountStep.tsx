import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AtSign,
  Eye,
  EyeOff,
  Lock,
  User,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { ActionButton } from "@/components/ActionButton";
import { FadeIn } from "@/components/Motion";
import { FEATURE_IMAGES, unsplash, unsplashSrcSet } from "@/lib/images";
import { AuthError, auth } from "@/lib/auth";
import { useOnboardingDraft } from "./OnboardingLayout";

interface FieldErrors {
  name?: string;
  identifier?: string;
  password?: string;
  confirm?: string;
  terms?: string;
  form?: string;
}

type Touched = Partial<Record<keyof FieldErrors, boolean>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validate identifier as either an email OR a student ID (≥5 chars). */
const isValidIdentifier = (v: string): boolean => {
  const t = v.trim();
  if (!t) return false;
  if (EMAIL_RE.test(t)) return true;
  // Student IDs are typically numeric or alphanumeric; accept ≥5 chars.
  return /^[A-Za-z0-9._-]{5,}$/.test(t);
};

/** Rough password strength 0–4. */
const scorePassword = (pw: string): number => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
};

const STRENGTH_META: Array<{ label: string; color: string; width: string }> = [
  { label: "", color: "bg-slate-200", width: "w-0" },
  { label: "Weak", color: "bg-rose-500", width: "w-1/4" },
  { label: "Okay", color: "bg-amber-500", width: "w-2/4" },
  { label: "Good", color: "bg-brand-500", width: "w-3/4" },
  { label: "Strong", color: "bg-emerald-500", width: "w-full" },
];

export const AccountStep = () => {
  const { draft, setDraft } = useOnboardingDraft();
  const navigate = useNavigate();
  const location = useLocation();
  const reduce = useReducedMotion();

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState<Touched>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Pre-fill the identifier if we arrived from the Log in page.
  useEffect(() => {
    const seed = (location.state as { identifier?: string } | null)?.identifier;
    if (seed && !draft.identifier) {
      setDraft({ identifier: seed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const strength = scorePassword(draft.password);
  const strengthMeta = STRENGTH_META[strength];

  const errors = useMemo((): FieldErrors => {
    const e: FieldErrors = {};
    if (draft.name.trim().length < 2) e.name = "Enter your full name";
    if (!isValidIdentifier(draft.identifier)) {
      e.identifier = "Enter a valid email or university ID";
    }
    if (draft.password.length < 8) {
      e.password = "Use at least 8 characters";
    }
    if (!confirmPassword) {
      e.confirm = "Confirm your password";
    } else if (confirmPassword !== draft.password) {
      e.confirm = "Passwords don't match";
    }
    if (!draft.termsAccepted) {
      e.terms = "Please accept the terms to continue";
    }
    return e;
  }, [draft, confirmPassword]);

  const isValid = Object.keys(errors).length === 0;

  const showErr = (key: keyof FieldErrors) =>
    touched[key] ? errors[key] : undefined;

  const markTouched = (key: keyof FieldErrors) =>
    setTouched((t) => ({ ...t, [key]: true }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Reveal all errors on submit attempt.
    setTouched({
      name: true,
      identifier: true,
      password: true,
      confirm: true,
      terms: true,
    });
    if (!isValid) return;

    setFormError(null);
    setLoading(true);
    try {
      await auth.signUp({
        name: draft.name.trim(),
        identifier: draft.identifier.trim(),
        password: draft.password,
        termsAccepted: draft.termsAccepted,
      });
      navigate("/onboarding/type");
    } catch (err) {
      setLoading(false);
      setFormError(
        err instanceof AuthError ? err.message : "Something went wrong. Try again.",
      );
    }
  };

  const img = FEATURE_IMAGES.onboardingAccount;

  return (
    <div className="md:grid md:min-h-[calc(100vh-120px)] md:grid-cols-2">
      {/* ─────── Desktop photo pane (hidden on mobile) ─────── */}
      <aside className="relative hidden overflow-hidden md:block">
        <motion.img
          src={unsplash(img.photoId, 1200, 65)}
          srcSet={unsplashSrcSet(img.photoId)}
          sizes="50vw"
          alt=""
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
          initial={{ opacity: 0, scale: 1 }}
          animate={
            reduce
              ? { opacity: 1 }
              : { opacity: 1, scale: [1, 1.06, 1], x: ["0%", "-1%", "0%"] }
          }
          transition={{
            opacity: { duration: 1, ease: "easeOut" },
            scale: { duration: 20, ease: "easeInOut", repeat: Infinity },
            x: { duration: 24, ease: "easeInOut", repeat: Infinity },
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-slate-950/55 to-brand-900/50"
        />
        <div className="relative flex h-full flex-col justify-end p-10 text-white">
          <FadeIn delay={0.1} y={16}>
            <h2 className="max-w-sm text-3xl font-bold leading-tight display">
              Join your campus community.
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-3 max-w-sm text-sm text-slate-200">
              One account unlocks classes, hostels, events and more.
            </p>
          </FadeIn>
        </div>
      </aside>

      {/* ─────── Content pane ─────── */}
      <section className="relative">
        {/* Mobile photo strip (25vh) with fade into form */}
        <div className="relative h-[25vh] min-h-[180px] overflow-hidden md:hidden">
          <motion.img
            src={unsplash(img.photoId, 900, 60)}
            srcSet={unsplashSrcSet(img.photoId)}
            sizes="100vw"
            alt=""
            className="absolute inset-0 h-full w-full object-cover will-change-transform"
            initial={{ opacity: 0, scale: 1 }}
            animate={
              reduce
                ? { opacity: 1 }
                : { opacity: 1, scale: [1, 1.08, 1] }
            }
            transition={{
              opacity: { duration: 1, ease: "easeOut" },
              scale: { duration: 20, ease: "easeInOut", repeat: Infinity },
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-slate-950/10 to-white"
          />
        </div>

        <form
          id="account-form"
          onSubmit={onSubmit}
          noValidate
          className="mx-auto w-full max-w-md px-5 pb-32 pt-5 md:px-8 md:py-10 md:pb-10"
        >
          <FadeIn delay={0.08} y={12}>
            <h1 className="text-2xl font-bold text-slate-900 display md:text-3xl">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              It takes less than a minute.
            </p>
          </FadeIn>

          {formError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
            >
              {formError}
            </div>
          )}

          <div className="mt-6 space-y-4">
            {/* Full name */}
            <Field
              id="name"
              label="Full name"
              icon={User}
              type="text"
              autoComplete="name"
              placeholder="Ama Mensah"
              value={draft.name}
              error={showErr("name")}
              onChange={(v) => setDraft({ name: v })}
              onBlur={() => markTouched("name")}
            />

            {/* Email or ID */}
            <Field
              id="identifier"
              label="Email or university ID"
              icon={AtSign}
              type="email"
              autoComplete="username"
              inputMode="email"
              placeholder="you@uni.edu.gh or 10123456"
              value={draft.identifier}
              error={showErr("identifier")}
              onChange={(v) => setDraft({ identifier: v })}
              onBlur={() => markTouched("identifier")}
            />

            {/* Password with strength */}
            <div>
              <Field
                id="password"
                label="Password"
                icon={Lock}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={draft.password}
                error={showErr("password")}
                onChange={(v) => setDraft({ password: v })}
                onBlur={() => markTouched("password")}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                }
              />
              {/* Strength indicator */}
              {draft.password && (
                <div className="mt-2" aria-live="polite">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full ${strengthMeta.color} ${strengthMeta.width} transition-all duration-300`}
                    />
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-slate-500">
                    {strengthMeta.label || "Keep going…"}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <Field
              id="confirm"
              label="Confirm password"
              icon={Lock}
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              error={showErr("confirm")}
              onChange={setConfirmPassword}
              onBlur={() => markTouched("confirm")}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  aria-pressed={showConfirm}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              }
            />

            {/* Terms */}
            <div>
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={draft.termsAccepted}
                  onChange={(e) => {
                    setDraft({ termsAccepted: e.target.checked });
                    markTouched("terms");
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>
                  I agree to the{" "}
                  <Link
                    to="/legal/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand-700 underline-offset-2 hover:underline"
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/legal/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand-700 underline-offset-2 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {showErr("terms") && (
                <p className="ml-6 mt-1 text-xs text-rose-600">
                  {showErr("terms")}
                </p>
              )}
            </div>
          </div>

          {/* Desktop Continue (inline). Mobile uses sticky bar below. */}
          <div className="mt-6 hidden md:block">
            <ActionButton
              type="submit"
              fullWidth
              loading={loading}
              disabled={!isValid}
              className="px-6"
            >
              {loading ? "Creating account" : "Continue"}
            </ActionButton>
          </div>
        </form>

        {/* Mobile sticky Continue */}
        <div
          className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white px-5 py-3 shadow-[0_-6px_20px_-10px_rgba(15,23,42,0.15)] md:hidden"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <ActionButton
            type="submit"
            form="account-form"
            fullWidth
            loading={loading}
            disabled={!isValid}
          >
            {loading ? "Creating account" : "Continue"}
          </ActionButton>
        </div>
      </section>
    </div>
  );
};

/* ───────────────────────────── Field ───────────────────────────── */

interface FieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  type: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  trailing?: React.ReactNode;
}

const Field = ({
  id,
  label,
  icon: Icon,
  type,
  autoComplete,
  inputMode,
  placeholder,
  value,
  error,
  onChange,
  onBlur,
  trailing,
}: FieldProps) => (
  <div>
    <label htmlFor={id} className="text-sm font-medium text-slate-800">
      {label}
    </label>
    <div className="relative mt-1.5">
      <Icon
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`block min-h-[44px] w-full rounded-xl border bg-white py-2.5 pl-9 ${
          trailing ? "pr-11" : "pr-3"
        } text-sm text-slate-900 placeholder:text-slate-400 ${
          error
            ? "border-rose-400 focus:border-rose-500"
            : "border-slate-200 focus:border-brand-500"
        }`}
      />
      {trailing && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2">
          {trailing}
        </span>
      )}
    </div>
    {error && (
      <p id={`${id}-error`} className="mt-1 text-xs text-rose-600">
        {error}
      </p>
    )}
  </div>
);
