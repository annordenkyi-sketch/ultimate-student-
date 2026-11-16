import { motion, useReducedMotion } from "framer-motion";

/** Progress bar that fills on arrival. Gold once complete. */
export const ProgressBar = ({ percent, label, size = "md" }: { percent: number; label: string; size?: "sm" | "md" }) => {
  const reduce = useReducedMotion();
  const done = percent >= 100;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={`w-full overflow-hidden rounded-full bg-oxford-ink/10 ${size === "sm" ? "h-1.5" : "h-2.5"}`}
    >
      <motion.div
        className={`h-full rounded-full ${done ? "bg-oxford-gold" : "bg-oxford-ink"}`}
        initial={reduce ? false : { width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
};
