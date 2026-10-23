import { createContext, useContext, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap } from "lucide-react";
import type { LivingSituation, StudentType } from "@/data/types";

interface Draft {
  name: string;
  identifier: string;
  password: string;
  termsAccepted: boolean;
  studentType?: StudentType;
  isInternational: boolean;
  living?: LivingSituation;
  hostel?: string;
  interests: string[];
}

interface OnboardingCtx {
  draft: Draft;
  setDraft: (patch: Partial<Draft>) => void;
}

const Ctx = createContext<OnboardingCtx | null>(null);

export const useOnboardingDraft = () => {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useOnboardingDraft must be used inside OnboardingLayout");
  return ctx;
};

const PATH_INDEX: Record<string, number> = {
  "/onboarding/account": 0,
  "/onboarding/type": 1,
  "/onboarding/living": 2,
  "/onboarding/done": 3,
};

export const OnboardingLayout = () => {
  const [draft, setDraftState] = useState<Draft>({
    name: "",
    identifier: "",
    password: "",
    termsAccepted: false,
    isInternational: false,
    interests: [],
  });
  const location = useLocation();
  const navigate = useNavigate();

  const setDraft = (patch: Partial<Draft>) =>
    setDraftState((prev) => ({ ...prev, ...patch }));

  const value = useMemo(() => ({ draft, setDraft }), [draft]);
  const current = PATH_INDEX[location.pathname] ?? 0;

  const onBack = () => {
    if (current === 0) {
      navigate("/welcome");
    } else {
      navigate(-1);
    }
  };

  return (
    <Ctx.Provider value={value}>
      <div className="flex min-h-screen flex-col bg-white">
        {/* Shared header */}
        <header className="sticky top-0 z-30 grid grid-cols-3 items-center border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="justify-self-start inline-flex items-center gap-1 rounded-md p-1 text-sm font-medium text-slate-700 transition hover:text-slate-900 motion-safe:active:scale-[0.97]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>

          <Link
            to="/welcome"
            className="justify-self-center inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-900 ring-1 ring-amber-200"
          >
            <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
            Ultimate Student
          </Link>

          <span aria-hidden="true" className="justify-self-end" />
        </header>

        {/* Step content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </Ctx.Provider>
  );
};
