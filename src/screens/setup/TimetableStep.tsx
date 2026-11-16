import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { btn } from "@/ui/button";
import { FormAlert } from "@/ui/form/FormAlert";
import { AuthHeading, BackLink } from "../auth/parts";
import { PersonalScheduleForm } from "./PersonalScheduleForm";
import { SessionLine } from "./SessionLine";
import { useSetup } from "./SetupLayout";
import { needsDetails, updateSession } from "./timetable";

/** Flow 02 "Match timetable": show official times and venues, fill in what's missing. */
export const TimetableStep = () => {
  const { progress, update } = useSetup();
  const [editing, setEditing] = useState<string | null>(null);

  if (progress.courses.length === 0) return <Navigate to="/onboarding/method" replace />;

  const incomplete = progress.courses.filter((c) => c.sessions.some(needsDetails));
  const back = progress.method === "sync" ? "/onboarding/sync-review" : "/onboarding/manual";

  return (
    <>
      <BackLink to={back} />
      <AuthHeading title="Match your timetable">
        Lecture times and venues from the university. Fill in anything that's missing.
      </AuthHeading>

      {incomplete.length > 0 ? (
        <FormAlert
          tone="info"
          title={`${incomplete.length} ${incomplete.length === 1 ? "course is" : "courses are"} missing a time or venue`}
          className="mb-5"
        >
          Add your own schedule for them, or carry on and add it later.
        </FormAlert>
      ) : (
        <FormAlert tone="success" title="Every session has a time and venue" className="mb-5" />
      )}

      <ul className="space-y-3">
        {progress.courses.map((course) => (
          <li key={course.code} className="rounded-xl border border-oxford-rule bg-white p-4">
            <p className="text-sm font-semibold text-oxford-ink">
              {course.code} <span className="font-normal text-oxford-mute">· {course.title}</span>
            </p>
            <ul className="mt-3 space-y-3">
              {course.sessions.map((s) => {
                const missing = needsDetails(s);
                const isEditing = editing === s.id;
                return (
                  <li key={s.id} className="border-t border-oxford-rule/70 pt-3 first:border-t-0 first:pt-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <SessionLine session={s} />
                      {!isEditing && (missing || s.source === "personal") && (
                        <button
                          type="button"
                          onClick={() => setEditing(s.id)}
                          aria-label={`${missing ? "Add personal schedule" : "Edit your schedule"} for ${course.code} ${s.kind}`}
                          className="inline-flex min-h-[40px] items-center rounded-full border border-oxford-ink/20 px-3 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream"
                        >
                          {missing ? "Add personal schedule" : "Edit"}
                        </button>
                      )}
                    </div>
                    {isEditing && (
                      <PersonalScheduleForm
                        id={`schedule-${s.id}`}
                        title={`${course.code} ${s.kind}`}
                        session={s}
                        onCancel={() => setEditing(null)}
                        onSave={(v) => {
                          update({ courses: updateSession(progress.courses, s.id, { ...v, source: "personal" }) });
                          setEditing(null);
                        }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>

      <Link to="/onboarding/review" className={btn("primary", "mt-6 w-full")}>
        Continue
      </Link>
    </>
  );
};
