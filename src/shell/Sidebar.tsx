import { Link, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import { isLimited } from "@/session/access";
import { useSession } from "@/session/SessionProvider";
import { useSync } from "@/session/SyncProvider";
import { useUnlock } from "@/session/useUnlock";
import { Avatar } from "@/ui/Avatar";
import { btn } from "@/ui/button";
import { Logo } from "@/ui/Logo";
import { VerificationChip } from "@/ui/StatusChip";
import { TABS, activeTabFor } from "./tabs";

export const Sidebar = () => {
  const { access, account } = useSession();
  const unlock = useUnlock();
  const { pathname } = useLocation();
  const active = activeTabFor(pathname);
  const limited = isLimited(access);
  const { pendingCount } = useSync();

  return (
    <aside
      aria-label="Main navigation"
      className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-oxford-rule/70 bg-oxford-cream/60 lg:flex"
    >
      <div className="flex h-16 items-center px-6">
        <Link to="/" aria-label="Ultimate Student, start" className="rounded-full">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-5">
        <ul className="space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const current = active?.id === tab.id;
            const locked = limited && tab.personal;
            return (
              <li key={tab.id}>
                <Link
                  to={tab.to}
                  aria-current={current ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    current
                      ? "bg-oxford-sand font-semibold text-oxford-ink"
                      : "font-medium text-oxford-ink2 hover:bg-oxford-sandSoft"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={current ? 2.2 : 1.8} aria-hidden="true" />
                  {tab.label}
                  {tab.id === "more" && pendingCount > 0 && (
                    <>
                      <span aria-hidden="true" className="ml-auto h-2.5 w-2.5 rounded-full bg-oxford-gold" />
                      <span className="sr-only">(timetable changes to review)</span>
                    </>
                  )}
                  {locked && (
                    <>
                      <Lock className="ml-auto h-3.5 w-3.5 text-oxford-mute" aria-hidden="true" />
                      <span className="sr-only">(locked)</span>
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-oxford-rule/70 p-4">
        {account ? (
          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-oxford-sandSoft"
          >
            <Avatar name={account.name} photo={account.photo} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-oxford-ink">
                {account.name}
              </span>
              <span className="mt-1 block">
                <VerificationChip status={account.verification} />
              </span>
            </span>
          </Link>
        ) : (
          <div className="p-2">
            <p className="text-sm font-semibold text-oxford-ink">Browsing as a guest</p>
            {unlock && (
              <Link to={unlock.to} className={btn("primary", "mt-3 w-full")}>
                {unlock.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
