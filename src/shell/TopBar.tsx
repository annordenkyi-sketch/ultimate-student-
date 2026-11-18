import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Bell, Search, UserRound } from "lucide-react";
import { useActivity } from "@/session/ActivityProvider";
import { useSession } from "@/session/SessionProvider";
import { useUnlock } from "@/session/useUnlock";
import { Avatar } from "@/ui/Avatar";
import { Logo } from "@/ui/Logo";

const IconLink = ({
  to,
  label,
  className = "",
  children,
}: {
  to: string;
  label: string;
  className?: string;
  children: ReactNode;
}) => (
  <Link
    to={to}
    aria-label={label}
    className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-oxford-ink transition hover:bg-oxford-cream ${className}`}
  >
    {children}
  </Link>
);

export const TopBar = () => {
  const { account } = useSession();
  const { unreadCount } = useActivity();
  const unlock = useUnlock();
  const signInTo = unlock?.to ?? "/start";

  return (
    <header className="sticky top-0 z-30 border-b border-oxford-rule/70 bg-oxford-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6 lg:px-10">
        <Link to="/" aria-label="Ultimate Student, start" className="rounded-full lg:hidden">
          <Logo />
        </Link>

        <Link
          to="/search"
          className="hidden h-11 w-full max-w-md items-center gap-2.5 rounded-full border border-oxford-ink/15 bg-white px-4 text-sm text-oxford-mute transition hover:border-oxford-ink/30 lg:flex"
        >
          <Search className="h-4 w-4 text-oxford-ink" aria-hidden="true" />
          Search places, events and services
        </Link>

        <div className="ml-auto flex items-center gap-0.5">
          <IconLink to="/search" label="Search" className="lg:hidden">
            <Search className="h-5 w-5" aria-hidden="true" />
          </IconLink>

          {account ? (
            <>
              <IconLink
                to="/notifications"
                label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                className="relative"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-oxford-danger px-1 text-[10px] font-bold leading-none text-white"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </IconLink>
              <Link to="/profile" aria-label="My profile" className="ml-1 rounded-full">
                <Avatar name={account.name} photo={account.photo} />
              </Link>
            </>
          ) : (
            <>
              <IconLink
                to="/notifications"
                label={unreadCount > 0 ? `Campus alerts, ${unreadCount} unread` : "Campus alerts"}
                className="relative"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-oxford-danger px-1 text-[10px] font-bold leading-none text-white"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </IconLink>
              <IconLink to={signInTo} label="Sign in" className="ml-1 border border-oxford-ink/15 bg-white">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </IconLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
