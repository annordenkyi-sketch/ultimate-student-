import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AtSign, Eye, EyeOff, Lock } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { AuthLayout } from "@/features/auth/AuthLayout";
import { AuthSuccess } from "@/features/auth/AuthSuccess";
import { FEATURE_IMAGES } from "@/lib/images";
import { AuthError, auth } from "@/lib/auth";
import { useProfile } from "@/hooks/useProfile";

interface FieldErrors {
  identifier?: string;
  password?: string;
  form?: string;
}

interface SuccessState {
  firstName: string;
  email: string;
}

export const LoginPage = () => {
  const { setProfile } = useProfile();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!identifier.trim()) next.identifier = "Enter your email or university ID";
    if (!password) next.password = "Password is required";
    return next;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const profile = await auth.signIn({
        identifier: identifier.trim(),
        password,
        remember,
      });
      setProfile(profile);
      setSuccess({
        firstName: profile.name.split(" ")[0] || profile.name,
        email: profile.identifier,
      });
    } catch (err) {
      setLoading(false);
      if (err instanceof AuthError) {
        setErrors({ form: err.message });
      } else {
        setErrors({ form: "Something went wrong. Try again." });
      }
    }
  };

  if (success) {
    return (
      <AuthSuccess
        variant="signin"
        firstName={success.firstName}
        email={success.email}
        photo={FEATURE_IMAGES.loginHero}
      />
    );
  }

  return (
    <AuthLayout
      active="signin"
      title="Welcome back."
      subtitle="Pick up where you left off — classes, hostels, events and more."
      photo={FEATURE_IMAGES.loginHero}
    >
      <form onSubmit={onSubmit} noValidate aria-labelledby="login-heading">
        <h1
          id="login-heading"
          className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl"
        >
          Sign in to your account.
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
                type="text"
                autoComplete="username"
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors({ ...errors, password: undefined });
                }}
                placeholder="Enter your password"
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

        <div className="mt-4 flex items-center justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
            />
            Remember me
          </label>
          <Link
            to="/login/forgot"
            className="text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <ActionButton
          type="submit"
          fullWidth
          loading={loading}
          className="mt-6 tracking-wider"
        >
          {loading ? "Signing in" : "SIGN IN"}
        </ActionButton>

        <p className="mt-5 text-center text-xs text-muted">
          By clicking the Sign In button, you agree to the{" "}
          <Link
            to="/legal/privacy"
            className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </AuthLayout>
  );
};
