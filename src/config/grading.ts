// Grading rules used to estimate a student's GPA in For You.
// Everything about grades lives here so it can be checked against the
// university's current regulations and corrected in one place.

/** GPA is on a 4.0 scale everywhere in the app. */
export const GPA_SCALE = 4.0;

/** Letter grade → grade points. Ordered from highest to lowest. */
export const GRADE_POINTS = [
  { grade: "A", points: 4.0 },
  { grade: "B+", points: 3.5 },
  { grade: "B", points: 3.0 },
  { grade: "C+", points: 2.5 },
  { grade: "C", points: 2.0 },
  { grade: "D+", points: 1.5 },
  { grade: "D", points: 1.0 },
  { grade: "E", points: 0.5 },
  { grade: "F", points: 0 },
] as const;

export type LetterGrade = (typeof GRADE_POINTS)[number]["grade"];

/**
 * Score (%) → letter grade: the lowest score for each grade.
 * Sample bands; confirm against the university's marking scheme.
 */
export const SCORE_BANDS: { grade: LetterGrade; min: number }[] = [
  { grade: "A", min: 80 },
  { grade: "B+", min: 75 },
  { grade: "B", min: 70 },
  { grade: "C+", min: 65 },
  { grade: "C", min: 60 },
  { grade: "D+", min: 55 },
  { grade: "D", min: 50 },
  { grade: "E", min: 45 },
  { grade: "F", min: 0 },
];

/** Kinds of result a student can record for a course. */
export const ASSESSMENTS = [
  { id: "assignment", label: "Assignment" },
  { id: "midsem", label: "Mid-semester exam" },
  { id: "final", label: "Final exam" },
] as const;

export type AssessmentId = (typeof ASSESSMENTS)[number]["id"];

/**
 * How much each kind of result counts towards a course's mark (%).
 * While some results are missing, the recorded ones are rescaled to 100%.
 * Sample weights; courses can differ.
 */
export const ASSESSMENT_WEIGHTS: Record<AssessmentId, number> = {
  assignment: 20,
  midsem: 20,
  final: 60,
};
