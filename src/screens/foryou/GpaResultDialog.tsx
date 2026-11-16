import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ASSESSMENTS, GRADE_POINTS, type AssessmentId, type LetterGrade } from "@/config/grading";
import type { Course, CourseResult, CourseResultInput } from "@/services";
import { formatGpa, gradeForScore, summariseGpa } from "@/lib/gpa";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { TextField, inputClass } from "@/ui/form/TextField";
import { Modal } from "@/ui/Modal";

const radioCard = (on: boolean) =>
  `flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl border bg-white px-3 text-sm font-semibold transition ${
    on ? "border-oxford-ink ring-1 ring-oxford-ink" : "border-oxford-ink/20 hover:border-oxford-ink/40"
  }`;

/** Flow 06 "Record progress" for a GPA goal: one result for one registered course. */
export const GpaResultDialog = ({
  open,
  courses,
  results,
  onClose,
  onSave,
}: {
  open: boolean;
  courses: Course[];
  results: CourseResult[];
  onClose: () => void;
  onSave: (input: CourseResultInput, note: string | null) => Promise<void>;
}) => {
  const [courseCode, setCourseCode] = useState("");
  const [assessment, setAssessment] = useState<AssessmentId>("assignment");
  const [mode, setMode] = useState<"score" | "grade">("score");
  const [score, setScore] = useState("");
  const [grade, setGrade] = useState<LetterGrade>("B");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ course?: string; score?: string }>({});
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCourseCode("");
    setAssessment("assignment");
    setMode("score");
    setScore("");
    setGrade("B");
    setNote("");
    setErrors({});
    setFailed(false);
  }, [open]);

  const scoreValue = Number(score);
  const scoreValid = score.trim() !== "" && Number.isFinite(scoreValue) && scoreValue >= 0 && scoreValue <= 100;
  const input: CourseResultInput | null =
    courseCode && (mode === "grade" || scoreValid)
      ? { courseCode, assessment, score: mode === "score" ? scoreValue : null, grade: mode === "grade" ? grade : null }
      : null;

  // What the estimate would become, using the same rules as saving.
  const preview = useMemo(() => {
    const before = summariseGpa(courses, results).gpa;
    if (!input) return { before, after: null as number | null };
    const kept = input.assessment === "assignment" ? results : results.filter((r) => !(r.courseCode === input.courseCode && r.assessment === input.assessment));
    const after = summariseGpa(courses, [...kept, { ...input, id: "preview", recordedAt: new Date().toISOString() }]).gpa;
    return { before, after };
  }, [courses, results, input]);

  const replaces = Boolean(
    courseCode && assessment !== "assignment" && results.some((r) => r.courseCode === courseCode && r.assessment === assessment),
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (!courseCode) found.course = "Choose a course.";
    if (mode === "score" && !scoreValid) found.score = "Enter a score from 0 to 100.";
    if (Object.keys(found).length || !input) {
      setErrors(found);
      document.getElementById(found.course ? "result-course" : "result-score")?.focus();
      return;
    }
    setSaving(true);
    setFailed(false);
    try {
      await onSave(input, note.trim() || null);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Record a result" description="Add a score or grade for one of your courses. Your estimated GPA updates straight away.">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="result-course" className="block text-sm font-semibold text-oxford-ink">
            Course
          </label>
          <select
            id="result-course"
            value={courseCode}
            onChange={(e) => {
              setCourseCode(e.target.value);
              setErrors({ ...errors, course: undefined });
            }}
            aria-invalid={errors.course ? true : undefined}
            aria-describedby={errors.course ? "result-course-error" : undefined}
            className={inputClass(Boolean(errors.course), "mt-1.5")}
          >
            <option value="">Choose a course</option>
            {courses.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.title} ({c.credits} credits)
              </option>
            ))}
          </select>
          {errors.course && (
            <p id="result-course-error" className="mt-1.5 text-sm font-semibold text-oxford-danger">
              {errors.course}
            </p>
          )}
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-oxford-ink">Result for</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {ASSESSMENTS.map((a) => (
              <label key={a.id} className={radioCard(assessment === a.id)}>
                <input type="radio" name="assessment" checked={assessment === a.id} onChange={() => setAssessment(a.id)} className="h-4 w-4 accent-[rgb(var(--us-ink))]" />
                {a.label}
              </label>
            ))}
          </div>
          {replaces && <p className="mt-1.5 text-xs text-oxford-mute">This replaces the {assessment === "midsem" ? "mid-semester" : "final"} result you recorded earlier for {courseCode}.</p>}
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-oxford-ink">Enter as</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(
              [
                ["score", "Score (%)"],
                ["grade", "Letter grade"],
              ] as const
            ).map(([m, label]) => (
              <label key={m} className={radioCard(mode === m)}>
                <input type="radio" name="result-mode" checked={mode === m} onChange={() => setMode(m)} className="h-4 w-4 accent-[rgb(var(--us-ink))]" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {mode === "score" ? (
          <TextField
            id="result-score"
            label="Score (%)"
            inputMode="decimal"
            value={score}
            onChange={(e) => {
              setScore(e.target.value);
              setErrors({ ...errors, score: undefined });
            }}
            error={errors.score}
            wrapperClassName="max-w-[12rem]"
            hint={scoreValid ? `That's a grade ${gradeForScore(scoreValue)}.` : undefined}
          />
        ) : (
          <div className="max-w-[12rem]">
            <label htmlFor="result-grade" className="block text-sm font-semibold text-oxford-ink">
              Grade
            </label>
            <select id="result-grade" value={grade} onChange={(e) => setGrade(e.target.value as LetterGrade)} className={inputClass(false, "mt-1.5")}>
              {GRADE_POINTS.map((g) => (
                <option key={g.grade} value={g.grade}>
                  {g.grade} ({g.points.toFixed(1)} points)
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="result-note" className="block text-sm font-semibold text-oxford-ink">
            Note <span className="font-normal text-oxford-mute">(optional)</span>
          </label>
          <input id="result-note" value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} className={inputClass(false, "mt-1.5")} />
        </div>

        <p role="status" className="rounded-xl bg-oxford-cream/70 px-3 py-2.5 text-sm text-oxford-ink">
          {preview.after === null
            ? preview.before === null
              ? "Your estimated GPA will appear once you record a result."
              : `Estimated GPA now: ${formatGpa(preview.before)}`
            : preview.before === null
              ? `Your estimated GPA would be ${formatGpa(preview.after)}.`
              : `Your estimated GPA would go from ${formatGpa(preview.before)} to ${formatGpa(preview.after)}.`}
        </p>

        {failed && (
          <FormAlert tone="error" title="We couldn't save the result">
            Check your connection and try again.
          </FormAlert>
        )}
        <LoadingButton loading={saving} loadingLabel="Saving…">
          Save result
        </LoadingButton>
      </form>
    </Modal>
  );
};
