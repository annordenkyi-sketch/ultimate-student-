import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarClock, MapPin, NotebookPen, UserRound } from "lucide-react";
import { services, type AlertPermission, type LectureReminder, type ReminderLead } from "@/services";
import { PermissionNote, useNotificationPermission } from "@/session/NotificationPermission";
import { dayLabel, duration, longDate, useNow } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { isLimited } from "@/session/access";
import { useSession } from "@/session/SessionProvider";
import { VenueLine } from "@/ui/ContentActions";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { DetailRow } from "@/ui/DetailRow";
import { LockedPanel } from "@/ui/LockedPanel";
import { PageHeader } from "@/ui/PageHeader";
import { countdown, nextOccurrenceOf } from "../home/lectures";
import { DetailHeader, NotFound } from "./DetailHeader";

const LEADS: ReminderLead[] = [10, 15, 30, 60];
const BACK = { to: "/home", label: "Home" };

/** Flow 03 "Lecture details" with "Manage reminder" and the verified-venue map link. */
export const LectureDetailsScreen = () => {
  const { sessionId = "" } = useParams();
  const { account, access } = useSession();
  const now = useNow(30_000);
  const accountId = account?.id;

  const { state, reload } = useAsync(
    () => (accountId && !isLimited(access) ? services.timetable.get(accountId) : Promise.resolve(null)),
    [accountId, access],
  );

  if (isLimited(access)) {
    return (
      <>
        <PageHeader title="Lecture details" />
        <LockedPanel feature="Your timetable" includes={["Lecture times, venues and lecturers", "Lecture reminders"]} />
      </>
    );
  }
  if (state.status === "loading") return <Skeleton lines={5} />;
  if (state.status === "error") return <LoadError what="this lecture" onRetry={reload} />;

  const course = state.data?.courses.find((c) => c.sessions.some((s) => s.id === sessionId));
  const session = course?.sessions.find((s) => s.id === sessionId);
  if (!course || !session || !accountId) return <NotFound what="Lecture" back={BACK} />;

  const occurrence = nextOccurrenceOf(state.data!.courses, sessionId, now);

  return (
    <>
      <DetailHeader back={BACK} eyebrow={`${course.code} · ${session.kind}`} title={course.title}>
        {session.source === "personal" && (
          <span className="inline-flex rounded-full border border-dashed border-oxford-ink/40 px-2.5 py-0.5 text-xs font-semibold text-oxford-ink">
            Times entered by you
          </span>
        )}
      </DetailHeader>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <dl className="divide-y divide-oxford-rule/70 rounded-2xl border border-oxford-rule bg-white/80 px-5">
          <DetailRow icon={CalendarClock} label="When">
            {occurrence ? (
              <>
                {dayLabel(occurrence.start, now) === "Today" ? "Today" : longDate(occurrence.start)},{" "}
                {session.start}–{session.end}
                <span className="mt-0.5 block text-sm font-semibold text-oxford-success">
                  {countdown(occurrence, now)}
                </span>
              </>
            ) : session.day ? (
              `${session.start}–${session.end}`
            ) : (
              <span className="font-medium text-oxford-danger">Time not published</span>
            )}
          </DetailRow>
          <DetailRow icon={MapPin} label="Venue">
            <VenueLine venue={session.venue} placeId={session.placeId} />
          </DetailRow>
          <DetailRow icon={UserRound} label="Lecturer">
            {course.lecturer ?? "Not listed"}
          </DetailRow>
          <DetailRow icon={NotebookPen} label="Notes for this session">
            {session.notes ?? <span className="text-oxford-mute">No notes for this session.</span>}
          </DetailRow>
        </dl>

        <ReminderPanel accountId={accountId} sessionId={sessionId} />
      </div>
    </>
  );
};

const ReminderPanel = ({ accountId, sessionId }: { accountId: string; sessionId: string }) => {
  const [reminder, setReminder] = useState<LectureReminder | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [permission, setPermission] = useState<AlertPermission | null>(null);
  const { ensure } = useNotificationPermission();

  useEffect(() => {
    void services.timetable.reminder(accountId, sessionId).then(setReminder);
  }, [accountId, sessionId]);

  const save = async (next: LectureReminder) => {
    setReminder(next);
    setStatus(null);
    if (next.enabled && !reminder?.enabled) {
      setPermission(await ensure("lectures"));
    }
    await services.timetable.setReminder(accountId, sessionId, next);
    setStatus(next.enabled ? `Reminder set for ${duration(next.minutesBefore)} before.` : "Reminder turned off.");
  };

  return (
    <section aria-labelledby="reminder-title" className="h-fit rounded-2xl border border-oxford-rule bg-white/80 p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 id="reminder-title" className="font-sans text-base font-semibold text-oxford-ink">
          Reminder
        </h2>
        {reminder && (
          <button
            type="button"
            role="switch"
            aria-checked={reminder.enabled}
            aria-labelledby="reminder-title"
            onClick={() => void save({ ...reminder, enabled: !reminder.enabled })}
            className={`relative h-8 w-14 shrink-0 rounded-full transition ${reminder.enabled ? "bg-oxford-ink" : "bg-oxford-ink/25"}`}
          >
            <span
              aria-hidden="true"
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${reminder.enabled ? "left-7" : "left-1"}`}
            />
          </button>
        )}
      </div>
      {!reminder ? (
        <p className="mt-3 text-sm text-oxford-mute">Loading…</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-oxford-mute">
            {reminder.enabled ? `${duration(reminder.minutesBefore)} before this session` : "Off for this session"}
          </p>
          {reminder.enabled && (
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold text-oxford-ink">How long before</legend>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {LEADS.map((m) => {
                  const on = reminder.minutesBefore === m;
                  return (
                    <label
                      key={m}
                      className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 py-2 text-sm font-semibold transition focus-within:ring-2 focus-within:ring-oxford-ink focus-within:ring-offset-2 ${
                        on ? "border-oxford-ink bg-oxford-ink text-white" : "border-oxford-ink/20 bg-white text-oxford-ink hover:border-oxford-ink/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reminder-lead"
                        checked={on}
                        onChange={() => void save({ ...reminder, minutesBefore: m })}
                        className="sr-only"
                      />
                      {m === 60 ? "1 hr" : `${m}m`}
                      <span className="sr-only"> minutes before</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}
          {permission && reminder.enabled && <PermissionNote permission={permission} className="mt-3" />}
          <p role="status" className="mt-3 text-sm font-semibold text-oxford-success">
            {status}
          </p>
        </>
      )}
    </section>
  );
};
