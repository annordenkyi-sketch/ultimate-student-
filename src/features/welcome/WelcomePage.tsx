import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  GraduationCap,
  LifeBuoy,
  LogIn,
  Map as MapIcon,
  Users,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { FadeIn, PressableDiv } from "@/components/Motion";
import { MOSAIC_IMAGES, unsplash, unsplashSrcSet } from "@/lib/images";

/* ─────────────────── Highlight pill behind one word ─────────────────── */

interface HighlightProps {
  children: ReactNode;
  tone: "sage" | "amber" | "blush";
  tilt?: number;
}

const TONE: Record<HighlightProps["tone"], string> = {
  sage: "bg-brand-200/70 text-ink",
  amber: "bg-accent-200/90 text-ink",
  blush: "bg-rose-200/70 text-ink",
};

const WordHighlight = ({ children, tone, tilt = -2 }: HighlightProps) => (
  <span className="relative inline-block px-[0.35em] py-[0.05em]">
    <span
      aria-hidden="true"
      className={`absolute inset-0 -z-[1] rounded-[0.75em] ${TONE[tone]}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    />
    <span className="relative">{children}</span>
  </span>
);

/* ─────────────────── Floating badge pills ─────────────────── */

interface Badge {
  label: string;
  sub?: string;
  tone: "white" | "amber" | "sage";
  className: string;
  delay: number;
}

const BADGES: Badge[] = [
  {
    label: "New opportunity",
    sub: "Internships this week",
    tone: "white",
    className: "left-[-6%] top-[14%]",
    delay: 0.4,
  },
  {
    label: "This week on campus",
    sub: "3 events",
    tone: "amber",
    className: "right-[-4%] top-[36%]",
    delay: 0.7,
  },
  {
    label: "You're all set",
    sub: "Personalised home",
    tone: "sage",
    className: "left-[-8%] bottom-[12%]",
    delay: 1.0,
  },
];

const TONES: Record<Badge["tone"], string> = {
  white: "bg-white text-ink ring-line",
  amber: "bg-accent-200 text-ink ring-accent-300",
  sage: "bg-brand-100 text-ink ring-brand-200",
};

const FloatingBadge = ({ label, sub, tone, className, delay }: Badge) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute hidden md:block ${className}`}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{
          duration: 3.6 + delay,
          ease: "easeInOut",
          repeat: Infinity,
          delay,
        }}
        className={`rounded-2xl px-4 py-3 shadow-xl shadow-slate-900/10 ring-1 ${TONES[tone]}`}
      >
        <p className="text-xs font-semibold">{label}</p>
        {sub && <p className="mt-0.5 text-[11px] text-muted">{sub}</p>}
      </motion.div>
    </motion.div>
  );
};

/* ─────────────────── Hero mosaic (static asymmetric grid) ─────────────────── */

const HeroMosaic = () => {
  const picks = [
    MOSAIC_IMAGES[0],
    MOSAIC_IMAGES[2],
    MOSAIC_IMAGES[3],
    MOSAIC_IMAGES[7],
  ];
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-[520px] md:max-w-none">
      <div className="grid grid-cols-6 grid-rows-6 gap-3">
        {/* Tall left tile */}
        <motion.img
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          src={unsplash(picks[0].photoId, 600, 65)}
          srcSet={unsplashSrcSet(picks[0].photoId)}
          sizes="(min-width:1024px) 320px, 50vw"
          alt={picks[0].alt}
          loading="eager"
          decoding="async"
          className="col-span-3 row-span-4 h-full w-full rounded-3xl bg-slate-800 object-cover"
        />
        {/* Top right tile */}
        <motion.img
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          src={unsplash(picks[1].photoId, 500, 65)}
          srcSet={unsplashSrcSet(picks[1].photoId)}
          sizes="(min-width:1024px) 260px, 40vw"
          alt={picks[1].alt}
          loading="eager"
          decoding="async"
          className="col-span-3 row-span-3 h-full w-full rounded-3xl bg-slate-800 object-cover"
        />
        {/* Bottom right tile */}
        <motion.img
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          src={unsplash(picks[2].photoId, 500, 65)}
          srcSet={unsplashSrcSet(picks[2].photoId)}
          sizes="(min-width:1024px) 260px, 40vw"
          alt={picks[2].alt}
          loading="lazy"
          decoding="async"
          className="col-span-3 row-span-3 h-full w-full rounded-3xl bg-slate-800 object-cover"
        />
        {/* Wide bottom tile */}
        <motion.img
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          src={unsplash(picks[3].photoId, 600, 65)}
          srcSet={unsplashSrcSet(picks[3].photoId)}
          sizes="(min-width:1024px) 320px, 50vw"
          alt={picks[3].alt}
          loading="lazy"
          decoding="async"
          className="col-span-3 row-span-2 h-full w-full rounded-3xl bg-slate-800 object-cover"
        />
      </div>

      {/* Decorative blob behind the mosaic */}
      <div
        aria-hidden="true"
        className="absolute -inset-10 -z-10 rounded-[48px] bg-gradient-to-br from-brand-300/20 via-accent-200/15 to-rose-200/15 blur-2xl"
      />

      {BADGES.map((b) => (
        <FloatingBadge key={b.label} {...b} />
      ))}

      {!reduce && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 top-6 h-16 w-16 rounded-full bg-accent-300"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
};

/* ─────────────────── Top nav ─────────────────── */

const TopNav = () => (
  <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
      <Link
        to="/welcome"
        className="inline-flex items-center gap-2 font-display text-base font-bold text-ink"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
        </span>
        Ultimate Student
      </Link>
      <nav className="flex items-center gap-2">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 motion-safe:active:scale-[0.97]"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          Log in
        </Link>
      </nav>
    </div>
  </header>
);

/* ─────────────────── Section components ─────────────────── */

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
  tint: string;
}

const FEATURES: Feature[] = [
  {
    icon: MapIcon,
    title: "Find your way around campus",
    body: "A clean map of lecture halls, labs, offices and services, with walking times from where you are.",
    tint: "bg-brand-100 text-brand-700",
  },
  {
    icon: Building2,
    title: "Discover hostels",
    body: "Filter by price, distance, water, power and food options. Save the ones you like for later.",
    tint: "bg-accent-100 text-accent-700",
  },
  {
    icon: Bell,
    title: "Stay on top of announcements",
    body: "Notices from academic, hostels, events and services — read when you have a moment, not scattered across apps.",
    tint: "bg-rose-100 text-rose-700",
  },
  {
    icon: Users,
    title: "Join events and clubs",
    body: "See what's happening this week on campus. RSVP, bring a friend, keep track of what you've saved.",
    tint: "bg-indigo-100 text-indigo-700",
  },
  {
    icon: Briefcase,
    title: "Find opportunities",
    body: "Internships, scholarships, open applications — the ones that fit your programme and level.",
    tint: "bg-brand-100 text-brand-700",
  },
  {
    icon: LifeBuoy,
    title: "Reach student services",
    body: "Clinic, counselling, security, chaplaincy and the dean's office — one tap to call, email or get directions.",
    tint: "bg-sky-100 text-sky-700",
  },
];

const WhatYouCanDo = () => (
  <section
    aria-labelledby="features-heading"
    className="mx-auto w-full max-w-6xl px-4 py-16 md:px-8 md:py-24"
  >
    <FadeIn>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-600">
        What you can do
      </p>
      <h2
        id="features-heading"
        className="mt-2 max-w-2xl font-display text-3xl font-bold tracking-tight text-ink md:text-5xl"
      >
        Everything campus throws at you,
        <br className="hidden md:block" /> in{" "}
        <WordHighlight tone="amber" tilt={-2}>one place</WordHighlight>.
      </h2>
    </FadeIn>

    <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((f, i) => {
        const Icon = f.icon;
        return (
          <li key={f.title}>
            <FadeIn delay={0.05 * i}>
              <PressableDiv className="h-full rounded-3xl border border-line bg-white p-6 transition hover:border-brand-300 hover:shadow-sm">
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${f.tint}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-ink">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {f.body}
                </p>
              </PressableDiv>
            </FadeIn>
          </li>
        );
      })}
    </ul>
  </section>
);

const STEPS = [
  {
    n: "01",
    title: "Create your account",
    body: "Name, email, a password — nothing else to install.",
  },
  {
    n: "02",
    title: "Tell us about you",
    body: "Student type, where you live, interests. We use it to filter what you see.",
  },
  {
    n: "03",
    title: "Get your personalised home",
    body: "Announcements, events, hostels and services that match you — nothing you don't need.",
  },
];

const HowItWorks = () => (
  <section
    aria-labelledby="steps-heading"
    className="relative overflow-hidden bg-brand-50 py-16 md:py-24"
  >
    <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
      <FadeIn>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-600">
          How it works
        </p>
        <h2
          id="steps-heading"
          className="mt-2 max-w-2xl font-display text-3xl font-bold tracking-tight text-ink md:text-5xl"
        >
          Three steps and{" "}
          <WordHighlight tone="blush" tilt={2}>you're in</WordHighlight>.
        </h2>
      </FadeIn>

      <ol className="relative mt-12 grid gap-6 md:grid-cols-3">
        {/* Dotted connector (desktop only) */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-7 hidden h-px w-2/3 -translate-x-1/2 md:block"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, #A6CFC2 0 6px, transparent 6px 14px)",
          }}
        />
        {STEPS.map((s, i) => (
          <li key={s.n}>
            <FadeIn delay={0.1 * i}>
              <div className="relative flex flex-col items-start rounded-3xl border border-line bg-white p-6 md:items-center md:text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 font-display text-base font-bold text-white shadow-lg shadow-brand-700/25">
                  {s.n}
                </span>
                <h3 className="mt-5 font-display text-lg font-bold tracking-tight text-ink">
                  {s.title}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
                  {s.body}
                </p>
              </div>
            </FadeIn>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

const FinalCTA = ({ onStart }: { onStart: () => void }) => (
  <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-8 md:py-24">
    <FadeIn>
      <div className="overflow-hidden rounded-[32px] bg-brand-800 px-6 py-12 text-center md:px-16 md:py-20">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-300">
          Ready when you are
        </p>
        <h2 className="mx-auto mt-3 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
          Your campus is a lot. Your app shouldn't be.{" "}
          <WordHighlight tone="amber" tilt={-2}>Get started</WordHighlight>.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-brand-100 md:text-base">
          Set up takes a minute. No credit card. No install.
        </p>
        <div className="mt-8">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-full bg-accent-400 px-7 py-3 text-sm font-semibold text-ink shadow-xl shadow-accent-500/30 transition hover:bg-accent-300 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.97]"
          >
            Get started
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </FadeIn>
  </section>
);

const SiteFooter = () => (
  <footer className="border-t border-line bg-paper">
    <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 text-sm md:flex-row md:items-center md:px-8">
      <Link
        to="/welcome"
        className="inline-flex items-center gap-2 font-display font-semibold text-ink"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
        </span>
        Ultimate Student
      </Link>
      <nav className="flex flex-wrap gap-x-6 gap-y-2 text-muted">
        <a href="#about" className="hover:text-brand-700">About</a>
        <a href="#contact" className="hover:text-brand-700">Contact</a>
        <a href="#privacy" className="hover:text-brand-700">Privacy</a>
        <a href="#terms" className="hover:text-brand-700">Terms</a>
      </nav>
      <p className="text-xs text-muted">© 2026 IID Global</p>
    </div>
  </footer>
);

/* ─────────────────── Page ─────────────────── */

export const WelcomePage = () => {
  const navigate = useNavigate();
  const goStart = () => navigate("/onboarding/account");

  return (
    <div className="min-h-screen bg-paper text-muted">
      <TopNav />

      {/* Hero */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-brand-50 via-paper to-paper"
        />

        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
          {/* Left — copy */}
          <div className="max-w-xl">
            <FadeIn>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-600">
                Ultimate Student
              </p>
            </FadeIn>
            <FadeIn delay={0.08}>
              <h1
                id="hero-heading"
                className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-6xl lg:text-7xl"
              >
                Your{" "}
                <WordHighlight tone="sage" tilt={-3}>campus</WordHighlight>{" "}
                community, in{" "}
                <WordHighlight tone="amber" tilt={2}>one app</WordHighlight>.
              </h1>
            </FadeIn>
            <FadeIn delay={0.18}>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted md:text-lg">
                Classes, hostels, announcements, events and opportunities —
                every part of student life in one calm place.
              </p>
            </FadeIn>

            <FadeIn delay={0.28}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={goStart}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-brand-700/25 transition hover:bg-brand-800 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.97]"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-brand-300 hover:bg-brand-50 motion-safe:active:scale-[0.97]"
                >
                  I have an account
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <p className="mt-6 text-xs text-muted">
                Built with students at IID partner universities.
              </p>
            </FadeIn>
          </div>

          {/* Right — mosaic + badges */}
          <div className="relative">
            <HeroMosaic />
          </div>
        </div>
      </section>

      <WhatYouCanDo />
      <HowItWorks />
      <FinalCTA onStart={goStart} />
      <SiteFooter />
    </div>
  );
};
