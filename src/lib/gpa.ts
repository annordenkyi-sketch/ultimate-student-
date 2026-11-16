import {
  ASSESSMENT_WEIGHTS,
  GPA_SCALE,
  GRADE_POINTS,
  SCORE_BANDS,
  type AssessmentId,
  type LetterGrade,
} from "@/config/grading";
import type { Course, CourseResult } from "@/services";

// GPA = total (grade points × credits) ÷ total credits, over courses with results.

export const gradeForScore = (score: number): LetterGrade =>
  (SCORE_BANDS.find((b) => score >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1]!).grade;

export const pointsFor = (grade: LetterGrade): number => GRADE_POINTS.find((g) => g.grade === grade)?.points ?? 0;

/** A result entered as a letter counts as the middle of that grade's score band. */
export const scoreForGrade = (grade: LetterGrade): number => {
  const i = SCORE_BANDS.findIndex((b) => b.grade === grade);
  const low = SCORE_BANDS[i]!.min;
  const high = i === 0 ? 100 : SCORE_BANDS[i - 1]!.min - 1;
  return (low + high) / 2;
};

const scoreOf = (r: CourseResult) => r.score ?? scoreForGrade((r.grade ?? "F") as LetterGrade);

export interface CourseStanding {
  course: Course;
  results: CourseResult[];
  /** Weighted mark so far (%), or null with no results. */
  mark: number | null;
  grade: LetterGrade | null;
  points: number | null;
}

/** A course's mark from its results: assignments averaged; the latest mid-semester and final count. */
export const courseStanding = (course: Course, all: CourseResult[]): CourseStanding => {
  const results = all.filter((r) => r.courseCode === course.code).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const byKind: Partial<Record<AssessmentId, number>> = {};
  const assignments = results.filter((r) => r.assessment === "assignment").map(scoreOf);
  if (assignments.length) byKind.assignment = assignments.reduce((s, x) => s + x, 0) / assignments.length;
  for (const kind of ["midsem", "final"] as const) {
    const latest = results.filter((r) => r.assessment === kind).pop();
    if (latest) byKind[kind] = scoreOf(latest);
  }
  const kinds = Object.keys(byKind) as AssessmentId[];
  if (!kinds.length) return { course, results, mark: null, grade: null, points: null };
  const weight = kinds.reduce((s, k) => s + ASSESSMENT_WEIGHTS[k], 0);
  const mark = kinds.reduce((s, k) => s + byKind[k]! * ASSESSMENT_WEIGHTS[k], 0) / weight;
  const grade = gradeForScore(mark);
  return { course, results, mark, grade, points: pointsFor(grade) };
};

export interface GpaSummary {
  /** Null until at least one course has a result. */
  gpa: number | null;
  courses: CourseStanding[];
  counted: number;
  total: number;
  countedCredits: number;
  totalCredits: number;
  /** Σ grade points × credits over counted courses. */
  qualityPoints: number;
}

export const summariseGpa = (courses: Course[], results: CourseResult[]): GpaSummary => {
  const standings = courses.map((c) => courseStanding(c, results));
  const counted = standings.filter((s) => s.points !== null);
  const countedCredits = counted.reduce((s, c) => s + c.course.credits, 0);
  const qualityPoints = counted.reduce((s, c) => s + c.points! * c.course.credits, 0);
  return {
    gpa: countedCredits ? qualityPoints / countedCredits : null,
    courses: standings,
    counted: counted.length,
    total: courses.length,
    countedCredits,
    totalCredits: courses.reduce((sum, c) => sum + c.credits, 0),
    qualityPoints,
  };
};

export type GpaOutlook =
  | { kind: "needs"; grade: LetterGrade; remaining: number }
  | { kind: "secured"; remaining: number }
  | { kind: "unreachable"; best: number }
  | { kind: "all-counted"; met: boolean };

/** What the student needs, on average, in the courses that don't have results yet. */
export const gpaOutlook = (s: GpaSummary, target: number): GpaOutlook => {
  const remainingCredits = s.totalCredits - s.countedCredits;
  const remaining = s.total - s.counted;
  if (remainingCredits <= 0) return { kind: "all-counted", met: (s.gpa ?? 0) >= target - 1e-9 };
  const required = (target * s.totalCredits - s.qualityPoints) / remainingCredits;
  if (required > GPA_SCALE + 1e-9) {
    return { kind: "unreachable", best: (s.qualityPoints + GPA_SCALE * remainingCredits) / s.totalCredits };
  }
  if (required <= 0) return { kind: "secured", remaining };
  const grade = [...GRADE_POINTS].reverse().find((g) => g.points >= required - 1e-9)!.grade;
  return { kind: "needs", grade, remaining };
};

/** "3.33" */
export const formatGpa = (n: number) => n.toFixed(2);
/** "3.5", "4.0" or "3.25": at least one decimal place, like a GPA. */
export const formatTarget = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r * 10) ? r.toFixed(1) : r.toFixed(2);
};

/** "0.17 to go", "Target reached", "0.12 above target", or "No results yet". */
export const gapText = (gpa: number | null, target: number) => {
  if (gpa === null) return "No results yet";
  const gap = Math.round((target - gpa) * 100) / 100;
  if (gap > 0) return `${gap.toFixed(2)} to go`;
  if (gap === 0) return "Target reached";
  return `${(-gap).toFixed(2)} above target`;
};
