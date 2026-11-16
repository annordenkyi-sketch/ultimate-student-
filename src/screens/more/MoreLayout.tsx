import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { isLimited } from "@/session/access";
import { useSession } from "@/session/SessionProvider";
import { BackLink } from "../auth/parts";
import { LockedPanel } from "@/ui/LockedPanel";
import { PageHeader } from "@/ui/PageHeader";
import { MoreNav, useVisibleSections } from "./MoreNav";

/**
 * Flow 07 "More". Desktop: section list on the left, the open section on the
 * right. Mobile: the list is its own page and each section opens on its own.
 */
export const MoreLayout = () => {
  const desktop = useIsDesktop();
  const { pathname } = useLocation();
  const sections = useVisibleSections();

  // On desktop there's always a section open beside the list.
  if (desktop && pathname === "/more") return <Navigate to={sections[0]!.to} replace />;

  return (
    <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <aside className="hidden lg:sticky lg:top-24 lg:block">
        <MoreNav />
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
};

/** /more on mobile: the menu itself. */
export const MoreHome = () => (
  <>
    <PageHeader title="More" description="Your account, academics, support and settings." />
    <MoreNav />
  </>
);

/** Section title, with a back link to the menu on mobile. */
export const SectionHeader = ({ title, description, back }: { title: string; description?: ReactNode; back?: { to: string; label: string } }) => (
  <header className="mb-6">
    <div className={back ? "" : "lg:hidden"}>
      <BackLink to={back?.to ?? "/more"} label={back?.label ?? "More"} />
    </div>
    <h1 className="text-3xl font-medium leading-tight md:text-4xl">{title}</h1>
    {description && <div className="mt-2 max-w-2xl text-oxford-mute">{description}</div>}
  </header>
);

/** Personal sections: guests and students not yet verified see what's inside and how to unlock it. */
export const PersonalSection = ({ title, includes, children }: { title: string; includes: string[]; children: ReactNode }) => {
  const { access } = useSession();
  if (!isLimited(access)) return <>{children}</>;
  return (
    <>
      <SectionHeader title={title} />
      <LockedPanel feature={title} includes={includes} />
    </>
  );
};
