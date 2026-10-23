import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  Dumbbell,
  GraduationCap,
  Home as HomeIcon,
  MapPin,
  Music,
  Palette,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ActionButton } from "@/components/ActionButton";
import { FadeIn, Stagger, StaggerChild } from "@/components/Motion";
import { unsplash, unsplashSrcSet } from "@/lib/images";
import type { LivingSituation } from "@/data/types";
import { useOnboardingDraft } from "./OnboardingLayout";
import { INTERESTS, MIN_INTERESTS, type InterestOption } from "./interests";

/* ───────────────────────────── Data ───────────────────────────── */

const ON_CAMPUS_HALLS = [
  "Legon Hall",
  "Volta Hall",
  "Jubilee Hall",
  "International Students' Hostel",
];

interface LivingTile {
  id: LivingSituation;
  title: string;
  icon: LucideIcon;
  gradient: string;
}

const LIVING_TILES: LivingTile[] = [
  {
    id: "on-campus",
    title: "On campus",
    icon: HomeIcon,
    gradient: "from-brand-500 to-brand-700",
  },
  {
    id: "off-campus",
    title: "Off campus",
    icon: Building2,
    gradient: "from-amber-500 to-amber-700",
  },
];

/* ──────────────────────── Floating background ──────────────────────── */

interface FloatIcon {
  icon: LucideIcon;
  className: string;
  size: string;
  delay: number;
  duration: number;
}

const FLOAT_ICONS: FloatIcon[] = [
  {
    icon: BookOpen,
    className: "left-6 top-10 lg:left-16 lg:top-24",
    size: "h-8 w-8",
    delay: 0,
    duration: 11,
  },
  {
    icon: MapPin,
    className: "right-6 top-8 lg:right-20 lg:top-32",
    size: "h-7 w-7",
    delay: 1.5,
    duration: 13,
  },
  {
    icon: Music,
    className: "left-4 bottom-28 lg:left-10 lg:top-1/2",
    size: "h-7 w-7",
    delay: 2.8,
    duration: 12,
  },
  {
    icon: Dumbbell,
    className: "right-4 bottom-20 lg:right-12 lg:top-[55%]",
    size: "h-7 w-7",
    delay: 4.1,
    duration: 10,
  },
  {
    icon: GraduationCap,
    className: "hidden lg:block lg:bottom-16 lg:left-20",
    size: "h-10 w-10",
    delay: 3.3,
    duration: 14,
  },
  {
    icon: Palette,
    className: "hidden lg:block lg:bottom-20 lg:right-20",
    size: "h-8 w-8",
    delay: 0.8,
    duration: 15,
  },
];

const FloatingBackdrop = ({ reduce }: { reduce: boolean | null }) => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 overflow-hidden"
  >
    {FLOAT_ICONS.map((f, i) => {
      const Icon = f.icon;
      return (
        <motion.span
          key={i}
          className={`absolute text-slate-200/70 ${f.className}`}
          initial={{ opacity: 0, y: 10 }}
          animate={
            reduce
              ? { opacity: 0.6, y: 0 }
              : {
                  opacity: [0.35, 0.65, 0.35],
                  y: [0, -10, 0],
                  rotate: [0, 4, -4, 0],
                }
          }
          transition={{
            duration: f.duration,
            ease: "easeInOut",
            repeat: Infinity,
            delay: f.delay,
          }}
        >
          <Icon className={f.size} aria-hidden="true" />
        </motion.span>
      );
    })}
  </div>
);

/* ───────────────────────────── Interest tiles ───────────────────────────── */

interface InterestsGridProps {
  selectedLabels: string[];
  onToggle: (label: string) => void;
  reduce: boolean | null;
  canContinueB: boolean;
  selectedCount: number;
}

const InterestsGrid = ({
  selectedLabels,
  onToggle,
  reduce,
  canContinueB,
  selectedCount,
}: InterestsGridProps) => (
  <div
    role="group"
    aria-label="Interests (choose at least 3)"
    className="mt-8"
  >
    <Stagger
      className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
      staggerChildren={0.04}
      delayChildren={0.08}
    >
      {INTERESTS.map((opt) => (
        <StaggerChild key={opt.label}>
          <InterestTile
            option={opt}
            isSelected={selectedLabels.includes(opt.label)}
            onToggle={() => onToggle(opt.label)}
            reduce={reduce}
          />
        </StaggerChild>
      ))}
    </Stagger>

    {/* Counter */}
    <p
      aria-live="polite"
      className={`mt-6 text-sm font-medium ${
        canContinueB ? "text-brand-700" : "text-slate-500"
      }`}
    >
      {selectedCount} selected
      {!canContinueB && (
        <>
          {" · "}
          <span className="text-slate-400">
            pick {MIN_INTERESTS - selectedCount} more
          </span>
        </>
      )}
    </p>
  </div>
);

interface InterestTileProps {
  option: InterestOption;
  isSelected: boolean;
  onToggle: () => void;
  reduce: boolean | null;
}

const InterestTile = ({
  option,
  isSelected,
  onToggle,
  reduce,
}: InterestTileProps) => {
  const [loaded, setLoaded] = useState(false);
  const Icon = option.icon;

  return (
    <motion.button
      type="button"
      aria-pressed={isSelected}
      onClick={onToggle}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative block aspect-square w-full overflow-hidden rounded-2xl text-left ring-offset-2 transition ${
        isSelected
          ? "shadow-[0_0_28px_rgba(79,70,229,0.35)] ring-[3px] ring-brand-500"
          : "ring-1 ring-slate-200 hover:ring-slate-300"
      }`}
    >
      {/* Blurred placeholder shown until the image loads */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 ${
          loaded ? "opacity-0" : "animate-pulse"
        }`}
      />

      {/* Image with hover + selected zoom */}
      <motion.img
        src={unsplash(option.photo.photoId, 600, 65)}
        srcSet={unsplashSrcSet(option.photo.photoId)}
        sizes="(min-width: 768px) 25vw, 45vw"
        alt={option.alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
        animate={{
          scale: reduce ? 1 : isSelected ? 1.08 : 1,
          opacity: loaded ? 1 : 0,
        }}
        whileHover={reduce ? undefined : { scale: isSelected ? 1.08 : 1.05 }}
        transition={{
          scale: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.3 },
        }}
      />

      {/* Dark gradient for text contrast */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent"
      />

      {/* Icon chip top-left */}
      <span
        aria-hidden="true"
        className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white shadow-lg shadow-slate-950/30 ring-1 ring-white/25 backdrop-blur-md"
      >
        <Icon className="h-3.5 w-3.5" />
      </span>

      {/* Check mark top-right */}
      <AnimatePresence>
        {isSelected && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={
              reduce
                ? { duration: 0.12 }
                : { type: "spring", stiffness: 520, damping: 22 }
            }
            className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg"
            aria-hidden="true"
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>

      {/* Label at the bottom */}
      <span className="absolute inset-x-0 bottom-0 block px-3 pb-3 pt-6 text-left text-sm font-bold leading-tight text-white drop-shadow md:text-[15px]">
        {option.label}
      </span>
    </motion.button>
  );
};

/* ───────────────────────────── Component ───────────────────────────── */

export const LivingStep = () => {
  const { draft, setDraft } = useOnboardingDraft();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const [searchParams] = useSearchParams();

  // Resume at Part B if the user already picked living, or if the caller
  // (e.g. the Done step's "Edit interests" link) requested it via ?part=B.
  const [part, setPart] = useState<"A" | "B">(() => {
    if (searchParams.get("part") === "B") return "B";
    return draft.living ? "B" : "A";
  });
  const [direction, setDirection] = useState<1 | -1>(1);
  const [loading, setLoading] = useState(false);

  const canAdvanceA = !!draft.living;
  const canContinueB = draft.interests.length >= MIN_INTERESTS;
  const canSubmit = canAdvanceA && canContinueB;

  const toggleInterest = (label: string) => {
    setDraft({
      interests: draft.interests.includes(label)
        ? draft.interests.filter((i) => i !== label)
        : [...draft.interests, label],
    });
  };

  const goToA = () => {
    setDirection(-1);
    setPart("A");
  };
  const goToB = () => {
    setDirection(1);
    setPart("B");
  };

  const onBack = () => {
    if (part === "B") {
      goToA();
    } else {
      navigate(-1);
    }
  };

  const onPrimary = async () => {
    if (part === "A") {
      if (!canAdvanceA) return;
      goToB();
      return;
    }
    if (!canSubmit || loading) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 450));
    navigate("/onboarding/done");
  };

  const primaryEnabled = part === "A" ? canAdvanceA : canSubmit;
  const primaryLabel =
    part === "A" ? "Next" : loading ? "Saving" : "Continue";

  // Slide direction for animations
  const slideVariants = {
    enter: (dir: 1 | -1) => ({
      x: reduce ? 0 : 24 * dir,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: 1 | -1) => ({
      x: reduce ? 0 : -24 * dir,
      opacity: 0,
    }),
  };

  return (
    <div className="relative min-h-[calc(100vh-120px)] bg-slate-50">
      <FloatingBackdrop reduce={reduce} />

      {/* Column — narrow for Part A, full-width for Part B */}
      <div
        className={`relative mx-auto w-full px-5 pb-32 pt-8 md:px-10 md:pt-14 ${
          part === "A" ? "max-w-[720px]" : "max-w-7xl"
        }`}
      >
        {/* Mini part indicator */}
        <FadeIn>
          <div className="mb-8 flex items-center gap-3 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full transition ${
                  part === "A" || draft.living
                    ? "bg-brand-600"
                    : "bg-slate-300"
                }`}
              />
              <span
                className={`h-px w-6 transition ${
                  part === "B" ? "bg-brand-500" : "bg-slate-200"
                }`}
              />
              <span
                className={`h-2 w-2 rounded-full transition ${
                  part === "B" ? "bg-brand-600" : "bg-slate-300"
                }`}
              />
            </div>
            <span className="uppercase tracking-wider">
              Part {part === "A" ? 1 : 2} of 2
            </span>
          </div>
        </FadeIn>

        {/* Sliding parts */}
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {part === "A" ? (
            <motion.section
              key="A"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.32,
                ease: [0.22, 1, 0.36, 1],
              }}
              aria-labelledby="partA-heading"
            >
              <h1
                id="partA-heading"
                className="text-3xl font-bold leading-tight text-slate-900 display md:text-4xl"
              >
                Where do you live?
              </h1>

              <fieldset className="mt-10">
                <legend className="sr-only">Living situation</legend>
                <Stagger
                  className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5"
                  staggerChildren={0.08}
                  delayChildren={0.1}
                >
                  {LIVING_TILES.map((tile) => {
                    const Icon = tile.icon;
                    const isSelected = draft.living === tile.id;
                    return (
                      <StaggerChild key={tile.id}>
                        <label className="relative block cursor-pointer">
                          <input
                            type="radio"
                            name="living"
                            value={tile.id}
                            checked={isSelected}
                            onChange={() => setDraft({ living: tile.id })}
                            className="peer sr-only"
                          />
                          <motion.div
                            className={`relative min-h-[160px] overflow-hidden rounded-3xl border-2 p-6 text-left transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 ${
                              isSelected
                                ? "border-brand-500 bg-brand-50 shadow-lift"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-lift"
                            }`}
                            whileHover={reduce ? undefined : { y: -3 }}
                            whileTap={reduce ? undefined : { scale: 0.98 }}
                            transition={{
                              duration: 0.18,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          >
                            <span
                              className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tile.gradient} text-white shadow-lg`}
                            >
                              <Icon
                                className="h-7 w-7"
                                aria-hidden="true"
                              />
                            </span>
                            <h3 className="text-xl font-bold text-slate-900 display">
                              {tile.title}
                            </h3>

                            <AnimatePresence>
                              {isSelected && (
                                <motion.span
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={
                                    reduce
                                      ? { duration: 0.12 }
                                      : {
                                          type: "spring",
                                          stiffness: 520,
                                          damping: 22,
                                        }
                                  }
                                  className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white shadow"
                                  aria-hidden="true"
                                >
                                  <Check
                                    className="h-4 w-4"
                                    strokeWidth={3}
                                  />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </label>
                      </StaggerChild>
                    );
                  })}
                </Stagger>
              </fieldset>

              {/* Hostel dropdown (only for on-campus) */}
              <AnimatePresence initial={false}>
                {draft.living === "on-campus" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
                      <label
                        htmlFor="hostel"
                        className="flex items-baseline justify-between text-sm font-medium text-slate-800"
                      >
                        <span>Which hall or hostel?</span>
                        <span className="text-xs font-normal text-slate-400">
                          Optional
                        </span>
                      </label>
                      <select
                        id="hostel"
                        value={draft.hostel ?? ""}
                        onChange={(e) =>
                          setDraft({ hostel: e.target.value || undefined })
                        }
                        className="mt-2 block min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500"
                      >
                        <option value="">Not sure yet</option>
                        {ON_CAMPUS_HALLS.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      {draft.hostel && (
                        <button
                          type="button"
                          onClick={() => setDraft({ hostel: undefined })}
                          className="mt-2 text-xs font-semibold text-brand-700 hover:text-brand-800"
                        >
                          Skip for now
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          ) : (
            <motion.section
              key="B"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.32,
                ease: [0.22, 1, 0.36, 1],
              }}
              aria-labelledby="partB-heading"
            >
              <h1
                id="partB-heading"
                className="text-3xl font-bold leading-tight text-slate-900 display md:text-4xl"
              >
                What are you into?
              </h1>
              <p className="mt-2 text-sm text-slate-500 md:text-base">
                Pick at least {MIN_INTERESTS}. We'll show you events and
                opportunities to match.
              </p>

              <InterestsGrid
                selectedLabels={draft.interests}
                onToggle={toggleInterest}
                reduce={reduce}
                canContinueB={canContinueB}
                selectedCount={draft.interests.length}
              />
            </motion.section>
          )}
        </AnimatePresence>

      </div>

      {/* Sticky footer — always visible on both breakpoints */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white shadow-[0_-6px_20px_-10px_rgba(15,23,42,0.15)]"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3 md:px-10">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 rounded-md px-2 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 motion-safe:active:scale-[0.97]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
          <motion.div
            animate={
              primaryEnabled && !loading && !reduce
                ? {
                    boxShadow: [
                      "0 0 0 0 rgba(79,70,229,0.0)",
                      "0 0 0 12px rgba(79,70,229,0.16)",
                      "0 0 0 0 rgba(79,70,229,0.0)",
                    ],
                  }
                : { boxShadow: "0 0 0 0 rgba(79,70,229,0.0)" }
            }
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
            className="flex-1 rounded-xl md:flex-initial"
          >
            <ActionButton
              onClick={onPrimary}
              loading={loading}
              disabled={!primaryEnabled}
              leading={
                part === "A" ? (
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                ) : undefined
              }
              className="w-full min-w-[180px] md:px-8"
            >
              {primaryLabel}
            </ActionButton>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
