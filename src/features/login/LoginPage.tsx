import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AtSign,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  LogIn,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { ActionButton } from "@/components/ActionButton";
import { FadeIn } from "@/components/Motion";
import { FEATURE_IMAGES, unsplash, unsplashSrcSet } from "@/lib/images";
import { AuthError, auth } from "@/lib/auth";
import { useProfile } from "@/hooks/useProfile";

interface FieldErrors {
  identifier?: string;
  password?: string;
  form?: string;
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setProfile } = useProfile();
  const reduce = useReducedMotion();
  const img = FEATURE_IMAGES.loginHero;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!identifier.trim()) {
      next.identifier = "Enter your email or university ID";
    }
    if (!password) {
      next.password = "Password is required";
    }
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
      navigate("/", { replace: true });
    } catch (err) {
      setLoading(false);
      if (err instanceof AuthError) {
        // Keep the email field; only reset password focus-wise.
        setErrors({ form: err.message });
      } else {
        setErrors({ form: "Something went wrong. Try again." });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-ink lg:grid lg:grid-cols-[1.05fr_1fr]"
    >
      {/* ───── Hero / brand pane ───── */}
      <div className="relative h-[36vh] min-h-[260px] overflow-hidden lg:h-auto lg:min-h-screen">
        <motion.img
          src={unsplash(img.photoId, 1600, 65)}
          srcSet={unsplashSrcSet(img.photoId)}
          sizes="(min-width: 1024px) 55vw, 100vw"
          alt=""
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
          initial={{ opacity: 0, scale: 1 }}
          animate={
            reduce
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  scale: [1, 1.08, 1],
                  x: ["0%", "-1.5%", "0%"],
                }
          }
          transition={{
            opacity: { duration: 1.1, ease: "easeOut" },
            scale: {
              duration: 18,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "loop",
            },
            x: {
              duration: 22,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "loop",
            },
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/55 to-ink lg:bg-gradient-to-br lg:from-ink/80 lg:via-ink/55 lg:to-brand-900/60"
        />

        <div className="relative mx-auto flex h-full max-w-xl flex-col px-6 pb-10 pt-5 text-white lg:max-w-none lg:px-12 lg:py-10 xl:px-20">
          <div className="flex items-center justify-between">
            <Link
              to="/welcome"
              aria-label="Back to welcome"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 p-2 pr-3 text-sm font-medium text-white backdrop-blur-md transition hover:border-white/50 hover:bg-white/20 motion-safe:active:scale-[0.97]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-200/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent-100 ring-1 ring-accent-200/40 backdrop-blur-sm">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
              Ultimate Student
            </span>
          </div>

          <div className="mt-auto lg:max-w-md">
            <FadeIn delay={0.08} y={16}>
              <h1 className="text-[32px] font-bold leading-[1.1] display lg:text-5xl">
                Back on campus.
              </h1>
            </FadeIn>
          </div>
        </div>
      </div>

      {/* ───── Form pane ───── */}
      <FadeIn
        delay={0.2}
        y={20}
        className="relative z-10 -mt-6 flex-1 lg:mt-0 lg:flex lg:items-center lg:justify-center lg:bg-paper lg:px-10"
      >
        <form
          onSubmit={onSubmit}
          noValidate
          aria-labelledby="login-heading"
          className="min-h-full rounded-t-3xl bg-white px-6 pb-8 pt-7 shadow-hero lg:min-h-0 lg:w-full lg:max-w-md lg:rounded-3xl lg:border lg:border-line lg:px-8 lg:py-9 lg:shadow-lift"
        >
          <h2
            id="login-heading"
            className="text-xl font-bold text-ink display"
          >
            Log in
          </h2>
          <p className="mt-1 text-sm text-muted">
            Use your university email and password.
          </p>

          {/* Form-level error */}
          {errors.form && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
            >
              {errors.form}
            </div>
          )}

          <div className="mt-5 space-y-4">
            {/* Identifier */}
            <div>
              <label
                htmlFor="identifier"
                className="text-sm font-medium text-ink"
              >
                Email or university ID
              </label>
              <div className="relative mt-1.5">
                <AtSign
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errors.identifier) setErrors({ ...errors, identifier: undefined });
                  }}
                  placeholder="you@uni.edu.gh or 10123456"
                  aria-invalid={errors.identifier ? true : undefined}
                  aria-describedby={errors.identifier ? "identifier-error" : undefined}
                  className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted ${
                    errors.identifier
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-line focus:border-brand-500"
                  }`}
                />
              </div>
              {errors.identifier && (
                <p id="identifier-error" className="mt-1 text-xs text-rose-600">
                  {errors.identifier}
                </p>
              )}
            </div>

            {/* Password with show/hide */}
            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-ink"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  placeholder="Enter your password"
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-10 text-sm text-ink placeholder:text-muted ${
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:bg-paper hover:text-ink"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1 text-xs text-rose-600">
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          {/* Remember + forgot */}
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
            leading={<LogIn className="h-4 w-4" aria-hidden="true" />}
            className="mt-6"
          >
            {loading ? "Signing in" : "Log in"}
          </ActionButton>

          <p className="mt-6 text-center text-sm text-muted">
            New here?{" "}
            <Link
              to="/onboarding/account"
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              Get started →
            </Link>
          </p>
        </form>
      </FadeIn>
    </motion.div>
  );
};
