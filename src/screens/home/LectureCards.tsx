import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarPlus, ChevronRight, Clock, MapPin, UserRound } from "lucide-react";
import type { Course } from "@/services";
import { dayLabel } from "@/lib/dates";
import { btn } from "@/ui/button";
import { DashCard, EmptyNote } from "@/ui/DashCard";
import {
  countdown,
  isInProgress,
  lecturesToday,
  nextLecture,
  nextLectureHeading,
} from "./lectures";

/** Main card: the lecture happening now or next, with a live countdown. */
export const NextLectureCard = ({ courses, now, className = "" }: { courses: Course[]; now: Date; className?: string }) => {
  const reduce = useReducedMotion();
  const next = nextLecture(courses, now);

  if (!next) {
    return (
      <DashCard id="next-lecture-title" title="Next lecture" className={className}>
        <EmptyNote>No lectures in the next week. Check your timetable for missing times.</EmptyNote>
      </DashCard>
    );
  }

  const { session, course } = next;
  const live = isInProgress(next, now);

  return (
    <motion.section
      aria-labelledby="next-lecture-title"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <Link
        to={`/lectures/${session.id}`}
        className="group block h-full rounded-2xl bg-oxford-ink p-5 text-white transition hover:bg-oxford-ink2 md:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="next-lecture-title" className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-oxford-sand">
            {nextLectureHeading(next, now)}
          </h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${live ? "bg-oxford-success text-white" : "bg-oxford-sand text-oxford-ink"}`}
          >
            {countdown(next, now)}
          </span>
        </div>
        <p className="mt-4 font-serif text-2xl font-medium leading-tight text-white md:text-3xl">
          {course.code} <span className="text-white/80">{course.title}</span>
        </p>
        <p className="mt-1 text-sm text-white/80">{session.kind}</p>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <div className="flex gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-oxford-sand" aria-hidden="true" />
            <div>
              <dt className="sr-only">Time</dt>
              <dd>
                {dayLabel(next.start, now)}, {session.start}–{session.end}
              </dd>
            </div>
          </div>
          <div className="flex gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-oxford-sand" aria-hidden="true" />
            <div>
              <dt className="sr-only">Venue</dt>
              <dd>{session.venue ?? "Venue not confirmed"}</dd>
            </div>
          </div>
          <div className="flex gap-2">
            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-oxford-sand" aria-hidden="true" />
            <div>
              <dt className="sr-only">Lecturer</dt>
              <dd>{course.lecturer ?? "Lecturer not listed"}</dd>
            </div>
          </div>
        </dl>
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-oxford-sand">
          Lecture details
          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </Link>
    </motion.section>
  );
};

/** Shown in place of the lecture cards when there's no timetable yet. */
export const SetupCoursesCard = ({ className = "" }: { className?: string }) => (
  <DashCard id="setup-courses-title" title="Set up your courses" className={`border-oxford-gold/40 bg-oxford-sandSoft ${className}`}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-oxford-ink">
        <CalendarPlus className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="flex-1 text-sm text-oxford-ink2">
        Add your courses to see your next lecture here and get lecture reminders.
      </p>
      <Link to="/onboarding" className={btn("primary", "shrink-0 self-start sm:self-auto")}>
        Set up courses
      </Link>
    </div>
  </DashCard>
);

export const TodaySchedule = ({ courses, now, className = "" }: { courses: Course[]; now: Date; className?: string }) => {
  const today = lecturesToday(courses, now);
  return (
    <DashCard id="today-title" title="Today's schedule" className={className} order={1}>
      {today.length === 0 ? (
        <EmptyNote>No lectures today.</EmptyNote>
      ) : (
        <ol className="space-y-1">
          {today.map((o) => {
            const done = o.end <= now;
            const live = isInProgress(o, now);
            return (
              <li key={o.session.id}>
                <Link
                  to={`/lectures/${o.session.id}`}
                  className={`flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-oxford-cream ${done ? "opacity-60" : ""}`}
                >
                  <span className={`w-12 shrink-0 text-sm font-semibold ${live ? "text-oxford-success" : "text-oxford-ink"}`}>
                    {o.session.start}
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block font-semibold text-oxford-ink">
                      {o.course.code} <span className="font-normal text-oxford-mute">{o.session.kind}</span>
                    </span>
                    <span className="block truncate text-oxford-mute">{o.session.venue ?? "Venue not confirmed"}</span>
                  </span>
                  {live && <span className="shrink-0 text-xs font-semibold text-oxford-success">Now</span>}
                  {done && <span className="shrink-0 text-xs font-semibold text-oxford-mute">Done</span>}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </DashCard>
  );
};
