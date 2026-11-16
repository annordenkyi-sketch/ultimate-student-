import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { services } from "@/services";
import { useSession } from "@/session/SessionProvider";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { AuthHeading, BackLink, TextLink } from "../auth/parts";
import { ClashList } from "./ClashList";
import { useSetup } from "./SetupLayout";
import { findClashes, placedSessions, unplacedSessions } from "./timetable";
import { WeekGrid, WeekList } from "./WeekView";

/** Flow 02 "Course and schedule review": weekly view, clashes, then save. */
export const ReviewStep = () => {
  const { account } = useSession();
  const { progress, update } = useSetup();
  const navigate = useNavigate();
  const [blocked, setBlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const clashesRef = useRef<HTMLDivElement>(null);

  if (progress.courses.length === 0) return <Navigate to="/onboarding/method" replace />;

  const sessions = placedSessions(progress.courses);
  const clashes = findClashes(sessions);
  const unresolved = clashes.filter((c) => !progress.acknowledgedClashes.includes(c.id));
  const clashing = new Set(unresolved.flatMap((c) => c.sessions.map((s) => s.id)));
  const unplaced = unplacedSessions(progress.courses);

  const save = async () => {
    if (unresolved.length > 0) {
      setBlocked(true);
      clashesRef.current?.focus();
      return;
    }
    if (!account || !progress.semesterId) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      await services.setup.saveTimetable(account.id, progress.semesterId, progress.courses);
      navigate("/onboarding/reminders");
    } catch {
      setSaveFailed(true);
      setSaving(false);
    }
  };

  return (
    <>
      <BackLink to="/onboarding/timetable" />
      <AuthHeading title="Review your week">
        {progress.courses.length} courses · {sessions.length} sessions a week
      </AuthHeading>

      <div ref={clashesRef} tabIndex={-1} className="space-y-3 outline-none">
        {blocked && unresolved.length > 0 && (
          <FormAlert tone="error" title="Sort out the overlap first">
            Change or remove one of the sessions, or tick "Keep both" if you know they overlap.
          </FormAlert>
        )}

        <ClashList
          courses={progress.courses}
          acknowledged={progress.acknowledgedClashes}
          onCoursesChange={(courses) => update({ courses })}
          onAcknowledgedChange={(ids) => {
            update({ acknowledgedClashes: ids });
            if (ids.length > progress.acknowledgedClashes.length) setBlocked(false);
          }}
        />
      </div>

      <div className="mt-6">
        <WeekGrid sessions={sessions} clashing={clashing} />
        <WeekList sessions={sessions} clashing={clashing} />
      </div>

      {unplaced.length > 0 && (
        <section aria-labelledby="unplaced-heading" className="mt-6 rounded-xl border border-dashed border-oxford-rule p-4">
          <h2 id="unplaced-heading" className="font-sans text-sm font-semibold text-oxford-ink">
            Not on your timetable yet
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-oxford-ink2">
            {unplaced.map(({ course, session }) => (
              <li key={session.id}>
                {course.code} {session.kind}: no time published
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm">
            <TextLink to="/onboarding/timetable">Add the details</TextLink>
          </p>
        </section>
      )}

      {saveFailed && (
        <FormAlert tone="error" title="Your timetable wasn't saved" className="mt-6">
          Check your connection, then select Save timetable again.
        </FormAlert>
      )}

      <div className="mt-6 sm:flex sm:justify-end">
        <LoadingButton type="button" onClick={save} loading={saving} loadingLabel="Saving…" className="sm:w-auto sm:min-w-[14rem]">
          Save timetable
        </LoadingButton>
      </div>
      {unresolved.length > 0 && (
        <p className="mt-2 text-center text-sm text-oxford-mute sm:text-right">
          Change, remove or keep each overlap to continue.
        </p>
      )}
    </>
  );
};
