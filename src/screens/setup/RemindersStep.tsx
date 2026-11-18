import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { type AlertPermission, type ReminderLead, type Weekday } from "@/services";
import { useNotificationPermission } from "@/session/NotificationPermission";
import { FieldError } from "@/ui/form/FieldError";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { AuthHeading, BackLink } from "../auth/parts";
import { useSetup } from "./SetupLayout";
import { DAYS, placedSessions } from "./timetable";

const LEADS: ReminderLead[] = [10, 15, 30, 60];

const chip = (on: boolean) =>
  `flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition focus-within:ring-2 focus-within:ring-oxford-ink focus-within:ring-offset-2 ${
    on ? "border-oxford-ink bg-oxford-ink text-white" : "border-oxford-ink/20 bg-white text-oxford-ink hover:border-oxford-ink/40"
  }`;

const PERMISSION_COPY: Partial<Record<AlertPermission, { tone: "success" | "info"; title: string; body?: string }>> = {
  granted: { tone: "success", title: "Notifications are allowed on this device." },
  denied: {
    tone: "info",
    title: "Notifications are blocked in this browser",
    body: "Reminders will still appear in your notification centre. You can allow notifications in your browser settings.",
  },
  default: {
    tone: "info",
    title: "Notifications weren't allowed",
    body: "Reminders will still appear in your notification centre.",
  },
  unsupported: {
    tone: "info",
    title: "This browser can't show notifications",
    body: "Reminders will still appear in your notification centre.",
  },
};

/** Flow 02 "Configure lecture reminders" + "Reminder preferences". */
export const RemindersStep = () => {
  const { progress, update } = useSetup();
  const navigate = useNavigate();

  const sessions = placedSessions(progress.courses);
  const daysWithClasses = DAYS.filter((d) => sessions.some((s) => s.day === d.id)).map((d) => d.id);
  const coursesWithClasses = progress.courses.filter((c) => sessions.some((s) => s.courseCode === c.code));

  const saved = progress.reminders;
  const [enabled, setEnabled] = useState(saved?.enabled ?? false);
  const [lead, setLead] = useState<ReminderLead>(saved?.minutesBefore ?? 15);
  const [days, setDays] = useState<Set<Weekday>>(new Set(saved?.days ?? daysWithClasses));
  const [codes, setCodes] = useState<Set<string>>(new Set(saved?.courseCodes ?? coursesWithClasses.map((c) => c.code)));
  const [permission, setPermission] = useState<AlertPermission | null>(null);
  const { ensure } = useNotificationPermission();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleEnabled = async () => {
    const next = !enabled;
    setEnabled(next);
    setError(null);
    if (!next) return;
    // Only ask once reminders are actually turned on, and explain first (pre-prompt).
    setAsking(true);
    setPermission(await ensure("lectures"));
    setAsking(false);
  };

  const toggleIn = <T,>(set: Set<T>, value: T) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (enabled && (days.size === 0 || codes.size === 0)) {
      setError(days.size === 0 ? "Choose at least one day." : "Choose at least one course.");
      return;
    }
    update({
      reminders: { enabled, minutesBefore: lead, days: [...days], courseCodes: [...codes] },
    });
    navigate("/onboarding/goals");
  };

  const permissionCopy = permission ? PERMISSION_COPY[permission] : undefined;

  return (
    <form onSubmit={onSubmit} noValidate>
      <BackLink to="/onboarding/review" />
      <AuthHeading title="Lecture reminders">Get a notification before your lectures start.</AuthHeading>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-oxford-rule bg-white p-4">
        <span>
          <span id="reminders-label" className="block font-semibold text-oxford-ink">
            Remind me before lectures
          </span>
          <span className="block text-sm text-oxford-mute">{enabled ? "On" : "Off"}</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="reminders-label"
          onClick={toggleEnabled}
          className={`relative h-8 w-14 shrink-0 rounded-full transition ${enabled ? "bg-oxford-ink" : "bg-oxford-ink/25"}`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${enabled ? "left-7" : "left-1"}`}
          />
        </button>
      </div>

      {enabled && asking && (
        <p role="status" className="mt-3 text-sm text-oxford-mute">
          Waiting for you to allow notifications…
        </p>
      )}
      {enabled && permissionCopy && (
        <FormAlert tone={permissionCopy.tone} title={permissionCopy.title} className="mt-3">
          {permissionCopy.body}
        </FormAlert>
      )}

      {enabled && (
        <div className="mt-6 space-y-6">
          <fieldset>
            <legend className="text-sm font-semibold text-oxford-ink">How long before</legend>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {LEADS.map((m) => (
                <label key={m} className={chip(lead === m)}>
                  <input
                    type="radio"
                    name="lead"
                    checked={lead === m}
                    onChange={() => setLead(m)}
                    className="sr-only"
                  />
                  {m === 60 ? "1 hr" : `${m} min`}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-oxford-ink">On these days</legend>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {DAYS.filter((d) => daysWithClasses.includes(d.id)).map((d) => (
                <label key={d.id} className={chip(days.has(d.id))}>
                  <input
                    type="checkbox"
                    checked={days.has(d.id)}
                    onChange={() => {
                      setDays((s) => toggleIn(s, d.id));
                      setError(null);
                    }}
                    className="sr-only"
                  />
                  <span aria-hidden="true">{d.short}</span>
                  <span className="sr-only">{d.long}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-oxford-ink">For these courses</legend>
            <ul className="mt-2 divide-y divide-oxford-rule overflow-hidden rounded-xl border border-oxford-rule bg-white">
              {coursesWithClasses.map((c) => (
                <li key={c.code}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={codes.has(c.code)}
                      onChange={() => {
                        setCodes((s) => toggleIn(s, c.code));
                        setError(null);
                      }}
                      className="h-5 w-5 accent-[rgb(var(--us-ink))]"
                    />
                    <span className="text-sm">
                      <span className="font-semibold text-oxford-ink">{c.code}</span>{" "}
                      <span className="text-oxford-mute">{c.title}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        </div>
      )}
      {error && <FieldError id="reminders-error">{error}</FieldError>}

      <LoadingButton className="mt-7">Continue</LoadingButton>
    </form>
  );
};
