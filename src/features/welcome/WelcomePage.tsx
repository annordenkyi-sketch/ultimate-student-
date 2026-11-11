import {
  useEffect,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  AtSign,
  BookOpen,
  Building2,
  Check,
  GraduationCap,
  Lock,
  MapPin,
  UserPlus,
  Users,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import {
  FEATURE_IMAGES,
  MOSAIC_IMAGES,
  unsplash,
  unsplashSrcSet,
  type UnsplashImage,
} from "@/lib/images";

/* ─────────────────────────────── Top nav ─────────────────────────────── */

const TopNav = ({ onStart }: { onStart: () => void }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-300 ${
        scrolled
          ? "border-b border-oxford-rule/80 bg-oxford-paper/95 backdrop-blur"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-5 md:h-20 md:px-8">
        <Link
          to="/welcome"
          aria-label="Ultimate Student — home"
          className="group flex items-center gap-2.5"
        >
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-oxford-ink/15 bg-oxford-paper"
          >
            <GraduationCap className="h-5 w-5 text-oxford-ink" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.18em] text-oxford-ink">
              Ultimate
            </span>
            <span className="font-serif text-[15px] font-bold uppercase tracking-[0.22em] text-oxford-ink">
              Student
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <Link
            to="/login"
            className="hidden items-center whitespace-nowrap rounded-md border border-oxford-ink/15 bg-white px-4 py-2 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream sm:inline-flex"
          >
            Log in
          </Link>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center whitespace-nowrap rounded-md bg-oxford-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-oxford-ink2 motion-safe:active:scale-[0.97]"
          >
            Join
          </button>
        </div>
      </div>
    </header>
  );
};

/* ─────────────────────────────── Hero ─────────────────────────────── */

const HERO_PHOTOS = [
  MOSAIC_IMAGES[0],                      // Graduates in caps and gowns in an auditorium
  MOSAIC_IMAGES[2],                      // Group of students sitting together outside a building
  MOSAIC_IMAGES[4],                      // Students on a university campus (Jonah Brown)
  FEATURE_IMAGES.onboardingInterests,    // Group of students laughing together outdoors
  FEATURE_IMAGES.loginHero,              // Students talking and laughing in a lecture hall
];

const PHOTO_MS = 5000;

const RotatingPhotos = ({ reduce }: { reduce: boolean }) => {
  const [idx, setIdx] = useState(0);

  // Preload photos so there's no flicker on first cycle
  useEffect(() => {
    HERO_PHOTOS.forEach((p) => {
      const img = new Image();
      img.src = unsplash(p.photoId, 2000, 70);
    });
  }, []);

  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(
      () => setIdx((i) => (i + 1) % HERO_PHOTOS.length),
      PHOTO_MS,
    );
    return () => window.clearInterval(t);
  }, [reduce]);

  if (reduce) {
    const only = HERO_PHOTOS[0];
    return (
      <img
        src={unsplash(only.photoId, 2000, 70)}
        srcSet={unsplashSrcSet(only.photoId)}
        sizes="(min-width:1024px) 1200px, 100vw"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  return (
    <div aria-hidden="true" className="absolute inset-0">
      <AnimatePresence initial={false}>
        <motion.img
          key={idx}
          src={unsplash(HERO_PHOTOS[idx].photoId, 2000, 70)}
          srcSet={unsplashSrcSet(HERO_PHOTOS[idx].photoId)}
          sizes="(min-width:1024px) 1200px, 100vw"
          alt=""
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1.08 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.4, ease: [0.22, 1, 0.36, 1] },
            scale: { duration: 7, ease: "linear" },
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>
    </div>
  );
};

const Hero = ({ reduce, onStart }: { reduce: boolean; onStart: () => void }) => {
  const [walkStep, setWalkStep] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(
      () => setWalkStep((s) => (s + 1) % WALK_STEPS.length),
      2600,
    );
    return () => window.clearInterval(t);
  }, [reduce]);

  return (
    <section aria-label="Welcome" className="relative bg-oxford-paper">
      <div className="mx-auto max-w-[1280px] px-5 pb-6 pt-6 md:px-8 md:pb-10 md:pt-8">
        <div className="relative overflow-hidden rounded-[18px] bg-oxford-ink">
          <RotatingPhotos reduce={reduce} />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-oxford-ink/85 via-oxford-ink/55 to-oxford-ink/70"
          />

          <div className="relative z-10 grid grid-cols-1 gap-10 px-6 pb-10 pt-12 md:gap-16 md:px-12 md:pb-14 md:pt-20 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-14 lg:px-16 lg:py-24">
            <div className="max-w-2xl">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="font-sans text-xs font-medium uppercase tracking-[0.3em] text-oxford-sand"
              >
                Ultimate Student · 2026
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="mt-4 font-serif text-[42px] font-medium leading-[1.02] text-white md:text-[72px] lg:text-[88px]"
              >
                Your whole university{" "}
                <span className="italic text-oxford-sand">in one app</span>.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="mt-6 max-w-xl text-base leading-relaxed text-white/85 md:text-lg"
              >
                Lectures, hostels, announcements, campus life — one account, one calm app.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-9 flex flex-wrap items-center gap-3"
              >
                <button
                  type="button"
                  onClick={onStart}
                  className="inline-flex items-center gap-2 rounded-md bg-oxford-sand px-6 py-3.5 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-sandSoft motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.97]"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
                >
                  Log in
                </Link>
              </motion.div>
            </div>

            {/* Desktop phone — beside hero text */}
            <div className="hidden w-[220px] shrink-0 lg:block">
              <WalkPhoneUI step={walkStep} reduce={reduce} size="md" />
            </div>
          </div>
        </div>

        {/* Mobile phone — under hero */}
        <div className="mt-8 flex justify-center lg:hidden">
          <WalkPhoneUI step={walkStep} reduce={reduce} size="md" />
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────── Walkthrough phone ─────────────────────────────── */

interface WalkStep {
  id: string;
  flow: "login" | "signup";
  Scene: (p: SceneProps) => JSX.Element;
}

interface SceneProps {
  reduce: boolean;
  active: boolean;
}

const WalkPhoneUI = ({
  step,
  reduce,
  size,
}: {
  step: number;
  reduce: boolean;
  size: "sm" | "md";
}) => {
  const current = WALK_STEPS[step];
  const SceneComponent = current.Scene;
  const flowLabel = current.flow === "login" ? "Log in" : "Sign up";
  const isLogin = current.flow === "login";

  return (
    <div className="flex flex-col items-center gap-2">
      <AnimatePresence mode="wait">
        <motion.span
          key={current.flow}
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 1 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-oxford-paper/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-oxford-ink shadow-sm shadow-oxford-ink/20 backdrop-blur"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isLogin ? "bg-oxford-ink" : "bg-oxford-gold"}`}
            aria-hidden="true"
          />
          {flowLabel}
        </motion.span>
      </AnimatePresence>

      <motion.div
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
        className={`relative aspect-[9/19.5] rounded-[32px] bg-oxford-ink p-[5px] shadow-[0_28px_60px_-18px_rgba(14,27,58,0.55)] ring-1 ring-white/10 ${
          size === "sm" ? "w-full" : "w-[220px]"
        }`}
      >
        <div className="absolute left-1/2 top-[5px] z-20 h-5 w-24 -translate-x-1/2 rounded-b-xl bg-oxford-ink" />
        <div className="relative h-full w-full overflow-hidden rounded-[26px] bg-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={reduce ? { opacity: 1 } : { opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 1 } : { opacity: 0, x: -14 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full"
            >
              <SceneComponent reduce={reduce} active />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

/* ─────────────────────────────── Walk mini-screens ─────────────────────────────── */

const MiniStatus = () => (
  <div className="flex items-center justify-between px-4 pt-5 text-[9px] font-semibold text-oxford-ink">
    <span>9:41</span>
    <div className="flex items-center gap-1 text-oxford-ink/70">
      <Wifi className="h-2.5 w-2.5" aria-hidden="true" />
      <span className="ml-1 h-1.5 w-3 rounded-sm bg-oxford-ink/70" />
    </div>
  </div>
);

const TapPulse = ({
  reduce,
  delay = 0.9,
}: {
  reduce: boolean;
  delay?: number;
}) => {
  if (reduce) return null;
  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay * 0.2 }}
    >
      <motion.span
        className="absolute inset-0 rounded-full border-2 border-oxford-ink/50"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.2, 0.4], opacity: [0, 0.8, 0] }}
        transition={{ duration: 1.4, delay, ease: "easeOut" }}
      />
      <span className="relative h-3.5 w-3.5 rounded-full bg-oxford-ink/80" />
    </motion.span>
  );
};

const TypeText = ({
  text,
  reduce,
  delay = 0,
  speed = 0.05,
}: {
  text: string;
  reduce: boolean;
  delay?: number;
  speed?: number;
}) => {
  if (reduce) return <span>{text}</span>;
  return (
    <span>
      {text.split("").map((c, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.05, delay: delay + i * speed }}
        >
          {c === " " ? " " : c}
        </motion.span>
      ))}
    </span>
  );
};

const MiniLandingTop = () => (
  <div className="flex items-center justify-between px-4 pt-3">
    <span className="flex items-center gap-1.5">
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-oxford-ink/15">
        <GraduationCap className="h-2.5 w-2.5 text-oxford-ink" aria-hidden="true" />
      </span>
      <span className="font-serif text-[8px] font-bold uppercase tracking-[0.2em] text-oxford-ink">
        Ultimate
      </span>
    </span>
    <span className="rounded border border-oxford-ink/15 bg-white px-2 py-0.5 text-[8px] font-semibold text-oxford-ink">
      Menu
    </span>
  </div>
);

const MiniHeroArt = () => (
  <div className="relative mx-3 mt-3 h-20 overflow-hidden rounded-md bg-oxford-cream">
    <img
      src={unsplash(FEATURE_IMAGES.campusGreeting.photoId, 400, 50)}
      alt=""
      className="h-full w-full object-cover"
    />
    <div className="absolute inset-0 bg-oxford-ink/35" />
    <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-serif text-base font-medium text-white/75">
      Ultimate
    </span>
  </div>
);

/* Scene 1 — Log in: Tap Log in */
const Scene1_TapLogin = ({ reduce }: SceneProps) => (
  <div className="flex h-full flex-col bg-oxford-paper">
    <MiniStatus />
    <MiniLandingTop />
    <MiniHeroArt />
    <div className="mt-3 px-4">
      <h4 className="font-serif text-[12px] font-semibold leading-tight text-oxford-ink">
        Your campus in one app.
      </h4>
      <p className="mt-1 text-[8px] leading-tight text-oxford-mute">
        Already have an account?
      </p>
    </div>
    <div className="mt-auto flex flex-col gap-2 px-4 pb-5">
      <button
        type="button"
        disabled
        tabIndex={-1}
        className="w-full rounded-md bg-oxford-ink py-1.5 text-[9px] font-semibold text-white"
      >
        Get started
      </button>
      <div className="relative">
        <button
          type="button"
          disabled
          tabIndex={-1}
          className="w-full rounded-md border border-oxford-ink/30 bg-white py-1.5 text-[9px] font-semibold text-oxford-ink"
        >
          Log in
        </button>
        <TapPulse reduce={reduce} />
      </div>
    </div>
  </div>
);

/* Scene 2 — Log in: Enter email */
const Scene2_EnterEmail = ({ reduce, active }: SceneProps) => (
  <div className="flex h-full flex-col bg-white">
    <MiniStatus />
    <div className="px-4 pt-3">
      <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-oxford-mute">
        Sign in
      </p>
      <h4 className="mt-0.5 font-serif text-[12px] font-semibold text-oxford-ink">
        Welcome back.
      </h4>
    </div>
    <div className="mt-3 flex flex-1 flex-col gap-2.5 px-4">
      <div>
        <p className="text-[7px] font-semibold uppercase tracking-wider text-oxford-mute">
          Email or ID
        </p>
        <div className="relative mt-0.5">
          <div className="flex items-center gap-1.5 rounded-md border-2 border-oxford-ink bg-white px-2 py-1.5">
            <AtSign className="h-2.5 w-2.5 text-oxford-ink" aria-hidden="true" />
            <span className="text-[9px] font-medium text-oxford-ink">
              {active ? <TypeText text="ama@ug.edu.gh" reduce={reduce} delay={0.5} /> : "ama@ug.edu.gh"}
            </span>
            {!reduce && (
              <motion.span
                className="ml-0.5 inline-block h-2.5 w-0.5 bg-oxford-ink"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
          <TapPulse reduce={reduce} delay={0.1} />
        </div>
      </div>
      <div>
        <p className="text-[7px] font-semibold uppercase tracking-wider text-oxford-mute">
          Password
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 rounded-md border border-oxford-ink/15 bg-white px-2 py-1.5">
          <Lock className="h-2.5 w-2.5 text-oxford-ink/40" aria-hidden="true" />
          <span className="text-[9px] text-oxford-ink/30">Enter password</span>
        </div>
      </div>
    </div>
    <div className="px-4 pb-5">
      <button
        type="button"
        disabled
        tabIndex={-1}
        className="w-full rounded-md bg-oxford-ink/30 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-white"
      >
        Sign in
      </button>
    </div>
  </div>
);

/* Scene 3 — Log in: Enter password and Sign in */
const Scene3_EnterPassword = ({ reduce, active }: SceneProps) => (
  <div className="flex h-full flex-col bg-white">
    <MiniStatus />
    <div className="px-4 pt-3">
      <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-oxford-mute">
        Sign in
      </p>
      <h4 className="mt-0.5 font-serif text-[12px] font-semibold text-oxford-ink">
        Welcome back.
      </h4>
    </div>
    <div className="mt-3 flex flex-1 flex-col gap-2.5 px-4">
      <div>
        <p className="text-[7px] font-semibold uppercase tracking-wider text-oxford-mute">
          Email or ID
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 rounded-md border border-oxford-ink/15 bg-white px-2 py-1.5">
          <AtSign className="h-2.5 w-2.5 text-oxford-ink/60" aria-hidden="true" />
          <span className="text-[9px] font-medium text-oxford-ink">ama@ug.edu.gh</span>
        </div>
      </div>
      <div>
        <p className="text-[7px] font-semibold uppercase tracking-wider text-oxford-mute">
          Password
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 rounded-md border-2 border-oxford-ink bg-white px-2 py-1.5">
          <Lock className="h-2.5 w-2.5 text-oxford-ink" aria-hidden="true" />
          <span className="font-mono text-[10px] font-bold tracking-widest text-oxford-ink">
            {active ? <TypeText text="••••••••" reduce={reduce} delay={0.3} speed={0.08} /> : "••••••••"}
          </span>
        </div>
      </div>
    </div>
    <div className="relative px-4 pb-5">
      <button
        type="button"
        disabled
        tabIndex={-1}
        className="w-full rounded-md bg-oxford-ink py-1.5 text-[9px] font-semibold uppercase tracking-wider text-white"
      >
        Sign in
      </button>
      <TapPulse reduce={reduce} delay={1.2} />
    </div>
  </div>
);

/* Scene 4 — Log in: Confirmation */
const Scene4_SignInConfirm = ({ reduce }: SceneProps) => (
  <div className="flex h-full flex-col bg-white px-4">
    <MiniStatus />
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <motion.div
        initial={reduce ? { scale: 1 } : { scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-oxford-ink shadow-xl shadow-oxford-ink/35"
      >
        <Check className="h-8 w-8 text-white" strokeWidth={3} aria-hidden="true" />
      </motion.div>
      <h4 className="mt-4 font-serif text-[12px] font-semibold text-oxford-ink">
        Welcome back, Ama.
      </h4>
      <p className="mt-1 text-[8px] leading-tight text-oxford-mute">
        You're signed in. Head to Home.
      </p>
      <p className="mt-2 font-serif text-[9px] font-bold text-oxford-ink">
        ama@ug.edu.gh
      </p>
    </div>
    <div className="relative pb-5">
      <button
        type="button"
        disabled
        tabIndex={-1}
        className="w-full rounded-md bg-oxford-ink py-1.5 text-[9px] font-semibold uppercase tracking-widest text-white"
      >
        Proceed
      </button>
      <TapPulse reduce={reduce} delay={0.9} />
    </div>
  </div>
);

/* Scene 5 — Home dashboard */
const Scene5_Home = ({ reduce }: SceneProps) => (
  <div className="flex h-full flex-col bg-oxford-paper">
    <MiniStatus />
    <div className="px-4 pt-3">
      <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-oxford-gold">
        Good morning
      </p>
      <h4 className="mt-0.5 font-serif text-base font-bold leading-none text-oxford-ink">
        Ama
      </h4>
      <p className="mt-1 text-[7px] text-oxford-mute">
        Thursday, 12 November
      </p>
    </div>

    <motion.div
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="mx-3 mt-2.5 rounded-lg bg-oxford-ink p-2 text-white"
    >
      <p className="text-[7px] font-semibold uppercase tracking-wider text-oxford-sand">
        Next class
      </p>
      <p className="mt-0.5 text-[10px] font-bold leading-tight">
        CPEN 312 — Software Eng.
      </p>
      <p className="mt-0.5 text-[7px] text-white/80">
        Tue · 10:00 · R401
      </p>
    </motion.div>

    <motion.div
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="mx-3 mt-1.5 rounded-lg border border-oxford-rule bg-white p-2"
    >
      <p className="text-[7px] font-semibold uppercase tracking-wider text-oxford-mute">
        Today
      </p>
      <p className="mt-0.5 text-[9px] font-bold text-oxford-ink">
        3 classes · 14:00 next
      </p>
    </motion.div>

    <motion.div
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.4 }}
      className="mx-3 mt-1.5 rounded-lg border border-oxford-rule bg-white p-2"
    >
      <p className="text-[7px] font-semibold uppercase tracking-wider text-oxford-mute">
        Upcoming exam
      </p>
      <p className="mt-0.5 text-[9px] font-bold text-oxford-ink">
        Software Eng. · 05 Dec
      </p>
    </motion.div>

    <div className="mx-3 mb-3 mt-auto grid grid-cols-4 gap-1 rounded-lg bg-oxford-ink p-1 text-white">
      {["Acad.", "Hostel", "Map", "More"].map((label) => (
        <div key={label} className="flex flex-col items-center gap-0.5 py-0.5">
          <span className="h-4 w-4 rounded bg-white/15" aria-hidden="true" />
          <span className="text-[6px] font-semibold">{label}</span>
        </div>
      ))}
    </div>
  </div>
);

/* Scene 6 — Sign up: Tap Get started */
const Scene6_TapGetStarted = ({ reduce }: SceneProps) => (
  <div className="flex h-full flex-col bg-oxford-paper">
    <MiniStatus />
    <MiniLandingTop />
    <MiniHeroArt />
    <div className="mt-3 px-4">
      <h4 className="font-serif text-[12px] font-semibold leading-tight text-oxford-ink">
        New here? Join the cohort.
      </h4>
      <p className="mt-1 text-[8px] leading-tight text-oxford-mute">
        Create your account in a minute.
      </p>
    </div>
    <div className="mt-auto flex flex-col gap-2 px-4 pb-5">
      <div className="relative">
        <button
          type="button"
          disabled
          tabIndex={-1}
          className="w-full rounded-md bg-oxford-ink py-1.5 text-[9px] font-semibold text-white"
        >
          Get started
        </button>
        <TapPulse reduce={reduce} />
      </div>
      <button
        type="button"
        disabled
        tabIndex={-1}
        className="w-full rounded-md border border-oxford-ink/30 bg-white py-1.5 text-[9px] font-semibold text-oxford-ink"
      >
        Log in
      </button>
    </div>
  </div>
);

/* Scene 7 — Sign up: Fill in account details */
const Scene7_SignUpForm = ({ reduce, active }: SceneProps) => (
  <div className="flex h-full flex-col bg-white">
    <MiniStatus />
    <div className="px-4 pt-3">
      <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-oxford-mute">
        Sign up
      </p>
      <h4 className="mt-0.5 font-serif text-[12px] font-semibold text-oxford-ink">
        Create your account.
      </h4>
    </div>
    <div className="mt-2.5 flex flex-1 flex-col gap-1.5 px-4">
      <div>
        <p className="text-[7px] font-semibold uppercase tracking-wider text-oxford-mute">
          Name
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 rounded-md border border-oxford-ink/20 bg-white px-2 py-1">
          <UserPlus className="h-2.5 w-2.5 text-oxford-ink/60" aria-hidden="true" />
          <span className="text-[9px] font-medium text-oxford-ink">
            {active ? <TypeText text="Ama Nkrumah" reduce={reduce} delay={0.2} /> : "Ama Nkrumah"}
          </span>
        </div>
      </div>
      <div>
        <p className="text-[7px] font-semibold uppercase tracking-wider text-oxford-mute">
          Email
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 rounded-md border border-oxford-ink/20 bg-white px-2 py-1">
          <AtSign className="h-2.5 w-2.5 text-oxford-ink/60" aria-hidden="true" />
          <span className="text-[9px] font-medium text-oxford-ink">
            {active ? <TypeText text="ama@ug.edu.gh" reduce={reduce} delay={0.9} /> : "ama@ug.edu.gh"}
          </span>
        </div>
      </div>
      <div>
        <p className="text-[7px] font-semibold uppercase tracking-wider text-oxford-mute">
          Password
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 rounded-md border border-oxford-ink/20 bg-white px-2 py-1">
          <Lock className="h-2.5 w-2.5 text-oxford-ink/60" aria-hidden="true" />
          <span className="font-mono text-[10px] font-bold tracking-widest text-oxford-ink">
            {active ? <TypeText text="••••••••" reduce={reduce} delay={1.8} speed={0.08} /> : "••••••••"}
          </span>
        </div>
      </div>
    </div>
    <div className="px-4 pb-5">
      <button
        type="button"
        disabled
        tabIndex={-1}
        className="w-full rounded-md bg-oxford-ink/30 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-white"
      >
        Sign up
      </button>
    </div>
  </div>
);

/* Scene 8 — Sign up: Tap Sign up */
const Scene8_TapSignUp = ({ reduce }: SceneProps) => (
  <div className="flex h-full flex-col bg-white">
    <MiniStatus />
    <div className="px-4 pt-3">
      <p className="text-[8px] font-semibold uppercase tracking-[0.25em] text-oxford-mute">
        Sign up
      </p>
      <h4 className="mt-0.5 font-serif text-[12px] font-semibold text-oxford-ink">
        Create your account.
      </h4>
    </div>
    <div className="mt-2.5 flex flex-1 flex-col gap-1.5 px-4">
      {[
        { label: "Name", icon: <UserPlus className="h-2.5 w-2.5 text-oxford-ink/60" aria-hidden="true" />, value: "Ama Nkrumah", mono: false },
        { label: "Email", icon: <AtSign className="h-2.5 w-2.5 text-oxford-ink/60" aria-hidden="true" />, value: "ama@ug.edu.gh", mono: false },
        { label: "Password", icon: <Lock className="h-2.5 w-2.5 text-oxford-ink/60" aria-hidden="true" />, value: "••••••••", mono: true },
      ].map((f) => (
        <div key={f.label}>
          <p className="text-[7px] font-semibold uppercase tracking-wider text-oxford-mute">
            {f.label}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 rounded-md border border-oxford-ink/20 bg-white px-2 py-1">
            {f.icon}
            <span className={f.mono ? "font-mono text-[10px] font-bold tracking-widest text-oxford-ink" : "text-[9px] font-medium text-oxford-ink"}>
              {f.value}
            </span>
          </div>
        </div>
      ))}
    </div>
    <div className="relative px-4 pb-5">
      <button
        type="button"
        disabled
        tabIndex={-1}
        className="w-full rounded-md bg-oxford-ink py-1.5 text-[9px] font-semibold uppercase tracking-wider text-white"
      >
        Sign up
      </button>
      <TapPulse reduce={reduce} delay={0.8} />
    </div>
  </div>
);

/* Scene 9 — Sign up: Confirmation */
const Scene9_SignUpConfirm = ({ reduce }: SceneProps) => (
  <div className="flex h-full flex-col bg-white px-4">
    <MiniStatus />
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <motion.div
        initial={reduce ? { scale: 1 } : { scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-oxford-ink shadow-xl shadow-oxford-ink/35"
      >
        <Check className="h-8 w-8 text-white" strokeWidth={3} aria-hidden="true" />
      </motion.div>
      <h4 className="mt-4 font-serif text-[12px] font-semibold text-oxford-ink">
        Account created.
      </h4>
      <p className="mt-1 text-[8px] leading-tight text-oxford-mute">
        Welcome to Ultimate Student.
      </p>
      <p className="mt-2 font-serif text-[9px] font-bold text-oxford-ink">
        ama@ug.edu.gh
      </p>
    </div>
    <div className="relative pb-5">
      <button
        type="button"
        disabled
        tabIndex={-1}
        className="w-full rounded-md bg-oxford-ink py-1.5 text-[9px] font-semibold uppercase tracking-widest text-white"
      >
        Proceed
      </button>
      <TapPulse reduce={reduce} delay={0.9} />
    </div>
  </div>
);

const WALK_STEPS: WalkStep[] = [
  { id: "li-1", flow: "login", Scene: Scene1_TapLogin },
  { id: "li-2", flow: "login", Scene: Scene2_EnterEmail },
  { id: "li-3", flow: "login", Scene: Scene3_EnterPassword },
  { id: "li-4", flow: "login", Scene: Scene4_SignInConfirm },
  { id: "li-5", flow: "login", Scene: Scene5_Home },
  { id: "su-1", flow: "signup", Scene: Scene6_TapGetStarted },
  { id: "su-2", flow: "signup", Scene: Scene7_SignUpForm },
  { id: "su-3", flow: "signup", Scene: Scene8_TapSignUp },
  { id: "su-4", flow: "signup", Scene: Scene9_SignUpConfirm },
  { id: "su-5", flow: "signup", Scene: Scene5_Home },
];

/* ─────────────────────────────── About + Stats ─────────────────────────────── */

const AboutStats = () => (
  <section aria-labelledby="about-heading" className="relative bg-oxford-paper">
    <div className="mx-auto max-w-[1280px] px-5 pb-16 pt-10 md:px-8 md:pb-24 md:pt-16">
      <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-[72px_1fr] lg:gap-16">
        <div className="hidden lg:block">
          <div className="sticky top-32 flex h-[560px] items-start justify-start">
            <span className="origin-top-left -rotate-90 translate-y-[220px] font-serif text-[11px] font-medium uppercase tracking-[0.35em] text-oxford-mute">
              2026&nbsp;&apos;s&nbsp;Recap
            </span>
          </div>
        </div>

        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5 }}
            className="font-sans text-xs font-medium uppercase tracking-[0.3em] text-oxford-mute"
          >
          
          </motion.p>
          <motion.h2
            id="about-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-4 max-w-4xl font-serif text-[30px] font-medium leading-[1.2] text-oxford-ink md:text-[46px] md:leading-[1.15] lg:text-[54px]"
          >
            Our numbers reflect a university life that actually works
            <span className="text-oxford-mute">
              {" "}
               connecting students with what matters most, every single day.
            </span>
          </motion.h2>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              variant="primary"
              eyebrow="Students"
              value="25,000+"
              body="Across undergraduate and postgraduate levels in Ghana and West Africa."
            />
            <StatCard
              variant="soft"
              eyebrow="Campus Spots"
              value="240+"
              body="Lecture halls, hostels, ATMs and food stops pinned on the in-app map."
            />
            <StatCard
              variant="primary"
              eyebrow="Partner Hostels"
              value="180+"
              body="Compared side-by-side — price, beds, Wi-Fi, laundry and shuttle info."
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-14 flex items-center gap-6"
          >
            <h3 className="font-serif text-2xl font-medium text-oxford-ink md:text-3xl">
              Ultimate Student at a Glance
            </h3>
            <span className="hidden h-px flex-1 bg-oxford-rule md:block" aria-hidden="true" />
          </motion.div>

          <GlanceCards />
        </div>
      </div>
    </div>
  </section>
);

/* ─────────────────────────────── Glance cards row ─────────────────────────────── */

interface GlanceFeature {
  id: string;
  title: string;
  blurb: string;
  image: UnsplashImage;
  Icon: LucideIcon;
}

const GLANCE_FEATURES: GlanceFeature[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    blurb: "Today's class, next deadline, who's gathering where one home screen.",
    image: FEATURE_IMAGES.onboardingAccount,
    Icon: BookOpen,
  },
  {
    id: "map",
    title: "Campus Map",
    blurb: "Every lecture hall, ATM and food stop pinned, with walking times.",
    image: FEATURE_IMAGES.onboardingTypeHero,
    Icon: MapPin,
  },
  {
    id: "hostels",
    title: "Hostels",
    blurb: "Compare price, beds, Wi-Fi and laundry  then claim your room.",
    image: FEATURE_IMAGES.onboardingLiving,
    Icon: Building2,
  },
  {
    id: "life",
    title: "Campus Life",
    blurb: "Clubs, events, matchups  RSVP with a tap and show up with friends.",
    image: FEATURE_IMAGES.onboardingInterests,
    Icon: Users,
  },
];

const GlanceCards = () => {
  const reduce = useReducedMotion();
  const r = !!reduce;

  return (
    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 md:mt-12 md:gap-5">
      <GlanceStat reduce={r} />
      {GLANCE_FEATURES.map((f, i) => (
        <GlanceFeatureCard
          key={f.id}
          feature={f}
          index={i}
          reduce={r}
        />
      ))}
    </div>
  );
};

const GlanceStat = ({ reduce }: { reduce: boolean }) => (
  <motion.article
    initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className="group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl bg-oxford-sandSoft p-6 ring-1 ring-oxford-rule/60 transition hover:ring-oxford-gold/50 sm:col-span-2 sm:min-h-[280px] md:p-7 lg:col-span-1 lg:min-h-0"
  >
    <div>
      <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.25em] text-oxford-gold">
        Why students stay
      </p>
      <p className="mt-6 font-serif text-5xl font-bold leading-none text-oxford-ink md:text-6xl">
        75%
      </p>
      <p className="mt-2 font-serif text-xl font-medium text-oxford-ink md:text-2xl">
        Less scrolling
      </p>
    </div>
    <p className="mt-6 max-w-xs text-sm leading-relaxed text-oxford-ink2/80">
      No more hunting for info across eight group chats and five bulletin boards.
    </p>
    {/* Soft decorative blob */}
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-oxford-sand opacity-70 transition duration-500 group-hover:scale-110"
    />
  </motion.article>
);

const GlanceFeatureCard = ({
  feature,
  index,
  reduce,
}: {
  feature: GlanceFeature;
  index: number;
  reduce: boolean;
}) => {
  const Icon = feature.Icon;
  return (
    <motion.article
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.6,
        delay: reduce ? 0 : 0.08 * (index + 1),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative min-h-[300px] overflow-hidden rounded-2xl bg-oxford-ink shadow-sm shadow-oxford-ink/10 sm:min-h-[360px] lg:min-h-[320px]"
    >
      <img
        src={unsplash(feature.image.photoId, 600, 65)}
        srcSet={unsplashSrcSet(feature.image.photoId)}
        sizes="(min-width:1024px) 240px, (min-width:640px) 45vw, 92vw"
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-oxford-ink via-oxford-ink/45 to-transparent"
      />

      {/* Icon badge — top-right */}
      <div className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-oxford-gold text-white shadow-md shadow-oxford-ink/40 transition duration-300 group-hover:scale-110 group-hover:bg-oxford-ink motion-reduce:transform-none motion-reduce:transition-none">
        <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
      </div>

      {/* Title + blurb at bottom */}
      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
        <h3 className="font-serif text-lg font-semibold leading-tight text-white md:text-xl">
          {feature.title}
        </h3>
        <p className="mt-1.5 text-[12px] leading-snug text-white/85 md:text-xs">
          {feature.blurb}
        </p>
      </div>

      {/* Hover arrow — subtle hint */}
      <div className="absolute right-4 bottom-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/0 text-white opacity-0 transition duration-300 group-hover:bg-white/15 group-hover:opacity-100 motion-reduce:transform-none motion-reduce:transition-none">
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </div>
    </motion.article>
  );
};

const StatCard = ({
  variant,
  eyebrow,
  value,
  body,
}: {
  variant: "primary" | "soft";
  eyebrow: string;
  value: string;
  body: string;
}) => (
  <motion.article
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className={`rounded-xl p-6 md:p-8 ${
      variant === "primary" ? "bg-oxford-sand" : "bg-oxford-sandSoft"
    }`}
  >
    <p className="font-serif text-sm font-medium italic text-oxford-gold">
      {eyebrow}
    </p>
    <p className="mt-6 font-serif text-5xl font-semibold tracking-tight text-oxford-ink md:text-6xl">
      {value}
    </p>
    <p className="mt-4 max-w-xs text-sm leading-relaxed text-oxford-ink2/80">
      {body}
    </p>
  </motion.article>
);

/* ─────────────────────────────── CTA band ─────────────────────────────── */

const CtaBand = ({ onStart }: { onStart: () => void }) => (
  <section aria-labelledby="cta-heading" className="bg-oxford-paper">
    <div className="mx-auto max-w-[1280px] px-5 pb-20 md:px-8 md:pb-28">
      <div className="relative overflow-hidden rounded-[18px] bg-oxford-ink">
        <div className="relative grid grid-cols-1 gap-10 px-6 py-14 lg:grid-cols-[1fr_320px] lg:items-center lg:gap-12 lg:px-16 lg:py-24">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5 }}
              className="font-sans text-xs font-medium uppercase tracking-[0.3em] text-white/70"
            >
              Join the next cohort
            </motion.p>
            <motion.h2
              id="cta-heading"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 font-serif text-[36px] font-medium leading-[1.1] text-white md:text-[56px]"
            >
              Your campus is a lot.
              <br />
              <span className="italic text-oxford-sand">Your app shouldn&apos;t be.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 max-w-lg text-base leading-relaxed text-white/80"
            >
              Set up takes a minute. Just you, your day, and the campus  in one app.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <button
                type="button"
                onClick={onStart}
                className="inline-flex items-center gap-2 rounded-md bg-oxford-sand px-6 py-3.5 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-sandSoft motion-safe:active:scale-[0.97]"
              >
                Join now
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-md border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Log in
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:block"
            aria-hidden="true"
          >
            <div className="relative h-72 w-full overflow-hidden rounded-xl">
              <img
                src={unsplash(MOSAIC_IMAGES[2].photoId, 800, 65)}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-oxford-ink/20" />
              <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-serif text-4xl font-medium text-white/70 mix-blend-overlay">
                Join
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </section>
);

/* ─────────────────────────────── Page ─────────────────────────────── */

export const WelcomePage = () => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const goStart = () => navigate("/onboarding/account");

  return (
    <div data-landing="oxford" className="min-h-screen bg-oxford-paper font-sans text-oxford-ink antialiased">
      <TopNav onStart={goStart} />
      <Hero reduce={!!reduce} onStart={goStart} />
      <AboutStats />
      <CtaBand onStart={goStart} />
    </div>
  );
};
