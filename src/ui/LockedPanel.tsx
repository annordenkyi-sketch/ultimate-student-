import { Link } from "react-router-dom";
import { Check, Lock } from "lucide-react";
import { useSession } from "@/session/SessionProvider";
import { useUnlock } from "@/session/useUnlock";
import { btn } from "./button";

interface Props {
  /** Name of the locked area, e.g. "Home". */
  feature: string;
  /** What the area gives a verified student, taken from the user flow. */
  includes: string[];
}

export const LockedPanel = ({ feature, includes }: Props) => {
  const { access } = useSession();
  const unlock = useUnlock();

  const title =
    access === "guest"
      ? `Sign in to use ${feature}`
      : access === "pending"
        ? `${feature} unlocks after verification`
        : `${feature} is for verified UG students`;

  const lead =
    access === "guest"
      ? "You need a student account for this."
      : access === "pending"
        ? "We're still reviewing your student status."
        : "Verify your student status to use it.";

  return (
    <section
      aria-labelledby="locked-title"
      className="rounded-2xl border border-oxford-rule bg-white/70 p-6 md:p-8"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-oxford-sandSoft text-oxford-ink">
        <Lock className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 id="locked-title" className="mt-4 text-2xl font-medium">
        {title}
      </h2>
      <p className="mt-2 text-oxford-mute">{lead} It includes:</p>
      <ul className="mt-4 space-y-2.5">
        {includes.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm text-oxford-ink2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-oxford-gold" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-7 flex flex-wrap gap-3">
        {unlock && (
          <Link to={unlock.to} className={btn("primary")}>
            {unlock.label}
          </Link>
        )}
        <Link to="/explore" className={btn("secondary")}>
          Browse Explore
        </Link>
      </div>
    </section>
  );
};
