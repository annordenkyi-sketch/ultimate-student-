import { Link, Navigate, useNavigate } from "react-router-dom";
import { Check, Lock } from "lucide-react";
import { useSession } from "@/session/SessionProvider";
import { btn } from "@/ui/button";
import { VerificationChip } from "@/ui/StatusChip";
import { AuthFrame } from "./AuthFrame";
import { AuthHeading } from "./parts";

const AVAILABLE = [
  "Campus map and walking directions",
  "Places to eat, study and get things done",
  "Campus events",
  "University services and contacts",
];

const LOCKED = [
  "Home, with your timetable and next lecture",
  "Lecture reminders",
  "For You: semester goals and weekly plan",
];

const NEXT_STEPS = [
  "The university confirms your student record.",
  "Your account updates to verified. You'll see it the next time you open the app.",
  "You then set up your semester, courses and reminders.",
];

/** Flow 01 "Pending or limited access". */
export const LimitedScreen = () => {
  const { account, signOut } = useSession();
  const navigate = useNavigate();

  if (!account) return <Navigate to="/start" replace />;
  if (account.verification === "verified") return <Navigate to="/" replace />;

  const attempt = account.lastVerification;
  const pending = account.verification === "pending";
  const failed = !pending && attempt?.result === "not-verified";

  return (
    <AuthFrame>
      <VerificationChip status={account.verification} />
      <div className="mt-3">
        {pending ? (
          <AuthHeading title="Your verification is being reviewed">
            You submitted <strong className="font-semibold text-oxford-ink">{attempt?.identifier}</strong>.
            The university needs to confirm your student record before personal features unlock.
          </AuthHeading>
        ) : failed ? (
          <AuthHeading title="We couldn't confirm your student status">
            <strong className="font-semibold text-oxford-ink">{attempt?.identifier}</strong> didn't
            match university records. Check your student ID or UG email and try again.
          </AuthHeading>
        ) : (
          <AuthHeading title="Your student status isn't verified">
            Verify with your student ID or UG email to unlock personal features.
          </AuthHeading>
        )}
      </div>

      {pending && (
        <section aria-labelledby="next-heading" className="mb-6 rounded-xl border border-oxford-rule bg-white/70 p-4">
          <h2 id="next-heading" className="font-sans text-sm font-semibold text-oxford-ink">
            What happens next
          </h2>
          <ol className="mt-3 space-y-2.5">
            {NEXT_STEPS.map((s, i) => (
              <li key={s} className="flex gap-3 text-sm text-oxford-ink2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-oxford-sandSoft text-xs font-semibold text-oxford-ink">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        <section aria-labelledby="available-heading">
          <h2 id="available-heading" className="font-sans text-sm font-semibold text-oxford-ink">
            You can still use
          </h2>
          <ul className="mt-2 space-y-2">
            {AVAILABLE.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-oxford-ink2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-oxford-success" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="locked-heading">
          <h2 id="locked-heading" className="font-sans text-sm font-semibold text-oxford-ink">
            Locked until you're verified
          </h2>
          <ul className="mt-2 space-y-2">
            {LOCKED.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-oxford-ink2">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-oxford-mute" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-7 flex flex-col gap-3">
        <Link to="/verify" className={btn("primary", "w-full")}>
          {failed || pending ? "Try verification again" : "Verify my status"}
        </Link>
        <Link to="/explore" className={btn("secondary", "w-full")}>
          Continue with public content only
        </Link>
      </div>

      <button
        type="button"
        onClick={() => {
          signOut();
          navigate("/start", { replace: true });
        }}
        className="mt-5 w-full text-center text-sm font-semibold text-oxford-mute underline-offset-4 hover:text-oxford-ink hover:underline"
      >
        Log out
      </button>
    </AuthFrame>
  );
};
