import type { OpeningPeriod } from "@/services";

const mins = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type OpenState = "open" | "closed" | "unknown";

/** "Open · closes 22:00", "Closed · opens Monday 08:00", "Open 24 hours", "Hours not listed". */
export const openStatus = (periods: OpeningPeriod[] | null, now: Date): { state: OpenState; label: string } => {
  if (!periods) return { state: "unknown", label: "Hours not listed" };
  if (periods.some((p) => p.days.length === 7 && p.open === "00:00" && p.close === "24:00")) {
    return { state: "open", label: "Open 24 hours" };
  }
  const day = now.getDay();
  const t = now.getHours() * 60 + now.getMinutes();
  const current = periods.find((p) => p.days.includes(day) && mins(p.open) <= t && t < mins(p.close));
  if (current) return { state: "open", label: `Open · closes ${current.close === "24:00" ? "midnight" : current.close}` };

  for (let offset = 0; offset < 7; offset++) {
    const d = (day + offset) % 7;
    const next = periods
      .filter((p) => p.days.includes(d) && (offset > 0 || mins(p.open) > t))
      .sort((a, b) => mins(a.open) - mins(b.open))[0];
    if (next) {
      const when = offset === 0 ? next.open : offset === 1 ? `tomorrow ${next.open}` : `${DAY_NAMES[d]} ${next.open}`;
      return { state: "closed", label: `Closed · opens ${when}` };
    }
  }
  return { state: "closed", label: "Closed" };
};

export const isOpenNow = (periods: OpeningPeriod[] | null, now: Date) => openStatus(periods, now).state === "open";
