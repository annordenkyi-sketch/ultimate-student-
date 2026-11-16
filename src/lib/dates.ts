import { useEffect, useState } from "react";
import { services } from "@/services";

/** Current time from the clock service, refreshed every `intervalMs`. */
export const useNow = (intervalMs = 30_000): Date => {
  const [now, setNow] = useState(() => services.clock.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(services.clock.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
};

const pad = (n: number) => String(n).padStart(2, "0");

export const time24 = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** "Thursday 12 November" */
export const longDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

/** "Thu 12 Nov" */
export const shortDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

export const greetingFor = (d: Date) => {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const dayDiff = (from: Date, to: Date) => {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / 86_400_000);
};

/** "45 min", "2 h 10 min" */
export const duration = (minutes: number) => {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
};

/** "Just now", "20 min ago", "3 h ago", "Yesterday", "Mon", "12 Nov" */
export const relativeTime = (iso: string, now: Date) => {
  const then = new Date(iso);
  const minutes = (now.getTime() - then.getTime()) / 60_000;
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${Math.floor(minutes)} min ago`;
  const days = dayDiff(then, now);
  if (days === 0) return `${Math.floor(minutes / 60)} h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return then.toLocaleDateString("en-GB", { weekday: "long" });
  return then.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

/** "Today", "Tomorrow", or the weekday name, relative to `now`. */
export const dayLabel = (d: Date, now: Date) => {
  const diff = dayDiff(now, d);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-GB", { weekday: "long" });
};

/** relativeTime for use mid-sentence: "saved just now", "saved yesterday", "saved Saturday". */
export const relativeTimeInline = (iso: string, now: Date) => {
  const t = relativeTime(iso, now);
  return t === "Just now" || t === "Yesterday" ? t.toLowerCase() : t;
};
