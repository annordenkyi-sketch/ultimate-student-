import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export const DetailRow = ({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) => (
  <div className="flex gap-3 py-3.5">
    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-oxford-mute" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-oxford-mute">{label}</dt>
      <dd className="mt-0.5 text-oxford-ink">{children}</dd>
    </div>
  </div>
);
