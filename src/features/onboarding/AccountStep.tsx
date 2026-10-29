import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { AtSign, Eye, EyeOff, Lock, User } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { AuthLayout } from "@/features/auth/AuthLayout";
import { AuthSuccess } from "@/features/auth/AuthSuccess";
import { FEATURE_IMAGES } from "@/lib/images";
import { AuthError, auth } from "@/lib/auth";
import { useProfile } from "@/hooks/useProfile";
import type { Profile } from "@/data/types";

interface FieldErrors {
  name?: string;
  identifier?: string;
  password?: string;
  terms?: string;
  form?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidIdentifier = (v: string): boolean => {
  const t = v.trim();
  if (!t) return false;
  if (EMAIL_RE.test(t)) return true;
  return /^[A-Za-z0-9._-]{5,}$/.test(t);
};

interface SuccessState {
  firstName: string;
  email: string;
}

export const AccountStep = () => {
  const location = useLocation();
  const { setProfile } = useProfile();
  const seededIdentifier =
    (location.state as { identifier?: string } | null)?.identifier ?? "";

  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState(seededIdentifier);
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (name.trim().length < 2) e.name = "Enter your full name";
    if (!isValidIdentifier(identifier))
      e.identifier = "Enter a valid email or university ID";
    if (password.length < 8) e.password = "Use at least 8 characters";
    if (!termsAccepted) e.terms = "Please accept the terms to continue";
    return e;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const next = validate();
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await auth.signUp({
        name: name.trim(),
        identifier: identifier.trim(),
        password,
        termsAccepted,
      });
      const trimmedName = name.trim();
      const trimmedId = identifier.trim();
      const profile: Profile = {
        id: `u-${Date.now()}`,
        name: trimmedName,
        identifier: trimmedId,
        studentType: "continuing",
        isInternational: false,
        living: "on-campus",
        interests: [],
        createdAt: new Date().toISOString(),
      };
      setProfile(profile);
      setSuccess({
        firstName: trimmedName.split(" ")[0] || trimmedName,
        email: trimmedId,
      });
    } catch (err) {
      setLoading(false);
      setErrors({
        form:
          err instanceof AuthError
            ? err.message
            : "Something went wrong. Try again.",
      });
    }
  };

  if (success) {
    return (
      <AuthSuccess
        variant="signup"
        firstName={success.firstName}
        email={success.email}
        photo={FEATURE_IMAGES.onboardingAccount}
      />
    );
  }

  return (
    <AuthLayout
      active="signup"
      title="Start your journey."
      subtitle="One account unlocks classes, hostels, events and more."
      photo={FEATURE_IMAGES.onboardingAccount}
    >
      <form onSubmit={onSubmit} noValidate aria-labelledby="signup-heading">
        <h1
          id="signup-heading"
          className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl"
        >
          Create your account.
        </h1>

        {errors.form && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {errors.form}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {/* Full name */}
          <div>
            <label htmlFor="name" className="text-sm font-semibold text-ink">
              Full name
            </label>
            <div className="relative mt-1.5">
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder="Ama Mensah"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? "name-error" : undefined}
                className={`block min-h-[44px] w-full rounded-xl border bg-white py-2.5 pl-3 pr-10 text-sm text-ink placeholder:text-muted ${
                  errors.name
                    ? "border-rose-400 focus:border-rose-500"
                    : "border-line focus:border-brand-500"
                }`}
              />
              <User
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
            </div>
            {errors.name && (
              <p id="name-error" className="mt-1 text-xs text-rose-600">
                {errors.name}
              </p>
            )}
          </div>

          {/* Identifier */}
          <div>
            <label
              htmlFor="identifier"
              className="text-sm font-semibold text-ink"
            >
              E-Mail
            </label>
            <div className="relative mt-1.5">
              <input
                id="identifier"
                type="email"
                autoComplete="username"
                inputMode="email"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errors.identifier)
                    setErrors({ ...errors, identifier: undefined });
                }}
                placeholder="you@uni.edu.gh or 10123456"
                aria-invalid={errors.identifier ? true : undefined}
                aria-describedby={errors.identifier ? "identifier-error" : undefined}
                className={`block min-h-[44px] w-full rounded-xl border bg-white py-2.5 pl-3 pr-10 text-sm text-ink placeholder:text-muted ${
                  errors.identifier
                    ? "border-rose-400 focus:border-rose-500"
                    : "border-line focus:border-brand-500"
                }`}
              />
              <AtSign
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
            </div>
            {errors.identifier && (
              <p id="identifier-error" className="mt-1 text-xs text-rose-600">
                {errors.identifier}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="text-sm font-semibold text-ink">
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors({ ...errors, password: undefined });
                }}
                placeholder="At least 8 characters"
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={`block min-h-[44px] w-full rounded-xl border bg-white py-2.5 pl-3 pr-20 text-sm text-ink placeholder:text-muted ${
                  errors.password
                    ? "border-rose-400 focus:border-rose-500"
                    : "border-line focus:border-brand-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-10 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:bg-paper hover:text-ink"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
              <Lock
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
            </div>
            {errors.password && (
              <p id="password-error" className="mt-1 text-xs text-rose-600">
                {errors.password}
              </p>
            )}
          </div>
        </div>

        {/* Terms */}
        <div className="mt-4">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (errors.terms) setErrors({ ...errors, terms: undefined });
              }}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-brand-600 focus:ring-brand-500"
            />
            <span>
              I agree to the{" "}
              <Link
                to="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                to="/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.terms && (
            <p className="ml-6 mt-1 text-xs text-rose-600">{errors.terms}</p>
          )}
        </div>

        <ActionButton
          type="submit"
          fullWidth
          loading={loading}
          className="mt-6 tracking-wider"
        >
          {loading ? "Creating account" : "SIGN UP"}
        </ActionButton>
      </form>
    </AuthLayout>
  );
};
