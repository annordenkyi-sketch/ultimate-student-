import type { Course, CourseSession, Weekday } from "@/services";

export const DAYS: { id: Weekday; short: string; long: string }[] = [
  { id: "mon", short: "Mon", long: "Monday" },
  { id: "tue", short: "Tue", long: "Tuesday" },
  { id: "wed", short: "Wed", long: "Wednesday" },
  { id: "thu", short: "Thu", long: "Thursday" },
  { id: "fri", short: "Fri", long: "Friday" },
  { id: "sat", short: "Sat", long: "Saturday" },
];

export const dayName = (day: Weekday, form: "short" | "long" = "long"): string =>
  DAYS.find((d) => d.id === day)?.[form] ?? day;

export const toMinutes = (time: string): number => {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
};

export const hasTime = (s: CourseSession): boolean => Boolean(s.day && s.start && s.end);

/** A session with a day and time, tagged with its course. */
export interface PlacedSession extends CourseSession {
  day: Weekday;
  start: string;
  end: string;
  courseCode: string;
  courseTitle: string;
}

export const placedSessions = (courses: Course[]): PlacedSession[] =>
  courses.flatMap((c) =>
    c.sessions.filter(hasTime).map(
      (s) => ({ ...s, courseCode: c.code, courseTitle: c.title }) as PlacedSession,
    ),
  );

export const unplacedSessions = (courses: Course[]) =>
  courses.flatMap((c) => c.sessions.filter((s) => !hasTime(s)).map((s) => ({ course: c, session: s })));

export const needsDetails = (s: CourseSession): boolean => !hasTime(s) || !s.venue;

export interface Clash {
  id: string;
  day: Weekday;
  /** When the overlap begins. */
  at: string;
  sessions: [PlacedSession, PlacedSession];
}

export const findClashes = (sessions: PlacedSession[]): Clash[] => {
  const clashes: Clash[] = [];
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const a = sessions[i]!;
      const b = sessions[j]!;
      if (a.day !== b.day) continue;
      if (toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end)) {
        const [first, second] = toMinutes(a.start) <= toMinutes(b.start) ? [a, b] : [b, a];
        clashes.push({
          id: [a.id, b.id].sort().join("|"),
          day: a.day,
          at: second.start,
          sessions: [first, second],
        });
      }
    }
  }
  return clashes;
};

export const clashLabel = (c: Clash): string => `2 sessions overlap on ${dayName(c.day)} ${c.at}`;

export const updateSession = (
  courses: Course[],
  sessionId: string,
  patch: Partial<CourseSession>,
): Course[] =>
  courses.map((c) => ({
    ...c,
    sessions: c.sessions.map((s) => (s.id === sessionId ? { ...s, ...patch } : s)),
  }));

export const removeSession = (courses: Course[], sessionId: string): Course[] =>
  courses.map((c) => ({ ...c, sessions: c.sessions.filter((s) => s.id !== sessionId) }));

export const timeRange = (s: { start: string; end: string }) => `${s.start}–${s.end}`;
