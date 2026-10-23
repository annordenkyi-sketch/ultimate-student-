import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useNotifications } from "@/hooks/useNotifications";
import { SearchBar } from "@/components/SearchBar";
import { ShortcutsBlock } from "./ShortcutsBlock";
import { AnnouncementsBlock } from "./AnnouncementsBlock";
import { DeadlinesBlock } from "./DeadlinesBlock";
import { EventsBlock } from "./EventsBlock";
import { SavedBlock } from "./SavedBlock";

const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

/** Mobile-only header: greeting line, bell, search */
const MobileHeader = ({ firstName }: { firstName: string }) => {
  const { unreadCount } = useNotifications();
  return (
    <header className="lg:hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{greeting()}</p>
          <h1 className="text-xl font-bold text-slate-900">{firstName}</h1>
        </div>
        <Link
          to="/notifications"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white"
            >
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
      <div className="mt-4">
        <SearchBar placeholder="Search campus, services, events…" />
      </div>
    </header>
  );
};

export const HomePage = () => {
  const { profile } = useProfile();
  const firstName = profile?.name.split(" ")[0] || "there";

  return (
    <div>
      <MobileHeader firstName={firstName} />

      {/* Desktop welcome strip — plain, no decoration */}
      <header className="mb-6 mt-6 hidden lg:block">
        <p className="text-xs font-medium text-slate-500">{greeting()}</p>
        <h1 className="text-2xl font-bold text-slate-900">{firstName}</h1>
      </header>

      {/* Section shortcuts — always on top */}
      <section className="mt-6">
        <ShortcutsBlock />
      </section>

      {/* Mobile: stacked blocks in brief order */}
      <div className="mt-6 space-y-6 lg:hidden">
        <AnnouncementsBlock />
        <DeadlinesBlock />
        <EventsBlock />
        <SavedBlock />
      </div>

      {/* Desktop: 3-col grid — main 2/3, side 1/3 */}
      <div className="mt-6 hidden gap-6 lg:grid lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AnnouncementsBlock />
          <DeadlinesBlock />
        </div>
        <div className="space-y-6 lg:col-span-1">
          <EventsBlock />
          <SavedBlock />
        </div>
      </div>
    </div>
  );
};
