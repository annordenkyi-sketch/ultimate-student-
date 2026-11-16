import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface Props {
  id: string;
  title: string;
  action?: { to: string; label: string };
  className?: string;
  children: ReactNode;
  /** Delay for the fade-in, so cards appear one after another. */
  order?: number;
}

/** Dashboard section: a titled card that fades in. */
export const DashCard = ({ id, title, action, className = "", children, order = 0 }: Props) => {
  const reduce = useReducedMotion();
  return (
    <motion.section
      aria-labelledby={id}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: order * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border border-oxford-rule bg-white/80 p-5 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={id} className="font-sans text-base font-semibold text-oxford-ink">
          {title}
        </h2>
        {action && (
          <Link
            to={action.to}
            className="inline-flex min-h-[36px] items-center gap-1 text-sm font-semibold text-oxford-ink underline-offset-4 hover:underline"
          >
            {action.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </motion.section>
  );
};

export const Skeleton = ({ lines = 3 }: { lines?: number }) => (
  <div role="status" aria-label="Loading" className="space-y-3">
    {Array.from({ length: lines }, (_, i) => (
      <div key={i} className="h-12 animate-pulse rounded-lg bg-oxford-cream" />
    ))}
  </div>
);

export const LoadError = ({ what, onRetry }: { what: string; onRetry: () => void }) => (
  <div role="alert" className="rounded-lg border border-oxford-danger/30 bg-oxford-danger/5 p-4 text-sm">
    <p className="font-semibold text-oxford-ink">We couldn't load {what}</p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-2 font-semibold text-oxford-ink underline underline-offset-4 hover:no-underline"
    >
      Try again
    </button>
  </div>
);

export const EmptyNote = ({ children }: { children: ReactNode }) => (
  <p className="rounded-lg border border-dashed border-oxford-rule px-4 py-6 text-center text-sm text-oxford-mute">
    {children}
  </p>
);
