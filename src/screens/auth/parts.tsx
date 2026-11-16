import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { btn } from "@/ui/button";

/** Screen title. Takes focus on arrival so screen readers announce the new step. */
export const AuthHeading = ({
  title,
  children,
  takeFocus = true,
}: {
  title: string;
  children?: ReactNode;
  takeFocus?: boolean;
}) => {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (takeFocus) ref.current?.focus({ preventScroll: true });
  }, [takeFocus]);
  return (
    <div className="mb-6">
      <h1
        ref={ref}
        tabIndex={-1}
        className="text-2xl font-medium outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-3xl"
      >
        {title}
      </h1>
      {children && <div className="mt-2 text-sm leading-relaxed text-oxford-mute">{children}</div>}
    </div>
  );
};

export const BackLink = ({ to, label = "Back" }: { to: string; label?: string }) => (
  <Link
    to={to}
    className="-ml-2 mb-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream"
  >
    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
    {label}
  </Link>
);

export const TextLink = ({ to, children, state }: { to: string; children: ReactNode; state?: unknown }) => (
  <Link
    to={to}
    state={state}
    className="font-semibold text-oxford-ink underline underline-offset-4 hover:no-underline"
  >
    {children}
  </Link>
);

/** A step already completed, shown when the student comes back to it. */
export const StepDone = ({
  title,
  children,
  continueTo,
}: {
  title: string;
  children: ReactNode;
  continueTo: string;
}) => (
  <div>
    <div className="flex items-start gap-3 rounded-xl border border-oxford-success/30 bg-oxford-success/5 p-4">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-oxford-success" aria-hidden="true" />
      <div className="text-sm">
        <p className="font-semibold text-oxford-ink">{title}</p>
        <div className="mt-1 text-oxford-ink2">{children}</div>
      </div>
    </div>
    <Link to={continueTo} className={btn("primary", "mt-6 w-full")}>
      Continue
    </Link>
  </div>
);
