import { useState } from "react";
import { GPA_SCALE } from "@/config/grading";
import type { CheckIn, Goal } from "@/services";
import { formatTarget } from "@/lib/gpa";
import { fromISODate, shortDay, toISODate } from "@/lib/days";
import { valueText } from "@/lib/goals";

const W = 320;
const H = 128;
const PAD = { top: 14, right: 14, bottom: 26, left: 34 };

const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/**
 * One goal's check-ins over the semester: a single ink line, a dashed target
 * line, hover/focus tooltips, and a table view so values are never chart-only.
 */
export const ProgressChart = ({
  goal,
  checkIns,
  semester,
  today,
}: {
  goal: Goal;
  checkIns: CheckIn[];
  semester: { startsOn: string; endsOn: string };
  today: string;
}) => {
  const [active, setActive] = useState<number | null>(null);
  const points = [...checkIns].sort((a, b) => a.at.localeCompare(b.at));
  const isGpa = goal.target.kind === "gpa";
  const target = goal.target.kind === "description" ? 100 : goal.target.value;
  // GPA always uses the full 0–4.0 scale.
  const maxY = isGpa ? GPA_SCALE : Math.max(target, ...points.map((p) => p.value)) * 1.08;

  const t0 = fromISODate(semester.startsOn).getTime();
  const t1 = fromISODate(semester.endsOn).getTime() + 86_400_000;
  const x = (t: number) => PAD.left + ((Math.min(Math.max(t, t0), t1) - t0) / (t1 - t0)) * (W - PAD.left - PAD.right);
  const y = (v: number) => H - PAD.bottom - (v / maxY) * (H - PAD.top - PAD.bottom);

  const coords = points.map((p) => ({ cx: x(new Date(p.at).getTime()), cy: y(p.value), p }));
  const path = coords.map((c, i) => `${i ? "L" : "M"}${c.cx.toFixed(1)},${c.cy.toFixed(1)}`).join(" ");
  const todayX = x(fromISODate(today).getTime());

  // Month ticks along the bottom.
  const months: { x: number; label: string }[] = [];
  const m = fromISODate(semester.startsOn);
  m.setDate(1);
  m.setMonth(m.getMonth() + 1);
  while (m.getTime() < t1) {
    months.push({ x: x(m.getTime()), label: m.toLocaleDateString("en-GB", { month: "short" }) });
    m.setMonth(m.getMonth() + 1);
  }

  const targetLabel = goal.target.kind === "description" ? "Done" : `Target ${isGpa ? formatTarget(target) : num(target)}`;

  const summary =
    points.length === 0
      ? `${goal.title}: no check-ins yet.`
      : `${goal.title}: ${points.length} check-ins, from ${valueText(goal.target, points[0]!.value)} to ${valueText(goal.target, points[points.length - 1]!.value)}. ${targetLabel}.`;
  const tip = active !== null ? coords[active] : null;

  return (
    <div>
      <div className="relative max-w-md">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={summary}>
          {/* Recessive grid: baseline and target. */}
          <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} className="stroke-oxford-rule" strokeWidth={1} />
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(target)}
            y2={y(target)}
            className="stroke-oxford-gold"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <text x={PAD.left - 6} y={y(0) + 4} textAnchor="end" className="fill-oxford-mute text-[10px]">
            0
          </text>
          {isGpa ? (
            <>
              {/* The 0–4.0 scale on the left; the target named at the right end of its line. */}
              {[GPA_SCALE / 2, GPA_SCALE].map((v) => (
                <g key={v}>
                  <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} className="stroke-oxford-rule/60" strokeWidth={1} />
                  <text x={PAD.left - 6} y={y(v) + 4} textAnchor="end" className="fill-oxford-mute text-[10px]">
                    {v.toFixed(1)}
                  </text>
                </g>
              ))}
              <text x={W - PAD.right} y={y(target) + (y(target) - y(GPA_SCALE) < 14 ? 12 : -4)} textAnchor="end" className="fill-oxford-ink2 text-[10px] font-semibold">
                Target {formatTarget(target)}
              </text>
            </>
          ) : (
            <text x={PAD.left - 6} y={y(target) + 4} textAnchor="end" className="fill-oxford-mute text-[10px]">
              {goal.target.kind === "description" ? "100%" : num(target)}
            </text>
          )}
          {months.map((mo) => (
            <g key={mo.label + mo.x}>
              <line x1={mo.x} x2={mo.x} y1={y(0)} y2={y(0) + 4} className="stroke-oxford-rule" />
              <text x={mo.x} y={H - 8} textAnchor="middle" className="fill-oxford-mute text-[10px]">
                {mo.label}
              </text>
            </g>
          ))}
          {todayX > PAD.left && todayX < W - PAD.right && (
            <g>
              <line x1={todayX} x2={todayX} y1={PAD.top} y2={y(0)} className="stroke-oxford-ink/20" strokeDasharray="2 3" />
              <text x={todayX} y={PAD.top - 4} textAnchor="middle" className="fill-oxford-mute text-[9px]">
                Today
              </text>
            </g>
          )}

          {coords.length > 1 && <path d={path} fill="none" className="stroke-oxford-ink" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
          {coords.map((c, i) => (
            <g
              key={c.p.id}
              tabIndex={0}
              role="button"
              aria-label={`${shortDay(toISODate(new Date(c.p.at)))}: ${valueText(goal.target, c.p.value)}${c.p.note ? `. ${c.p.note}` : ""}`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="cursor-default outline-none [&:focus-visible>circle.dot]:stroke-oxford-gold"
            >
              {/* Larger invisible hit target. */}
              <circle cx={c.cx} cy={c.cy} r={12} fill="transparent" />
              <circle cx={c.cx} cy={c.cy} r={4.5} className="dot fill-oxford-ink stroke-oxford-paper" strokeWidth={2} />
            </g>
          ))}
        </svg>

        {tip && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-oxford-ink px-2.5 py-1.5 text-xs text-white shadow"
            style={{ left: `${(tip.cx / W) * 100}%`, top: `calc(${(tip.cy / H) * 100}% - 10px)` }}
          >
            <span className="font-semibold">{valueText(goal.target, tip.p.value)}</span>
            <span className="text-white/75"> · {shortDay(toISODate(new Date(tip.p.at)))}</span>
          </div>
        )}
      </div>

      {points.length > 0 && (
        <details className="mt-2 text-sm">
          <summary className="inline-flex min-h-[40px] cursor-pointer items-center font-semibold text-oxford-ink underline underline-offset-4">
            Show as a table
          </summary>
          <table className="mt-2 w-full text-left">
            <caption className="sr-only">{goal.title} check-ins</caption>
            <thead>
              <tr className="text-xs text-oxford-mute">
                <th scope="col" className="py-1 font-semibold">Date</th>
                <th scope="col" className="py-1 font-semibold">Progress</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.id} className="border-t border-oxford-rule/60">
                  <td className="py-1.5 text-oxford-ink2">{shortDay(toISODate(new Date(p.at)))}</td>
                  <td className="py-1.5 font-semibold text-oxford-ink">{valueText(goal.target, p.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
};
