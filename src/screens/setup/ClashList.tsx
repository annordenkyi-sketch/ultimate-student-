import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Course } from "@/services";
import { Checkbox } from "@/ui/form/Checkbox";
import { PersonalScheduleForm } from "./PersonalScheduleForm";
import { clashLabel, findClashes, placedSessions, removeSession, timeRange, updateSession, type Clash } from "./timetable";

const smallButton =
  "inline-flex min-h-[40px] items-center rounded-full border border-oxford-ink/20 bg-white px-3 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream";

/**
 * The overlap resolver from flow 02, shared with the sync flow (08): each
 * overlap can be fixed by changing a time, removing a session, or kept.
 */
export const ClashList = ({
  courses,
  acknowledged,
  onCoursesChange,
  onAcknowledgedChange,
}: {
  courses: Course[];
  acknowledged: string[];
  onCoursesChange: (courses: Course[]) => void;
  onAcknowledgedChange: (ids: string[]) => void;
}) => {
  const [openClash, setOpenClash] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const clashes = findClashes(placedSessions(courses));

  const acknowledge = (clash: Clash, keep: boolean) => {
    const others = acknowledged.filter((id) => id !== clash.id);
    onAcknowledgedChange(keep ? [...others, clash.id] : others);
  };

  if (clashes.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm font-semibold text-oxford-success">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        No overlaps. Your week is clear.
      </p>
    );
  }

  return (
    <>
      {clashes.map((clash) => {
        const kept = acknowledged.includes(clash.id);
        const open = openClash === clash.id;
        const [a, b] = clash.sessions;
        return (
          <section
            key={clash.id}
            aria-label={clashLabel(clash)}
            className={`rounded-xl border p-4 ${kept ? "border-oxford-rule bg-white" : "border-oxford-danger/40 bg-oxford-danger/5"}`}
          >
            <p className="flex items-start gap-2 text-sm font-semibold text-oxford-ink">
              <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${kept ? "text-oxford-mute" : "text-oxford-danger"}`} aria-hidden="true" />
              {clashLabel(clash)}
              {kept && <span className="font-normal text-oxford-mute">· kept</span>}
            </p>
            <p className="mt-1 pl-6 text-sm text-oxford-ink2">
              {a.courseCode} {a.kind} ({timeRange(a)}) and {b.courseCode} {b.kind} ({timeRange(b)}).
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 pl-6">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => {
                  setOpenClash(open ? null : clash.id);
                  setEditingSession(null);
                }}
                className={smallButton}
              >
                {open ? "Close" : "Edit conflicting sessions"}
              </button>
              <Checkbox id={`keep-${clash.id}`} checked={kept} onChange={(v) => acknowledge(clash, v)}>
                Keep both. I know they overlap.
              </Checkbox>
            </div>

            {open && (
              <ul className="mt-4 space-y-3 pl-6">
                {clash.sessions.map((s) => (
                  <li key={s.id} className="rounded-lg border border-oxford-rule bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm">
                        <span className="font-semibold text-oxford-ink">
                          {s.courseCode} {s.kind}
                        </span>
                        <span className="block text-oxford-mute">
                          {timeRange(s)} · {s.venue ?? "Venue not confirmed"}
                        </span>
                      </p>
                      {editingSession !== s.id && (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setEditingSession(s.id)} className={smallButton}>
                            Change time
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onCoursesChange(removeSession(courses, s.id));
                              setOpenClash(null);
                            }}
                            className={smallButton}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                    {editingSession === s.id && (
                      <PersonalScheduleForm
                        id={`clash-${s.id}`}
                        title={`${s.courseCode} ${s.kind}`}
                        session={s}
                        onCancel={() => setEditingSession(null)}
                        onSave={(v) => {
                          onCoursesChange(updateSession(courses, s.id, { ...v, source: "personal" }));
                          setEditingSession(null);
                          setOpenClash(null);
                        }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
};
