import { Link, Navigate, useSearchParams } from "react-router-dom";
import { safeReturnTo } from "@/session/access";
import { useSession } from "@/session/SessionProvider";
import { btn } from "@/ui/button";
import { AuthFrame } from "./AuthFrame";
import { AuthHeading, BackLink } from "./parts";

/** Flow 01 "Choose entry": sign up, log in or continue as a guest. */
export const ChooseEntry = () => {
  const { account } = useSession();
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo"));

  if (account) return <Navigate to="/" replace />;

  const loginTo = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login";

  return (
    <AuthFrame>
      <BackLink to="/welcome" label="Home page" />
      <AuthHeading title="Welcome to Ultimate Student">
        Your timetable, campus and university news in one place.
      </AuthHeading>

      <div className="flex flex-col gap-3">
        <Link to="/signup/level" className={btn("primary", "w-full")}>
          Sign up
        </Link>
        <Link to={loginTo} className={btn("secondary", "w-full")}>
          Log in
        </Link>
        <Link
          to={returnTo ?? "/explore"}
          className="inline-flex min-h-[44px] items-center justify-center text-sm font-semibold text-oxford-ink underline underline-offset-4 hover:no-underline"
        >
          Continue as guest
        </Link>
      </div>

      <p className="mt-5 border-t border-oxford-rule pt-5 text-sm leading-relaxed text-oxford-mute">
        Guests can browse public places, events and services. You'll need an account to save items,
        see your timetable and get lecture reminders.
      </p>
    </AuthFrame>
  );
};
