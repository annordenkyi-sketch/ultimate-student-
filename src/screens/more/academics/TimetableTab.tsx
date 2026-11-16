import { useState } from "react";
import { CalendarX, PencilLine } from "lucide-react";
import { ClashList } from "../../setup/ClashList";
import { PersonalScheduleForm } from "../../setup/PersonalScheduleForm";
import { SessionLine } from "../../setup/SessionLine";
import { findClashes, placedSessions, updateSession } from "../../setup/timetable";
import { WeekGrid, WeekList } from "../../setup/WeekView";
import type { AcademicsData } from "./AcademicsSection";
import { OriginChip } from "./CoursesTab";

const smallButton =
  "inline-flex min-h-[40px] items-center rounded-full border border-oxford-ink/20 bg-white px-3 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream";

/** Weekly timetable (grid on desktop, day list on mobile), with personal times and venues. */
export const TimetableTab = ({ data }: { data: AcademicsData }) => {
  const courses = data.timetable?.courses ?? [];
  const acknowledged = data.timetable?.acknowledgedClashes ?? [];
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState<{ text: string; failed?: boolean } | null>(null);

  const sessions = placedSessions(courses);
  const clashes = findClashes(sessions);
  const unresolved = clashes.filter((c) => !acknowledged.includes(c.id));
  const clashing = new Set(unresolved.flatMap((c) => c.sessions.map((s) => s.id)));

  const save = async (next: typeof courses, message: string, ack?: string[]) => {
    try {
      await data.saveCourses(next, ack);
      setStatus({ text: message });
    } catch {
      setStatus({ text: "That didn't save. Try again.", failed: true });
    }
  };

  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-oxford-rule px-5 py-10 text-center">
        <CalendarX className="mx-auto h-8 w-8 text-oxford-mute" aria-hidden="true" />
        <p className="mt-3 font-semibold text-oxford-ink">No timetable yet</p>
        <p className="mt-1 text-sm text-oxford-mute">Add your courses in the Courses tab first.</p>
      </div>
    );
  }

  return (
    <>
      <p role="status" className={`mb-3 min-h-[1.25rem] text-sm font-semibold ${status?.failed ? "text-oxford-danger" : "text-oxford-success"}`}>
        {status?.text}
      </p>

      {unresolved.length > 0 && (
        <section aria-labelledby="overlaps-title" className="mb-5 space-y-3">
          <h2 id="overlaps-title" className="font-sans text-base font-semibold text-oxford-ink">
            Overlaps to sort out
          </h2>
          <ClashList
            courses={courses}
            acknowledged={acknowledged}
            onCoursesChange={(next) => save(next, "Timetable updated.")}
            onAcknowledgedChange={(ids) => save(courses, "Overlap kept.", ids)}
          />
        </section>
      )}

      <WeekGrid sessions={sessions} clashing={clashing} />
      <WeekList sessions={sessions} clashing={clashing} />

      <section aria-labelledby="edit-sessions-title" className="mt-6">
        <h2 id="edit-sessions-title" className="font-sans text-base font-semibold text-oxford-ink">
          Times and venues
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-oxford-mute">
          <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
          Your own changes are marked "Entered by you" and stay when you sync.
        </p>
        <ul className="mt-3 space-y-3">
          {courses.map((c) => (
            <li key={c.code} className="rounded-2xl border border-oxford-rule bg-white/80 p-4">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-oxford-ink">
                {c.code} <span className="font-normal text-oxford-ink2">· {c.title}</span>
                <OriginChip origin={c.origin} />
              </p>
              <ul className="mt-3 space-y-3">
                {c.sessions.map((s) => (
                  <li key={s.id} className="border-t border-oxford-rule/70 pt-3 first:border-t-0 first:pt-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <SessionLine session={s} />
                      {editing !== s.id && (
                        <button type="button" onClick={() => setEditing(s.id)} className={smallButton}>
                          Edit<span className="sr-only"> {c.code} {s.kind} time or venue</span>
                        </button>
                      )}
                    </div>
                    {editing === s.id && (
                      <PersonalScheduleForm
                        id={`tt-${s.id}`}
                        title={`${c.code} ${s.kind}`}
                        session={s}
                        onCancel={() => setEditing(null)}
                        onSave={async (v) => {
                          setEditing(null);
                          await save(updateSession(courses, s.id, { ...v, source: "personal" }), `${c.code} ${s.kind} saved as your own time and venue.`);
                        }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
};
