import type { SectionItem } from "@/data/types";

export const academic: SectionItem[] = [
  {
    id: "acad-1",
    section: "academic",
    title: "Semester 1 Registration",
    subtitle: "Office of the Registrar",
    summary:
      "Register for Semester 1 courses through the student portal. Late registration carries a GHS 50 fee.",
    details:
      "Log into the student portal with your student ID. Confirm your major, add electives, then submit for departmental approval.",
    tags: ["registration", "semester 1", "deadline"],
    deadline: "2026-11-14T23:59:00",
    nextAction: "save-deadline",
    contact: {
      phone: "+233 30 221 3850",
      email: "registrar@uni.edu.gh",
      office: "Admin Block, 2nd Floor",
    },
    location: {
      label: "Admin Block, Room 204",
      mapsQuery: "Admin Block University",
    },
  },
  {
    id: "acad-2",
    section: "academic",
    title: "End-of-Semester Exam Timetable",
    summary: "The provisional exam timetable for Semester 1 is now published.",
    tags: ["exam", "timetable"],
    deadline: "2026-12-05T08:00:00",
    nextAction: "save-deadline",
    contact: { email: "exams@uni.edu.gh", office: "Exams Office" },
  },
  {
    id: "acad-3",
    section: "academic",
    title: "Academic Calendar 2026/2027",
    summary:
      "Key dates for teaching, exams, breaks and graduation across the full academic year.",
    tags: ["calendar"],
    nextAction: "save-deadline",
  },
  {
    id: "acad-4",
    section: "academic",
    title: "Department of Computer Science",
    summary:
      "Programmes, faculty staff, course offerings and departmental announcements.",
    tags: ["department", "programmes"],
    nextAction: "contact-department",
    contact: {
      phone: "+233 30 221 4000",
      email: "cs@uni.edu.gh",
      office: "Science Block, Room 410",
    },
    location: {
      label: "Science Block, 4th Floor",
      mapsQuery: "Computer Science Department",
    },
  },
  {
    id: "acad-5",
    section: "academic",
    title: "Tuition Fees — Instalment 2",
    summary:
      "Second instalment of tuition fees is due. Pay via bank or the student portal.",
    tags: ["fees", "payment"],
    deadline: "2026-11-30T23:59:00",
    nextAction: "save-deadline",
    contact: { email: "finance@uni.edu.gh", office: "Finance Office" },
  },
  {
    id: "acad-6",
    section: "academic",
    title: "Postgraduate Thesis Submission Window",
    summary:
      "Final thesis submission window opens for Master's and PhD students.",
    tags: ["postgraduate", "thesis"],
    deadline: "2026-12-20T17:00:00",
    nextAction: "save-deadline",
    contact: {
      email: "sgs@uni.edu.gh",
      office: "School of Graduate Studies",
    },
  },
  {
    id: "acad-7",
    section: "academic",
    title: "Course Add/Drop Window",
    summary: "Change your course selection without penalty.",
    tags: ["registration"],
    deadline: "2026-11-07T23:59:00",
    nextAction: "save-deadline",
  },
];
