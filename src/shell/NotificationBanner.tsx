import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { describe, linkFor } from "@/lib/notifications";
import { useActivity } from "@/session/ActivityProvider";

const VISIBLE_MS = 5000;

/**
 * Flow 09 "In-app banner": a notification that arrives while the app is open.
 * Tap to open it, or dismiss. It hides after 5 seconds, but waits while it's
 * hovered or focused so nobody is rushed.
 */
export const NotificationBanner = () => {
  const { banner, clearBanner, markNotificationsRead } = useActivity();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!banner || paused) return;
    timer.current = window.setTimeout(clearBanner, VISIBLE_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [banner, paused, clearBanner]);

  useEffect(() => setPaused(false), [banner?.id]);

  const info = banner ? describe(banner) : null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[1150] flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <AnimatePresence>
        {banner && info && (
          <motion.div
            key={banner.id}
            role="status"
            aria-live="polite"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            className="pointer-events-auto flex w-full max-w-md items-stretch overflow-hidden rounded-2xl border border-oxford-rule bg-white shadow-xl"
          >
            <button
              type="button"
              onClick={() => {
                markNotificationsRead([banner.id]);
                clearBanner();
                navigate(linkFor(banner.target));
              }}
              className="flex min-w-0 flex-1 items-start gap-3 p-3 text-left transition hover:bg-oxford-cream"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-oxford-ink text-white">
                <info.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-oxford-mute">{info.label}</span>
                <span className="block truncate font-semibold text-oxford-ink">{banner.title}</span>
                <span className="block truncate text-sm text-oxford-mute">{banner.body}</span>
              </span>
              <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-oxford-mute" aria-hidden="true" />
              <span className="sr-only">Open</span>
            </button>
            <button
              type="button"
              onClick={clearBanner}
              aria-label="Dismiss notification"
              className="flex w-12 shrink-0 items-center justify-center border-l border-oxford-rule text-oxford-mute transition hover:bg-oxford-cream hover:text-oxford-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
