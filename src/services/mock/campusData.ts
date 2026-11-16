import type { CampusPlace, LatLng, OpeningPeriod } from "../types";

// Campus places at the University of Ghana, Legon. Positions come from
// OpenStreetMap (© OpenStreetMap contributors, ODbL); entrances are the
// nearest point on the walking network in ./campusPaths.json. Hours,
// contacts and descriptions are sample data for the backend team to replace.

export const CAMPUS_AREA = { center: { lat: 5.649, lng: -0.187 }, radiusM: 1600 };

const WEEKDAYS = [1, 2, 3, 4, 5];
const MON_SAT = [1, 2, 3, 4, 5, 6];
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const ALWAYS: OpeningPeriod[] = [{ days: EVERY_DAY, open: "00:00", close: "24:00" }];
const weekdays = (open: string, close: string): OpeningPeriod[] => [{ days: WEEKDAYS, open, close }];
const VISITORS = [{ days: "Visitors", time: "Ask at the porters' lodge" }];

type PlaceSeed = Omit<CampusPlace, "phone" | "email" | "website" | "photoId"> &
  Partial<Pick<CampusPlace, "phone" | "email" | "website" | "photoId">> & {
    /** False: no verified walking path to it yet, so Directions finds no route. */
    routable?: boolean;
    /** How walking instructions refer to it, e.g. "the Balme Library". */
    landmark?: string;
  };

const SEEDS: PlaceSeed[] = [
  {
    id: "balme-library", name: "Balme Library", landmark: "the Balme Library", category: "Libraries",
    summary: "The main university library and reading rooms.",
    description: ["Borrow books, use the reading rooms and book group study rooms.", "Ground-floor reading rooms are silent study areas."],
    lat: 5.65205, lng: -0.18698, entrance: { lat: 5.651459, lng: -0.186839, label: "Main entrance, facing the fountain" },
    hours: [{ days: "Monday to Friday", time: "08:00–22:00" }, { days: "Saturday", time: "09:00–17:00" }, { days: "Sunday", time: "Closed" }],
    periods: [...weekdays("08:00", "22:00"), { days: [6], open: "09:00", close: "17:00" }],
    phone: "+233 30 000 0101", email: "library@example.edu.gh", website: "https://www.ug.edu.gh",
  },
  {
    id: "great-hall", name: "Great Hall", landmark: "the Great Hall", category: "Lecture halls",
    summary: "Large hall for ceremonies, examinations and events.",
    description: ["Used for matriculation, congregation, large examinations and university events."],
    lat: 5.65062, lng: -0.19621, entrance: { lat: 5.650432, lng: -0.196431, label: "South-west side" },
    hours: [{ days: "Events only", time: "See event listings" }], periods: null,
    photoId: "photo-1498243691581-b145c3f54a5a",
  },
  {
    id: "jqb", name: "Jones-Quartey Building (JQB)", landmark: "JQB", category: "Lecture halls",
    summary: "Lecture rooms used by many departments.",
    description: ["Teaching rooms across three floors, including JQB 19 and JQB 23."],
    lat: 5.65225, lng: -0.18199, entrance: { lat: 5.652057, lng: -0.181764, label: "South-east side, by the car park" },
    hours: [{ days: "Monday to Friday", time: "07:00–19:00" }], periods: weekdays("07:00", "19:00"),
  },
  {
    id: "n-block", name: "N Block lecture theatres", landmark: "N Block", category: "Lecture halls",
    summary: "Lecture theatres LT 1 and LT 2.",
    description: ["Two large lecture theatres used for first and second-year courses."],
    lat: 5.65476, lng: -0.18708, entrance: { lat: 5.654496, lng: -0.187111, label: "South side, on Ebenezer Laing Road" },
    hours: [{ days: "Monday to Friday", time: "07:00–19:00" }], periods: weekdays("07:00", "19:00"),
  },
  {
    id: "cs-dept", name: "Department of Computer Science", landmark: "Computer Science", category: "Offices",
    summary: "Department office and CS Lab 1.",
    description: ["Department office, lecturers' offices and the CS Lab 1 computer lab."],
    lat: 5.65445, lng: -0.18378, entrance: { lat: 5.654336, lng: -0.18406, label: "West side" },
    hours: [{ days: "Monday to Friday", time: "08:00–17:00" }], periods: weekdays("08:00", "17:00"),
  },
  {
    id: "econ-dept", name: "Department of Economics", landmark: "the Economics Department", category: "Offices",
    summary: "Department office and Economics lecture theatre.",
    description: ["Department office and the Economics lecture theatre."],
    lat: 5.65113, lng: -0.18742, entrance: { lat: 5.651275, lng: -0.187211, label: "North-east side" },
    hours: [{ days: "Monday to Friday", time: "08:00–17:00" }], periods: weekdays("08:00", "17:00"),
  },
  {
    id: "src-office", name: "SRC Union Building", landmark: "the SRC Union Building", category: "Offices",
    summary: "Students' Representative Council offices.",
    description: ["Talk to SRC officers about welfare, transport and student issues."],
    lat: 5.64699, lng: -0.18775, entrance: { lat: 5.646706, lng: -0.187811, label: "South side" },
    hours: [{ days: "Monday to Friday", time: "09:00–17:00" }], periods: weekdays("09:00", "17:00"),
  },
  {
    id: "ict-directorate", name: "UGCS (ICT Directorate)", landmark: "UGCS", category: "Offices",
    summary: "ICT help desk for Wi-Fi, email and portal passwords.",
    description: ["University of Ghana Computing Systems. The help desk is on the ground floor."],
    lat: 5.65221, lng: -0.1881, entrance: { lat: 5.651848, lng: -0.188204, label: "South side" },
    hours: [{ days: "Monday to Friday", time: "08:00–17:00" }], periods: weekdays("08:00", "17:00"),
    phone: "+233 30 000 0103", email: "ict.help@example.edu.gh",
  },
  {
    id: "hospital", name: "University Hospital", landmark: "the University Hospital", category: "Health",
    summary: "Outpatient and emergency care for students.",
    description: ["Outpatients on weekdays; the emergency unit is open 24 hours."],
    lat: 5.65209, lng: -0.17783, entrance: { lat: 5.652132, lng: -0.178008, label: "West side" },
    hours: [{ days: "Outpatients, Monday to Friday", time: "08:00–16:00" }, { days: "Emergency", time: "Open 24 hours" }],
    periods: ALWAYS, phone: "+233 30 000 0102",
  },
  {
    id: "food-court", name: "Pent food court", landmark: "the Pent food court", category: "Food",
    summary: "Local dishes, snacks and drinks.",
    description: ["Several food vendors under one roof, with indoor seating."],
    lat: 5.6562, lng: -0.18067, entrance: { lat: 5.656161, lng: -0.180958, label: "West side" },
    hours: [{ days: "Monday to Saturday", time: "07:00–21:00" }, { days: "Sunday", time: "10:00–18:00" }],
    periods: [{ days: MON_SAT, open: "07:00", close: "21:00" }, { days: [0], open: "10:00", close: "18:00" }],
    photoId: "photo-1504674900247-0877df9cc836",
  },
  {
    id: "bush-canteen", name: "Bush Canteen", category: "Food",
    summary: "Food stalls and quick meals.",
    description: ["Breakfast and lunch counters with outdoor seating."],
    lat: 5.64565, lng: -0.18002, entrance: { lat: 5.645791, lng: -0.179746, label: "North-east side" },
    hours: [{ days: "Monday to Saturday", time: "07:00–19:00" }], periods: [{ days: MON_SAT, open: "07:00", close: "19:00" }],
  },
  {
    id: "night-market", name: "Night Market", landmark: "the Night Market", category: "Food",
    summary: "Evening food stalls.",
    description: ["Open-air stalls that get busy in the evening."],
    lat: 5.64218, lng: -0.18566, entrance: { lat: 5.641914, lng: -0.185723, label: "South side, on Diaspora Path" },
    hours: [{ days: "Every day", time: "16:00–23:00" }], periods: [{ days: EVERY_DAY, open: "16:00", close: "23:00" }],
  },
  {
    id: "gcb-atm", name: "GCB ATM", landmark: "the GCB ATM", category: "ATMs",
    summary: "Cash machine by the Office of the Dean of Students.",
    description: ["Cash machine in a covered lobby."],
    lat: 5.65103, lng: -0.18759, entrance: { lat: 5.65077, lng: -0.187845, label: "On W.E.B. Dubois Road" },
    hours: [{ days: "Every day", time: "Open 24 hours" }], periods: ALWAYS,
  },
  {
    id: "ecobank-atm", name: "Ecobank ATM", landmark: "the Ecobank ATM", category: "ATMs",
    summary: "Cash machine near UGCS.",
    description: ["Single cash machine in a kiosk."],
    lat: 5.652, lng: -0.18849, entrance: { lat: 5.651847, lng: -0.188745, label: "South-west side" },
    hours: [{ days: "Every day", time: "Open 24 hours" }], periods: ALWAYS,
  },
  {
    id: "commonwealth-hall", name: "Commonwealth Hall", category: "Hostels",
    summary: "Hall of residence.", description: ["Visitors sign in at the porters' lodge."],
    lat: 5.6509, lng: -0.19265, entrance: { lat: 5.651668, lng: -0.192465, label: "North side" },
    hours: VISITORS, periods: null,
  },
  {
    id: "legon-hall", name: "Legon Hall", category: "Hostels",
    summary: "Hall of residence.", description: ["Visitors sign in at the porters' lodge."],
    lat: 5.64758, lng: -0.18862, entrance: { lat: 5.647813, lng: -0.188648, label: "North side" },
    hours: VISITORS, periods: null,
  },
  {
    id: "akuafo-hall", name: "Akuafo Hall", category: "Hostels",
    summary: "Hall of residence.", description: ["Visitors sign in at the porters' lodge."],
    lat: 5.64972, lng: -0.18601, entrance: { lat: 5.649609, lng: -0.18621, label: "South-west side, on Agyei Bart Crescent" },
    hours: VISITORS, periods: null,
  },
  {
    id: "volta-hall", name: "Volta Hall", category: "Hostels",
    summary: "Hall of residence.", description: ["Visitors sign in at the porters' lodge."],
    lat: 5.65186, lng: -0.18952, entrance: { lat: 5.651802, lng: -0.189337, label: "East side" },
    hours: VISITORS, periods: null,
  },
  {
    // Test case: no verified walking path yet, so Directions shows "no route".
    id: "sports-stadium", name: "University sports stadium", category: "Sports", routable: false,
    summary: "Main stadium for inter-hall competitions.",
    description: ["Football pitch and athletics track with a covered main stand."],
    lat: 5.63904, lng: -0.18006, entrance: { lat: 5.63952, lng: -0.181154, label: "North-west gate" },
    hours: [{ days: "Monday to Saturday", time: "06:00–20:00" }], periods: [{ days: MON_SAT, open: "06:00", close: "20:00" }],
  },
];

export const PLACES: CampusPlace[] = SEEDS.map(({ routable, landmark, ...p }) => {
  void routable;
  void landmark;
  return { phone: null, email: null, website: null, photoId: null, ...p };
});

/** Places with a verified walking path to their entrance. */
export const ROUTABLE = new Set(SEEDS.filter((s) => s.routable !== false).map((s) => s.id));

/** How walking instructions name each place. */
export const LANDMARKS: Record<string, string> = Object.fromEntries(SEEDS.map((s) => [s.id, s.landmark ?? s.name]));

/** Simulated "on campus" position: Dr. J.B. Danquah Avenue, south of the Balme Library. */
export const SIM_START: LatLng = { lat: 5.65003, lng: -0.18716 };
/** Simulated "off campus" position: central Accra. */
export const SIM_OFF_CAMPUS: LatLng = { lat: 5.604, lng: -0.187 };
