import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Activity, ClipboardCheck, ExternalLink, FileText, LayoutDashboard, LogOut, ShieldCheck, Users } from "lucide-react";
import { useAdmin, useUnsavedGuard, canManage, canReview, ROLE_LABEL } from "./AdminAuth";
import { abtn } from "./ui";

const NAV = [
  { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard, show: () => true },
  { to: "/admin/content", end: false, label: "Content", icon: FileText, show: () => true },
  { to: "/admin/review", end: false, label: "Review queue", icon: ClipboardCheck, show: canReview },
  { to: "/admin/activity", end: false, label: "Activity log", icon: Activity, show: () => true },
  { to: "/admin/users", end: false, label: "Users and roles", icon: Users, show: canManage },
];

/** Flow 10 admin layout: left sidebar, top bar, wide content area. Desktop first; icon sidebar on tablets. */
export const AdminLayout = () => {
  const { user, logOut } = useAdmin();
  const { confirmLeave } = useUnsavedGuard();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/admin/login" replace />;
  if (!user.role) return <Navigate to="/admin/denied" replace />;

  const go = (to: string) => (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    confirmLeave(() => navigate(to));
  };

  return (
    <div className="min-h-screen bg-oxford-paper text-oxford-ink">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:shadow">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 flex w-16 flex-col border-r border-oxford-rule bg-oxford-cream lg:w-56">
        <div className="flex h-14 items-center gap-2 border-b border-oxford-rule px-4">
          <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="hidden text-sm font-semibold lg:inline">Content admin</span>
        </div>
        <nav aria-label="Admin" className="flex-1 space-y-1 p-2">
          {NAV.filter((n) => n.show(user)).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={go(n.to)}
              title={n.label}
              className={({ isActive }) =>
                `flex min-h-[40px] items-center gap-3 rounded-md px-3 text-sm transition ${isActive ? "bg-oxford-sand font-semibold" : "font-medium text-oxford-ink2 hover:bg-oxford-sandSoft"}`
              }
            >
              <n.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="sr-only lg:not-sr-only">{n.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="pl-16 lg:pl-56">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-oxford-rule bg-oxford-paper/95 px-4 backdrop-blur lg:px-6">
          <p className="text-sm text-oxford-mute">
            Signed in as <span className="font-semibold text-oxford-ink">{user.name}</span>
            <span className="ml-2 rounded-full bg-oxford-ink px-2 py-0.5 text-[11px] font-semibold text-white">{ROLE_LABEL[user.role]}</span>
          </p>
          <div className="ml-auto flex items-center gap-2">
            <a href="/home" target="_blank" rel="noopener noreferrer" className={abtn("ghost")}>
              Student app
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <button
              type="button"
              onClick={() =>
                confirmLeave(() => {
                  logOut();
                  navigate("/admin/login", { replace: true });
                })
              }
              className={abtn("secondary")}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </header>
        <main id="admin-main" tabIndex={-1} className="mx-auto max-w-[1400px] px-4 py-5 outline-none lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
