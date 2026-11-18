import { useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { AdminReference, ContentMeta, ContentType, HoursRow } from "@/services";
import { DAY_SET_OPTIONS } from "@/lib/cms";
import { abtn, Card, TextInput } from "../ui";

// Pieces shared by every editor (flow 10).

export type Errors = Record<string, string>;

export interface FormProps<P> {
  value: P;
  onChange: (patch: Partial<P>) => void;
  errors: Errors;
  reference: AdminReference;
}

/** What to tell the editor when a checklist item isn't done. Keys match `checklist()` fields. */
export const ERROR_TEXT: Record<string, string> = {
  title: "Enter a title.",
  summary: "Write a short summary.",
  body: "Write the body text.",
  link: "Links must start with https://",
  description: "Write a description.",
  date: "Choose a date.",
  start: "Enter a start and end time. The end must be after the start.",
  venue: "Choose a place, or enter a venue name.",
  organiser: "Enter who is organising it.",
  capacity: "Enter how many places there are.",
  name: "Enter a name.",
  contact: "Add a phone number or an email address.",
  website: "Links must start with https://",
  location: "Drop a pin on the map.",
  entrances: "Add at least one entrance.",
  pathChecked: "Check that the entrances connect to a walking path.",
  semesterId: "Choose a semester.",
  courseCode: "Enter the course code and title.",
  credits: "Enter the number of credits.",
  sessions: "Add at least one complete session: day, start and end.",
  sourceDocument: "Attach the official schedule, or add a link to it.",
  sourceChecked: "Confirm you've checked the sessions against the official schedule.",
  source: "Say where this content comes from.",
  audience: "Choose at least one level or programme.",
  expiresOn: "The expiry date must be on or after the publish date.",
};

export const fid = (field: string) => `f-${field}`;

export const Checkbox = ({ id, checked, onChange, label, hint, error }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode; error?: string }) => (
  <div>
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2 text-sm text-oxford-ink">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className="mt-0.5 h-4 w-4 shrink-0 accent-oxford-ink"
      />
      <span className="font-semibold">{label}</span>
    </label>
    {hint && !error && (
      <p id={`${id}-hint`} className="ml-6 mt-0.5 text-xs text-oxford-mute">
        {hint}
      </p>
    )}
    {error && (
      <p id={`${id}-error`} className="ml-6 mt-0.5 text-xs font-semibold text-oxford-danger">
        {error}
      </p>
    )}
  </div>
);

const small = "rounded-md border border-oxford-ink/25 bg-white px-2 py-1.5 text-sm";

/** Opening hours as rows: days, open, close, or closed. */
export const HoursEditor = ({ rows, onChange, emptyNote }: { rows: HoursRow[]; onChange: (rows: HoursRow[]) => void; emptyNote: string }) => {
  const update = (i: number, patch: Partial<HoursRow>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <fieldset>
      <legend className="text-xs font-semibold text-oxford-ink">Opening hours</legend>
      {rows.length === 0 && <p className="mt-1 text-xs text-oxford-mute">{emptyNote}</p>}
      <ul className="mt-1 space-y-2">
        {rows.map((r, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor={`hours-days-${i}`}>
              Days, row {i + 1}
            </label>
            <select id={`hours-days-${i}`} value={r.days} onChange={(e) => update(i, { days: e.target.value as HoursRow["days"] })} className={small}>
              {DAY_SET_OPTIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor={`hours-open-${i}`}>
              Opens, row {i + 1}
            </label>
            <input id={`hours-open-${i}`} type="time" value={r.open} disabled={r.closed} onChange={(e) => update(i, { open: e.target.value })} className={small} />
            <span aria-hidden="true" className="text-oxford-mute">
              to
            </span>
            <label className="sr-only" htmlFor={`hours-close-${i}`}>
              Closes, row {i + 1}
            </label>
            <input id={`hours-close-${i}`} type="time" value={r.close} disabled={r.closed} onChange={(e) => update(i, { close: e.target.value })} className={small} />
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={r.closed} onChange={(e) => update(i, { closed: e.target.checked })} className="h-4 w-4 accent-oxford-ink" />
              Closed
            </label>
            <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} className={abtn("ghost", "px-2")} aria-label={`Remove hours row ${i + 1}`}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => onChange([...rows, { days: "weekdays", open: "08:00", close: "17:00", closed: false }])} className={abtn("secondary", "mt-2")}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add hours
      </button>
    </fieldset>
  );
};

const NOTIFY_TYPES: ContentType[] = ["news", "event", "timetable"];
const SOURCES = ["Registrar's Office", "Academic Affairs", "Office of the Dean of Students", "Balme Library", "University of Ghana Computing Systems", "Finance Directorate", "Physical Development and Municipal Services"];

/** Source, audience and publishing options: required on every item. */
export const MetaFields = ({ type, meta, onChange, errors, reference }: { type: ContentType; meta: ContentMeta; onChange: (m: ContentMeta) => void; errors: Errors; reference: AdminReference }) => {
  const [filter, setFilter] = useState("");
  const set = (patch: Partial<ContentMeta>) => onChange({ ...meta, ...patch });
  const a = meta.audience;
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const programmes = reference.programmes.filter((p) => p.name.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <>
      <Card title="Source and audience">
        <div className="space-y-4">
          <TextInput
            id={fid("source")}
            label="Source"
            required
            list="source-options"
            value={meta.source}
            onChange={(e) => set({ source: e.target.value })}
            hint="The office the information comes from. Students see this."
            error={errors.source}
          />
          <datalist id="source-options">
            {SOURCES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>

          <fieldset aria-describedby={errors.audience ? "audience-error" : undefined}>
            <legend className="text-xs font-semibold text-oxford-ink">
              Audience<span aria-hidden="true" className="text-oxford-danger"> *</span>
              <span className="sr-only"> (required)</span>
            </legend>
            <div className="mt-1 flex flex-wrap gap-4 text-sm">
              {(
                [
                  ["all", "All students"],
                  ["levels", "Particular levels"],
                  ["programmes", "Particular programmes"],
                ] as const
              ).map(([kind, label], i) => (
                <label key={kind} className="flex items-center gap-1.5">
                  <input
                    id={i === 0 ? fid("audience") : undefined}
                    type="radio"
                    name="audience"
                    checked={a.kind === kind}
                    onChange={() => set({ audience: kind === "all" ? { kind } : kind === "levels" ? { kind, levels: [] } : { kind, programmeIds: [] } })}
                    className="h-4 w-4 accent-oxford-ink"
                  />
                  {label}
                </label>
              ))}
            </div>
            {a.kind === "all" && <p className="mt-1 text-xs text-oxford-mute">Guests can see it too.</p>}
            {a.kind === "levels" && (
              <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {reference.levels.map((l) => (
                  <label key={l} className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" checked={a.levels.includes(l)} onChange={() => set({ audience: { kind: "levels", levels: toggle(a.levels, l) } })} className="h-4 w-4 accent-oxford-ink" />
                    {l}
                  </label>
                ))}
              </div>
            )}
            {a.kind === "programmes" && (
              <div className="mt-2">
                <label className="text-xs font-semibold" htmlFor="programme-filter">
                  Find a programme
                </label>
                <input id="programme-filter" type="search" value={filter} onChange={(e) => setFilter(e.target.value)} className={`${small} ml-2 w-56`} />
                <div className="mt-2 grid max-h-48 gap-1 overflow-y-auto rounded-md border border-oxford-rule p-2 sm:grid-cols-2">
                  {programmes.map((p) => (
                    <label key={p.id} className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" checked={a.programmeIds.includes(p.id)} onChange={() => set({ audience: { kind: "programmes", programmeIds: toggle(a.programmeIds, p.id) } })} className="h-4 w-4 accent-oxford-ink" />
                      {p.name}
                    </label>
                  ))}
                  {programmes.length === 0 && <p className="text-xs text-oxford-mute">No programme matches.</p>}
                </div>
                <p className="mt-1 text-xs text-oxford-mute">{a.programmeIds.length} chosen</p>
              </div>
            )}
            {errors.audience && (
              <p id="audience-error" className="mt-1 text-xs font-semibold text-oxford-danger">
                {errors.audience}
              </p>
            )}
          </fieldset>
        </div>
      </Card>

      <Card title="Publishing">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            id={fid("publishOn")}
            type="datetime-local"
            label="Publish on (optional)"
            value={meta.publishOn ?? ""}
            onChange={(e) => set({ publishOn: e.target.value })}
            hint="The reviewer can schedule it for this time. Leave empty to publish once approved."
          />
          <TextInput
            id={fid("expiresOn")}
            type="date"
            label="Expires after (optional)"
            value={meta.expiresOn ?? ""}
            onChange={(e) => set({ expiresOn: e.target.value })}
            hint="Students stop seeing it after this day."
            error={errors.expiresOn}
          />
        </div>
        {NOTIFY_TYPES.includes(type) && (
          <div className="mt-4">
            <Checkbox
              id={fid("notify")}
              checked={meta.notify}
              onChange={(notify) => set({ notify })}
              label="Notify students when it's published"
              hint={type === "timetable" ? "Students taking this course get a timetable update." : "Students in the audience get a notification that opens this item."}
            />
          </div>
        )}
      </Card>
    </>
  );
};
