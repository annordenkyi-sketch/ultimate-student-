import type { ReactNode } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useToast, type Toast } from "@/hooks/useToast";

const toneStyles: Record<NonNullable<Toast["tone"]>, string> = {
  info: "bg-slate-900 text-white",
  success: "bg-emerald-600 text-white",
  error: "bg-rose-600 text-white",
};

const toneIcon: Record<NonNullable<Toast["tone"]>, ReactNode> = {
  info: <Info className="h-4 w-4" aria-hidden="true" />,
  success: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
  error: <XCircle className="h-4 w-4" aria-hidden="true" />,
};

export const ToastViewport = () => {
  const { toasts } = useToast();
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-lg ${
            toneStyles[t.tone ?? "success"]
          }`}
        >
          {toneIcon[t.tone ?? "success"]}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};
