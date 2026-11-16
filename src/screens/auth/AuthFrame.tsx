import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { FEATURE_IMAGES, unsplash, unsplashSrcSet } from "@/lib/images";
import { Logo } from "@/ui/Logo";

const photo = FEATURE_IMAGES.loginHero;

const WIDTHS = { md: "max-w-md", lg: "max-w-xl", xl: "max-w-5xl" } as const;

interface Props {
  children: ReactNode;
  progress?: ReactNode;
  /** Card width: md for forms, lg for lists, xl for the weekly timetable. */
  size?: keyof typeof WIDTHS;
}

/** Shared layout for sign-in, sign-up, verification and onboarding: frosted card on a campus photo. */
export const AuthFrame = ({ children, progress, size = "md" }: Props) => {
  const reduce = useReducedMotion();
  return (
    <div className="relative min-h-screen bg-oxford-ink">
      <img
        src={unsplash(photo.photoId, 1800, 70)}
        srcSet={unsplashSrcSet(photo.photoId)}
        sizes="100vw"
        alt=""
        aria-hidden="true"
        className="fixed inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-gradient-to-b from-oxford-ink/75 via-oxford-ink/55 to-oxford-ink/85"
      />

      <header className="relative z-10 mx-auto flex h-16 max-w-5xl items-center px-5 md:h-20 md:px-8">
        <Link to="/welcome" aria-label="Ultimate Student home page" className="rounded-full">
          <Logo tone="light" />
        </Link>
      </header>

      <main className="relative z-10 flex justify-center px-4 pb-12 pt-1 sm:pt-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`w-full ${WIDTHS[size]} rounded-2xl bg-oxford-paper/95 p-6 shadow-2xl shadow-black/30 ring-1 ring-white/40 backdrop-blur-xl sm:p-8`}
        >
          {progress}
          {children}
        </motion.div>
      </main>
    </div>
  );
};
