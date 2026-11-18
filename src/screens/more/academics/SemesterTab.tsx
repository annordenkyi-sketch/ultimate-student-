import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { services, type AlertPermission, type ReminderLead, type ReminderPrefs, type Weekday } from "@/services";
import { PermissionNote, useNotificationPermission } from "@/session/NotificationPermission";
import { useAsync } from "@/lib/useAsync";
import { btn } from "@/ui/button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { inputClass } from "@/ui/form/TextField";
import { startRerun } from "../../setup/rerun";
import { DAYS, placedSessions } from "../../setup/timetable";
import type { AcademicsData } from "./AcademicsSection";

const LEADS: ReminderLead[] = [10, 15, 30, 60];
const semesterName = (s: { term: string; academicYear: string }) => `${s.term}, ${s.academicYear}`;

const chip = (on: boolean) =>
  `flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-semibold transition focus-within:ring-2 focus-within:ring-oxford-ink focus-within:ring-offset-2 ${
    on ? "border-oxford-ink bg-oxford-ink text-white" : "border-oxford-ink/20 bg-white text-oxford-ink hover:border-oxford-ink/40"
  }`;

/** Starts course setup again (sync or manual). The current courses stay until the new setup is saved. */
export const RerunSetupButton = ({ data, label = "Re-run course setup" }: { data: AcademicsData; label?: string }) => {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const semesterId = data.timetable?.semesterId ?? data.semesters.find((s) => s.current)?.id ?? "";
  return (
    <>
      <button type="button" onClick={() => setConfirm(true)} disabled={busy} className={btn("primary")}>
        {busy ? "Opening setup…" : label}
      </button>
      <ConfirmDialog
        open={confirm}
        title="Set up your courses again?"
        body="You'll choose how to add your courses: sync from the student portal or add them yourself. Your current courses stay until you save the new setup."
        confirmLabel="Continue"
        onConfirm={async () => {
          setConfirm(false);
          setBusy(true);
          const prefs = await services.timetable.reminderPrefs(data.accountId);
          await startRerun(data.accountId, semesterId, prefs);
          navigate("/onboarding/method");
        }}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
};

/** Semester settings: switch semester, re-run setup, lecture reminder preferences. */
export const SemesterTab = ({ data }: { data: AcademicsData }) => {
  const currentId = data.timetable?.semesterId ?? data.semesters.find((s) => s.current)?.id ?? "";
  const current = data.semesters.find((s) => s.id === currentId);
  const [target, setTarget] = useState(currentId);
  const [confirmSwitch, setConfirmSwitch] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const targetSemester = data.semesters.find((s) => s.id === target);

  return (
    <div className="space-y-5">
      {notice && <FormAlert tone="success" title={notice} />}

      <section aria-labelledby="semester-title" className="rounded-2xl border border-oxford-rule bg-white/80 p-5">
        <h2 id="semester-title" className="font-sans text-base font-semibold text-oxford-ink">
          Semester
        </h2>
        <p className="mt-1 text-sm text-oxford-mute">Showing: {current ? semesterName(current) : "Not set"}</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[14rem] flex-1">
            <label htmlFor="semester-select" className="block text-sm font-semibold text-oxford-ink">
              Switch to
            </label>
            <select id="semester-select" value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass(false, "mt-1.5")}>
              {data.semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {semesterName(s)}
                  {s.current ? " (current)" : ""}
                </option>
              ))}
            </select>
          </div>
          <button type="button" disabled={target === currentId || switching} onClick={() => setConfirmSwitch(true)} className={btn("secondary")}>
            {switching ? "Switching…" : "Switch semester"}
          </button>
        </div>
      </section>

      <section aria-labelledby="rerun-title" className="rounded-2xl border border-oxford-rule bg-white/80 p-5">
        <h2 id="rerun-title" className="font-sans text-base font-semibold text-oxford-ink">
          Course setup
        </h2>
        <p className="mt-1 text-sm text-oxford-mute">Go through course setup again, for example after changing your registration.</p>
        <div className="mt-4">
          <RerunSetupButton data={data} />
        </div>
      </section>

      <ReminderPrefsForm data={data} />

      <ConfirmDialog
        open={confirmSwitch}
        title={`Switch to ${targetSemester ? semesterName(targetSemester) : "this semester"}?`}
        body="Your courses for each semester are kept, so you can switch back at any time."
        confirmLabel="Switch"
        onConfirm={async () => {
          setConfirmSwitch(false);
          setSwitching(true);
          await services.timetable.switchSemester(data.accountId, target);
          setSwitching(false);
          setNotice(`Now showing ${targetSemester ? semesterName(targetSemester) : "the new semester"}.`);
          data.reload();
        }}
        onCancel={() => setConfirmSwitch(false)}
      />
    </div>
  );
};

const ReminderPrefsForm = ({ data }: { data: AcademicsData }) => {
  const { state, reload } = useAsync(() => services.timetable.reminderPrefs(data.accountId), [data.accountId]);
  const courses = data.timetable?.courses ?? [];
  const sessions = placedSessions(courses);
  const classDays = DAYS.filter((d) => sessions.some((s) => s.day === d.id));
  const [prefs, setPrefs] = useState<ReminderPrefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const { ensure } = useNotificationPermission();
  const [permission, setPermission] = useState<AlertPermission | null>(null);

  useEffect(() => {
    if (state.status !== "ready") return;
    setPrefs(
      state.data ?? {
        enabled: false,
        minutesBefore: 15,
        days: classDays.map((d) => d.id),
        courseCodes: courses.map((c) => c.code),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (state.status === "loading" || (state.status === "ready" && !prefs)) return <Skeleton lines={3} />;
  if (state.status === "error") return <LoadError what="your reminder settings" onRetry={reload} />;
  if (!prefs) return null;

  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  const set = (p: Partial<ReminderPrefs>) => {
    setPrefs({ ...prefs, ...p });
    setNotice(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      await services.timetable.setReminderPrefs(data.accountId, prefs);
      setNotice({ tone: "success", text: prefs.enabled ? "Lecture reminders saved." : "Lecture reminders are off." });
    } catch {
      setNotice({ tone: "error", text: "Your reminder settings didn't save. Try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="reminders-title" className="rounded-2xl border border-oxford-rule bg-white/80 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id="reminders-title" className="font-sans text-base font-semibold text-oxford-ink">
            Lecture reminders
          </h2>
          <p className="text-sm text-oxford-mute">{prefs.enabled ? "On" : "Off"}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={prefs.enabled}
          aria-labelledby="reminders-title"
          onClick={async () => {
            const on = !prefs.enabled;
            set({ enabled: on });
            if (on) setPermission(await ensure("lectures"));
          }}
          className={`relative h-8 w-14 shrink-0 rounded-full transition ${prefs.enabled ? "bg-oxford-ink" : "bg-oxford-ink/20"}`}
        >
          <span aria-hidden="true" className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${prefs.enabled ? "left-7" : "left-1"}`} />
        </button>
      </div>

      {prefs.enabled && permission && <PermissionNote permission={permission} className="mt-4" />}
      {prefs.enabled && (
        <div className="mt-5 space-y-5">
          <fieldset>
            <legend className="text-sm font-semibold text-oxford-ink">Remind me</legend>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {LEADS.map((m) => (
                <label key={m} className={chip(prefs.minutesBefore === m)}>
                  <input type="radio" name="lead" className="sr-only" checked={prefs.minutesBefore === m} onChange={() => set({ minutesBefore: m })} />
                  {m === 60 ? "1 hour" : `${m} min`}
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-oxford-mute">before each lecture</p>
          </fieldset>

          {classDays.length > 0 && (
            <fieldset>
              <legend className="text-sm font-semibold text-oxford-ink">On these days</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {classDays.map((d) => (
                  <label key={d.id} className={chip(prefs.days.includes(d.id as Weekday))}>
                    <input type="checkbox" className="sr-only" checked={prefs.days.includes(d.id)} onChange={() => set({ days: toggle(prefs.days, d.id) })} />
                    {d.short}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {courses.length > 0 && (
            <fieldset>
              <legend className="text-sm font-semibold text-oxford-ink">For these courses</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {courses.map((c) => (
                  <label key={c.code} className={chip(prefs.courseCodes.includes(c.code))}>
                    <input type="checkbox" className="sr-only" checked={prefs.courseCodes.includes(c.code)} onChange={() => set({ courseCodes: toggle(prefs.courseCodes, c.code) })} />
                    {c.code}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      )}

      {notice && <FormAlert tone={notice.tone} title={notice.text} className="mt-4" />}
      <LoadingButton type="button" onClick={save} loading={saving} loadingLabel="Saving…" className="mt-5 sm:w-auto">
        Save reminder settings
      </LoadingButton>
    </section>
  );
};
