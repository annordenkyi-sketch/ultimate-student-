import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, GraduationCap, LogIn } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { ActionButton } from "@/components/ActionButton";
import { CampusMosaic } from "@/components/CampusMosaic";
import { FloatingChips } from "@/components/FloatingChips";
import { FadeIn } from "@/components/Motion";

export const WelcomePage = () => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const goStart = () => navigate("/onboarding/account");

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950">
      {/* ────── Mosaic (fades in, then starts scrolling) ────── */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <CampusMosaic />
      </motion.div>

      {/* ────── Readability overlay ────── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/30 md:bg-gradient-to-r md:from-slate-950 md:via-slate-950/85 md:to-slate-950/10"
      />

      {/* ────── Floating community chips ────── */}
      <FloatingChips />

      {/* ────── Content ────── */}
      <div className="relative z-10 flex min-h-screen flex-col px-6 pb-10 pt-6 md:px-10 lg:px-16">
        {/* Top bar: brand chip (left) + Log in (right) */}
        <div className="flex items-center justify-between">
          <FadeIn>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-100 ring-1 ring-amber-200/40 backdrop-blur-sm">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
              Ultimate Student
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-300 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-xl shadow-amber-500/40 ring-1 ring-amber-100/50 transition duration-150 hover:bg-amber-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.97]"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Log in
            </Link>
          </FadeIn>
        </div>

        {/* Headline + buttons: bottom on mobile, center-left on desktop */}
        <div className="mt-auto md:mt-0 md:flex-1 md:items-center md:flex">
          <div className="max-w-xl md:max-w-lg">
            <FadeIn delay={0.3} y={18}>
              <h1 className="text-[36px] font-bold leading-[1.05] text-white display md:text-5xl lg:text-6xl">
                Your campus community.
              </h1>
            </FadeIn>
            <FadeIn delay={0.45}>
              <p className="mt-3 max-w-md text-base leading-relaxed text-slate-200 md:mt-4 md:text-lg">
                Classes, hostels, events and opportunities together.
              </p>
            </FadeIn>

            <FadeIn delay={0.6} className="mt-7">
              <motion.div
                animate={
                  reduce
                    ? undefined
                    : {
                        boxShadow: [
                          "0 0 0 0 rgba(79,70,229,0.0)",
                          "0 0 0 12px rgba(79,70,229,0.18)",
                          "0 0 0 0 rgba(79,70,229,0.0)",
                        ],
                      }
                }
                transition={{
                  duration: 2.4,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
                className="inline-block rounded-xl"
              >
                <ActionButton
                  onClick={goStart}
                  leading={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                  className="px-6"
                >
                  Get started
                </ActionButton>
              </motion.div>
            </FadeIn>
          </div>
        </div>
      </div>
    </div>
  );
};
