import { Bookmark, Grid3x3, Home, Search, User } from "lucide-react";
import { NavLink } from "react-router-dom";

interface TabDef {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
}

const tabs: TabDef[] = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/search", label: "Search", icon: Search },
  { to: "/sections", label: "Sections", icon: Grid3x3 },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/profile", label: "Profile", icon: User },
];

export const BottomTabBar = () => (
  <nav
    aria-label="Primary"
    className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper lg:hidden"
  >
    <ul className="mx-auto flex max-w-[480px] items-stretch justify-between px-2 pb-[max(env(safe-area-inset-bottom),0px)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                  isActive
                    ? "text-brand-700"
                    : "text-muted hover:text-ink"
                }`
              }
              aria-label={tab.label}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="h-5 w-5"
                    aria-hidden="true"
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                  <span>{tab.label}</span>
                </>
              )}
            </NavLink>
          </li>
        );
      })}
    </ul>
  </nav>
);
