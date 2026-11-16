import { addDays, toISODate, weekStartOf } from "@/lib/days";
import type { CheckIn, CourseResult, Goal, GoalTarget, PlanTask, Resource, SuggestedGoal } from "../types";

// Sample data for For You (flow 06): suggested goals, resources, and a
// demo student's goals, check-ins and weekly tasks. Dates are relative to
// "now" so the demo always looks current.

export const SUGGESTED_GOALS: SuggestedGoal[] = [
  {
    id: "attend",
    title: "Attend every lecture",
    target: { kind: "description", text: "No missed lectures this semester" },
    steps: ["Check tomorrow's timetable each evening", "Turn on lecture reminders", "Plan how to get to early lectures"],
  },
  {
    id: "gpa",
    title: "Reach a 3.5 GPA",
    target: { kind: "gpa", value: 3.5 },
    steps: ["Record each result as it comes in", "Review lecture notes every weekend", "Start past papers three weeks before exams", "Go to office hours when stuck"],
  },
  {
    id: "club",
    title: "Join one club",
    target: { kind: "number", value: 1, unit: "club" },
    steps: ["Look through the clubs and societies list", "Go to one taster session", "Sign up"],
  },
  {
    id: "internships",
    title: "Apply for two internships",
    target: { kind: "number", value: 2, unit: "applications" },
    steps: ["Update my CV", "Get my CV reviewed at the Careers Centre", "Send the first application", "Send the second application"],
  },
  {
    id: "assignments",
    title: "Hand in every assignment on time",
    target: { kind: "description", text: "Every assignment in by its deadline" },
    steps: ["List every assignment deadline", "Start each assignment a week early"],
  },
  {
    id: "readings",
    title: "Keep up with readings each week",
    target: { kind: "description", text: "Readings done before each lecture" },
    steps: ["Block reading time in my weekly plan", "Note one question per reading"],
  },
];

/** Goals chosen during semester setup can use a slightly different wording. */
export const SETUP_GOAL_ALIASES: Record<string, string> = { "Join a club or society": "club" };

/** Keywords that link a goal's title to opportunity topics. */
export const GOAL_TOPICS: [RegExp, string][] = [
  [/intern|career|cv\b|job|employ|graduate role/i, "careers"],
  [/gpa|grade|exam|result|revis|study|read|assignment|lecture|attend/i, "study"],
  [/club|societ|volunteer/i, "clubs"],
  [/cod(e|ing)|program|software|app\b|hackathon/i, "computing"],
];

/** Topics that suit a department's students. */
export const DEPARTMENT_TOPICS: Record<string, string[]> = {
  "computer-science": ["computing"],
  "computer-engineering": ["computing"],
};

/** Topics for campus events that count as opportunities. */
export const EVENT_TOPICS: Record<string, string[]> = {
  "career-fair": ["careers"],
  "coding-night": ["computing"],
  "study-skills": ["study"],
};

export const resourcesAt = (now: Date): (Resource & { topics: string[] })[] => {
  const today = toISODate(now);
  return [
    {
      id: "internship-listings",
      title: "Internship listings",
      kind: "Internships",
      provider: "Careers and Counselling Centre",
      summary: "Current internship openings from partner employers.",
      description: [
        "The Careers and Counselling Centre keeps a list of internships open to UG students, updated each week.",
        "Ask at the centre for help choosing which ones to apply for.",
      ],
      deadline: null,
      location: "Careers and Counselling Centre",
      placeId: null,
      email: "careers@example.edu.gh",
      website: "https://www.ug.edu.gh",
      topics: ["careers"],
    },
    {
      id: "cv-clinic",
      title: "CV and cover letter clinic",
      kind: "Workshops",
      provider: "Careers and Counselling Centre",
      summary: "Bring your CV for one-to-one feedback.",
      description: ["A careers adviser reviews your CV and cover letter with you and suggests changes.", "Sessions take about 20 minutes."],
      deadline: null,
      location: "Careers and Counselling Centre",
      placeId: null,
      email: "careers@example.edu.gh",
      website: null,
      topics: ["careers"],
    },
    {
      id: "programming-contest",
      title: "Inter-faculty programming contest",
      kind: "Competitions",
      provider: "Department of Computer Science",
      summary: "Teams of three solve programming problems against the clock.",
      description: ["Open to students from every faculty. Form a team of up to three.", "Practice problems are shared after you register."],
      deadline: addDays(today, 21),
      location: "Department of Computer Science",
      placeId: "cs-dept",
      email: null,
      website: "https://www.ug.edu.gh",
      topics: ["computing"],
    },
    {
      id: "past-papers",
      title: "Past examination papers",
      kind: "Study resources",
      provider: "Balme Library",
      summary: "Past papers for most undergraduate courses.",
      description: ["Search past papers by course code on the library's e-resources page, or ask at the front desk."],
      deadline: null,
      location: "Balme Library",
      placeId: "balme-library",
      email: "library@example.edu.gh",
      website: "https://www.ug.edu.gh",
      topics: ["study"],
    },
    {
      id: "peer-tutoring",
      title: "Peer tutoring",
      kind: "Study resources",
      provider: "Students' Representative Council",
      summary: "Weekly help from senior students in first and second-year courses.",
      description: ["Sign up for a weekly small-group session with a senior student in your subject."],
      deadline: null,
      location: "SRC Union Building",
      placeId: "src-office",
      email: null,
      website: null,
      topics: ["study"],
    },
    {
      id: "clubs-directory",
      title: "Clubs and societies directory",
      kind: "Study resources",
      provider: "Students' Representative Council",
      summary: "Every registered club, with contacts and meeting times.",
      description: ["Find clubs by interest, see when they meet and who to contact to join."],
      deadline: null,
      location: "SRC Union Building",
      placeId: "src-office",
      email: null,
      website: null,
      topics: ["clubs"],
    },
  ];
};

// ── Demo student's goals ─────────────────────────────────────────────

const iso = (now: Date, daysAgo: number, hour = 18) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const steps = (...items: [string, boolean][]) => items.map(([text, done], i) => ({ id: `s${i + 1}`, text, done }));

const goal = (g: Omit<Goal, "completedAt" | "archivedAt"> & Partial<Pick<Goal, "completedAt" | "archivedAt">>): Goal => ({
  completedAt: null,
  archivedAt: null,
  ...g,
});

export const seedForYou = (
  now: Date,
  semesterEnd: string,
): { goals: Goal[]; checkIns: CheckIn[]; tasks: PlanTask[]; results: CourseResult[] } => {
  const number = (value: number, unit: string): GoalTarget => ({ kind: "number", value, unit });

  const goals: Goal[] = [
    goal({
      id: "g-internships", title: "Apply for two internships", target: number(2, "applications"), deadline: semesterEnd,
      steps: steps(["Update my CV", true], ["Get my CV reviewed at the Careers Centre", true], ["Apply at the career fair", false], ["Send the second application", false]),
      reminder: { frequency: "weekly", time: "09:00", day: 1 }, status: "active", progress: 1, createdAt: iso(now, 45),
    }),
    goal({
      id: "g-gpa", title: "Reach a 3.5 GPA", target: { kind: "gpa", value: 3.5 }, deadline: semesterEnd,
      steps: steps(["Review lecture notes every weekend", true], ["Start past papers three weeks before exams", false], ["Go to CSCD 309 office hours", false]),
      // Estimated from the course results below: (C+ 2.5 + A 4.0 + B+ 3.5) × 3 credits ÷ 9.
      reminder: null, status: "active", progress: 10 / 3, createdAt: iso(now, 70),
    }),
    goal({
      id: "g-attend", title: "Attend every lecture", target: { kind: "description", text: "No missed lectures this semester" }, deadline: semesterEnd,
      steps: steps(["Check tomorrow's timetable each evening", true], ["Turn on lecture reminders", true], ["Leave early for Thursday afternoon labs", false]),
      reminder: { frequency: "daily", time: "20:00", day: null }, status: "active", progress: 75, createdAt: iso(now, 70),
    }),
    goal({
      id: "g-club", title: "Join one club", target: number(1, "club"), deadline: semesterEnd,
      steps: steps(["Look through the clubs and societies list", true], ["Go to one taster session", true], ["Sign up", true]),
      reminder: null, status: "completed", progress: 1, createdAt: iso(now, 60), completedAt: iso(now, 24),
    }),
    goal({
      id: "g-novels", title: "Read one novel a month", target: number(4, "novels"), deadline: semesterEnd,
      steps: steps(["Pick four novels", true], ["Read 20 pages a night", false]),
      reminder: null, status: "archived", progress: 1, createdAt: iso(now, 65), archivedAt: iso(now, 14),
    }),
  ];

  const checkIns: CheckIn[] = [
    { id: "c2", goalId: "g-attend", at: iso(now, 56), value: 40, note: null },
    { id: "c3", goalId: "g-internships", at: iso(now, 40), value: 0, note: "Started looking at listings" },
    { id: "c4", goalId: "g-club", at: iso(now, 35), value: 0, note: "Went to the coding club taster" },
    { id: "c5", goalId: "g-novels", at: iso(now, 30), value: 1, note: null },
    { id: "c6", goalId: "g-attend", at: iso(now, 28), value: 60, note: null },
    { id: "c7", goalId: "g-club", at: iso(now, 24), value: 1, note: "Joined the coding club" },
    // GPA check-ins follow each recorded result.
    { id: "c11", goalId: "g-gpa", at: iso(now, 40), value: 2.5, note: "CSCD 309 assignment: 66%" },
    { id: "c12", goalId: "g-gpa", at: iso(now, 25), value: 3.25, note: "CSCD 305 mid-semester exam: 81%" },
    { id: "c8", goalId: "g-gpa", at: iso(now, 18), value: 19 / 6, note: "CSCD 301 assignment: 74%" },
    { id: "c13", goalId: "g-gpa", at: iso(now, 10), value: 10 / 3, note: "CSCD 301 mid-semester exam: 80%" },
    { id: "c9", goalId: "g-internships", at: iso(now, 11), value: 1, note: "Applied for a software internship" },
    { id: "c10", goalId: "g-attend", at: iso(now, 6), value: 75, note: "Missed one Friday lecture" },
  ];

  const mon = weekStartOf(now);
  const task = (id: string, title: string, day: number, time: string | null, goalId: string | null, done: boolean): PlanTask => ({
    id, title, date: addDays(mon, day), time, goalId, done,
  });
  const tasks: PlanTask[] = [
    task("t1", "Revise CSCD 301 inheritance notes", 0, "19:00", "g-gpa", true),
    task("t2", "Update CV with summer project", 1, null, "g-internships", true),
    task("t3", "Attempt problem set 4", 2, "16:00", null, true),
    task("t4", "Book a CV review at the Careers Centre", 3, "12:00", "g-internships", false),
    task("t5", "Buy a lab notebook", 3, null, null, true),
    task("t6", "Register for the career fair", 4, "09:00", "g-internships", false),
    task("t7", "MATH 351 past paper", 5, "10:00", "g-gpa", false),
    task("t8", "Plan next week's readings", 6, null, null, false),
    task("t9", "Read chapter 3 for CSCD 305", -5, null, "g-gpa", true),
    task("t10", "Draft cover letter", -3, null, "g-internships", true),
    task("t11", "Second internship application", 9, null, "g-internships", false),
  ];

  // Ama's results so far: 3 of her 6 courses (all 3 credits).
  const results: CourseResult[] = [
    { id: "r1", courseCode: "CSCD 309", assessment: "assignment", score: 66, grade: null, recordedAt: iso(now, 40) },
    { id: "r2", courseCode: "CSCD 305", assessment: "midsem", score: 81, grade: null, recordedAt: iso(now, 25) },
    { id: "r3", courseCode: "CSCD 301", assessment: "assignment", score: 74, grade: null, recordedAt: iso(now, 18) },
    { id: "r4", courseCode: "CSCD 301", assessment: "midsem", score: 80, grade: null, recordedAt: iso(now, 10) },
  ];

  return { goals, checkIns, tasks, results };
};
