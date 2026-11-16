import { Link } from "react-router-dom";
import { Eye, Hourglass, ShieldAlert, type LucideIcon } from "lucide-react";
import { useSession } from "@/session/SessionProvider";
import { useUnlock } from "@/session/useUnlock";
import { btn } from "@/ui/button";

const COPY: Record<"guest" | "unverified" | "pending", { icon: LucideIcon; title: string; body: string }> = {
  guest: {
    icon: Eye,
    title: "You're browsing as a guest",
    body: "News, events and Explore are open to everyone. Your timetable, For You, saved items and reminders need a student account.",
  },
  unverified: {
    icon: ShieldAlert,
    title: "Your student status isn't verified yet",
    body: "Your timetable, lecture reminders and For You are for verified UG students. News, events and Explore are open to you.",
  },
  pending: {
    icon: Hourglass,
    title: "Your verification is being reviewed",
    body: "Your timetable, lecture reminders and For You unlock once it's approved. News, events and Explore are open to you.",
  },
};

export const AccessBanner = () => {
  const { access } = useSession();
  const unlock = useUnlock();
  if (access !== "guest" && access !== "unverified" && access !== "pending") return null;

  const copy = COPY[access];
  const Icon = copy.icon;

  return (
    <section
      aria-label="Limited access"
      className="mb-6 flex flex-col gap-3 rounded-2xl border border-oxford-gold/40 bg-oxford-sandSoft p-4 sm:flex-row sm:items-center sm:gap-4 md:p-5"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-oxford-ink">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-oxford-ink">{copy.title}</p>
        <p className="mt-0.5 text-sm text-oxford-ink2">{copy.body}</p>
      </div>
      {unlock && (
        <Link to={unlock.to} className={btn("primary", "shrink-0 self-start sm:self-auto")}>
          {unlock.label}
        </Link>
      )}
    </section>
  );
};
