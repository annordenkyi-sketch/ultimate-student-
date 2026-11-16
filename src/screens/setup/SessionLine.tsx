import { AlertCircle, MapPin, PencilLine } from "lucide-react";
import type { CourseSession } from "@/services";
import { dayName, hasTime } from "./timetable";

/** One session's day, time and venue, flagging anything missing. */
export const SessionLine = ({ session }: { session: CourseSession }) => {
  const timed = hasTime(session);
  return (
    <div className="min-w-0 text-sm">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-semibold text-oxford-ink">{session.kind}</span>
        {timed ? (
          <span className="text-oxford-ink2">
            {dayName(session.day!)} {session.start}–{session.end}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-medium text-oxford-danger">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Time not published
          </span>
        )}
        {session.source === "personal" && (
          <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-oxford-ink/40 px-2 py-0.5 text-[11px] font-semibold text-oxford-ink">
            <PencilLine className="h-3 w-3" aria-hidden="true" />
            Entered by you
          </span>
        )}
      </p>
      <p className="mt-0.5 flex items-center gap-1 text-oxford-mute">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {session.venue ?? (
          <span className="font-medium text-oxford-danger">Venue not confirmed</span>
        )}
      </p>
    </div>
  );
};
