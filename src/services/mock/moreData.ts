import type { Faq, UgPortal } from "../types";

// Sample content for More (flow 07): approved portals and support answers.
// Portal links all point at the university's main site for now; the backend
// team replaces them with each portal's confirmed address.

const UG_SITE = "https://www.ug.edu.gh";

export const UG_PORTALS: UgPortal[] = [
  { id: "student-portal", name: "Student portal", description: "Course registration, results and your fee statement.", url: UG_SITE },
  { id: "lms", name: "Learning management system", description: "Course materials, assignments and announcements from lecturers.", url: UG_SITE },
  { id: "email", name: "Student email", description: "Your university email account.", url: UG_SITE },
  { id: "library", name: "Library e-resources", description: "Journals, e-books and past examination papers.", url: UG_SITE },
  { id: "fees", name: "Fee payment", description: "Pay fees and download receipts.", url: UG_SITE },
];

export const FAQS: Faq[] = [
  {
    id: "sync-what",
    topic: "Courses and timetable",
    question: "What does syncing with the student portal do?",
    answer: [
      "It copies your registered courses and their official lecture times and venues into your timetable.",
      "When something changes at the university, you can review the changes before they're applied. Times and venues you've set yourself are kept.",
    ],
  },
  {
    id: "sync-wrong",
    topic: "Courses and timetable",
    question: "A lecture time or venue is wrong. What can I do?",
    answer: [
      "Open More, then Academics, then Timetable, and edit the session. Your version is marked as a personal change and stays even after a sync.",
      "If the official timetable is wrong, tell your department.",
    ],
  },
  {
    id: "add-course",
    topic: "Courses and timetable",
    question: "How do I add a course that isn't on my registration?",
    answer: ["In Academics, choose Courses, then Add a course. Courses you add yourself are labelled \"Added by you\" and syncing never removes them."],
  },
  {
    id: "reminders",
    topic: "Reminders and notifications",
    question: "Why am I not getting lecture reminders?",
    answer: [
      "Check that lecture reminders are on in Academics, under Semester, and that notifications are allowed for this app in your browser or phone settings.",
      "You can also turn notifications on or off by type in Settings.",
    ],
  },
  {
    id: "verify",
    topic: "Account",
    question: "Why can't I see my timetable or For You?",
    answer: ["These are for verified UG students. If your student status is still being checked, you'll see its progress under More. Once you're verified, everything unlocks."],
  },
  {
    id: "password",
    topic: "Account",
    question: "How do I change my password?",
    answer: ["Go to Settings, then Security, and choose Change password. If you've forgotten it, use \"Forgot password\" on the log-in screen."],
  },
  {
    id: "directions",
    topic: "Campus map",
    question: "The map says there's no walking route. Why?",
    answer: [
      "We only give directions along verified campus paths, so a few places don't have a route yet.",
      "Use \"Report an issue with this location\" on the map so the campus map team can add it.",
    ],
  },
  {
    id: "location",
    topic: "Campus map",
    question: "Is my location stored?",
    answer: ["No. Your location is only used while the map is open to draw your route and guide you. It isn't saved or shared."],
  },
  {
    id: "goals",
    topic: "For You",
    question: "How is my estimated GPA worked out?",
    answer: [
      "From the results you record for each course. Each course's grade is turned into grade points and weighted by its credits.",
      "It's an estimate until all your results are in. Your official GPA comes from the university.",
    ],
  },
];
