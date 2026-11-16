// Calendar-day helpers using local "YYYY-MM-DD" strings (no time zones involved).

const pad = (n: number) => String(n).padStart(2, "0");

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromISODate = (iso: string) => {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (iso: string, days: number) => {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

/** The Monday on or before `d`. */
export const weekStartOf = (d: Date) => {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return toISODate(monday);
};

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export const daysBetween = (from: string, to: string) =>
  Math.round((fromISODate(to).getTime() - fromISODate(from).getTime()) / 86_400_000);

/** "Friday 18 December" */
export const longDay = (iso: string) =>
  fromISODate(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

/** "18 Dec" */
export const shortDay = (iso: string) =>
  fromISODate(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
