import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlarmClock,
  BellRing,
  Building2,
  CalendarDays,
  GraduationCap,
  Home as HomeIcon,
  Pencil,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { ActionButton } from "@/components/ActionButton";
import { FadeIn } from "@/components/Motion";
import { dataService } from "@/data/service";
import type {
  Deadline,
  EventItem,
  SectionItem,
  StudentType,
} from "@/data/types";
import { FEATURE_IMAGES, unsplash, unsplashSrcSet } from "@/lib/images";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/useToast";
import { useOnboardingDraft } from "./OnboardingLayout";
import { findInterest } from "./interests";

const typeLabel: Record<StudentType, string> = {
  prospective: "Prospective",
  new: "First-year",
  continuing: "Continuing",
  postgraduate: "Postgraduate",
  "final-year": "Final year",
};

const relativeDays = (iso: string): string => {
  const d = new Date(iso);
  const diff = Math.round((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (diff <= 0) return "today";
  if (diff === 1) return "in 1 day";
  return `in ${diff} days`;
};

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

/* ───────────────────────────── Check with confetti ───────────────────────────── */

interface ConfettiParticle {
  x: number;
  y: number;
  rotate: number;
  color: string;
  shape: "dot" | "bar";
}

const buildConfetti = (): ConfettiParticle[] => {
  const colors = [
    "bg-brand-600",
    "bg-brand-400",
    "bg-amber-300",
    "bg-emerald-400",
    "bg-rose-400",
  ];
  const particles: ConfettiParticle[] = [];
  const count = 16;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const distance = 70 + Math.random() * 50;
    particles.push({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      rotate: Math.random() * 360,
      color: colors[i % colors.length],
      shape: i % 3 === 0 ? "bar" : "dot",
    });
  }
  return particles;
};

const SuccessCheck = ({ reduce }: { reduce: boolean | null }) => {
  const [confetti] = useState(buildConfetti);

  return (
    <div className="relative mx-auto h-24 w-24">
      {/* Confetti */}
      {!reduce &&
        confetti.map((p, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className={`absolute left-1/2 top-1/2 ${p.color} ${
              p.shape === "bar"
                ? "h-2 w-1 rounded-sm"
                : "h-1.5 w-1.5 rounded-full"
            }`}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: p.x,
              y: p.y,
              rotate: p.rotate,
              opacity: [0, 1, 1, 0],
              scale: [0, 1.1, 1, 0.6],
            }}
            transition={{
              duration: 1.5,
              delay: 0.55,
              ease: [0.22, 1, 0.36, 1],
              times: [0, 0.1, 0.7, 1],
            }}
          />
        ))}

      {/* Check inside circle — draws itself */}
      <svg
        viewBox="0 0 100 100"
        className="relative h-24 w-24 text-brand-600"
        role="img"
        aria-label="Account created"
      >
        <motion.circle
          cx="50"
          cy="50"
          r="46"
          fill="currentColor"
          initial={reduce ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={
            reduce
              ? { duration: 0 }
              : {
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }
          }
          style={{ originX: "50px", originY: "50px" }}
        />
        <motion.path
          d="M28 52 L44 68 L74 36"
          fill="none"
          stroke="white"
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={
            reduce
              ? { duration: 0 }
              : {
                  duration: 0.45,
                  delay: 0.3,
                  ease: "easeOut",
                }
          }
        />
      </svg>
    </div>
  );
};

/* ───────────────────────────── Profile summary ───────────────────────────── */

interface SummaryRowProps {
  icon: typeof HomeIcon;
  label: string;
  value: React.ReactNode;
  editTo: string;
}

const SummaryRow = ({ icon: Icon, label, value, editTo }: SummaryRowProps) => (
  <li className="flex items-start gap-3 py-3">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-0.5 text-sm font-semibold text-slate-900">{value}</div>
    </div>
    <Link
      to={editTo}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 hover:text-brand-800"
    >
      <Pencil className="h-3 w-3" aria-hidden="true" />
      Edit
    </Link>
  </li>
);

/* ───────────────────────────── Sneak peek ───────────────────────────── */

interface SneakPeek {
  deadline: Deadline | null;
  event: EventItem | null;
  service: SectionItem | null;
}

const useSneakPeek = (
  interests: string[],
  hostel: string | undefined,
  living: string | undefined,
): SneakPeek => {
  const [peek, setPeek] = useState<SneakPeek>({
    deadline: null,
    event: null,
    service: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [deadlines, events, accommodation, services] = await Promise.all([
        dataService.getDeadlines(),
        dataService.getEventsThisWeek(),
        dataService.getSection("accommodation"),
        dataService.getSection("services"),
      ]);
      if (cancelled) return;

      const deadline = deadlines[0] ?? null;

      const interestLower = interests.map((i) => i.toLowerCase());
      const event =
        events.find((e) =>
          interestLower.some((label) => e.title.toLowerCase().includes(label)),
        ) ??
        events[0] ??
        null;

      // Prefer the student's hostel if they picked one, else first on-campus hall,
      // else the first student-service entry.
      let service: SectionItem | null = null;
      if (hostel) {
        service = accommodation.find((a) => a.title === hostel) ?? null;
      }
      if (!service && living === "on-campus") {
        service =
          accommodation.find((a) => a.tags.includes("on-campus")) ?? null;
      }
      if (!service) service = services[0] ?? null;

      setPeek({ deadline, event, service });
    })();
    return () => {
      cancelled = true;
    };
  }, [interests, hostel, living]);

  return peek;
};

/* ───────────────────────────── Component ───────────────────────────── */

export const DoneStep = () => {
  const navigate = useNavigate();
  const { setProfile } = useProfile();
  const { showToast } = useToast();
  const { draft } = useOnboardingDraft();
  const reduce = useReducedMotion();
  const bgImg = FEATURE_IMAGES.onboardingInterests;

  const [loading, setLoading] = useState(false);
  const [remindersOn, setRemindersOn] = useState(false);

  const peek = useSneakPeek(draft.interests, draft.hostel, draft.living);

  const firstName = draft.name.split(" ")[0] || "Student";

  const studentTypeText = draft.studentType ? typeLabel[draft.studentType] : "";
  const typeLine = draft.isInternational
    ? `${studentTypeText} · International`
    : studentTypeText;

  const livingLine = (() => {
    if (!draft.living) return "";
    const where = draft.living === "on-campus" ? "On campus" : "Off campus";
    return draft.hostel ? `${where} · ${draft.hostel}` : where;
  })();

  const toggleReminders = async (checked: boolean) => {
    setRemindersOn(checked);
    if (!checked) return;
    if (typeof Notification === "undefined") {
      showToast("Notifications aren't supported on this device", "info");
      setRemindersOn(false);
      return;
    }
    if (Notification.permission === "granted") {
      showToast("Reminders are on", "success");
      return;
    }
    try {
      const result = await Notification.requestPermission();
      if (result === "granted") {
        showToast("Reminders are on", "success");
      } else {
        setRemindersOn(false);
        showToast("Permission denied — reminders stay off", "info");
      }
    } catch {
      setRemindersOn(false);
      showToast("Couldn't ask for permission", "error");
    }
  };

  const enter = () => {
    if (!draft.studentType || !draft.living) {
      navigate("/onboarding/account", { replace: true });
      return;
    }
    setLoading(true);
    setProfile({
      id: `u-${Date.now()}`,
      name: draft.name,
      identifier: draft.identifier,
      studentType: draft.studentType,
      isInternational: draft.isInternational,
      living: draft.living,
      interests: draft.interests,
      createdAt: new Date().toISOString(),
    });
    setTimeout(() => navigate("/", { replace: true }), 300);
  };

  return (
    <div className="relative min-h-[calc(100vh-72px)] bg-slate-50">
      {/* Softly faded student photo */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <img
          src={unsplash(bgImg.photoId, 1600, 60)}
          srcSet={unsplashSrcSet(bgImg.photoId)}
          sizes="100vw"
          alt=""
          className="h-full w-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/92 to-white" />
      </div>

      <div className="relative mx-auto w-full max-w-[640px] px-5 pb-40 pt-6 md:px-8 md:pb-20 md:pt-12">
        {/* Check mark */}
        <div className="flex flex-col items-center">
          <SuccessCheck reduce={reduce} />

          <FadeIn delay={0.6}>
            <h1 className="mt-6 text-center text-[32px] font-bold leading-tight text-slate-900 display md:text-4xl">
              You're all set,{" "}
              <span className="text-brand-700">{firstName}</span>!
            </h1>
          </FadeIn>
          <FadeIn delay={0.7}>
            <p className="mx-auto mt-2 max-w-sm text-center text-sm text-slate-600 md:text-base">
              Your campus, sorted. Here's what we've set up for you.
            </p>
          </FadeIn>
        </div>

        {/* Profile summary */}
        <FadeIn delay={0.8} className="mt-10">
          <section
            aria-labelledby="your-profile"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
          >
            <div className="flex items-baseline justify-between">
              <h2
                id="your-profile"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Your profile
              </h2>
            </div>
            <ul className="mt-2 divide-y divide-slate-100">
              <SummaryRow
                icon={GraduationCap}
                label="Student type"
                value={typeLine || "—"}
                editTo="/onboarding/type"
              />
              <SummaryRow
                icon={draft.living === "on-campus" ? HomeIcon : Building2}
                label="Living"
                value={livingLine || "—"}
                editTo="/onboarding/living"
              />
              <li className="flex items-start gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Interests
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {draft.interests.length === 0 ? (
                      <span className="text-sm text-slate-400">
                        None picked
                      </span>
                    ) : (
                      draft.interests.map((label) => {
                        const opt = findInterest(label);
                        if (!opt) return null;
                        return (
                          <span
                            key={label}
                            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-0.5 pl-0.5 pr-2.5 text-xs font-semibold text-slate-700"
                          >
                            <img
                              src={unsplash(opt.photo.photoId, 100, 60)}
                              alt=""
                              loading="lazy"
                              className="h-5 w-5 rounded-full object-cover"
                            />
                            {label}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
                <Link
                  to="/onboarding/living?part=B"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 hover:text-brand-800"
                >
                  <Pencil className="h-3 w-3" aria-hidden="true" />
                  Edit
                </Link>
              </li>
            </ul>
          </section>
        </FadeIn>

        {/* Sneak peek */}
        <section
          aria-labelledby="peek-heading"
          className="mt-8"
        >
          <FadeIn delay={0.9}>
            <h2
              id="peek-heading"
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Ready for you on Home
            </h2>
          </FadeIn>

          <div className="mt-3 space-y-2.5">
            {[peek.deadline, peek.event, peek.service].map((item, i) => {
              if (!item) {
                return (
                  <motion.div
                    key={`skeleton-${i}`}
                    aria-hidden="true"
                    className="h-16 animate-pulse rounded-xl bg-slate-100"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.95 + i * 0.12,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                );
              }
              return (
                <motion.div
                  key={`peek-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.95 + i * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {i === 0 && peek.deadline && (
                    <DeadlinePeek deadline={peek.deadline} />
                  )}
                  {i === 1 && peek.event && <EventPeek event={peek.event} />}
                  {i === 2 && peek.service && (
                    <ServicePeek item={peek.service} />
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Reminders */}
        <FadeIn delay={1.2} className="mt-6">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-slate-300">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <BellRing className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                Turn on reminders for deadlines and events
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                We'll nudge you a day or two before anything matters.
              </p>
            </div>
            <input
              type="checkbox"
              checked={remindersOn}
              onChange={(e) => toggleReminders(e.target.checked)}
              className="peer sr-only"
              aria-label="Turn on reminders"
            />
            <span
              aria-hidden="true"
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 ${
                remindersOn ? "bg-brand-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  remindersOn ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </span>
          </label>
        </FadeIn>

        {/* Desktop CTA inline */}
        <FadeIn delay={1.3} className="mt-8 hidden md:block">
          <ActionButton
            onClick={enter}
            loading={loading}
            disabled={loading}
            className="w-full px-6"
          >
            {loading ? "Opening" : "Go to my Home"}
          </ActionButton>
        </FadeIn>
      </div>

      {/* Mobile sticky CTA */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white px-5 py-3 shadow-[0_-6px_20px_-10px_rgba(15,23,42,0.15)] md:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <ActionButton
          onClick={enter}
          loading={loading}
          disabled={loading}
          fullWidth
        >
          {loading ? "Opening" : "Go to my Home"}
        </ActionButton>
      </div>
    </div>
  );
};

/* ───────────────────────────── Peek sub-cards ───────────────────────────── */

const DeadlinePeek = ({ deadline }: { deadline: Deadline }) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
      <AlarmClock className="h-4 w-4" aria-hidden="true" />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">
        Deadline
      </p>
      <p className="truncate text-sm font-semibold text-slate-900">
        {deadline.title}
      </p>
      <p className="text-xs text-slate-500">
        {formatDate(deadline.date)} · {relativeDays(deadline.date)}
      </p>
    </div>
  </div>
);

const EventPeek = ({ event }: { event: EventItem }) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
      <CalendarDays className="h-4 w-4" aria-hidden="true" />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">
        This week
      </p>
      <p className="truncate text-sm font-semibold text-slate-900">
        {event.title}
      </p>
      <p className="text-xs text-slate-500">
        {formatDate(event.date)} · {event.location}
      </p>
    </div>
  </div>
);

const ServicePeek = ({ item }: { item: SectionItem }) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
      <HomeIcon className="h-4 w-4" aria-hidden="true" />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
        {item.section === "accommodation" ? "Your hostel" : "On campus"}
      </p>
      <p className="truncate text-sm font-semibold text-slate-900">
        {item.title}
      </p>
      <p className="line-clamp-1 text-xs text-slate-500">{item.summary}</p>
    </div>
  </div>
);
