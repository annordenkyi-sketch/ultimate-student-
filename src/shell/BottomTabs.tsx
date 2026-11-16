import { Link, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import { isLimited } from "@/session/access";
import { useSession } from "@/session/SessionProvider";
import { useSync } from "@/session/SyncProvider";
import { TABS, activeTabFor } from "./tabs";

export const BottomTabs = () => {
  const { access } = useSession();
  const { pathname } = useLocation();
  const active = activeTabFor(pathname);
  const limited = isLimited(access);
  const { pendingCount } = useSync();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-oxford-rule/70 bg-oxford-paper/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const current = active?.id === tab.id;
          const locked = limited && tab.personal;
          return (
            <li key={tab.id} className="flex-1">
              <Link
                to={tab.to}
                aria-current={current ? "page" : undefined}
                className={`relative flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] transition ${
                  current ? "font-semibold text-oxford-ink" : "font-medium text-oxford-mute"
                }`}
              >
                {current && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-oxford-ink"
                  />
                )}
                <span className="relative">
                  <Icon className="h-5 w-5" strokeWidth={current ? 2.2 : 1.8} aria-hidden="true" />
                  {tab.id === "more" && pendingCount > 0 && (
                    <span aria-hidden="true" className="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full bg-oxford-gold ring-2 ring-oxford-paper" />
                  )}
                  {locked && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-oxford-paper"
                    >
                      <Lock className="h-2.5 w-2.5 text-oxford-mute" />
                    </span>
                  )}
                </span>
                {tab.label}
                {locked && <span className="sr-only">(locked)</span>}
                {tab.id === "more" && pendingCount > 0 && <span className="sr-only">(timetable changes to review)</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
