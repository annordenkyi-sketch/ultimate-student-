import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bookmark, ChevronRight, ExternalLink, GraduationCap, LifeBuoy, LogOut, Settings, UserRound, type LucideIcon } from "lucide-react";
import { isLimited } from "@/session/access";
import { useSession } from "@/session/SessionProvider";
import { useSync } from "@/session/SyncProvider";
import { useUnlock } from "@/session/useUnlock";
import { useAcademicNames } from "@/lib/useAcademicNames";
import { Avatar } from "@/ui/Avatar";
import { btn } from "@/ui/button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { VerificationChip } from "@/ui/StatusChip";

export interface MoreSection {
  id: "profile" | "academics" | "self-service" | "saved" | "support" | "settings";
  to: string;
  icon: LucideIcon;
  title: string;
  body: string;
  /** Personal sections need a verified student. Support and Settings basics are open to everyone. */
  personal: boolean;
}

export const SECTIONS: MoreSection[] = [
  { id: "profile", to: "/more/profile", icon: UserRound, title: "Profile", body: "Your details, photo and contact number.", personal: true },
  { id: "academics", to: "/more/academics", icon: GraduationCap, title: "Academics", body: "Courses, weekly timetable and semester settings.", personal: true },
  { id: "self-service", to: "/more/self-service", icon: ExternalLink, title: "Self-service", body: "University portals and your portal connection.", personal: true },
  { id: "saved", to: "/more/saved", icon: Bookmark, title: "Saved items", body: "Announcements, places, events and services you saved.", personal: true },
  { id: "support", to: "/more/support", icon: LifeBuoy, title: "Support", body: "Answers to common questions, or report an issue.", personal: false },
  { id: "settings", to: "/more/settings", icon: Settings, title: "Settings", body: "Notifications, privacy and security.", personal: false },
];

/** Sections this student can open. */
export const useVisibleSections = () => {
  const { access } = useSession();
  return isLimited(access) ? SECTIONS.filter((s) => !s.personal) : SECTIONS;
};

/** Photo, name, programme and level; or a sign-in / verify prompt. */
const ProfileSummary = () => {
  const { account, access } = useSession();
  const unlock = useUnlock();
  const names = useAcademicNames(account);

  if (!account) {
    return (
      <div className="rounded-2xl border border-oxford-rule bg-white/80 p-4">
        <p className="font-semibold text-oxford-ink">Browsing as a guest</p>
        <p className="mt-1 text-sm text-oxford-mute">Sign in to see your profile, courses, timetable and saved items.</p>
        {unlock && (
          <Link to={unlock.to} className={btn("primary", "mt-3 w-full")}>
            {unlock.label}
          </Link>
        )}
      </div>
    );
  }

  const limited = isLimited(access);
  return (
    <div className="rounded-2xl border border-oxford-rule bg-white/80 p-4">
      <div className="flex items-center gap-3">
        <Avatar name={account.name} photo={account.photo} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-serif text-lg font-semibold leading-tight text-oxford-ink">{account.preferredName || account.name}</p>
          {limited ? (
            <span className="mt-1 inline-block">
              <VerificationChip status={account.verification} />
            </span>
          ) : (
            <>
              <p className="truncate text-sm text-oxford-ink2">{names ? (names.programme ?? "Programme not set") : account.academic ? "…" : "Programme not set"}</p>
              <p className="text-sm text-oxford-mute">{names?.level ?? account.academic?.level ?? ""}</p>
            </>
          )}
        </div>
      </div>
      {limited && unlock && (
        <>
          <p className="mt-3 text-sm text-oxford-mute">Profile, academics, self-service and saved items open once you're verified.</p>
          <Link to={unlock.to} className={btn("primary", "mt-3 w-full")}>
            {unlock.label}
          </Link>
        </>
      )}
    </div>
  );
};

/** The More menu: profile summary, sections, and Log out. A page on mobile, the left column on desktop. */
export const MoreNav = () => {
  const { account, signOut } = useSession();
  const { pendingCount } = useSync();
  const sections = useVisibleSections();
  const navigate = useNavigate();
  const [confirmOut, setConfirmOut] = useState(false);

  return (
    <div className="space-y-4">
      <ProfileSummary />
      <nav aria-label="More sections">
        <ul className="divide-y divide-oxford-rule/70 overflow-hidden rounded-2xl border border-oxford-rule bg-white/80">
          {sections.map((s) => (
            <li key={s.id}>
              <NavLink
                to={s.to}
                className={({ isActive }) =>
                  `flex min-h-[64px] items-center gap-3 px-4 py-3 transition hover:bg-oxford-cream ${isActive ? "lg:bg-oxford-sandSoft" : ""}`
                }
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-oxford-sandSoft text-oxford-ink">
                  <s.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-semibold text-oxford-ink">
                    {s.title}
                    {s.id === "academics" && pendingCount > 0 && (
                      <span className="rounded-full bg-oxford-gold px-2 py-0.5 text-[11px] font-semibold text-oxford-ink">
                        Pending review
                      </span>
                    )}
                  </span>
                  <span className="block text-sm leading-snug text-oxford-mute lg:hidden xl:block">{s.body}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-oxford-mute" aria-hidden="true" />
              </NavLink>
            </li>
          ))}
          {account && (
            <li>
              <button
                type="button"
                onClick={() => setConfirmOut(true)}
                className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-oxford-cream"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-oxford-danger/10 text-oxford-danger">
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-semibold text-oxford-danger">Log out</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      <ConfirmDialog
        open={confirmOut}
        title="Log out?"
        body="You'll need to sign in again to see your timetable, goals and saved items."
        confirmLabel="Yes, log out"
        cancelLabel="No, stay"
        onConfirm={() => {
          setConfirmOut(false);
          signOut();
          navigate("/welcome", { replace: true });
        }}
        onCancel={() => setConfirmOut(false)}
      />
    </div>
  );
};
