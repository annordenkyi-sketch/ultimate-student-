import { GraduationCap } from "lucide-react";

export const Logo = ({ tone = "dark" }: { tone?: "dark" | "light" }) => {
  const text = tone === "dark" ? "text-oxford-ink" : "text-white";
  const ring = tone === "dark" ? "border-oxford-ink/15 bg-oxford-paper" : "border-white/30";
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className={`flex h-10 w-10 items-center justify-center rounded-full border ${ring}`}
      >
        <GraduationCap className={`h-5 w-5 ${text}`} aria-hidden="true" />
      </span>
      <span className={`flex flex-col leading-none ${text}`}>
        <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.18em]">
          Ultimate
        </span>
        <span className="font-serif text-[15px] font-bold uppercase tracking-[0.22em]">
          Student
        </span>
      </span>
    </span>
  );
};
