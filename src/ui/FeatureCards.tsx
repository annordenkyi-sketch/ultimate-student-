import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Lock, type LucideIcon } from "lucide-react";
import type { Unlock } from "@/session/useUnlock";

export interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
  /** Set when this feature needs sign-in or verification for the current user. */
  locked?: Unlock | null;
}

export const FeatureCards = ({ items }: { items: Feature[] }) => {
  const reduce = useReducedMotion();
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((f, i) => {
        const Icon = f.icon;
        return (
          <motion.li
            key={f.title}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col rounded-2xl border border-oxford-rule bg-white/70 p-5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-oxford-sandSoft text-oxford-ink">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-oxford-mute">{f.body}</p>
            {f.locked && (
              <Link
                to={f.locked.to}
                className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-oxford-ink underline-offset-4 hover:underline"
              >
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                {f.locked.label}
              </Link>
            )}
          </motion.li>
        );
      })}
    </ul>
  );
};
