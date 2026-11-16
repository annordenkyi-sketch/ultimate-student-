import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useSession } from "@/session/SessionProvider";
import { AccessBanner } from "./AccessBanner";
import { BottomTabs } from "./BottomTabs";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export const AppShell = () => {
  const { access } = useSession();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Flow 00: verified but setup not finished → resume onboarding.
  if (access === "needsSetup") return <Navigate to="/onboarding" replace />;

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:shadow"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 outline-none sm:px-6 lg:px-10 lg:pb-14 lg:pt-8"
        >
          <AccessBanner />
          <motion.div
            key={pathname}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <BottomTabs />
    </div>
  );
};
