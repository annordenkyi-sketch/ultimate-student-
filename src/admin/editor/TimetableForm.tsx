import { useState } from "react";
import { Download, FileUp, Paperclip, Plus, Trash2, X } from "lucide-react";
import type { SessionKind, TimetablePayload, TimetableSessionRow, Weekday } from "@/services";
import { abtn, Card, Field, SelectInput, TextInput } from "../ui";
import { Checkbox, fid, type FormProps } from "./fields";

const KINDS: SessionKind[] = ["Lecture", "Tutorial", "Practical"];
const DAYS: { id: Weekday; label: string }[] = [
  { id: "mon", label: "Monday" },
  { id: "tue", label: "Tuesday" },
  { id: "wed", label: "Wednesday" },
  { id: "thu", label: "Thursday" },
  { id: "fri", label: "Friday" },
  { id: "sat", label: "Saturday" },
];
const TIME = /^\d{2}:\d{2}$/;
const TEMPLATE = "kind,day,start,end,venue,lecturer\nLecture,Monday,08:30,10:30,JQB 19,Dr. A. Mensah\nTutorial,Thursday,14:00,15:00,N Block LT 1,\n";

const newId = () => `s-${Math.random().toString(36).slice(2, 9)}`;

// ── CSV import ───────────────────────────────────────────────────────

/** Splits CSV text into rows of fields. Handles quoted fields with commas and "" escapes. */
const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim()));
};

const toTime = (s: string) => {
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(s.trim());
  return m ? `${m[1]!.padStart(2, "0")}:${m[2]}` : s.trim();
};

const toDay = (s: string): Weekday | null => {
  const t = s.trim().toLowerCase().slice(0, 3);
  return DAYS.find((d) => d.id === t)?.id ?? null;
};

interface ParsedRow {
  line: number;
  raw: string[];
  session: TimetableSessionRow | null;
  errors: string[];
  warnings: string[];
}

const COLUMNS = ["kind", "day", "start", "end", "venue", "lecturer"] as const;

const parseImport = (text: string, venues: Record<string, string>): { rows: ParsedRow[]; headerError: string | null } => {
  const all = parseCsv(text);
  if (all.length === 0) return { rows: [], headerError: "The file is empty." };
  const header = all[0]!.map((h) => h.trim().toLowerCase());
  const missing = COLUMNS.slice(0, 4).filter((c) => !header.includes(c));
  if (missing.length) return { rows: [], headerError: `The first row must name the columns. Missing: ${missing.join(", ")}. Download the template to see the format.` };
  const col = (r: string[], c: (typeof COLUMNS)[number]) => (header.indexOf(c) >= 0 ? (r[header.indexOf(c)] ?? "").trim() : "");

  const rows = all.slice(1).map((r, i): ParsedRow => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const kindRaw = col(r, "kind");
    const kind = KINDS.find((k) => k.toLowerCase() === kindRaw.toLowerCase());
    if (!kind) errors.push(`Kind “${kindRaw || "(empty)"}” must be Lecture, Tutorial or Practical`);
    const day = toDay(col(r, "day"));
    if (!day) errors.push(`Day “${col(r, "day") || "(empty)"}” isn't Monday to Saturday`);
    const start = toTime(col(r, "start"));
    const end = toTime(col(r, "end"));
    if (!TIME.test(start)) errors.push(`Start “${start || "(empty)"}” isn't a time like 08:30`);
    if (!TIME.test(end)) errors.push(`End “${end || "(empty)"}” isn't a time like 10:30`);
    if (TIME.test(start) && TIME.test(end) && end <= start) errors.push("End must be after start");
    const venue = col(r, "venue");
    if (!venue) warnings.push("No venue");
    else if (!venues[venue]) warnings.push(`Venue “${venue}” isn't on the campus map, so no directions`);
    return {
      line: i + 2,
      raw: r,
      session: errors.length ? null : { id: newId(), kind: kind!, day: day!, start, end, venue, lecturer: col(r, "lecturer") },
      errors,
      warnings,
    };
  });
  return { rows, headerError: rows.length ? null : "There are no sessions under the header row." };
};

const download = (name: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

const CsvImport = ({ venues, onImport, onClose }: { venues: Record<string, string>; onImport: (rows: TimetableSessionRow[], replace: boolean) => void; onClose: () => void }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof parseImport> | null>(null);
  const valid = result?.rows.filter((r) => r.session).map((r) => r.session!) ?? [];
  const failed = result?.rows.filter((r) => !r.session) ?? [];

  const report = () =>
    download(
      "timetable-import-errors.csv",
      ["row,problem", ...failed.flatMap((r) => r.errors.map((e) => `${r.line},"${e.replace(/"/g, '""')}"`))].join("\n"),
    );

  return (
    <section aria-labelledby="csv-title" className="rounded-lg border border-oxford-ink/20 bg-oxford-paper p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 id="csv-title" className="font-sans text-sm font-semibold">
          Import sessions from a CSV file
        </h3>
        <button type="button" onClick={onClose} className={abtn("ghost", "px-2")} aria-label="Close CSV import">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-1 text-xs text-oxford-mute">Columns: kind, day, start, end, venue, lecturer. One session per row.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className={abtn("secondary", "cursor-pointer focus-within:ring-2 focus-within:ring-oxford-gold")}>
          <FileUp className="h-4 w-4" aria-hidden="true" />
          Choose CSV file
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setFileName(file.name);
              setResult(parseImport(await file.text(), venues));
              e.target.value = "";
            }}
          />
        </label>
        <button type="button" onClick={() => download("timetable-template.csv", TEMPLATE)} className={abtn("ghost")}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Download template
        </button>
        {fileName && <span className="text-xs text-oxford-mute">{fileName}</span>}
      </div>

      {result && (
        <div className="mt-3" role="status">
          {result.headerError ? (
            <p className="text-sm font-semibold text-oxford-danger">{result.headerError}</p>
          ) : (
            <>
              <p className="text-sm">
                <span className="font-semibold">{result.rows.length} rows:</span> {valid.length} ready to import
                {failed.length > 0 && <span className="font-semibold text-oxford-danger">, {failed.length} with errors (not imported)</span>}
              </p>
              <div className="mt-2 max-h-64 overflow-auto rounded-md border border-oxford-rule bg-white">
                <table className="w-full text-left text-xs">
                  <caption className="sr-only">Import preview</caption>
                  <thead className="sticky top-0 bg-oxford-cream text-oxford-mute">
                    <tr>
                      <th scope="col" className="px-2 py-1.5">Row</th>
                      <th scope="col" className="px-2 py-1.5">Session</th>
                      <th scope="col" className="px-2 py-1.5">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-oxford-rule/70">
                    {result.rows.map((r) => (
                      <tr key={r.line} className={r.session ? "" : "bg-oxford-danger/5"}>
                        <td className="px-2 py-1.5 align-top">{r.line}</td>
                        <td className="px-2 py-1.5 align-top">{r.raw.join(" · ")}</td>
                        <td className="px-2 py-1.5 align-top">
                          {r.errors.length ? (
                            <ul className="font-semibold text-oxford-danger">
                              {r.errors.map((e) => (
                                <li key={e}>{e}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="font-semibold text-oxford-success">Ready</span>
                          )}
                          {r.warnings.map((w) => (
                            <span key={w} className="block text-oxford-mute">
                              {w}
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" disabled={!valid.length} onClick={() => onImport(valid, true)} className={abtn("primary")}>
                  Replace sessions with {valid.length}
                </button>
                <button type="button" disabled={!valid.length} onClick={() => onImport(valid, false)} className={abtn("secondary")}>
                  Add {valid.length} to the list
                </button>
                {failed.length > 0 && (
                  <button type="button" onClick={report} className={abtn("ghost")}>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download error report
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};

// ── Form ─────────────────────────────────────────────────────────────

const cell = "w-full rounded-md border border-oxford-ink/25 bg-white px-1.5 py-1 text-sm";

export const TimetableForm = ({ value: v, onChange, errors, reference }: FormProps<TimetablePayload>) => {
  const [importing, setImporting] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  // Changing sessions means they need checking against the source again.
  const setSessions = (sessions: TimetableSessionRow[]) => onChange({ sessions, ...(v.sourceChecked ? { sourceChecked: false } : {}) });
  const update = (id: string, patch: Partial<TimetableSessionRow>) => setSessions(v.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const isLink = /^https?:\/\//.test(v.sourceDocument);

  return (
    <>
      <Card title="Course">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectInput id={fid("semesterId")} label="Semester" required value={v.semesterId} onChange={(e) => onChange({ semesterId: e.target.value })} error={errors.semesterId}>
            <option value="">Choose a semester</option>
            {reference.semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.term}, {s.academicYear}
                {s.current ? " (current)" : ""}
              </option>
            ))}
          </SelectInput>
          <SelectInput id={fid("programmeId")} label="Programme (optional)" value={v.programmeId} onChange={(e) => onChange({ programmeId: e.target.value })}>
            <option value="">Shared by several programmes</option>
            {reference.programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectInput>
          <TextInput id={fid("courseCode")} label="Course code" required placeholder="e.g. DCIT 201" value={v.courseCode} onChange={(e) => onChange({ courseCode: e.target.value.toUpperCase() })} error={errors.courseCode} />
          <TextInput id={fid("courseTitle")} label="Course title" required value={v.courseTitle} onChange={(e) => onChange({ courseTitle: e.target.value })} />
          <TextInput id={fid("credits")} type="number" min={1} max={12} label="Credits" required value={v.credits} onChange={(e) => onChange({ credits: e.target.value })} error={errors.credits} />
        </div>
      </Card>

      <Card
        title={`Sessions (${v.sessions.length})`}
        actions={
          !importing && (
            <button type="button" onClick={() => setImporting(true)} className={abtn("secondary")}>
              <FileUp className="h-4 w-4" aria-hidden="true" />
              Import CSV
            </button>
          )
        }
      >
        {importing && (
          <div className="mb-3">
            <CsvImport
              venues={reference.venues}
              onClose={() => setImporting(false)}
              onImport={(rows, replace) => {
                setSessions(replace ? rows : [...v.sessions, ...rows]);
                setImporting(false);
                setNote(`${rows.length} ${rows.length === 1 ? "session" : "sessions"} imported. Check them below.`);
              }}
            />
          </div>
        )}
        {note && (
          <p role="status" className="mb-2 text-sm font-semibold text-oxford-success">
            {note}
          </p>
        )}
        {errors.sessions && <p className="mb-2 text-xs font-semibold text-oxford-danger">{errors.sessions}</p>}
        {v.sessions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <caption className="sr-only">Course sessions</caption>
              <thead className="text-xs text-oxford-mute">
                <tr>
                  <th scope="col" className="w-[120px] py-1 pr-2 font-semibold">Kind</th>
                  <th scope="col" className="w-[130px] py-1 pr-2 font-semibold">Day</th>
                  <th scope="col" className="w-[124px] py-1 pr-2 font-semibold">Start</th>
                  <th scope="col" className="w-[124px] py-1 pr-2 font-semibold">End</th>
                  <th scope="col" className="py-1 pr-2 font-semibold">Venue</th>
                  <th scope="col" className="py-1 pr-2 font-semibold">Lecturer</th>
                  <th scope="col" className="py-1"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {v.sessions.map((s, i) => {
                  const bad = !s.day || !TIME.test(s.start) || !TIME.test(s.end) || s.end <= s.start;
                  const n = i + 1;
                  return (
                    <tr key={s.id} className={bad && errors.sessions ? "bg-oxford-danger/5" : ""}>
                      <td className="py-1 pr-2">
                        <select aria-label={`Session ${n} kind`} value={s.kind} onChange={(e) => update(s.id, { kind: e.target.value as SessionKind })} className={cell}>
                          {KINDS.map((k) => (
                            <option key={k}>{k}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-1 pr-2">
                        <select aria-label={`Session ${n} day`} value={s.day} onChange={(e) => update(s.id, { day: e.target.value as Weekday })} className={cell}>
                          <option value="">Day</option>
                          {DAYS.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-1 pr-2">
                        <input aria-label={`Session ${n} start`} type="time" value={s.start} onChange={(e) => update(s.id, { start: e.target.value })} className={cell} />
                      </td>
                      <td className="py-1 pr-2">
                        <input aria-label={`Session ${n} end`} type="time" value={s.end} onChange={(e) => update(s.id, { end: e.target.value })} className={cell} />
                      </td>
                      <td className="py-1 pr-2">
                        <input aria-label={`Session ${n} venue`} list="venue-options" value={s.venue} onChange={(e) => update(s.id, { venue: e.target.value })} className={cell} />
                      </td>
                      <td className="py-1 pr-2">
                        <input aria-label={`Session ${n} lecturer`} value={s.lecturer} onChange={(e) => update(s.id, { lecturer: e.target.value })} className={cell} />
                      </td>
                      <td className="py-1">
                        <button type="button" onClick={() => setSessions(v.sessions.filter((x) => x.id !== s.id))} className={abtn("ghost", "px-2")} aria-label={`Remove session ${n}`}>
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <datalist id="venue-options">
              {Object.keys(reference.venues).map((venue) => (
                <option key={venue} value={venue} />
              ))}
            </datalist>
          </div>
        )}
        <button
          id={fid("sessions")}
          type="button"
          onClick={() => setSessions([...v.sessions, { id: newId(), kind: "Lecture", day: "", start: "", end: "", venue: "", lecturer: "" }])}
          className={abtn("secondary", "mt-2")}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add session
        </button>
      </Card>

      <Card title="Verify official schedule source">
        <div className="space-y-4">
          <Field id={fid("sourceDocument")} label="Official schedule" required hint="Attach the timetable document from the faculty or registry, or paste a link to it." error={errors.sourceDocument}>
            {v.sourceDocument && !isLink ? (
              <div className="flex items-center gap-2 rounded-md border border-oxford-ink/25 bg-white px-2.5 py-1.5 text-sm">
                <Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{v.sourceDocument}</span>
                <button type="button" onClick={() => onChange({ sourceDocument: "", sourceChecked: false })} className="rounded p-0.5 hover:bg-oxford-cream" aria-label={`Remove ${v.sourceDocument}`}>
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id={fid("sourceDocument")}
                  type="url"
                  placeholder="https://"
                  value={v.sourceDocument}
                  onChange={(e) => onChange({ sourceDocument: e.target.value })}
                  aria-invalid={errors.sourceDocument ? true : undefined}
                  aria-describedby={errors.sourceDocument ? `${fid("sourceDocument")}-error` : `${fid("sourceDocument")}-hint`}
                  className={`min-w-[220px] flex-1 rounded-md border bg-white px-2.5 py-1.5 text-sm ${errors.sourceDocument ? "border-oxford-danger" : "border-oxford-ink/25"}`}
                />
                <span className="text-xs text-oxford-mute">or</span>
                <label className={abtn("secondary", "cursor-pointer focus-within:ring-2 focus-within:ring-oxford-gold")}>
                  <Paperclip className="h-4 w-4" aria-hidden="true" />
                  Attach document
                  <input type="file" accept=".pdf,.xlsx,.xls,.csv,.doc,.docx" className="sr-only" onChange={(e) => e.target.files?.[0] && onChange({ sourceDocument: e.target.files[0].name })} />
                </label>
              </div>
            )}
          </Field>
          <Checkbox
            id={fid("sourceChecked")}
            checked={v.sourceChecked}
            onChange={(sourceChecked) => onChange({ sourceChecked })}
            label="I've checked every session against this official schedule"
            hint="Changing the sessions clears this tick, so it always matches what you submit."
            error={errors.sourceChecked}
          />
        </div>
      </Card>
    </>
  );
};
