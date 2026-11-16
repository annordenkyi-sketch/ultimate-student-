import { useRef, type KeyboardEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Target } from "lucide-react";
import { services, type GoalStatus } from "@/services";
import { useNow } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { btn } from "@/ui/button";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { DetailHeader } from "../details/DetailHeader";
import { GoalCard } from "./GoalCard";
import { useAccountId } from "./useAccountId";

const TABS: { id: GoalStatus; label: string; empty: string }[] = [
  { id: "active", label: "Active", empty: "No active goals." },
  { id: "completed", label: "Completed", empty: "Goals you complete will appear here." },
  { id: "archived", label: "Archived", empty: "Nothing archived. Goals you archive are kept here." },
];

/** Flow 06 "My goals": goal cards by status, and New goal. */
export const GoalsScreen = () => {
  const accountId = useAccountId();
  const now = useNow();
  const [params, setParams] = useSearchParams();
  const status = (TABS.find((t) => t.id === params.get("status"))?.id ?? "active") as GoalStatus;
  const { state, reload } = useAsync(() => services.goals.list(accountId), [accountId]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (s: GoalStatus) => setParams(s === "active" ? {} : { status: s }, { replace: true });

  // Arrow keys move between tabs.
  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + TABS.length) % TABS.length;
    select(TABS[next]!.id);
    tabRefs.current[next]?.focus();
  };

  const goals = state.status === "ready" ? state.data : [];
  const shown = goals.filter((g) => g.status === status);
  const tab = TABS.find((t) => t.id === status)!;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <DetailHeader back={{ to: "/for-you", label: "For You" }} title="My goals" />
        <Link to="/for-you/goals/new" className={btn("primary", "mb-6")}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New goal
        </Link>
      </div>

      <div role="tablist" aria-label="Goals by status" className="mb-5 flex gap-1 rounded-xl bg-oxford-cream p-1 sm:inline-flex">
        {TABS.map((t, i) => {
          const count = goals.filter((g) => g.status === t.id).length;
          const selected = t.id === status;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls="goals-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => select(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`min-h-[44px] flex-1 rounded-lg px-4 text-sm font-semibold transition sm:flex-none ${
                selected ? "bg-white text-oxford-ink shadow-sm" : "text-oxford-mute hover:text-oxford-ink"
              }`}
            >
              {t.label}
              {state.status === "ready" && <span className="ml-1.5 text-oxford-mute">{count}</span>}
            </button>
          );
        })}
      </div>

      <div id="goals-panel" role="tabpanel" aria-labelledby={`tab-${status}`}>
        {state.status === "loading" && <Skeleton lines={3} />}
        {state.status === "error" && <LoadError what="your goals" onRetry={reload} />}
        {state.status === "ready" &&
          (shown.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-oxford-rule px-5 py-10 text-center">
              <Target className="mx-auto h-8 w-8 text-oxford-mute" aria-hidden="true" />
              <p className="mt-3 font-semibold text-oxford-ink">{tab.empty}</p>
              {status === "active" && (
                <Link to="/for-you/goals/new" className={btn("primary", "mt-5")}>
                  Set a goal
                </Link>
              )}
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {shown.map((g) => (
                <li key={g.id} className="min-w-0">
                  <GoalCard goal={g} now={now} />
                </li>
              ))}
            </ul>
          ))}
      </div>
    </>
  );
};
