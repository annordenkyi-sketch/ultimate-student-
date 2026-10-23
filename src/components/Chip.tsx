import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  tone?: "default" | "accent";
}

export const Chip = ({ children, tone = "default" }: Props) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
      tone === "accent"
        ? "bg-brand-100 text-brand-800"
        : "bg-slate-100 text-slate-700"
    }`}
  >
    {children}
  </span>
);
