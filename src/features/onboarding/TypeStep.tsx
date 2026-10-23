import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlarmClock,
  ArrowLeft,
  CalendarDays,
  Check,
  Globe,
  GraduationCap,
  Megaphone,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ActionButton } from "@/components/ActionButton";
import { FadeIn, Stagger, StaggerChild } from "@/components/Motion";
import {
  TYPE_PHOTOS,
  unsplash,
  unsplashSrcSet,
  type UnsplashImage,
} from "@/lib/images";
import type { StudentType } from "@/data/types";
import { useOnboardingDraft } from "./OnboardingLayout";

type PhotoKey = StudentType | "default";

interface TypeOption {
  id: StudentType;
  title: string;
  description: string;
  photo: UnsplashImage;
}

const TYPES: TypeOption[] = [
  {
    id: "new",
    title: "New / first-year",
    description: "Just admitted and getting started",
    photo: TYPE_PHOTOS.new,
  },
  {
    id: "continuing",
    title: "Continuing student",
    description: "Already studying here",
    photo: TYPE_PHOTOS.continuing,
  },
  {
    id: "postgraduate",
    title: "Postgraduate",
    description: "Master's or PhD student",
    photo: TYPE_PHOTOS.postgraduate,
  },
  {
    id: "final-year",
    title: "Final year",
    description: "Preparing to graduate and move on",
    photo: TYPE_PHOTOS["final-year"],
  },
];

const CONTEXT_LINES: Partial<Record<StudentType, string>> = {
  new: "We'll guide you through orientation, registration and finding your way around campus.",
  continuing:
    "We'll keep you on top of deadlines, exams and what's happening on campus.",
  postgraduate:
    "We'll highlight research opportunities, supervisors' contacts and postgraduate deadlines.",
  "final-year": "We'll focus on graduation steps, jobs and internships.",
};

const PHOTO_KEYS: PhotoKey[] = [
  "default",
  "new",
  "continuing",
  "postgraduate",
  "final-year",
];

const CAPTIONS: Record<PhotoKey, string> = {
  default: "Your whole campus, in your pocket",
  prospective: "Find your way around campus",
  new: "Never miss a deadline",
  continuing: "Discover events and clubs",
  postgraduate: "Grab every opportunity",
  "final-year": "From first day to graduation",
};

const ROTATION_INTERVAL_MS = 4000;

/* ───────────────────────── Phone mockup ───────────────────────── */

const PhoneMockup = () => (
  <div className="w-[200px] rounded-[32px] bg-slate-900 p-2 shadow-2xl ring-1 ring-slate-800">
    <div className="overflow-hidden rounded-[26px] bg-slate-50 p-2.5">
      <div className="mb-2 flex items-center justify-between text-[8px] font-semibold text-slate-500">
        <span>9:41</span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          <span className="inline-block h-2 w-3 rounded-sm border border-slate-400" />
        </span>
      </div>
      <div className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 p-2.5 text-white">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/20 px-1.5 py-0.5 text-[6px] font-semibold uppercase tracking-wider text-amber-100 ring-1 ring-amber-200/40">
          <GraduationCap className="h-2 w-2" aria-hidden="true" />
          Ultimate Student
        </span>
        <p className="mt-1 text-[11px] font-bold leading-tight">Hi Ama,</p>
        <p className="text-[8px] opacity-80">What do you need today?</p>
      </div>
      <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-brand-100 bg-brand-50 p-1.5">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-brand-100 text-brand-700">
          <Megaphone className="h-2.5 w-2.5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[7px] font-semibold uppercase tracking-wide text-brand-700">
            Announcement
          </p>
          <p className="text-[8px] font-semibold leading-tight text-slate-900">
            Welcome week schedule
          </p>
        </div>
      </div>
      <div className="mt-1 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1.5">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-rose-100 text-rose-700">
          <AlarmClock className="h-2.5 w-2.5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[8px] font-semibold leading-tight text-slate-900">
            Registration
          </p>
          <p className="text-[7px] text-slate-500">In 2 days</p>
        </div>
      </div>
      <div className="mt-1 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1.5">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-sky-100 text-sky-700">
          <CalendarDays className="h-2.5 w-2.5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[8px] font-semibold leading-tight text-slate-900">
            Fresher's party
          </p>
          <p className="text-[7px] text-slate-500">Great Hall · Sat</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-around border-t border-slate-200 pt-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1 w-5 rounded-full ${
              i === 0 ? "bg-brand-600" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  </div>
);

/* ───────────────────────── Slideshow ───────────────────────── */

interface SlideshowProps {
  activeKey: PhotoKey;
  activeIndex: number;
  onDotClick: (index: number) => void;
  onPause: (pause: boolean) => void;
  reduce: boolean | null;
  variant: "desktop" | "mobile";
}

const Slideshow = ({
  activeKey,
  activeIndex,
  onDotClick,
  onPause,
  reduce,
  variant,
}: SlideshowProps) => (
  <div
    className="absolute inset-0"
    onPointerEnter={() => onPause(true)}
    onPointerLeave={() => onPause(false)}
    onPointerDown={() => onPause(true)}
    onPointerUp={() => onPause(false)}
  >
    {PHOTO_KEYS.map((key, i) => {
      const p = TYPE_PHOTOS[key];
      const isActive = activeKey === key;
      const even = i % 2 === 0;
      return (
        <motion.img
          key={key}
          src={unsplash(p.photoId, variant === "desktop" ? 1200 : 900, 65)}
          srcSet={unsplashSrcSet(p.photoId)}
          sizes={variant === "desktop" ? "45vw" : "100vw"}
          alt={p.alt}
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
          initial={{ opacity: key === "default" ? 1 : 0 }}
          animate={{
            opacity: isActive ? 1 : 0,
            scale: reduce ? 1 : even ? [1, 1.08, 1] : [1.08, 1, 1.08],
            x: reduce ? "0%" : even ? ["0%", "-2%", "0%"] : ["-2%", "0%", "-2%"],
          }}
          transition={{
            opacity: { duration: 0.8, ease: "easeInOut" },
            scale: { duration: 20, ease: "easeInOut", repeat: Infinity },
            x: { duration: 24, ease: "easeInOut", repeat: Infinity },
          }}
        />
      );
    })}

    <div
      aria-hidden="true"
      className={
        variant === "desktop"
          ? "absolute inset-0 bg-gradient-to-br from-slate-950/75 via-slate-950/50 to-brand-900/55"
          : "absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/15 to-white"
      }
    />

    {/* Caption */}
    <div
      className={`pointer-events-none absolute left-5 md:left-10 ${
        variant === "desktop" ? "top-10" : "top-4"
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeKey}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-slate-950/30 ring-1 ring-white/25 backdrop-blur-md"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300" />
          {CAPTIONS[activeKey]}
        </motion.div>
      </AnimatePresence>
    </div>

    {/* Dots */}
    <div
      role="tablist"
      aria-label="Image slideshow"
      className={`absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-950/40 px-2.5 py-1.5 backdrop-blur-md ${
        variant === "desktop" ? "bottom-10" : "bottom-4"
      }`}
    >
      {PHOTO_KEYS.map((key, i) => {
        const isActive = activeIndex === i;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Show image ${i + 1} of ${PHOTO_KEYS.length}: ${CAPTIONS[key]}`}
            onClick={() => onDotClick(i)}
            className={`h-1.5 rounded-full transition-all ${
              isActive ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        );
      })}
    </div>
  </div>
);

/* ───────────────────────── PhotoCard ───────────────────────── */

interface PhotoCardProps {
  option: TypeOption;
  isSelected: boolean;
  onSelect: () => void;
  reduce: boolean | null;
}

const PhotoCard = ({
  option,
  isSelected,
  onSelect,
  reduce,
}: PhotoCardProps) => (
  <label className="relative block cursor-pointer">
    <input
      type="radio"
      name="studentType"
      value={option.id}
      checked={isSelected}
      onChange={onSelect}
      className="peer sr-only"
    />
    <motion.div
      className={`flex flex-col overflow-hidden rounded-2xl border shadow-card transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 ${
        isSelected
          ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-lift"
      }`}
      whileHover={reduce ? undefined : { y: -2 }}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Row: photo + content */}
      <div className="flex flex-row items-center md:flex-col md:items-stretch">
        {/* Photo — round thumbnail on mobile, cover on desktop */}
        <div className="relative m-3 h-16 w-16 shrink-0 overflow-hidden rounded-full md:m-0 md:aspect-[16/10] md:h-auto md:w-full md:rounded-none">
          <img
            src={unsplash(option.photo.photoId, 500, 65)}
            srcSet={unsplashSrcSet(option.photo.photoId)}
            sizes="(min-width: 768px) 25vw, 96px"
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden md:block md:bg-gradient-to-t md:from-slate-950/30 md:to-transparent"
          />
        </div>

        {/* Content */}
        <div className="flex flex-1 items-center justify-between gap-2 py-3 pr-3 md:items-start md:p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 md:text-[15px]">
              {option.title}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {option.description}
            </p>
          </div>
          <div className="flex h-6 w-6 shrink-0 items-center justify-center">
            <AnimatePresence initial={false}>
              {isSelected ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={
                    reduce
                      ? { duration: 0.12 }
                      : { type: "spring", stiffness: 520, damping: 22 }
                  }
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white"
                >
                  <Check
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                    strokeWidth={3}
                  />
                </motion.span>
              ) : (
                <span
                  key="empty"
                  aria-hidden="true"
                  className="h-5 w-5 rounded-full border-2 border-slate-300"
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Context line — slides open under the selected card only */}
      <AnimatePresence initial={false}>
        {isSelected && CONTEXT_LINES[option.id] && (
          <motion.div
            key="context"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={
              reduce
                ? { duration: 0 }
                : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <div className="border-t border-brand-200/70 px-4 py-3">
              <p className="text-xs leading-relaxed text-slate-700 md:text-[13px]">
                {CONTEXT_LINES[option.id]}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  </label>
);

/* ───────────────────────── Component ───────────────────────── */

export const TypeStep = () => {
  const { draft, setDraft } = useOnboardingDraft();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const selected = draft.studentType ?? null;
  const [rotationIndex, setRotationIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);

  // Snap slideshow to the matching photo when a card is selected.
  useEffect(() => {
    if (!selected) return;
    const idx = PHOTO_KEYS.indexOf(selected);
    if (idx >= 0) setRotationIndex(idx);
  }, [selected]);

  // Auto-rotate while nothing selected and not paused.
  useEffect(() => {
    if (reduce || selected || isPaused) return;
    const timer = window.setInterval(() => {
      setRotationIndex((i) => (i + 1) % PHOTO_KEYS.length);
    }, ROTATION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [reduce, selected, isPaused]);

  const activeIndex = rotationIndex;
  const activeKey: PhotoKey = PHOTO_KEYS[activeIndex];
  const canContinue = selected !== null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue || loading) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 450));
    navigate("/onboarding/living");
  };

  return (
    <div className="md:grid md:min-h-[calc(100vh-120px)] md:grid-cols-[9fr_11fr]">
      {/* ─────── Desktop photo pane (45%) ─────── */}
      <aside className="relative hidden overflow-hidden md:block">
        <Slideshow
          activeKey={activeKey}
          activeIndex={activeIndex}
          onDotClick={setRotationIndex}
          onPause={setIsPaused}
          reduce={reduce}
          variant="desktop"
        />

        {/* Floating phone mockup */}
        <motion.div
          className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 lg:right-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        >
          <motion.div
            animate={reduce ? undefined : { y: [0, -10, 0] }}
            transition={{
              duration: 4.5,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          >
            <PhoneMockup />
          </motion.div>
        </motion.div>

        {/* Tagline */}
        <div className="pointer-events-none relative flex h-full flex-col justify-end p-10 text-white">
          <FadeIn delay={0.1} y={16}>
            <h2 className="max-w-xs text-3xl font-bold leading-tight display">
              Tell us where you are in your journey.
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-3 max-w-xs text-sm text-slate-200">
              We'll shape the app around your year, programme and plans.
            </p>
          </FadeIn>
        </div>
      </aside>

      {/* ─────── Content pane (55%) ─────── */}
      <section className="relative">
        {/* Mobile slideshow strip */}
        <div className="relative h-[200px] overflow-hidden md:hidden">
          <Slideshow
            activeKey={activeKey}
            activeIndex={activeIndex}
            onDotClick={setRotationIndex}
            onPause={setIsPaused}
            reduce={reduce}
            variant="mobile"
          />
        </div>

        <form
          id="type-form"
          onSubmit={onSubmit}
          noValidate
          className="mx-auto w-full max-w-2xl px-5 pb-32 pt-5 md:px-10 md:py-12 md:pb-14"
        >
          <FadeIn delay={0.08} y={12}>
            <h1 className="text-2xl font-bold text-slate-900 display md:text-3xl">
              Which best describes you?
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              We'll personalise your app around this.
            </p>
          </FadeIn>

          {/* Image card grid */}
          <fieldset className="mt-6">
            <legend className="sr-only">Student type</legend>
            <Stagger
              className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0"
              staggerChildren={0.06}
              delayChildren={0.1}
            >
              {TYPES.map((t) => (
                <StaggerChild key={t.id}>
                  <PhotoCard
                    option={t}
                    isSelected={selected === t.id}
                    onSelect={() => setDraft({ studentType: t.id })}
                    reduce={reduce}
                  />
                </StaggerChild>
              ))}
            </Stagger>
          </fieldset>

          {/* Pill-style international toggle */}
          <FadeIn delay={0.55} className="mt-6">
            <button
              type="button"
              onClick={() =>
                setDraft({ isInternational: !draft.isInternational })
              }
              aria-pressed={draft.isInternational}
              className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition motion-safe:active:scale-[0.97] ${
                draft.isInternational
                  ? "border-brand-500 bg-brand-50 text-brand-800 shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition ${
                  draft.isInternational
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
                aria-hidden="true"
              >
                {draft.isInternational ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : (
                  <Globe className="h-3 w-3" />
                )}
              </span>
              I'm an international student
            </button>
          </FadeIn>

          {/* Desktop footer: text Back + bold pulsing Continue */}
          <div className="mt-8 hidden items-center justify-between md:flex">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900 motion-safe:active:scale-[0.97]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>

            <motion.div
              animate={
                canContinue && !loading && !reduce
                  ? {
                      boxShadow: [
                        "0 0 0 0 rgba(79,70,229,0.0)",
                        "0 0 0 12px rgba(79,70,229,0.18)",
                        "0 0 0 0 rgba(79,70,229,0.0)",
                      ],
                    }
                  : { boxShadow: "0 0 0 0 rgba(79,70,229,0.0)" }
              }
              transition={{
                duration: 2.4,
                ease: "easeInOut",
                repeat: Infinity,
              }}
              className="rounded-xl"
            >
              <ActionButton
                type="submit"
                loading={loading}
                disabled={!canContinue}
                className="min-w-[180px] px-6"
              >
                {loading ? "Saving" : "Continue"}
              </ActionButton>
            </motion.div>
          </div>
        </form>

        {/* Mobile sticky Continue */}
        <div
          className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white px-5 py-3 shadow-[0_-6px_20px_-10px_rgba(15,23,42,0.15)] md:hidden"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <motion.div
            animate={
              canContinue && !loading && !reduce
                ? {
                    boxShadow: [
                      "0 0 0 0 rgba(79,70,229,0.0)",
                      "0 0 0 10px rgba(79,70,229,0.18)",
                      "0 0 0 0 rgba(79,70,229,0.0)",
                    ],
                  }
                : { boxShadow: "0 0 0 0 rgba(79,70,229,0.0)" }
            }
            transition={{
              duration: 2.4,
              ease: "easeInOut",
              repeat: Infinity,
            }}
            className="rounded-xl"
          >
            <ActionButton
              type="submit"
              form="type-form"
              fullWidth
              loading={loading}
              disabled={!canContinue}
            >
              {loading ? "Saving" : "Continue"}
            </ActionButton>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
