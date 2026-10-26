import { Bell, User } from "lucide-react";
import { Link } from "react-router-dom";
import { SearchBar } from "@/components/SearchBar";
import { useNotifications } from "@/hooks/useNotifications";
import { useProfile } from "@/hooks/useProfile";

export const TopBar = () => {
  const { unreadCount } = useNotifications();
  const { profile } = useProfile();

  const initial = (profile?.name || "S").trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 hidden h-16 border-b border-line bg-paper/95 backdrop-blur-sm lg:block">
      <div className="mx-auto flex h-full max-w-[1200px] items-center gap-4 px-6">
        {/* Wide search */}
        <div className="flex-1 max-w-xl">
          <SearchBar placeholder="Search campus, services, events…" />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/notifications"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-brand-50 hover:text-ink"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white"
              >
                {unreadCount}
              </span>
            )}
          </Link>

          <Link
            to="/profile"
            aria-label="Open profile"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 transition hover:bg-brand-200"
          >
            {profile ? initial : <User className="h-5 w-5" aria-hidden="true" />}
          </Link>
        </div>
      </div>
    </header>
  );
};
