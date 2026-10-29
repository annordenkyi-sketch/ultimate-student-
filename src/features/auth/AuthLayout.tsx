import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  LogIn,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { unsplash, unsplashSrcSet, type UnsplashImage } from "@/lib/images";

type Tab = "signin" | "signup";

const TAB_META: Record<
  Tab,
  { label: string; to: string; icon: LucideIcon }
> = {
  signin: { label: "Sign In", to: "/login", icon: LogIn },
  signup: { label: "Sign Up", to: "/onboarding/account", icon: UserPlus },
};

const TABS: Tab[] = ["signin", "signup"];

interface Props {
  active: Tab;
  title: string;
  subtitle?: string;
  photo: UnsplashImage;
  children: ReactNode;
}

export const AuthLayout = ({
  active,
  title,
  subtitle,
  photo,
  children,
}: Props) => {
  const reduce = useReducedMotion();
  const other = active === "signin" ? "signup" : "signin";
  const otherMeta = TAB_META[other];

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-paper">
      {/* Soft gradient page background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,theme(colors.brand.50),theme(colors.paper)_55%)]"
      />

      {/* Mobile top bar */}
      <MobileTopBar active={active} />

      <div className="mx-auto flex min-h-screen max-w-6xl items-stretch justify-center px-4 pb-10 pt-6 md:px-6 lg:items-center lg:gap-5 lg:px-8 lg:py-12">
        {/* Left rail (desktop only) */}
        <DesktopRail active={active} />

        {/* Center illustration pane (desktop only) */}
        <section className="relative hidden overflow-hidden rounded-3xl bg-brand-700 shadow-xl shadow-brand-900/15 lg:flex lg:w-[360px] lg:flex-col lg:justify-end lg:self-stretch">
          <motion.img
            src={unsplash(photo.photoId, 1200, 65)}
            srcSet={unsplashSrcSet(photo.photoId)}
            sizes="360px"
            alt=""
            className="absolute inset-0 h-full w-full object-cover will-change-transform"
            initial={{ opacity: 0, scale: 1 }}
            animate={
              reduce
                ? { opacity: 1 }
                : { opacity: 1, scale: [1, 1.06, 1], x: ["0%", "-1%", "0%"] }
            }
            transition={{
              opacity: { duration: 1, ease: "easeOut" },
              scale: { duration: 20, ease: "easeInOut", repeat: Infinity },
              x: { duration: 24, ease: "easeInOut", repeat: Infinity },
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-brand-700/90 via-brand-700/80 to-brand-600/70"
          />
          <div className="relative z-10 flex flex-col gap-3 p-10 text-white">
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="max-w-xs text-sm text-brand-100">{subtitle}</p>
            )}
          </div>
        </section>

        {/* Form card */}
        <section className="relative w-full max-w-md rounded-3xl bg-white shadow-xl shadow-brand-900/10 lg:w-[400px] lg:self-stretch">
          <div className="flex h-full flex-col px-6 pb-8 pt-8 md:px-10 md:pt-10 md:pb-10">
            <div className="mb-6 flex items-center justify-end text-sm">
              <span className="text-muted">
                {active === "signin"
                  ? "Don't have an account?"
                  : "Already a member?"}
              </span>
              <Link
                to={otherMeta.to}
                className="ml-1.5 font-semibold text-brand-700 hover:text-brand-800 hover:underline"
              >
                {otherMeta.label}
              </Link>
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
};

/* ───────── Desktop left rail ───────── */

const DesktopRail = ({ active }: { active: Tab }) => (
  <aside className="hidden flex-col items-center self-stretch rounded-3xl bg-white px-3 py-8 shadow-xl shadow-brand-900/10 lg:flex lg:w-24">
    <Link
      to="/welcome"
      aria-label="Ultimate Student home"
      className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-500"
    >
      <GraduationCap className="h-5 w-5" aria-hidden="true" />
    </Link>
    <nav
      aria-label="Account"
      className="mt-10 flex flex-col gap-2"
    >
      {TABS.map((tab) => (
        <DesktopTab key={tab} tab={tab} active={active} />
      ))}
    </nav>
  </aside>
);

const DesktopTab = ({ tab, active }: { tab: Tab; active: Tab }) => {
  const meta = TAB_META[tab];
  const navigate = useNavigate();
  const isActive = tab === active;
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={() => navigate(meta.to)}
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-[11px] font-semibold transition ${
        isActive
          ? "text-brand-700"
          : "text-muted hover:bg-brand-50 hover:text-brand-700"
      }`}
    >
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute -left-3 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-brand-600"
        />
      )}
      <Icon className="h-4 w-4" aria-hidden="true" strokeWidth={2.2} />
      <span>{meta.label}</span>
    </button>
  );
};

/* ───────── Mobile top bar ───────── */

const MobileTopBar = ({ active }: { active: Tab }) => (
  <header
    className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden"
    style={{
      paddingLeft: "max(16px, env(safe-area-inset-left))",
      paddingRight: "max(16px, env(safe-area-inset-right))",
    }}
  >
    <Link
      to="/welcome"
      aria-label="Ultimate Student home"
      className="inline-flex items-center gap-2 font-display text-sm font-bold text-ink"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        <GraduationCap className="h-4 w-4" aria-hidden="true" />
      </span>
      Ultimate Student
    </Link>
    <nav aria-label="Account" className="flex rounded-full bg-brand-50 p-1">
      {TABS.map((tab) => (
        <MobileTab key={tab} tab={tab} active={active} />
      ))}
    </nav>
  </header>
);

const MobileTab = ({ tab, active }: { tab: Tab; active: Tab }) => {
  const meta = TAB_META[tab];
  const isActive = tab === active;
  return (
    <Link
      to={meta.to}
      aria-current={isActive ? "page" : undefined}
      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
        isActive
          ? "bg-brand-600 text-white shadow"
          : "text-brand-700 hover:bg-white"
      }`}
    >
      {meta.label}
    </Link>
  );
};
