import type { OpeningPeriod } from "@/services";
import { openStatus } from "@/lib/hours";

/** "Open · closes 22:00" / "Closed · opens 08:00", with a coloured dot. */
export const OpenBadge = ({
  periods,
  now,
  size = "sm",
}: {
  periods: OpeningPeriod[] | null;
  now: Date;
  size?: "sm" | "xs";
}) => {
  const { state, label } = openStatus(periods, now);
  const tone =
    state === "open" ? "text-oxford-success" : state === "closed" ? "text-oxford-danger" : "text-oxford-mute";
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold ${size === "xs" ? "text-xs" : "text-sm"} ${tone}`}>
      {state !== "unknown" && (
        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${state === "open" ? "bg-oxford-success" : "bg-oxford-danger"}`} />
      )}
      {label}
    </span>
  );
};
