import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, SearchX } from "lucide-react";
import { btn } from "@/ui/button";
import { canGoBack, useGoBack } from "@/lib/useGoBack";
import { BackLink } from "../auth/parts";

/** Back to wherever the student came from; the fallback when they arrived directly. */
export const HistoryBack = ({ fallback: given }: { fallback: { to: string; label: string } }) => {
  // Opened straight from a notification (e.g. a link from outside the app): back to the notification centre.
  const fromNotification = new URLSearchParams(useLocation().search).get("ref") === "notification";
  const fallback = fromNotification ? { to: "/notifications", label: "Notifications" } : given;
  const goBack = useGoBack(fallback.to);
  if (!canGoBack()) return <BackLink to={fallback.to} label={fallback.label} />;
  return (
    <button
      type="button"
      onClick={goBack}
      className="-ml-2 mb-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back
    </button>
  );
};

/** Back link, eyebrow and title for detail pages inside the app shell. */
export const DetailHeader = ({
  back,
  eyebrow,
  title,
  children,
}: {
  back: { to: string; label: string };
  eyebrow?: ReactNode;
  title: string;
  children?: ReactNode;
}) => (
  <header className="mb-6">
    <HistoryBack fallback={back} />
    {eyebrow && (
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-oxford-mute">{eyebrow}</p>
    )}
    <h1 className="mt-1 text-3xl font-medium leading-tight md:text-4xl">{title}</h1>
    {children && <div className="mt-2 text-oxford-mute">{children}</div>}
  </header>
);

/** Flow 09: the link is fine but the content has gone (event removed, course dropped). */
export const NotFound = ({ what, back }: { what: string; back: { to: string; label: string } }) => (
  <div className="max-w-xl">
    <HistoryBack fallback={back} />
    <div className="mt-2 rounded-2xl border border-oxford-rule bg-white/80 px-6 py-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-oxford-sandSoft text-oxford-ink">
        <SearchX className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-2xl font-medium">This is no longer available</h1>
      <p className="mx-auto mt-2 max-w-sm text-oxford-mute">
        This {what.toLowerCase()} may have been removed or changed since the link was sent.
      </p>
      <Link to="/home" className={btn("primary", "mt-6")}>
        Go to Home
      </Link>
    </div>
  </div>
);
