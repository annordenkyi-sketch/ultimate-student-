import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Link2Off, RefreshCw } from "lucide-react";
import { services, type Course, type Semester, type Timetable } from "@/services";
import { relativeTime, useNow } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { useSession } from "@/session/SessionProvider";
import { useSync } from "@/session/SyncProvider";
import { btn } from "@/ui/button";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { PersonalSection, SectionHeader } from "../MoreLayout";
import { CoursesTab } from "./CoursesTab";
import { SemesterTab } from "./SemesterTab";
import { TimetableTab } from "./TimetableTab";

const TABS = [
  { id: "courses", label: "Courses" },
  { id: "timetable", label: "Timetable" },
  { id: "semester", label: "Semester" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export interface AcademicsData {
  accountId: string;
  timetable: Timetable | null;
  semesters: Semester[];
  /** Saves the student's own changes and updates the page. */
  saveCourses: (courses: Course[], acknowledged?: string[]) => Promise<void>;
  reload: () => void;
}

/** Flow 07 "Academic hub": registered courses, weekly timetable and semester settings. */
export const AcademicsSection = () => (
  <PersonalSection
    title="Academics"
    includes={["Your registered courses, synced or added by you", "Your weekly timetable, with your own times and venues", "Semester settings and lecture reminders"]}
  >
    <AcademicsContent />
  </PersonalSection>
);

/** Portal connection and anything waiting for review, at the top of Academics. */
const SyncStatus = () => {
  const { connection, pending, pendingCount } = useSync();
  const now = useNow();
  if (!connection) return <Skeleton lines={1} />;

  return (
    <div className="mb-5 space-y-3">
      {pending && pendingCount > 0 && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-oxford-gold/60 bg-oxford-gold/10 p-4">
          <p className="flex items-start gap-2 text-sm text-oxford-ink">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-oxford-ink2" aria-hidden="true" />
            <span>
              <strong className="font-semibold">Pending review:</strong> {pendingCount} {pendingCount === 1 ? "change" : "changes"} from the
              university timetable haven't been applied yet.
            </span>
          </p>
          <Link to="/more/academics/sync?review=pending" className={btn("primary")}>
            Review changes
          </Link>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-oxford-rule bg-white/80 p-4">
        <p className="flex items-start gap-2 text-sm text-oxford-ink">
          {connection.status === "connected" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-oxford-success" aria-hidden="true" />
          ) : (
            <Link2Off className="mt-0.5 h-4 w-4 shrink-0 text-oxford-mute" aria-hidden="true" />
          )}
          <span>
            <span className="block font-semibold">
              {connection.status === "connected"
                ? "Student portal connected"
                : connection.status === "expired"
                  ? "Student portal needs reconnecting"
                  : "Student portal not connected"}
            </span>
            <span className="block text-oxford-mute">
              {connection.lastSyncedAt ? `Last synced: ${relativeTime(connection.lastSyncedAt, now)}` : "Your courses were set up manually."}
            </span>
          </span>
        </p>
        {connection.status === "connected" ? (
          <Link to="/more/academics/sync" className={btn("secondary")}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Sync now
          </Link>
        ) : (
          <Link to="/more/self-service" className={btn("secondary")}>
            {connection.status === "expired" ? "Reconnect" : "Connect portal"}
          </Link>
        )}
      </div>
    </div>
  );
};

const AcademicsContent = () => {
  const { account } = useSession();
  const accountId = account!.id;
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get("tab"))?.id ?? "courses") as TabId;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { state, reload } = useAsync(
    () => Promise.all([services.timetable.get(accountId), services.courses.semesters()]),
    [accountId],
  );
  const [timetable, setTimetable] = useState<Timetable | null>(null);

  useEffect(() => {
    if (state.status === "ready") setTimetable(state.data[0]);
  }, [state]);

  const select = (id: TabId) => setParams(id === "courses" ? {} : { tab: id }, { replace: true });
  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + TABS.length) % TABS.length;
    select(TABS[next]!.id);
    tabRefs.current[next]?.focus();
  };

  const data: AcademicsData | null =
    state.status === "ready"
      ? {
          accountId,
          timetable,
          semesters: state.data[1],
          saveCourses: async (courses, acknowledged) => {
            setTimetable(await services.timetable.saveCourses(accountId, courses, acknowledged));
          },
          reload,
        }
      : null;

  return (
    <>
      <SectionHeader title="Academics" description="Your courses, weekly timetable and semester settings." />
      <SyncStatus />

      <div role="tablist" aria-label="Academics" className="mb-5 flex gap-1 rounded-xl bg-oxford-cream p-1 sm:inline-flex">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`acad-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="acad-panel"
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => select(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`min-h-[44px] flex-1 rounded-lg px-4 text-sm font-semibold transition sm:flex-none ${
              tab === t.id ? "bg-white text-oxford-ink shadow-sm" : "text-oxford-mute hover:text-oxford-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id="acad-panel" role="tabpanel" aria-labelledby={`acad-tab-${tab}`}>
        {state.status === "loading" && <Skeleton lines={5} />}
        {state.status === "error" && <LoadError what="your courses" onRetry={reload} />}
        {data && tab === "courses" && <CoursesTab data={data} />}
        {data && tab === "timetable" && <TimetableTab data={data} />}
        {data && tab === "semester" && <SemesterTab data={data} />}
      </div>
    </>
  );
};
