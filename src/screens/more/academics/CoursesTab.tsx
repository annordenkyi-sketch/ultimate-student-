import { useState } from "react";
import { BookOpen, Plus, RefreshCw, UserPen } from "lucide-react";
import type { Course } from "@/services";
import { btn } from "@/ui/button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { PersonalScheduleForm } from "../../setup/PersonalScheduleForm";
import { SessionLine } from "../../setup/SessionLine";
import { updateSession } from "../../setup/timetable";
import type { AcademicsData } from "./AcademicsSection";
import { AddCourseDialog } from "./AddCourseDialog";
import { RerunSetupButton } from "./SemesterTab";

const smallButton =
  "inline-flex min-h-[40px] items-center rounded-full border border-oxford-ink/20 bg-white px-3 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream";

export const OriginChip = ({ origin }: { origin: Course["origin"] }) =>
  origin === "manual" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-oxford-sandSoft px-2.5 py-0.5 text-xs font-semibold text-oxford-ink">
      <UserPen className="h-3 w-3" aria-hidden="true" />
      Added by you
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-oxford-ink/5 px-2.5 py-0.5 text-xs font-semibold text-oxford-ink2">
      <RefreshCw className="h-3 w-3" aria-hidden="true" />
      Synced from portal
    </span>
  );

/** Registered courses this semester, with manual entries the student can edit or remove. */
export const CoursesTab = ({ data }: { data: AcademicsData }) => {
  const courses = data.timetable?.courses ?? [];
  const semesterId = data.timetable?.semesterId ?? data.semesters.find((s) => s.current)?.id ?? "";
  const semester = data.semesters.find((s) => s.id === semesterId);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Course | null>(null);
  const [status, setStatus] = useState<{ text: string; failed?: boolean } | null>(null);

  const save = async (next: Course[], message: string) => {
    try {
      await data.saveCourses(next);
      setStatus({ text: message });
    } catch {
      setStatus({ text: "That didn't save. Try again.", failed: true });
    }
  };

  const totalCredits = courses.reduce((s, c) => s + c.credits, 0);

  return (
    <>
      <p role="status" className={`mb-3 min-h-[1.25rem] text-sm font-semibold ${status?.failed ? "text-oxford-danger" : "text-oxford-success"}`}>
        {status?.text}
      </p>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-oxford-rule px-5 py-10 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-oxford-mute" aria-hidden="true" />
          <p className="mt-3 font-semibold text-oxford-ink">No courses for {semester ? `${semester.term}, ${semester.academicYear}` : "this semester"} yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-oxford-mute">Sync them from the student portal, or add them yourself.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <RerunSetupButton data={data} label="Set up your courses" />
            <button type="button" onClick={() => setAdding(true)} className={btn("secondary")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add a course
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-oxford-mute">
              {courses.length} courses · {totalCredits} credits{semester ? ` · ${semester.term}, ${semester.academicYear}` : ""}
            </p>
            <button type="button" onClick={() => setAdding(true)} className={btn("secondary")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add a course
            </button>
          </div>
          <ul className="space-y-3">
            {courses.map((c) => {
              const manual = c.origin === "manual";
              const open = editing === c.code;
              return (
                <li key={c.code} className="rounded-2xl border border-oxford-rule bg-white/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-oxford-ink">
                        {c.code} <span className="font-normal text-oxford-ink2">· {c.title}</span>
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-oxford-mute">
                        {c.credits} credits
                        <OriginChip origin={c.origin} />
                      </p>
                    </div>
                    {manual && (
                      <div className="flex gap-2">
                        <button type="button" aria-expanded={open} onClick={() => setEditing(open ? null : c.code)} className={smallButton}>
                          {open ? "Done" : "Edit"}
                          <span className="sr-only"> {c.code}</span>
                        </button>
                        <button type="button" onClick={() => setRemoving(c)} className={smallButton}>
                          Remove<span className="sr-only"> {c.code}</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {open && (
                    <ul className="mt-3 space-y-3 border-t border-oxford-rule/70 pt-3">
                      {c.sessions.map((s) => (
                        <li key={s.id}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <SessionLine session={s} />
                            {editingSession !== s.id && (
                              <button type="button" onClick={() => setEditingSession(s.id)} className={smallButton}>
                                Change time or venue<span className="sr-only"> for {c.code} {s.kind}</span>
                              </button>
                            )}
                          </div>
                          {editingSession === s.id && (
                            <PersonalScheduleForm
                              id={`course-${s.id}`}
                              title={`${c.code} ${s.kind}`}
                              session={s}
                              onCancel={() => setEditingSession(null)}
                              onSave={async (v) => {
                                setEditingSession(null);
                                await save(updateSession(courses, s.id, { ...v, source: "personal" }), `${c.code} ${s.kind} updated.`);
                              }}
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-oxford-mute">
            Synced courses update when you sync with the student portal. To use your own time or venue for any session, go to the Timetable tab.
          </p>
        </>
      )}

      <AddCourseDialog
        open={adding}
        semesterId={semesterId}
        existing={new Set(courses.map((c) => c.code))}
        onClose={() => setAdding(false)}
        onAdd={async (course) => {
          await save([...courses, { ...course, origin: "manual" }], `Added ${course.code}.`);
          setAdding(false);
        }}
      />
      <ConfirmDialog
        open={removing !== null}
        title={`Remove ${removing?.code ?? "this course"}?`}
        body="It comes off your courses and timetable, and its lecture reminders stop. You can add it again later."
        confirmLabel="Remove"
        onConfirm={async () => {
          const c = removing;
          setRemoving(null);
          if (c) await save(courses.filter((x) => x.code !== c.code), `Removed ${c.code}.`);
        }}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
};
