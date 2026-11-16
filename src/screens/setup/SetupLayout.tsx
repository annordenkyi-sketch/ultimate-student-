import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  services,
  type Semester,
  type SetupProgress,
  type SetupStep,
} from "@/services";
import { useSession } from "@/session/SessionProvider";
import { FormAlert, alertActionClass } from "@/ui/form/FormAlert";
import { StepProgress } from "@/ui/StepProgress";
import { AuthFrame } from "../auth/AuthFrame";
import { endRerun, isRerunning } from "./rerun";
import { placedSessions } from "./timetable";

/** Grouped stages shown in the progress bar; each covers one or more screens. */
const STAGES: { label: string; steps: SetupStep[] }[] = [
  { label: "Semester", steps: ["semester"] },
  { label: "Courses", steps: ["method", "sync-access", "sync-connect", "sync-review", "manual"] },
  { label: "Timetable", steps: ["timetable"] },
  { label: "Review", steps: ["review"] },
  { label: "Reminders", steps: ["reminders"] },
  { label: "Goal", steps: ["goals"] },
];
const STAGE_LABELS = STAGES.map((s) => s.label);
const ALL_STEPS = STAGES.flatMap((s) => s.steps);

const WIDE: SetupStep[] = ["review"];
const MEDIUM: SetupStep[] = ["sync-review", "manual", "timetable"];

const newProgress = (semesters: Semester[]): SetupProgress => ({
  step: "semester",
  semesterId: semesters.find((s) => s.current)?.id ?? null,
  method: null,
  imported: [],
  excludedCodes: [],
  courses: [],
  acknowledgedClashes: [],
  reminders: null,
  goal: null,
});

export interface DoneSummary {
  semester: string;
  courses: number;
  sessions: number;
  reminders: string;
  goal: string | null;
}

interface SetupCtx {
  progress: SetupProgress;
  update: (patch: Partial<SetupProgress>) => void;
  semesters: Semester[];
  semester: Semester | null;
  /** Saves everything and opens the success screen. */
  finish: (goal: string | null) => Promise<void>;
  /** "Skip for now": straight to Home with a "Set up your courses" prompt. */
  skip: () => Promise<void>;
}

const Ctx = createContext<SetupCtx | null>(null);

export const useSetup = (): SetupCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSetup must be used inside SetupLayout");
  return ctx;
};

export const semesterLabel = (s: Semester | null) => (s ? `${s.term}, ${s.academicYear}` : "");

export const SetupLayout = () => {
  const { account, access, setAccount } = useSession();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<SetupProgress | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const accountId = account?.id;

  const load = useCallback(() => {
    if (!accountId) return;
    setLoadFailed(false);
    Promise.all([services.courses.semesters(), services.setup.load(accountId)]).then(
      ([list, saved]) => {
        setSemesters(list);
        setProgress(saved ?? newProgress(list));
      },
      () => setLoadFailed(true),
    );
  }, [accountId]);

  useEffect(load, [load]);

  const currentStep = ALL_STEPS.find((s) => pathname === `/onboarding/${s}`) ?? null;

  // Remember the screen the student is on, so leaving and returning resumes here.
  const loaded = progress !== null;
  useEffect(() => {
    if (currentStep) setProgress((p) => (p && p.step !== currentStep ? { ...p, step: currentStep } : p));
  }, [currentStep, loaded]);

  useEffect(() => {
    if (progress && accountId) void services.setup.save(accountId, progress);
  }, [progress, accountId]);

  const update = useCallback((patch: Partial<SetupProgress>) => {
    setProgress((p) => (p ? { ...p, ...patch } : p));
  }, []);

  const semester = semesters.find((s) => s.id === progress?.semesterId) ?? null;

  const finish = useCallback(
    async (goal: string | null) => {
      if (!accountId || !progress?.semesterId) return;
      const reminders = progress.reminders;
      const updated = await services.setup.finish(accountId, {
        semesterId: progress.semesterId,
        courses: progress.courses,
        reminders,
        goal,
        method: progress.method,
        imported: progress.method === "sync" ? progress.imported.filter((c) => !progress.excludedCodes.includes(c.code)) : [],
      });
      const summary: DoneSummary = {
        semester: semesterLabel(semester),
        courses: progress.courses.length,
        sessions: placedSessions(progress.courses).length,
        reminders: reminders?.enabled ? `${reminders.minutesBefore} minutes before each lecture` : "Off",
        goal,
      };
      endRerun();
      navigate("/onboarding/done", { replace: true, state: summary });
      setAccount(updated);
    },
    [accountId, progress, semester, navigate, setAccount],
  );

  const skip = useCallback(async () => {
    if (!accountId) return;
    const updated = await services.setup.finish(accountId, null);
    navigate("/home", { replace: true });
    setAccount(updated);
  }, [accountId, navigate, setAccount]);

  const value = useMemo<SetupCtx | null>(
    () => (progress ? { progress, update, semesters, semester, finish, skip } : null),
    [progress, update, semesters, semester, finish, skip],
  );

  if (!account) return <Navigate to="/start" replace />;
  if (access === "unverified" || access === "pending") return <Navigate to="/limited" replace />;
  if (!account.academic) return <Navigate to="/academic-profile" replace />;
  if (account.setupComplete && account.coursesSetUp && !isRerunning(account.id)) return <Navigate to="/home" replace />;

  if (loadFailed) {
    return (
      <AuthFrame>
        <FormAlert
          tone="error"
          title="We couldn't load your setup"
          actions={
            <button type="button" onClick={load} className={alertActionClass}>
              Try again
            </button>
          }
        >
          Check your connection and try again.
        </FormAlert>
      </AuthFrame>
    );
  }

  if (!value) {
    return (
      <AuthFrame>
        <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-oxford-mute">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Loading your setup…
        </div>
      </AuthFrame>
    );
  }

  // /onboarding on its own resumes at the saved step.
  if (!currentStep) return <Navigate to={`/onboarding/${value.progress.step}`} replace />;

  const stage = STAGES.findIndex((s) => s.steps.includes(currentStep));
  const size = WIDE.includes(currentStep) ? "xl" : MEDIUM.includes(currentStep) ? "lg" : "md";

  return (
    <Ctx.Provider value={value}>
      <AuthFrame
        size={size}
        progress={<StepProgress label="Semester setup progress" steps={STAGE_LABELS} current={stage} />}
      >
        <Outlet />
      </AuthFrame>
    </Ctx.Provider>
  );
};
