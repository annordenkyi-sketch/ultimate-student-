import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { StudyLevel } from "@/services";
import { useSession } from "@/session/SessionProvider";
import { StepProgress } from "@/ui/StepProgress";
import { AuthFrame } from "../AuthFrame";

export const SIGNUP_STEPS = [
  { path: "level", label: "Study level" },
  { path: "account", label: "Create account" },
  { path: "verify-email", label: "Email code" },
  { path: "eligibility", label: "Student status" },
  { path: "academic", label: "Academic profile" },
] as const;

/** Sign-up answers kept in memory so going Back never loses them. */
export interface SignupDraft {
  studyLevel: StudyLevel | null;
  name: string;
  email: string;
  password: string;
  confirm: string;
  terms: boolean;
  /** Email the latest code was sent to. */
  codeSentTo: string | null;
  resendAfterSeconds: number;
}

const EMPTY: SignupDraft = {
  studyLevel: null,
  name: "",
  email: "",
  password: "",
  confirm: "",
  terms: false,
  codeSentTo: null,
  resendAfterSeconds: 60,
};

interface SignupCtx {
  draft: SignupDraft;
  update: (patch: Partial<SignupDraft>) => void;
}

const Ctx = createContext<SignupCtx | null>(null);

export const useSignup = (): SignupCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSignup must be used inside SignupLayout");
  return ctx;
};

const STEP_LABELS = SIGNUP_STEPS.map((s) => s.label);

export const SignupLayout = () => {
  const [draft, setDraft] = useState<SignupDraft>(EMPTY);
  const { account } = useSession();
  const { pathname } = useLocation();

  const update = useCallback((patch: Partial<SignupDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);
  const value = useMemo(() => ({ draft, update }), [draft, update]);

  // Sign-up is finished once the student is verified and has an academic profile.
  if (account?.verification === "verified" && account.academic) {
    return <Navigate to="/" replace />;
  }

  const current = SIGNUP_STEPS.findIndex((s) => pathname.endsWith(`/signup/${s.path}`));

  return (
    <Ctx.Provider value={value}>
      <AuthFrame
        progress={
          current >= 0 ? (
            <StepProgress label="Sign-up progress" steps={STEP_LABELS} current={current} />
          ) : null
        }
      >
        <Outlet />
      </AuthFrame>
    </Ctx.Provider>
  );
};
