import {
  Briefcase,
  CalendarDays,
  Home as HomeIcon,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

interface Chip {
  icon: LucideIcon;
  label: string;
  /** Positioning + visibility. */
  className: string;
  /** Phase offset for the drift animation (so they don't move in sync). */
  phase: number;
}

const CHIPS: Chip[] = [
  {
    icon: CalendarDays,
    label: "Campus events",
    className: "top-[8%] right-[6%]",
    phase: 0,
  },
  {
    icon: Users,
    label: "Study groups",
    className: "top-[22%] left-[52%] md:left-[48%]",
    phase: 1.2,
  },
  {
    icon: Sparkles,
    label: "Clubs & societies",
    className: "top-[40%] right-[10%] hidden sm:inline-flex",
    phase: 2.4,
  },
  {
    icon: HomeIcon,
    label: "Hostels",
    className: "top-[55%] left-[58%] hidden md:inline-flex",
    phase: 3.6,
  },
  {
    icon: Briefcase,
    label: "Internships",
    className: "top-[35%] left-[8%] hidden md:inline-flex",
    phase: 4.8,
  },
];

export const FloatingChips = () => {
  const reduce = useReducedMotion();
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5]"
      aria-hidden="true"
    >
      {CHIPS.map(({ icon: Icon, label, className, phase }, i) => (
        <motion.span
          key={label}
          className={`absolute inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-slate-950/30 ring-1 ring-white/25 backdrop-blur-md ${className}`}
          initial={{ opacity: 0, y: 8 }}
          animate={
            reduce
              ? { opacity: 1, y: 0 }
              : {
                  opacity: 1,
                  y: [0, -8, 0, 6, 0],
                  x: [0, 3, 0, -3, 0],
                }
          }
          transition={{
            opacity: { duration: 0.5, delay: 0.4 + i * 0.08 },
            y: {
              duration: 9 + i * 0.6,
              ease: "easeInOut",
              repeat: Infinity,
              delay: phase,
            },
            x: {
              duration: 11 + i * 0.5,
              ease: "easeInOut",
              repeat: Infinity,
              delay: phase,
            },
          }}
        >
          <Icon className="h-3 w-3 text-accent-200" aria-hidden="true" />
          {label}
        </motion.span>
      ))}
    </div>
  );
};
