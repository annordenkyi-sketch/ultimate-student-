import { motion, useReducedMotion } from "framer-motion";
import { GPA_SCALE } from "@/config/grading";
import { formatGpa, formatTarget } from "@/lib/gpa";

/** GPA on the full 0–4.0 scale, with a marker at the target. Gold once the target is reached. */
export const GpaBar = ({ gpa, target, label }: { gpa: number | null; target: number; label: string }) => {
  const reduce = useReducedMotion();
  const pct = gpa === null ? 0 : Math.min(100, (gpa / GPA_SCALE) * 100);
  const targetPct = Math.min(100, (target / GPA_SCALE) * 100);
  const reached = gpa !== null && gpa >= target;

  return (
    <span
      className="block"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={GPA_SCALE}
      aria-valuenow={gpa ?? 0}
      aria-valuetext={
        gpa === null
          ? `No results yet. Target ${formatTarget(target)} out of ${GPA_SCALE.toFixed(1)}`
          : `${formatGpa(gpa)} out of ${GPA_SCALE.toFixed(1)}, target ${formatTarget(target)}`
      }
    >
      {/* Target label above the marker. */}
      <span className="relative mb-1 block h-4 text-[11px] font-semibold text-oxford-ink2" aria-hidden="true">
        <span
          className="absolute whitespace-nowrap"
          style={{ left: `${targetPct}%`, transform: `translateX(${targetPct > 85 ? "-100%" : targetPct < 15 ? "0" : "-50%"})` }}
        >
          Target {formatTarget(target)}
        </span>
      </span>
      <span className="relative block h-3 rounded-full bg-oxford-ink/10">
        <motion.span
          className={`absolute inset-y-0 left-0 block rounded-full ${reached ? "bg-oxford-gold" : "bg-oxford-ink"}`}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-1 -top-1 w-1 -translate-x-1/2 rounded-full bg-oxford-gold shadow-[0_0_0_2px_rgb(var(--us-paper))]"
          style={{ left: `${targetPct}%` }}
        />
      </span>
      <span className="mt-1 flex justify-between text-[11px] text-oxford-mute" aria-hidden="true">
        <span>0</span>
        <span>{GPA_SCALE.toFixed(1)}</span>
      </span>
    </span>
  );
};
