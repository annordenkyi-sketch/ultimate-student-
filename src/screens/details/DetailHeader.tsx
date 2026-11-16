import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { canGoBack, useGoBack } from "@/lib/useGoBack";
import { BackLink } from "../auth/parts";

/** Back to wherever the student came from; the fallback when they arrived directly. */
export const HistoryBack = ({ fallback }: { fallback: { to: string; label: string } }) => {
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

export const NotFound = ({ what, back }: { what: string; back: { to: string; label: string } }) => (
  <>
    <DetailHeader back={back} title={`${what} not found`} />
    <p className="text-oxford-mute">It may have been removed, or the link is out of date.</p>
  </>
);
