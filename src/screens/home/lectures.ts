import type { Course, Weekday } from "@/services";
import { dayLabel, duration, time24 } from "@/lib/dates";
import { placedSessions, toMinutes, type PlacedSession } from "../setup/timetable";

const JS_DAY: Record<Weekday, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

/** A session on a specific date. */
export interface Occurrence {
  session: PlacedSession;
  course: Course;
  start: Date;
  end: Date;
}

const at = (day: Date, hhmm: string) => {
  const d = new Date(day);
  const m = toMinutes(hhmm);
  d.setHours(Math.floor(m / 60), m % 60, 0, 0);
  return d;
};

/** Every session over the next `days` days, starting today, in time order. */
export const occurrences = (courses: Course[], now: Date, days = 8): Occurrence[] => {
  const sessions = placedSessions(courses);
  const list: Occurrence[] = [];
  for (let offset = 0; offset < days; offset++) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    for (const s of sessions) {
      if (JS_DAY[s.day] !== day.getDay()) continue;
      const course = courses.find((c) => c.code === s.courseCode);
      if (course) list.push({ session: s, course, start: at(day, s.start), end: at(day, s.end) });
    }
  }
  return list.sort((a, b) => a.start.getTime() - b.start.getTime());
};

/** The lecture happening now, or the next one to start. */
export const nextLecture = (courses: Course[], now: Date) =>
  occurrences(courses, now).find((o) => o.end > now) ?? null;

export const lecturesToday = (courses: Course[], now: Date) =>
  occurrences(courses, now, 1);

export const nextOccurrenceOf = (courses: Course[], sessionId: string, now: Date) =>
  occurrences(courses, now).find((o) => o.session.id === sessionId && o.end > now) ?? null;

export const isInProgress = (o: Occurrence, now: Date) => o.start <= now && now < o.end;

/** "Starts in 45 min", "In progress, ends in 20 min", "Tomorrow at 08:30". */
export const countdown = (o: Occurrence, now: Date): string => {
  if (isInProgress(o, now)) return `In progress, ends in ${duration((o.end.getTime() - now.getTime()) / 60_000)}`;
  const label = dayLabel(o.start, now);
  if (label === "Today") return `Starts in ${duration((o.start.getTime() - now.getTime()) / 60_000)}`;
  return `${label} at ${time24(o.start)}`;
};

/** Heading for the next-lecture card. */
export const nextLectureHeading = (o: Occurrence, now: Date): string => {
  if (isInProgress(o, now)) return "Happening now";
  const label = dayLabel(o.start, now);
  if (label === "Today") return "Next lecture";
  return `${label}'s first lecture`;
};
