import { AlertTriangle, PencilLine } from "lucide-react";
import { DAYS, dayName, toMinutes, type PlacedSession } from "./timetable";

const HOUR_PX = 56;

interface Props {
  sessions: PlacedSession[];
  /** Session ids involved in an unresolved overlap. */
  clashing: Set<string>;
}

const describe = (s: PlacedSession, clash: boolean) =>
  `${s.courseCode} ${s.courseTitle}, ${s.kind}, ${dayName(s.day)} ${s.start} to ${s.end}, ${
    s.venue ?? "venue not confirmed"
  }${s.source === "personal" ? ", entered by you" : ""}${clash ? ", overlaps another session" : ""}`;

/** Lays out each day's sessions side by side where they overlap. */
const withLanes = (sessions: PlacedSession[]) => {
  const sorted = [...sessions].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  const laneEnds: number[] = [];
  const placed = sorted.map((s) => {
    let lane = laneEnds.findIndex((end) => end <= toMinutes(s.start));
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = toMinutes(s.end);
    return { s, lane };
  });
  return { placed, lanes: Math.max(1, laneEnds.length) };
};

/** Desktop: weekly grid. */
export const WeekGrid = ({ sessions, clashing }: Props) => {
  const days = DAYS.filter((d) => d.id !== "sat" || sessions.some((s) => s.day === "sat"));
  const startHour = Math.min(8, ...sessions.map((s) => Math.floor(toMinutes(s.start) / 60)));
  const endHour = Math.max(17, ...sessions.map((s) => Math.ceil(toMinutes(s.end) / 60)));
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const height = (endHour - startHour) * HOUR_PX;

  return (
    <section aria-label="Weekly timetable" className="hidden overflow-hidden rounded-xl border border-oxford-rule bg-white lg:block">
      <div className="grid border-b border-oxford-rule" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}>
        <span aria-hidden="true" />
        {days.map((d) => (
          <p key={d.id} className="border-l border-oxford-rule px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-oxford-mute">
            {d.short}
          </p>
        ))}
      </div>
      <div className="grid" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}>
        <div aria-hidden="true" className="relative" style={{ height }}>
          {hours.map((h, i) => (
            <span key={h} className="absolute right-2 -translate-y-1/2 text-[11px] text-oxford-mute" style={{ top: i * HOUR_PX }}>
              {i === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
            </span>
          ))}
        </div>
        {days.map((d) => {
          const { placed, lanes } = withLanes(sessions.filter((s) => s.day === d.id));
          return (
            <ul
              key={d.id}
              aria-label={d.long}
              className="relative border-l border-oxford-rule"
              style={{
                height,
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_PX - 1}px, rgb(var(--us-rule) / 0.6) ${HOUR_PX - 1}px, rgb(var(--us-rule) / 0.6) ${HOUR_PX}px)`,
              }}
            >
              {placed.map(({ s, lane }) => {
                const clash = clashing.has(s.id);
                const top = ((toMinutes(s.start) - startHour * 60) / 60) * HOUR_PX;
                const blockHeight = ((toMinutes(s.end) - toMinutes(s.start)) / 60) * HOUR_PX;
                return (
                  <li
                    key={s.id}
                    className={`absolute overflow-hidden rounded-md border px-1.5 py-1 text-[11px] leading-tight ${
                      clash
                        ? "border-oxford-danger bg-oxford-danger/10 text-oxford-ink"
                        : s.source === "personal"
                          ? "border-dashed border-oxford-ink/50 bg-oxford-cream text-oxford-ink"
                          : "border-oxford-ink/15 bg-oxford-sandSoft text-oxford-ink"
                    }`}
                    style={{
                      top: top + 1,
                      height: blockHeight - 2,
                      left: `calc(${(lane / lanes) * 100}% + 2px)`,
                      width: `calc(${100 / lanes}% - 4px)`,
                    }}
                  >
                    <span className="sr-only">{describe(s, clash)}</span>
                    <span aria-hidden="true">
                      <span className="flex items-center gap-1 font-semibold">
                        {clash && <AlertTriangle className="h-3 w-3 shrink-0 text-oxford-danger" />}
                        {s.source === "personal" && !clash && <PencilLine className="h-3 w-3 shrink-0" />}
                        <span className="truncate">{s.courseCode}</span>
                      </span>
                      <span className="block truncate text-oxford-ink2">
                        {s.start}–{s.end}
                      </span>
                      <span className="block truncate text-oxford-mute">{s.venue ?? "Venue TBC"}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        })}
      </div>
    </section>
  );
};

/** Mobile: the same week as a list grouped by day. */
export const WeekList = ({ sessions, clashing }: Props) => {
  const days = DAYS.filter((d) => sessions.some((s) => s.day === d.id));
  return (
    <section aria-label="Weekly timetable" className="space-y-4 lg:hidden">
      {days.map((d) => (
        <div key={d.id}>
          <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-oxford-mute">{d.long}</h3>
          <ul className="mt-2 space-y-2">
            {sessions
              .filter((s) => s.day === d.id)
              .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
              .map((s) => {
                const clash = clashing.has(s.id);
                return (
                  <li
                    key={s.id}
                    className={`flex gap-3 rounded-lg border p-3 ${
                      clash
                        ? "border-oxford-danger bg-oxford-danger/5"
                        : s.source === "personal"
                          ? "border-dashed border-oxford-ink/40 bg-white"
                          : "border-oxford-rule bg-white"
                    }`}
                  >
                    <span className="w-24 shrink-0 text-sm font-semibold text-oxford-ink">
                      {s.start}–{s.end}
                    </span>
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="block font-semibold text-oxford-ink">
                        {s.courseCode} <span className="font-normal text-oxford-mute">{s.kind}</span>
                      </span>
                      <span className="block truncate text-oxford-mute">{s.venue ?? "Venue not confirmed"}</span>
                      {(clash || s.source === "personal") && (
                        <span className="mt-1 flex flex-wrap gap-1.5">
                          {clash && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-oxford-danger">
                              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                              Overlaps
                            </span>
                          )}
                          {s.source === "personal" && (
                            <span className="text-xs font-semibold text-oxford-ink">Entered by you</span>
                          )}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </section>
  );
};
