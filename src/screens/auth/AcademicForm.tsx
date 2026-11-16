import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { services, type AcademicCatalog } from "@/services";
import { useSession } from "@/session/SessionProvider";
import { Combobox } from "@/ui/form/Combobox";
import { FormAlert, alertActionClass } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { AuthHeading } from "./parts";

interface Errors {
  department?: string;
  programme?: string;
  level?: string;
}

/** Flow 01 "Academic profile": department, programme and level, with searchable dropdowns. */
export const AcademicForm = ({ onSaved }: { onSaved: () => void }) => {
  const { account, setAccount } = useSession();
  const [catalog, setCatalog] = useState<AcademicCatalog | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [departmentId, setDepartmentId] = useState(account?.academic?.departmentId ?? null);
  const [programmeId, setProgrammeId] = useState(account?.academic?.programmeId ?? null);
  const [level, setLevel] = useState(account?.academic?.level ?? null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const studyLevel = account?.studyLevel ?? "undergraduate";

  const load = () => {
    setLoadFailed(false);
    services.catalog.forStudyLevel(studyLevel).then(setCatalog, () => setLoadFailed(true));
  };

  useEffect(load, [studyLevel]);

  const programmeOptions = useMemo(
    () =>
      (catalog?.programmes ?? [])
        .filter((p) => p.departmentId === departmentId)
        .map((p) => ({ value: p.id, label: p.name })),
    [catalog, departmentId],
  );

  if (!account) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {
      department: departmentId ? undefined : "Choose your department.",
      programme: programmeId ? undefined : "Choose your programme.",
      level: level ? undefined : `Choose your ${studyLevel === "undergraduate" ? "level" : "year"}.`,
    };
    setErrors(next);
    const firstInvalid = (["department", "programme", "level"] as const).find((k) => next[k]);
    if (firstInvalid) {
      document.getElementById(`academic-${firstInvalid}`)?.focus();
      return;
    }

    setSaving(true);
    setSaveFailed(false);
    try {
      const updated = await services.accounts.update(account.id, {
        academic: { departmentId: departmentId!, programmeId: programmeId!, level: level! },
      });
      setAccount(updated);
      onSaved();
    } catch {
      setSaveFailed(true);
      setSaving(false);
    }
  };

  const heading = (
    <AuthHeading title="Your academic profile">
      This helps set up your courses and timetable in the next step.
    </AuthHeading>
  );

  if (loadFailed) {
    return (
      <>
        {heading}
        <FormAlert
          tone="error"
          title="We couldn't load programmes"
          actions={
            <button type="button" onClick={load} className={alertActionClass}>
              Try again
            </button>
          }
        >
          Check your connection and try again.
        </FormAlert>
      </>
    );
  }

  if (!catalog) {
    return (
      <>
        {heading}
        <div role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-oxford-mute">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Loading programmes…
        </div>
      </>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {heading}
      {saveFailed && (
        <FormAlert tone="error" title="Your profile wasn't saved" className="mb-5">
          Check your connection, then select Save and continue again.
        </FormAlert>
      )}
      <div className="space-y-5">
        <Combobox
          id="academic-department"
          label="Department"
          placeholder="Search departments"
          options={catalog.departments.map((d) => ({ value: d.id, label: d.name }))}
          value={departmentId}
          onChange={(id) => {
            setDepartmentId(id);
            if (!catalog.programmes.some((p) => p.id === programmeId && p.departmentId === id)) {
              setProgrammeId(null);
            }
            setErrors((er) => ({ ...er, department: undefined }));
          }}
          error={errors.department}
        />
        <Combobox
          id="academic-programme"
          label="Programme"
          placeholder={departmentId ? "Search programmes" : "Choose a department first"}
          options={programmeOptions}
          value={programmeId}
          onChange={(id) => {
            setProgrammeId(id);
            setErrors((er) => ({ ...er, programme: undefined }));
          }}
          disabled={!departmentId}
          error={errors.programme}
        />
        <Combobox
          id="academic-level"
          label={studyLevel === "undergraduate" ? "Level" : "Year of study"}
          placeholder={studyLevel === "undergraduate" ? "Choose your level" : "Choose your year"}
          options={catalog.levels.map((l) => ({ value: l, label: l }))}
          value={level}
          onChange={(l) => {
            setLevel(l);
            setErrors((er) => ({ ...er, level: undefined }));
          }}
          error={errors.level}
        />
      </div>
      <LoadingButton loading={saving} loadingLabel="Saving…" className="mt-7">
        Save and continue
      </LoadingButton>
    </form>
  );
};
