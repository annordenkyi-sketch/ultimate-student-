import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Check, Landmark, Loader2 } from "lucide-react";
import { errorCodeOf, services } from "@/services";
import { useSession } from "@/session/SessionProvider";
import { btn } from "@/ui/button";
import { Checkbox } from "@/ui/form/Checkbox";
import { FormAlert, alertActionClass } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { PasswordField } from "@/ui/form/PasswordField";
import { TextField } from "@/ui/form/TextField";
import { AuthHeading, BackLink } from "../auth/parts";
import { semesterLabel, useSetup } from "./SetupLayout";

type Phase = "form" | "connecting" | "importing" | "failed";

interface Errors {
  studentId?: string;
  password?: string;
  consent?: string;
}

/** Flow 02 "Institution authorisation" with progress, failure and retry. */
export const SyncConnectStep = () => {
  const { account } = useSession();
  const { progress, update, semester } = useSetup();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("form");
  const [studentId, setStudentId] = useState(account?.studentId ?? "");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [authFailed, setAuthFailed] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {
      studentId: studentId.trim() ? undefined : "Enter your student ID.",
      password: password ? undefined : "Enter your portal password.",
      consent: consent ? undefined : "Allow access to import your courses.",
    };
    setErrors(next);
    if (next.studentId || next.password || next.consent) return;

    setAuthFailed(false);
    setPhase("connecting");
    let token: string;
    try {
      ({ token } = await services.portal.authorize(studentId, password));
    } catch (err) {
      if (errorCodeOf(err) === "portal-auth-failed") {
        setAuthFailed(true);
        setPassword("");
        setPhase("form");
        window.setTimeout(() => passwordRef.current?.focus(), 0);
      } else {
        setPhase("failed");
      }
      return;
    }

    setPhase("importing");
    try {
      const imported = await services.portal.importRegistration(token, progress.semesterId ?? "");
      update({ method: "sync", imported, excludedCodes: [] });
      navigate("/onboarding/sync-review");
    } catch {
      setPhase("failed");
    }
  };

  if (phase === "connecting" || phase === "importing") {
    const steps = [
      { label: "Connecting to the university portal", done: phase === "importing" },
      { label: "Importing your courses", done: false },
    ];
    const active = phase === "connecting" ? 0 : 1;
    return (
      <div className="py-6">
        <AuthHeading title="Syncing your courses" takeFocus={false} />
        <p role="status" aria-live="polite" className="sr-only">
          {steps[active]!.label}…
        </p>
        <ol className="space-y-4" aria-hidden="true">
          {steps.map((s, i) => (
            <li key={s.label} className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  s.done ? "bg-oxford-success text-white" : i === active ? "bg-oxford-sandSoft text-oxford-ink" : "bg-oxford-ink/5 text-oxford-mute"
                }`}
              >
                {s.done ? (
                  <Check className="h-4 w-4" />
                ) : i === active ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-xs font-semibold">{i + 1}</span>
                )}
              </span>
              <span className={`text-sm ${i === active ? "font-semibold text-oxford-ink" : "text-oxford-mute"}`}>
                {s.label}
                {i === active && "…"}
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-oxford-danger/10 text-oxford-danger">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="mt-4">
          <AuthHeading title="We couldn't import your courses">
            The university portal didn't respond, so nothing was imported. You can try again, or add
            your courses yourself.
          </AuthHeading>
        </div>
        <div className="flex flex-col gap-3">
          <button type="button" onClick={() => setPhase("form")} className={btn("primary", "w-full")}>
            Try again
          </button>
          <button
            type="button"
            onClick={() => {
              update({ method: "manual" });
              navigate("/onboarding/manual");
            }}
            className={btn("secondary", "w-full")}
          >
            Add courses manually instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <BackLink to="/onboarding/sync-access" />
      <AuthHeading title="Sign in to the university portal">
        To import {semesterLabel(semester)}.
      </AuthHeading>

      <p className="mb-4 rounded-lg border border-dashed border-oxford-ink/30 px-3 py-2 text-xs font-medium text-oxford-mute">
        Test portal sign-in. In the live app this step opens the university's own sign-in page.
      </p>

      {authFailed && (
        <FormAlert
          tone="error"
          title="Those portal details don't match"
          className="mb-5"
          actions={
            <button type="button" onClick={() => passwordRef.current?.focus()} className={alertActionClass}>
              Try again
            </button>
          }
        >
          Check your student ID and portal password.
        </FormAlert>
      )}

      <div className="rounded-xl border border-oxford-rule bg-white p-4 sm:p-5">
        <p className="flex items-center gap-2 font-sans text-sm font-semibold text-oxford-ink">
          <Landmark className="h-4 w-4" aria-hidden="true" />
          UG Student Portal
        </p>
        <div className="mt-4 space-y-4">
          <TextField
            id="portal-student-id"
            label="Student ID"
            inputMode="numeric"
            autoComplete="username"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            error={errors.studentId}
          />
          <PasswordField
            ref={passwordRef}
            id="portal-password"
            label="Portal password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Checkbox id="portal-consent" checked={consent} onChange={setConsent} error={errors.consent}>
            Allow Ultimate Student to read my registered courses and timetable.
          </Checkbox>
        </div>
      </div>

      <LoadingButton className="mt-6">Allow and import</LoadingButton>
    </form>
  );
};
