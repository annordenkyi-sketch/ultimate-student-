import { Link, Navigate, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { btn } from "@/ui/button";
import { AuthFrame } from "../auth/AuthFrame";
import { AuthHeading } from "../auth/parts";
import type { DoneSummary } from "./SetupLayout";

/** Flow 02 end: short success moment, then Home. */
export const DoneScreen = () => {
  const summary = useLocation().state as DoneSummary | null;
  const reduce = useReducedMotion();

  if (!summary) return <Navigate to="/" replace />;

  const rows: [string, string][] = [
    ["Semester", summary.semester],
    ["Courses", String(summary.courses)],
    ["Sessions a week", String(summary.sessions)],
    ["Lecture reminders", summary.reminders],
    ["Goal", summary.goal ?? "None for now"],
  ];

  return (
    <AuthFrame>
      <motion.span
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-oxford-ink text-white"
      >
        <Check className="h-7 w-7" strokeWidth={3} aria-hidden="true" />
      </motion.span>
      <div className="mt-5">
        <AuthHeading title="Your semester is set up">Here's what we saved.</AuthHeading>
      </div>
      <dl className="divide-y divide-oxford-rule rounded-xl border border-oxford-rule bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
            <dt className="text-oxford-mute">{label}</dt>
            <dd className="text-right font-semibold text-oxford-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <Link to="/home" replace className={btn("primary", "mt-7 w-full")}>
        Go to Home
      </Link>
    </AuthFrame>
  );
};
