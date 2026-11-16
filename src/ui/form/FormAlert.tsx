import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

type Tone = "error" | "info" | "success";

const TONES: Record<Tone, { box: string; icon: string; Icon: typeof Info }> = {
  error: { box: "border-oxford-danger/30 bg-oxford-danger/5", icon: "text-oxford-danger", Icon: AlertTriangle },
  info: { box: "border-oxford-ink/15 bg-white", icon: "text-oxford-ink", Icon: Info },
  success: { box: "border-oxford-success/30 bg-oxford-success/5", icon: "text-oxford-success", Icon: CheckCircle2 },
};

interface Props {
  tone: Tone;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  id?: string;
  className?: string;
}

/** Errors are announced immediately; info and success politely. */
export const FormAlert = ({ tone, title, children, actions, id, className = "" }: Props) => {
  const t = TONES[tone];
  return (
    <div
      id={id}
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border p-4 text-sm text-oxford-ink ${t.box} ${className}`}
    >
      <div className="flex gap-3">
        <t.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${t.icon}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{title}</p>
          {children && <div className="mt-1 text-oxford-ink2">{children}</div>}
          {actions && <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
};

/** Text-style action inside an alert (link or button). */
export const alertActionClass =
  "inline-flex min-h-[32px] items-center font-semibold text-oxford-ink underline underline-offset-4 hover:no-underline";
