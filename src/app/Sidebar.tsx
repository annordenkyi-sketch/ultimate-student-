import {
  Bookmark,
  Briefcase,
  GraduationCap,
  Home as HomeIcon,
  LifeBuoy,
  Map as MapIcon,
  Megaphone,
  Building2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";

interface NavItem {
  to: string;
  label: string;
  icon?: LucideIcon;
  end?: boolean;
}

const PRIMARY: NavItem[] = [
  { to: "/", label: "Home", icon: HomeIcon, end: true },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
  { to: "/section/academic", label: "Academic", icon: GraduationCap },
  { to: "/section/navigation", label: "Campus map", icon: MapIcon },
  { to: "/section/accommodation", label: "Accommodation", icon: Building2 },
  { to: "/section/services", label: "Services", icon: LifeBuoy },
  { to: "/section/social", label: "Social life", icon: Users },
  { to: "/section/opportunities", label: "Opportunities", icon: Briefcase },
];

const SECONDARY: NavItem[] = [
  { to: "/saved", label: "Saved", icon: Bookmark },
];

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-brand-50 text-brand-700"
      : "text-slate-700 hover:bg-slate-100"
  }`;

export const Sidebar = () => (
  <aside
    aria-label="Main navigation"
    className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block"
  >
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-slate-200 px-5">
        <NavLink
          to="/"
          end
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
          </span>
          Ultimate Student
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {PRIMARY.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={linkClass}>
                  {({ isActive }) => (
                    <>
                      {Icon ? (
                        <Icon
                          className="h-4 w-4"
                          strokeWidth={isActive ? 2.4 : 1.8}
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="h-4 w-4" aria-hidden="true" />
                      )}
                      {item.label}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Library
          </p>
          <ul className="space-y-0.5">
            {SECONDARY.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink to={item.to} className={linkClass}>
                    {({ isActive }) => (
                      <>
                        {Icon ? (
                          <Icon
                            className="h-4 w-4"
                            strokeWidth={isActive ? 2.4 : 1.8}
                            aria-hidden="true"
                          />
                        ) : (
                          <span className="h-4 w-4" aria-hidden="true" />
                        )}
                        {item.label}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  </aside>
);
