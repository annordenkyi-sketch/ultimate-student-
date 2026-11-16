import { useState, type FormEvent } from "react";
import type { CourseSession, Weekday } from "@/services";
import { btn } from "@/ui/button";
import { FieldError } from "@/ui/form/FieldError";
import { inputClass } from "@/ui/form/TextField";
import { DAYS, toMinutes } from "./timetable";

export interface ScheduleValues {
  day: Weekday;
  start: string;
  end: string;
  venue: string | null;
  /** Kept only when the venue text is unchanged; a retyped venue isn't verified on the map. */
  placeId: string | null;
}

interface Props {
  /** Unique prefix for field ids. */
  id: string;
  /** e.g. "CSCD 311 Lecture". */
  title: string;
  session: CourseSession;
  onSave: (values: ScheduleValues) => void;
  onCancel: () => void;
}

type Errors = Partial<Record<"day" | "start" | "end", string>>;

/** "Add personal schedule": the student's own day, time and venue for a session. */
export const PersonalScheduleForm = ({ id, title, session, onSave, onCancel }: Props) => {
  const [day, setDay] = useState<Weekday | "">(session.day ?? "");
  const [start, setStart] = useState(session.start ?? "");
  const [end, setEnd] = useState(session.end ?? "");
  const [venue, setVenue] = useState(session.venue ?? "");
  const [errors, setErrors] = useState<Errors>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next: Errors = {
      day: day ? undefined : "Choose a day.",
      start: start ? undefined : "Enter a start time.",
      end: !end ? "Enter an end time." : start && toMinutes(end) <= toMinutes(start) ? "End time must be after the start time." : undefined,
    };
    setErrors(next);
    const first = (["day", "start", "end"] as const).find((k) => next[k]);
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    const typedVenue = venue.trim() || null;
    onSave({
      day: day as Weekday,
      start,
      end,
      venue: typedVenue,
      placeId: typedVenue === session.venue ? (session.placeId ?? null) : null,
    });
  };

  const described = (key: keyof Errors) => (errors[key] ? `${id}-${key}-error` : undefined);

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-labelledby={`${id}-title`}
      className="mt-3 rounded-xl border border-dashed border-oxford-ink/30 bg-oxford-cream/50 p-4"
    >
      <p id={`${id}-title`} className="text-sm font-semibold text-oxford-ink">
        Your schedule for {title}
      </p>
      <p className="mt-0.5 text-xs text-oxford-mute">Marked "Entered by you" on your timetable.</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-day`} className="block text-sm font-semibold text-oxford-ink">
            Day
          </label>
          <select
            id={`${id}-day`}
            value={day}
            onChange={(e) => setDay(e.target.value as Weekday | "")}
            aria-invalid={errors.day ? true : undefined}
            aria-describedby={described("day")}
            className={inputClass(Boolean(errors.day), "mt-1.5")}
          >
            <option value="">Choose a day</option>
            {DAYS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.long}
              </option>
            ))}
          </select>
          {errors.day && <FieldError id={`${id}-day-error`}>{errors.day}</FieldError>}
        </div>
        <div>
          <label htmlFor={`${id}-venue`} className="block text-sm font-semibold text-oxford-ink">
            Venue <span className="font-normal text-oxford-mute">(optional)</span>
          </label>
          <input
            id={`${id}-venue`}
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. JQB 19"
            className={inputClass(false, "mt-1.5")}
          />
        </div>
        <div>
          <label htmlFor={`${id}-start`} className="block text-sm font-semibold text-oxford-ink">
            Start time
          </label>
          <input
            id={`${id}-start`}
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            aria-invalid={errors.start ? true : undefined}
            aria-describedby={described("start")}
            className={inputClass(Boolean(errors.start), "mt-1.5")}
          />
          {errors.start && <FieldError id={`${id}-start-error`}>{errors.start}</FieldError>}
        </div>
        <div>
          <label htmlFor={`${id}-end`} className="block text-sm font-semibold text-oxford-ink">
            End time
          </label>
          <input
            id={`${id}-end`}
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            aria-invalid={errors.end ? true : undefined}
            aria-describedby={described("end")}
            className={inputClass(Boolean(errors.end), "mt-1.5")}
          />
          {errors.end && <FieldError id={`${id}-end-error`}>{errors.end}</FieldError>}
        </div>
      </div>

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className={btn("secondary")}>
          Cancel
        </button>
        <button type="submit" className={btn("primary")}>
          Save schedule
        </button>
      </div>
    </form>
  );
};
