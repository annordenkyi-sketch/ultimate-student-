import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AtSign, CheckCircle2, MailCheck } from "lucide-react";
import { motion } from "framer-motion";
import { ActionButton } from "@/components/ActionButton";
import { FadeIn } from "@/components/Motion";
import { AuthError, auth } from "@/lib/auth";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!email.trim()) {
      setError("Enter the email on your account");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await auth.requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setLoading(false);
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Try again.");
      }
    }
  };

  const resend = async () => {
    setSent(false);
    setLoading(false);
    // Re-arm: the next submit will show the confirmation again.
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-slate-50"
    >
      <div className="mx-auto max-w-md px-6 pb-10 pt-6">
        <Link
          to="/login"
          aria-label="Back to log in"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white p-2 pr-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 motion-safe:active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to log in
        </Link>

        {!sent ? (
          <FadeIn delay={0.08} className="mt-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
              <MailCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900 display">
              Reset your password
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Enter your university email and we&apos;ll send you a link to
              choose a new password.
            </p>

            <form
              onSubmit={onSubmit}
              noValidate
              className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
            >
              <label
                htmlFor="reset-email"
                className="text-sm font-medium text-slate-800"
              >
                University email
              </label>
              <div className="relative mt-1.5">
                <AtSign
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="you@uni.edu.gh"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "reset-error" : undefined}
                  className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 ${
                    error
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-slate-200 focus:border-brand-500"
                  }`}
                />
              </div>
              {error && (
                <p id="reset-error" className="mt-1 text-xs text-rose-600">
                  {error}
                </p>
              )}

              <ActionButton
                type="submit"
                fullWidth
                loading={loading}
                className="mt-5"
              >
                {loading ? "Sending" : "Send reset link"}
              </ActionButton>
            </form>
          </FadeIn>
        ) : (
          <FadeIn delay={0.05} className="mt-8">
            <div
              role="status"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-card"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                <h2 className="text-base font-semibold display">Check your email</h2>
              </div>
              <p className="mt-2 text-sm text-emerald-900/80">
                We&apos;ve sent a password reset link to{" "}
                <strong className="font-semibold">{email}</strong>. It should
                arrive in a few minutes.
              </p>
            </div>

            <p className="mt-5 text-center text-sm text-slate-600">
              Didn&apos;t get it?{" "}
              <button
                type="button"
                onClick={resend}
                className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
              >
                Resend
              </button>
            </p>

            <Link to="/login" className="mt-5 block">
              <ActionButton variant="secondary" fullWidth>
                Back to log in
              </ActionButton>
            </Link>
          </FadeIn>
        )}
      </div>
    </motion.div>
  );
};
