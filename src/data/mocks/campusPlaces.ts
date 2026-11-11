/**
 * Source of truth for every place shown on the campus map.
 *
 * Add, edit or remove a place by changing an entry in CAMPUS_PLACES.
 * The /section/navigation page reads this file directly; the legacy
 * `navigation` SectionItem[] in ./navigation.ts is derived from it.
 */

export type CampusCategory =
  | "Lecture halls"
  | "Libraries"
  | "Offices"
  | "Food"
  | "Health"
  | "Banks & ATMs"
  | "Transport"
  | "Emergency"
  | "Hostels";

export interface CampusPlace {
  id: string;
  name: string;
  category: CampusCategory;
  subtitle?: string;
  summary: string;
  details?: string;
  lat: number;
  lng: number;
  /** Unsplash photoId (`photo-XXXX-YYYY`). */
  photoId: string;
  photoAlt: string;
  hours?: string;
  phone?: string;
  email?: string;
  mapsQuery?: string;
  tags: string[];
}

/** Campus: University of Ghana, Legon — Accra. Approx. centre of campus. */
export const CAMPUS_CENTER: { lat: number; lng: number } = {
  lat: 5.6508,
  lng: -0.187,
};

export const CAMPUS_NAME = "University of Ghana, Legon";

export const CAMPUS_PLACES: CampusPlace[] = [
  {
    id: "nav-1",
    name: "Balme Library",
    category: "Libraries",
    subtitle: "Central Campus",
    summary: "24-hour reading area, Wi-Fi, group study rooms and printing.",
    details:
      "The university's main library with over a million volumes, silent reading rooms, group-study pods and bookable discussion rooms.",
    lat: 5.6509,
    lng: -0.187,
    photoId: "photo-1522202176988-66273c2fd55f",
    photoAlt: "Students reading at long library tables",
    hours: "Open daily · 24/7 reading area",
    phone: "+233 30 221 3010",
    mapsQuery: "Balme Library University of Ghana",
    tags: ["library", "study"],
  },
  {
    id: "nav-2",
    name: "Pentagon Hall",
    category: "Hostels",
    subtitle: "North Campus",
    summary: "Postgraduate hall of residence with en-suite rooms.",
    details:
      "Private postgraduate hostel with single and double en-suite rooms, laundry service and a quiet reading lounge.",
    lat: 5.653,
    lng: -0.1845,
    photoId: "photo-1555854877-bab0e564b8d5",
    photoAlt: "A tidy student bedroom with soft morning light",
    hours: "Residents only",
    phone: "+233 24 000 1122",
    mapsQuery: "Pentagon Hall Legon",
    tags: ["hostel", "residence"],
  },
  {
    id: "nav-3",
    name: "SRC Office",
    category: "Offices",
    subtitle: "JQB Block",
    summary:
      "Office of the SRC. Walk in during open hours or book an appointment.",
    details:
      "Students' Representative Council — the elected body for student advocacy, welfare and events.",
    lat: 5.6504,
    lng: -0.1868,
    photoId: "photo-1573164713714-d95e436ab8d6",
    photoAlt: "A modern university office with glass partitions",
    hours: "Mon–Fri · 09:00–17:00",
    email: "src@uni.edu.gh",
    mapsQuery: "SRC Office University of Ghana",
    tags: ["student life", "office"],
  },
  {
    id: "nav-4",
    name: "Ecobank ATM",
    category: "Banks & ATMs",
    subtitle: "Near Night Market",
    summary: "ATM operational 24/7. Deposits accepted during branch hours.",
    details:
      "Two ATMs supporting Visa, Mastercard and Verve. Mobile money cash-in during banking hours.",
    lat: 5.6497,
    lng: -0.1855,
    photoId: "photo-1601597111158-2fceff292cdc",
    photoAlt: "An outdoor ATM kiosk at night",
    hours: "Open 24/7",
    mapsQuery: "Ecobank Campus Legon",
    tags: ["ATM", "banking"],
  },
  {
    id: "nav-5",
    name: "University Hospital",
    category: "Health",
    subtitle: "Hospital Road",
    summary: "On-campus clinic providing GP, pharmacy and lab services.",
    details:
      "General practice, pharmacy, laboratory, dental and emergency triage. Students may register at reception on first visit.",
    lat: 5.6488,
    lng: -0.1893,
    photoId: "photo-1587351021355-a479a299d2f9",
    photoAlt: "A healthcare worker in a modern clinic",
    hours: "Mon–Sun · 08:00–20:00 · Emergencies 24/7",
    phone: "+233 30 221 3900",
    mapsQuery: "Legon Hospital University of Ghana",
    tags: ["clinic", "health"],
  },
  {
    id: "nav-6",
    name: "Great Hall",
    category: "Lecture halls",
    subtitle: "Central Campus",
    summary: "Venue for matriculation, graduation and major lectures.",
    details:
      "Ceremonial hall seating 1,500. Also used for major faculty lectures and public talks.",
    lat: 5.6515,
    lng: -0.1872,
    photoId: "photo-1498243691581-b145c3f54a5a",
    photoAlt: "Students gathered in a grand university hall",
    hours: "Open for scheduled events",
    mapsQuery: "Great Hall University of Ghana",
    tags: ["events", "landmark"],
  },
  {
    id: "nav-7",
    name: "Night Market",
    category: "Food",
    subtitle: "East Campus",
    summary: "Food vendors, groceries and essentials open till late.",
    details:
      "Rows of local-food stalls, provisions shops and a few sit-down spots. Busiest 18:00–22:00.",
    lat: 5.6482,
    lng: -0.1848,
    photoId: "photo-1504674900247-0877df9cc836",
    photoAlt: "A bowl of warm Ghanaian jollof rice with grilled chicken",
    hours: "Daily · 10:00–23:00",
    mapsQuery: "Night Market Legon",
    tags: ["food", "shops"],
  },
  {
    id: "nav-8",
    name: "Sports Complex",
    category: "Offices",
    subtitle: "East Campus",
    summary: "Football pitch, athletics track, gym and swimming pool.",
    details:
      "Staff office handles bookings for the gym, pool and pitches. Student membership is included in sports fees.",
    lat: 5.6479,
    lng: -0.1901,
    photoId: "photo-1526401485004-46910ecc8e51",
    photoAlt: "An athletics track in bright morning light",
    hours: "Mon–Sat · 06:00–21:00",
    mapsQuery: "University of Ghana Sports Complex",
    tags: ["sports", "fitness"],
  },
  {
    id: "nav-9",
    name: "JQB Lecture Theatre",
    category: "Lecture halls",
    subtitle: "Jones Quartey Building",
    summary: "Main 400-seat lecture theatre for Humanities.",
    details:
      "Four tiered theatres and six smaller seminar rooms. A/V support desk at reception.",
    lat: 5.6501,
    lng: -0.1874,
    photoId: "photo-1522202176988-66273c2fd55f",
    photoAlt: "Students in a tiered lecture theatre",
    hours: "Mon–Fri · 07:00–19:00",
    mapsQuery: "JQB University of Ghana",
    tags: ["lectures", "humanities"],
  },
  {
    id: "nav-10",
    name: "Main Gate — Trotro Stop",
    category: "Transport",
    subtitle: "Okponglo entrance",
    summary: "Trotros and shared taxis to Madina, 37 and Accra Central.",
    details:
      "Main inbound/outbound stop for public transport. Ride-hail pickups allowed on the service lane only.",
    lat: 5.653,
    lng: -0.1792,
    photoId: "photo-1570125909232-eb263c188f7e",
    photoAlt: "Commuters boarding a minibus at a busy urban stop",
    hours: "Daily · 04:30–23:30",
    mapsQuery: "Legon Main Gate Trotro",
    tags: ["transport", "trotro", "taxi"],
  },
  {
    id: "nav-11",
    name: "Campus Shuttle Hub",
    category: "Transport",
    subtitle: "Behind the Great Hall",
    summary: "Free inter-campus shuttle every 20 minutes.",
    details:
      "Loops Central → Commonwealth → Legon Hall → Night Market. Live tracker on the Transport Office page.",
    lat: 5.6513,
    lng: -0.1864,
    photoId: "photo-1570125909232-eb263c188f7e",
    photoAlt: "A university campus shuttle bus parked at a stop",
    hours: "Mon–Sat · 06:30–20:30",
    phone: "+233 30 250 1234",
    mapsQuery: "University of Ghana Shuttle",
    tags: ["shuttle", "transport"],
  },
  {
    id: "nav-12",
    name: "Campus Security Post",
    category: "Emergency",
    subtitle: "Main Gate",
    summary: "24-hour security. Call first for on-campus emergencies.",
    details:
      "First point of contact for all on-campus incidents. Can dispatch patrol, escort or ambulance.",
    lat: 5.6522,
    lng: -0.1801,
    photoId: "photo-1582719471384-894fbb16e074",
    photoAlt: "A high-visibility security officer on patrol",
    hours: "24/7",
    phone: "+233 30 221 3850",
    mapsQuery: "University of Ghana Security",
    tags: ["security", "emergency"],
  },
  {
    id: "nav-13",
    name: "Fire & Rescue Point",
    category: "Emergency",
    subtitle: "Commonwealth Lane",
    summary: "Ghana National Fire Service campus post.",
    details:
      "Staffed around the clock. Tag the nearest point when calling to speed up response.",
    lat: 5.6495,
    lng: -0.1882,
    photoId: "photo-1582719471384-894fbb16e074",
    photoAlt: "A firefighter in protective gear",
    hours: "24/7",
    phone: "192",
    mapsQuery: "Fire Service Legon",
    tags: ["fire", "emergency"],
  },
  {
    id: "nav-14",
    name: "Commonwealth Hall",
    category: "Hostels",
    subtitle: "Commonwealth Lane",
    summary: "Historic men's hall of residence.",
    details:
      "Traditional hall with dining room, JCR and sports fields. Known as 'Vandal City'.",
    lat: 5.6493,
    lng: -0.1858,
    photoId: "photo-1555854877-bab0e564b8d5",
    photoAlt: "A quiet student bedroom with natural light",
    hours: "Residents only",
    phone: "+233 24 000 3344",
    mapsQuery: "Commonwealth Hall Legon",
    tags: ["hostel", "residence"],
  },
  {
    id: "nav-15",
    name: "Bush Canteen",
    category: "Food",
    subtitle: "Central Campus",
    summary: "Local meals — waakye, banku, jollof — from 11:00.",
    details:
      "Cheap, popular lunch spot with 12 vendors. Cash preferred; some vendors accept MoMo.",
    lat: 5.6505,
    lng: -0.1881,
    photoId: "photo-1504674900247-0877df9cc836",
    photoAlt: "Plates of Ghanaian waakye and jollof",
    hours: "Mon–Sat · 11:00–17:00",
    mapsQuery: "Bush Canteen Legon",
    tags: ["food", "local"],
  },
  {
    id: "nav-16",
    name: "GCB Bank — Campus Branch",
    category: "Banks & ATMs",
    subtitle: "Central Campus",
    summary: "Branch with 3 ATMs, forex and student-account services.",
    details:
      "Teller services and ATMs. First point for opening a student-account linked to your University ID.",
    lat: 5.6511,
    lng: -0.1862,
    photoId: "photo-1601597111158-2fceff292cdc",
    photoAlt: "A modern bank branch exterior",
    hours: "Mon–Fri · 08:30–16:00 · ATMs 24/7",
    phone: "+233 30 266 4910",
    mapsQuery: "GCB Bank Legon",
    tags: ["bank", "ATM"],
  },
];

export const CAMPUS_CATEGORIES: CampusCategory[] = [
  "Lecture halls",
  "Libraries",
  "Offices",
  "Food",
  "Health",
  "Banks & ATMs",
  "Transport",
  "Emergency",
  "Hostels",
];
