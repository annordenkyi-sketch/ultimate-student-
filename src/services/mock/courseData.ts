import type { Course, CourseSession, SessionKind, Semester, Weekday } from "../types";

// Sample data for testing. Course codes follow UG's style; venues are placeholders.

export const SEMESTERS: Semester[] = [
  // Start and end dates are sample values.
  { id: "2025-26-s1", academicYear: "2025/2026", term: "First semester", current: false, startsOn: "2025-08-11", endsOn: "2025-12-19" },
  { id: "2025-26-s2", academicYear: "2025/2026", term: "Second semester", current: false, startsOn: "2026-01-19", endsOn: "2026-05-15" },
  { id: "2026-27-s1", academicYear: "2026/2027", term: "First semester", current: true, startsOn: "2026-08-10", endsOn: "2026-12-18" },
  { id: "2026-27-s2", academicYear: "2026/2027", term: "Second semester", current: false, startsOn: "2027-01-18", endsOn: "2027-05-14" },
];

/** Venues located on the campus map. Any other venue shows as text only. */
export const VENUE_PLACES: Record<string, string> = {
  "JQB 19": "jqb",
  "JQB 23": "jqb",
  "N Block LT 1": "n-block",
  "N Block LT 2": "n-block",
  "CS Lab 1": "cs-dept",
  "Great Hall": "great-hall",
  "Economics LT": "econ-dept",
};

export const session = (
  code: string,
  n: number,
  kind: SessionKind,
  day: Weekday | null,
  start: string | null,
  end: string | null,
  venue: string | null,
  notes: string | null = null,
): CourseSession => ({
  id: `${code.replace(/\s+/g, "")}-${n}`,
  kind,
  day,
  start,
  end,
  venue,
  placeId: venue ? (VENUE_PLACES[venue] ?? null) : null,
  notes,
  source: "official",
});

/** Sample lecturers (placeholder names). */
export const LECTURERS: Record<string, string> = {
  "CSCD 301": "Dr. Kofi Sarpong",
  "CSCD 303": "Dr. Adwoa Badu",
  "CSCD 305": "Prof. Abena Ofori",
  "CSCD 307": "Dr. Nii Lartey",
  "CSCD 309": "Dr. Yaw Mensah",
  "CSCD 311": "Dr. Efua Quaye",
  "CSCD 313": "Dr. Esi Amoah",
  "UGRC 220": "Dr. Kwesi Boadu",
  "UGRC 150": "Dr. Ama Owusu",
  "MATH 351": "Dr. Akua Darko",
  "STAT 301": "Dr. Kojo Antwi",
  "ECON 201": "Dr. Selorm Agbeko",
  "ECON 203": "Prof. Kwabena Appiah",
  "PSYC 201": "Dr. Dzifa Tetteh",
};

const BASE_CATALOGUE: Course[] = [
  {
    code: "CSCD 301",
    title: "Object Oriented Programming",
    credits: 3,
    sessions: [
      session("CSCD 301", 1, "Lecture", "mon", "08:30", "10:20", "JQB 19"),
      session("CSCD 301", 2, "Tutorial", "thu", "10:30", "11:20", "JQB 19"),
    ],
  },
  {
    code: "CSCD 303",
    title: "Database Systems",
    credits: 3,
    sessions: [
      session("CSCD 303", 1, "Lecture", "tue", "10:30", "12:20", "N Block LT 1"),
      session("CSCD 303", 2, "Practical", "fri", "13:30", "15:20", "CS Lab 1"),
    ],
  },
  {
    code: "CSCD 305",
    title: "Computer Networks",
    credits: 3,
    sessions: [session("CSCD 305", 1, "Lecture", "wed", "08:30", "10:20", "JQB 23")],
  },
  {
    // Overlaps CSCD 303 on Tuesday.
    code: "CSCD 307",
    title: "Software Engineering",
    credits: 3,
    sessions: [session("CSCD 307", 1, "Lecture", "tue", "11:30", "13:20", "Science LT 2")],
  },
  {
    // Venue not published.
    code: "CSCD 309",
    title: "Operating Systems",
    credits: 3,
    sessions: [session("CSCD 309", 1, "Lecture", "thu", "13:30", "15:20", null)],
  },
  {
    // Time and venue not published.
    code: "CSCD 311",
    title: "Research Methods",
    credits: 2,
    sessions: [session("CSCD 311", 1, "Lecture", null, null, null, null)],
  },
  {
    code: "UGRC 220",
    title: "Introduction to African Studies",
    credits: 3,
    sessions: [session("UGRC 220", 1, "Lecture", "fri", "08:30", "10:20", "Great Hall")],
  },
  {
    code: "CSCD 313",
    title: "Artificial Intelligence",
    credits: 3,
    sessions: [session("CSCD 313", 1, "Lecture", "wed", "13:30", "15:20", "JQB 19")],
  },
  {
    code: "MATH 351",
    title: "Numerical Analysis",
    credits: 3,
    sessions: [session("MATH 351", 1, "Lecture", "mon", "13:30", "15:20", "Maths Room 2")],
  },
  {
    code: "STAT 301",
    title: "Probability Theory",
    credits: 3,
    sessions: [session("STAT 301", 1, "Lecture", "thu", "08:30", "10:20", "N Block LT 2")],
  },
  {
    code: "ECON 201",
    title: "Microeconomics I",
    credits: 3,
    sessions: [session("ECON 201", 1, "Lecture", "mon", "10:30", "12:20", "Economics LT")],
  },
  {
    code: "ECON 203",
    title: "Macroeconomics I",
    credits: 3,
    sessions: [session("ECON 203", 1, "Lecture", "wed", "10:30", "12:20", "Economics LT")],
  },
  {
    code: "UGRC 150",
    title: "Critical Thinking and Practical Reasoning",
    credits: 3,
    sessions: [session("UGRC 150", 1, "Lecture", "tue", "14:30", "16:20", "Great Hall")],
  },
  {
    code: "PSYC 201",
    title: "Introduction to Psychology",
    credits: 3,
    sessions: [session("PSYC 201", 1, "Lecture", "fri", "10:30", "12:20", "Psychology LT")],
  },
];

export const CATALOGUE: Course[] = BASE_CATALOGUE.map((c) => ({ ...c, lecturer: LECTURERS[c.code] }));

/** What a successful portal sync returns: includes a missing venue, missing times and a clash. */
export const PORTAL_IMPORT_CODES = [
  "CSCD 301",
  "CSCD 303",
  "CSCD 305",
  "CSCD 307",
  "CSCD 309",
  "CSCD 311",
  "UGRC 220",
];

export const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
