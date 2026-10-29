import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { AuthLayout } from "@/features/auth/AuthLayout";
import type { UnsplashImage } from "@/lib/images";

interface Props {
  variant: "signin" | "signup";
  firstName: string;
  email: string;
  photo: UnsplashImage;
}

export const AuthSuccess = ({ variant, firstName, email, photo }: Props) => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const paneTitle =
    variant === "signin" ? "You're signed in." : "You're all set.";
  const paneSubtitle =
    variant === "signin"
      ? "Pick up where you left off."
      : "Welcome to the Ultimate Student community.";

  const headline =
    variant === "signin" ? `Welcome back, ${firstName}` : "Account created";
  const message =
    variant === "signin"
      ? "You're signed in. Head to your home to pick up where you left off."
      : "We've set everything up. Head to your home to explore.";

  return (
    <AuthLayout
      active={variant}
      title={paneTitle}
      subtitle={paneSubtitle}
      photo={photo}
    >
      <motion.div
        role="status"
        aria-live="polite"
        initial={
          reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }
        }
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex h-full flex-col items-center justify-center text-center"
      >
        {/* Success icon with scattered accents */}
        <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute left-0 top-2 h-3 w-3 rotate-12 rounded-sm bg-accent-400"
          />
          <span
            aria-hidden="true"
            className="absolute right-1 top-0 h-2.5 w-2.5 rounded-full bg-brand-300"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-2 right-0 h-3.5 w-3.5 rotate-45 border-[2.5px] border-brand-300"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-1 h-2.5 w-2.5 rounded-full bg-accent-500"
          />
          <motion.div
            initial={reduce ? { scale: 1 } : { scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.1,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600 shadow-xl shadow-brand-900/35"
          >
            <Check
              className="h-11 w-11 text-white"
              strokeWidth={3}
              aria-hidden="true"
            />
          </motion.div>
        </div>

        <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
          {headline}
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          {message}
        </p>
        <p className="mt-5 break-all font-display text-base font-bold text-ink">
          {email}
        </p>

        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          autoFocus
          className="mt-8 w-full rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold tracking-wider text-white transition hover:bg-accent-500 hover:text-brand-900 motion-safe:active:scale-[0.97]"
        >
          PROCEED
        </button>
      </motion.div>
    </AuthLayout>
  );
};
