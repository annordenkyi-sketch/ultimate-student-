import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  GraduationCap,
  LogIn,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FadeIn } from "@/components/Motion";
import { unsplash, unsplashSrcSet, type UnsplashImage } from "@/lib/images";

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

/* ─────────────────── Hero photos (free Unsplash License) ─────────────────── */

const HERO_PHOTOS: UnsplashImage[] = [
  {
    id: "hero-grads",
    photoId: "photo-1769905226600-1d447fe7d020",
    alt: "African graduates in caps and gowns gathered in an auditorium",
    credit: { name: "Blessfield John", profile: "https://unsplash.com/@blessfield" },
  },
  {
    id: "hero-campus",
    photoId: "photo-1616428394230-ba242d33e3ba",
    alt: "African students walking together across a university campus",
    credit: { name: "Jonah Brown", profile: "https://unsplash.com/@jonahbrown" },
  },
  {
    id: "hero-study",
    photoId: "photo-1761370981247-1dfd749ec96b",
    alt: "Three African women reviewing study notes together, laughing",
    credit: { name: "Muhammad-Taha Ibrahim", profile: "https://unsplash.com/@planeteelevene" },
  },
  {
    id: "hero-phones",
    photoId: "photo-1758270704464-f980b03b9633",
    alt: "Students looking at their phones together in a lecture hall",
    credit: { name: "Vitaly Gariev", profile: "https://unsplash.com/@silverkblack" },
  },
  {
    id: "hero-sports",
    photoId: "photo-1600077063877-22118d6290eb",
    alt: "A group of young African men playing football on a university pitch",
    credit: { name: "Omar Ramadan", profile: "https://unsplash.com/@omarvellous14" },
  },
];

const SLIDE_MS = 5500;

/* ─────────────────── Hero carousel ─────────────────── */

const HeroCarousel = ({
  i,
  onPick,
  paused,
}: {
  i: number;
  onPick: (n: number) => void;
  paused: boolean;
}) => {
  const reduce = useReducedMotion();

  return (
    <>
      {/* Preload the rest so cross-fade never flickers */}
      <div aria-hidden="true" className="hidden">
        {HERO_PHOTOS.map((p) => (
          <img key={p.id} src={unsplash(p.photoId, 2000, 70)} alt="" />
        ))}
      </div>

      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={HERO_PHOTOS[i].id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 1.1, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <motion.img
              src={unsplash(HERO_PHOTOS[i].photoId, 2000, 70)}
              srcSet={unsplashSrcSet(HERO_PHOTOS[i].photoId)}
              sizes="100vw"
              alt={HERO_PHOTOS[i].alt}
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover"
              initial={reduce ? undefined : { scale: 1.02, x: 0, y: 0 }}
              animate={
                reduce
                  ? undefined
                  : paused
                    ? { scale: 1.02, x: 0, y: 0 }
                    : { scale: 1.14, x: -24, y: -12 }
              }
              transition={{ duration: SLIDE_MS / 1000 + 0.5, ease: "linear" }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Dark gradient overlay for readability */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/55 to-ink/85"
        />
      </div>

      {/* Dot indicators */}
      <div
        role="tablist"
        aria-label="Hero slides"
        className="absolute inset-x-0 bottom-20 z-10 flex items-center justify-center gap-2 md:bottom-24"
      >
        {HERO_PHOTOS.map((p, idx) => {
          const active = idx === i;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Show photo ${idx + 1} of ${HERO_PHOTOS.length}`}
              onClick={() => onPick(idx)}
              className={`h-2 rounded-full transition-all duration-500 ${
                active
                  ? "w-10 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          );
        })}
      </div>

    </>
  );
};

/* ─────────────────── Hero overlay nav ─────────────────── */

const HeroNav = () => (
  <div className="absolute inset-x-0 top-0 z-20 flex h-16 items-center justify-between px-4 md:h-20 md:px-8">
    <Link
      to="/welcome"
      className="inline-flex items-center gap-2 font-display text-base font-bold text-white md:text-lg"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/40 backdrop-blur-sm">
        <GraduationCap className="h-4 w-4" aria-hidden="true" />
      </span>
      Ultimate Student
    </Link>
    <Link
      to="/login"
      className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-ink/30 transition hover:bg-brand-800 motion-safe:active:scale-[0.97]"
    >
      <LogIn className="h-4 w-4" aria-hidden="true" />
      Log in
    </Link>
  </div>
);

/* ─────────────────── Scroll-down arrow ─────────────────── */

const ScrollDown = () => {
  const reduce = useReducedMotion();
  const onClick = () => {
    const next = document.getElementById("after-hero");
    next?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Scroll to see more"
      className="absolute inset-x-0 bottom-6 z-10 mx-auto flex w-12 flex-col items-center text-white/80 transition hover:text-white"
    >
      <motion.span
        animate={reduce ? undefined : { y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-white/40 backdrop-blur-sm"
      >
        <ChevronDown className="h-5 w-5" aria-hidden="true" />
      </motion.span>
    </button>
  );
};

/* ─────────────────── Section components ─────────────────── */

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
    id="after-hero"
    aria-labelledby="steps-heading"
    className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-16"
  >
    <div className="overflow-hidden rounded-[28px] bg-brand-50 px-5 py-7 md:px-10 md:py-12 lg:px-14 lg:py-14">
      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-5 lg:gap-14">
        {/* Left — eyebrow + headline */}
        <div className="lg:col-span-2">
          <FadeIn>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-600">
              How it works
            </p>
            <h2
              id="steps-heading"
              className="mt-1.5 font-display text-2xl font-bold leading-[1.05] tracking-tight text-ink md:text-4xl lg:text-5xl"
            >
              Three steps and{" "}
              <WordHighlight tone="blush" tilt={2}>you're in</WordHighlight>.
            </h2>
          </FadeIn>
        </div>

        {/* Right — stacked step cards */}
        <ol className="relative space-y-2.5 lg:col-span-3 lg:space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.n}>
              <FadeIn delay={0.08 * (i + 1)} y={6}>
                <div className="flex items-start gap-3 rounded-2xl border border-line bg-white p-3 md:gap-4 md:p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 font-display text-xs font-bold text-white shadow-md shadow-brand-700/20 md:h-11 md:w-11 md:text-sm">
                    {s.n}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-bold tracking-tight text-ink md:text-lg">
                      {s.title}
                    </h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted md:mt-1 md:text-sm">
                      {s.body}
                    </p>
                  </div>
                </div>
              </FadeIn>
            </li>
          ))}
        </ol>
      </div>
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

  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || paused) return;
    const id = window.setInterval(
      () => setI((n) => (n + 1) % HERO_PHOTOS.length),
      SLIDE_MS,
    );
    return () => window.clearInterval(id);
  }, [reduce, paused]);

  return (
    <div className="min-h-screen bg-paper text-muted">
      {/* ─── Full-screen hero ─── */}
      <section
        aria-labelledby="hero-heading"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative isolate h-screen min-h-[640px] w-full overflow-hidden"
      >
        <HeroCarousel i={i} onPick={setI} paused={paused} />
        <HeroNav />

        {/* Headline + CTAs centred on the image */}
        <div className="relative z-10 flex h-full items-center">
          <div className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-24 pt-24 md:px-8">
            <div className="max-w-3xl">
              <FadeIn>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-300">
                  Ultimate Student
                </p>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1
                  id="hero-heading"
                  className="mt-3 font-display text-5xl font-bold leading-[1.02] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
                >
                  Your{" "}
                  <WordHighlight tone="sage" tilt={-3}>campus</WordHighlight>{" "}
                  community, in{" "}
                  <WordHighlight tone="amber" tilt={2}>one app</WordHighlight>.
                </h1>
              </FadeIn>
              <FadeIn delay={0.4}>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={goStart}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-7 py-3 text-sm font-semibold text-white shadow-xl shadow-ink/40 transition hover:bg-brand-800 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.97]"
                  >
                    Get started
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 motion-safe:active:scale-[0.97]"
                  >
                    I have an account
                  </Link>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>

        <ScrollDown />
      </section>

      {/* Everything below is untouched */}
      <HowItWorks />
      <FinalCTA onStart={goStart} />
      <SiteFooter />
    </div>
  );
};
