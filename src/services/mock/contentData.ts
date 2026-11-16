import type {
  Announcement,
  AppNotification,
  CampusEvent,
  OpeningPeriod,
  UniversityService,
} from "../types";

// Sample content. Times are relative to "now" so the demo always looks current.
// Contact details are placeholders for the backend team to replace.

const hoursAgo = (now: Date, h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();

const dayAt = (now: Date, dayOffset: number, time: string) => {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const weekdays = (open: string, close: string): OpeningPeriod[] => [{ days: [1, 2, 3, 4, 5], open, close }];

export const announcementsAt = (now: Date): Announcement[] => [
  {
    id: "midsem-timetable",
    title: "Mid-semester examination timetable published",
    source: "Academic Affairs",
    category: "Academic",
    publishedAt: hoursAgo(now, 2),
    summary: "Check your papers, dates and venues now.",
    body: [
      "The timetable for first-semester mid-semester examinations is now available on the student portal.",
      "Check the date, time and venue of each of your papers. If two of your papers clash, tell your department before the deadline printed on the timetable.",
      "Bring your student ID card to every paper.",
    ],
  },
  {
    id: "library-hours",
    title: "Library opening hours extended for exams",
    source: "Balme Library",
    category: "Services",
    publishedAt: hoursAgo(now, 5),
    summary: "Longer evening hours during the examination period.",
    body: [
      "During the examination period the library will stay open later in the evening.",
      "Reading rooms on the ground floor remain silent study areas. Group study rooms can be booked at the front desk.",
    ],
  },
  {
    id: "src-town-hall",
    title: "SRC town hall meeting",
    source: "Students' Representative Council",
    category: "Campus life",
    publishedAt: hoursAgo(now, 26),
    summary: "Raise questions about welfare, transport and halls.",
    body: [
      "The SRC invites all students to a town hall meeting to discuss student welfare, campus transport and conditions in the halls.",
      "Questions can also be sent in advance through your hall representative.",
    ],
  },
  {
    id: "fees-instalment",
    title: "Second fee instalment due",
    source: "Finance Directorate",
    category: "Finance",
    publishedAt: hoursAgo(now, 30),
    summary: "Pay by the date shown on your student portal.",
    body: [
      "Students paying fees in instalments should pay the second instalment by the date shown on the student portal.",
      "Keep your receipt. If your payment doesn't show on the portal within three working days, contact the Finance Directorate.",
    ],
  },
  {
    id: "wifi-maintenance",
    title: "Wi-Fi maintenance in halls of residence",
    source: "ICT Directorate",
    category: "Services",
    publishedAt: hoursAgo(now, 52),
    summary: "Short outages overnight while equipment is upgraded.",
    body: [
      "The ICT Directorate is upgrading wireless equipment in the halls of residence. Expect short outages overnight.",
      "Lecture theatres and the library are not affected.",
    ],
  },
  {
    id: "registration-changes",
    title: "Course registration changes close soon",
    source: "Academic Affairs",
    category: "Academic",
    publishedAt: hoursAgo(now, 75),
    summary: "Add or drop courses before the deadline.",
    body: [
      "If you need to add or drop a course this semester, do it on the student portal before registration closes.",
      "Speak to your academic adviser if you're unsure which courses you need.",
    ],
  },
  {
    id: "health-screening",
    title: "Health screening for continuing students",
    source: "University Hospital",
    category: "Services",
    publishedAt: hoursAgo(now, 98),
    summary: "Walk in with your student ID.",
    body: [
      "Continuing students can complete their annual health screening at the University Hospital.",
      "Bring your student ID card. No appointment is needed.",
    ],
  },
  {
    id: "interhall-fixtures",
    title: "Inter-hall sports fixtures released",
    source: "Sports Directorate",
    category: "Campus life",
    publishedAt: hoursAgo(now, 122),
    summary: "Football, volleyball and athletics schedules are out.",
    body: [
      "Fixtures for this semester's inter-hall football, volleyball and athletics competitions are now available from hall sports secretaries.",
    ],
  },
];

export const eventsAt = (now: Date): CampusEvent[] => [
  {
    id: "career-fair",
    category: "Careers",
    title: "Career fair: internships and graduate roles",
    startsAt: dayAt(now, 1, "10:00"),
    endsAt: dayAt(now, 1, "15:00"),
    venue: "Great Hall",
    placeId: "great-hall",
    organiser: "Careers and Counselling Centre",
    description: [
      "Meet employers offering internships and graduate roles.",
      "Bring copies of your CV. Careers advisers will be on hand to review CVs during the day.",
    ],
    registration: "required",
  },
  {
    id: "coding-night",
    category: "Tech",
    title: "Coding night: build a mini app",
    startsAt: dayAt(now, 2, "17:00"),
    endsAt: dayAt(now, 2, "20:00"),
    venue: "CS Lab 1",
    placeId: "cs-dept",
    organiser: "Computer Science Students' Association",
    description: [
      "Team up and build a small app in an evening. Beginners are welcome.",
      "Bring a laptop if you have one. Lab machines are available.",
    ],
    registration: "required",
  },
  {
    id: "interhall-football",
    category: "Sports",
    title: "Inter-hall football: opening match",
    startsAt: dayAt(now, 2, "16:00"),
    endsAt: dayAt(now, 2, "18:00"),
    venue: "University sports stadium",
    placeId: "sports-stadium",
    organiser: "Sports Directorate",
    description: ["The first match of this semester's inter-hall football competition. Come and support your hall."],
    registration: "none",
  },
  {
    id: "study-skills",
    category: "Wellbeing",
    title: "Study skills workshop",
    startsAt: dayAt(now, 3, "14:00"),
    endsAt: dayAt(now, 3, "15:30"),
    venue: "N Block LT 2",
    placeId: "n-block",
    organiser: "Careers and Counselling Centre",
    description: [
      "Practical techniques for planning revision, taking notes and preparing for exams.",
    ],
    registration: "required",
  },
  {
    id: "cultural-night",
    category: "Culture",
    title: "International cultural night",
    startsAt: dayAt(now, 5, "18:00"),
    endsAt: dayAt(now, 5, "21:00"),
    venue: "Great Hall",
    placeId: "great-hall",
    organiser: "International Students' Association",
    description: ["Music, food and performances from students of many countries."],
    registration: "none",
  },
];

export const UNIVERSITY_SERVICES: UniversityService[] = [
  {
    id: "library",
    category: "Study and IT",
    name: "Balme Library",
    shortName: "Library",
    icon: "library",
    summary: "Borrow books, find study space and access e-resources.",
    description: [
      "The main university library. Borrow and return books, use the reading rooms and book group study rooms.",
      "Library staff can help you find journals and e-resources for assignments.",
    ],
    hours: [
      { days: "Monday to Friday", time: "08:00–22:00" },
      { days: "Saturday", time: "09:00–17:00" },
      { days: "Sunday", time: "Closed" },
    ],
    periods: [...weekdays("08:00", "22:00"), { days: [6], open: "09:00", close: "17:00" }],
    phone: "+233 30 000 0101",
    email: "library@example.edu.gh",
    location: "Balme Library",
    placeId: "balme-library",
    website: "https://www.ug.edu.gh",
  },
  {
    id: "health",
    category: "Health",
    name: "University Hospital",
    shortName: "Health",
    icon: "health",
    summary: "Medical care and health screening for students.",
    description: [
      "Outpatient care, health screening and emergency care for registered students.",
      "Bring your student ID card to every visit.",
    ],
    hours: [
      { days: "Outpatients, Monday to Friday", time: "08:00–16:00" },
      { days: "Emergency", time: "Open 24 hours" },
    ],
    periods: [{ days: [0, 1, 2, 3, 4, 5, 6], open: "00:00", close: "24:00" }],
    phone: "+233 30 000 0102",
    email: "hospital@example.edu.gh",
    location: "University Hospital",
    placeId: "hospital",
    website: "https://www.ug.edu.gh",
  },
  {
    id: "ict-help",
    category: "Study and IT",
    name: "ICT help desk",
    shortName: "ICT help",
    icon: "ict",
    summary: "Help with Wi-Fi, student email and portal passwords.",
    description: [
      "Get help connecting to campus Wi-Fi, resetting your student email or portal password, and with university software.",
    ],
    hours: [{ days: "Monday to Friday", time: "08:00–17:00" }],
    periods: weekdays("08:00", "17:00"),
    phone: "+233 30 000 0103",
    email: "ict.help@example.edu.gh",
    location: "ICT Directorate",
    placeId: "ict-directorate",
    website: null,
  },
  {
    id: "fees",
    category: "Money",
    name: "Fees and payments",
    shortName: "Fees",
    icon: "fees",
    summary: "Fee payments, receipts and instalment plans.",
    description: [
      "Questions about your fees, payment receipts and instalment plans.",
      "Have your student ID and payment receipt ready when you get in touch.",
    ],
    hours: [{ days: "Monday to Friday", time: "08:30–16:30" }],
    periods: weekdays("08:30", "16:30"),
    phone: "+233 30 000 0104",
    email: "fees@example.edu.gh",
    location: "Finance Directorate",
    placeId: null,
    website: "https://www.ug.edu.gh",
  },
  {
    id: "student-portal",
    category: "Study and IT",
    name: "Student portal",
    shortName: "Portal",
    icon: "portal",
    summary: "Course registration, results and fee statements online.",
    description: [
      "Register for courses, check results and view your fee statement online.",
      "Use your student ID and portal password to sign in.",
    ],
    hours: [{ days: "Online", time: "Available any time" }],
    periods: null,
    phone: null,
    email: "portal.support@example.edu.gh",
    location: "Online",
    placeId: null,
    website: "https://www.ug.edu.gh",
  },
];

/** Notifications for a signed-in student. Lecture ones only once courses are set up. */
export const notificationsAt = (now: Date, withLectures: boolean): AppNotification[] => {
  const items: AppNotification[] = [
    {
      id: "n-midsem",
      title: "New from Academic Affairs",
      body: "Mid-semester examination timetable published.",
      createdAt: hoursAgo(now, 2),
      target: { kind: "announcement", id: "midsem-timetable" },
    },
    {
      id: "n-career-fair",
      title: "Registration open: Career fair",
      body: "Internships and graduate roles. Register to attend.",
      createdAt: hoursAgo(now, 4),
      target: { kind: "event", id: "career-fair" },
    },
    {
      id: "n-fees",
      title: "New from the Finance Directorate",
      body: "Second fee instalment due.",
      createdAt: hoursAgo(now, 30),
      target: { kind: "announcement", id: "fees-instalment" },
    },
  ];
  if (withLectures) {
    items.push(
      {
        id: "n-cscd301",
        title: "CSCD 301 Tutorial today",
        body: "Object Oriented Programming at 10:30 in JQB 19.",
        createdAt: hoursAgo(now, 1),
        target: { kind: "lecture", id: "CSCD301-2" },
      },
      {
        id: "n-cscd309",
        title: "CSCD 309 venue update",
        body: "Operating Systems lectures are in Science LT 2.",
        createdAt: hoursAgo(now, 50),
        target: { kind: "lecture", id: "CSCD309-1" },
      },
    );
  }
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};
