export type Location = "on-campus" | "off-campus";
export type RoomType =
  | "Single"
  | "2 in a room"
  | "3 in a room"
  | "4 in a room"
  | "Self-contained";
export type Facility =
  | "Wi-Fi"
  | "Water supply"
  | "Generator"
  | "Air conditioning"
  | "Fan"
  | "Private bathroom"
  | "Shared bathroom"
  | "Kitchen"
  | "Study room"
  | "Laundry"
  | "Parking"
  | "CCTV"
  | "Security guard";
export type Gender = "Male" | "Female" | "Mixed";
export type PaymentOption = "Full year" | "Per semester" | "Instalments";
export type Availability = "Available now" | "Next semester";
export type Nearby = "Shuttle stop" | "Market/shops" | "Clinic" | "ATM";

export interface Review {
  author: string;
  text: string;
}

export interface Hostel {
  id: string;
  name: string;
  area: string;
  location: Location;
  walkMinutes: number;
  pricePerYear: number;
  pricePerSemester: number;
  payment: PaymentOption[];
  roomTypes: RoomType[];
  facilities: Facility[];
  gender: Gender;
  availability: Availability;
  verified: boolean;
  nearby: Nearby[];
  summary: string;
  reviews?: Review[];
  /** Used only to sort by "Newest". */
  dateAdded: string;
  contact: {
    phone?: string;
    email?: string;
    office?: string;
  };
}

export const HOSTELS: Hostel[] = [
  {
    id: "acc-1",
    name: "Legon Hall",
    area: "Legon · Central Campus",
    location: "on-campus",
    walkMinutes: 2,
    pricePerYear: 2800,
    pricePerSemester: 1500,
    payment: ["Full year", "Per semester"],
    roomTypes: ["2 in a room", "3 in a room"],
    facilities: [
      "Wi-Fi",
      "Water supply",
      "Generator",
      "Shared bathroom",
      "Laundry",
      "Security guard",
    ],
    gender: "Mixed",
    availability: "Available now",
    verified: true,
    nearby: ["Shuttle stop", "ATM"],
    summary:
      "Traditional on-campus hall with a hall library and cafeteria. Shared bathrooms, two or three students per room.",
    dateAdded: "2024-06-01",
    contact: {
      phone: "+233 30 221 2500",
      email: "legon.hall@uni.edu.gh",
      office: "Hall Master's Office",
    },
    reviews: [
      {
        author: "Ama",
        text: "Fees are modest and the hall tradition is strong. Water flows reliably.",
      },
    ],
  },
  {
    id: "acc-2",
    name: "Volta Hall",
    area: "Legon · Central Campus",
    location: "on-campus",
    walkMinutes: 3,
    pricePerYear: 3100,
    pricePerSemester: 1700,
    payment: ["Full year", "Per semester"],
    roomTypes: ["2 in a room", "Self-contained"],
    facilities: [
      "Wi-Fi",
      "Water supply",
      "Generator",
      "Private bathroom",
      "Kitchen",
      "Laundry",
      "CCTV",
      "Security guard",
    ],
    gender: "Female",
    availability: "Available now",
    verified: true,
    nearby: ["Shuttle stop", "Clinic"],
    summary:
      "Women-only hall with en-suite options, kitchenette on each floor and 24/7 security.",
    dateAdded: "2024-07-15",
    contact: { phone: "+233 30 221 2600" },
  },
  {
    id: "acc-3",
    name: "Pentagon Hostel",
    area: "Haatso",
    location: "off-campus",
    walkMinutes: 15,
    pricePerYear: 5500,
    pricePerSemester: 3000,
    payment: ["Full year", "Per semester", "Instalments"],
    roomTypes: ["Single", "Self-contained"],
    facilities: [
      "Wi-Fi",
      "Water supply",
      "Generator",
      "Air conditioning",
      "Private bathroom",
      "Kitchen",
      "Parking",
      "CCTV",
      "Security guard",
    ],
    gender: "Mixed",
    availability: "Available now",
    verified: true,
    nearby: ["ATM", "Market/shops"],
    summary:
      "Private hostel in Haatso with en-suite single rooms, 24/7 power backup and shuttle to campus.",
    dateAdded: "2025-01-10",
    contact: {
      phone: "+233 54 110 2210",
      email: "info@pentagonhostel.gh",
    },
    reviews: [
      {
        author: "Kofi",
        text: "The AC and Wi-Fi hold up during exam period. Management is quick to respond.",
      },
      {
        author: "Nana",
        text: "A bit of a walk but the private bathroom and kitchen make up for it.",
      },
    ],
  },
  {
    id: "acc-4",
    name: "Bani Hostel",
    area: "Legon-Westlands",
    location: "off-campus",
    walkMinutes: 20,
    pricePerYear: 3200,
    pricePerSemester: 1800,
    payment: ["Full year", "Per semester"],
    roomTypes: ["3 in a room", "4 in a room"],
    facilities: [
      "Wi-Fi",
      "Water supply",
      "Generator",
      "Fan",
      "Shared bathroom",
      "Laundry",
      "Security guard",
    ],
    gender: "Mixed",
    availability: "Next semester",
    verified: true,
    nearby: ["Market/shops"],
    summary:
      "Budget-friendly off-campus hostel. Rooms sleep three or four and share bathrooms.",
    dateAdded: "2024-09-20",
    contact: { phone: "+233 54 110 2200" },
  },
  {
    id: "acc-5",
    name: "Jubilee Hall",
    area: "Legon · Central Campus",
    location: "on-campus",
    walkMinutes: 1,
    pricePerYear: 3800,
    pricePerSemester: 2000,
    payment: ["Full year", "Per semester"],
    roomTypes: ["2 in a room", "Self-contained"],
    facilities: [
      "Wi-Fi",
      "Water supply",
      "Generator",
      "Air conditioning",
      "Private bathroom",
      "Kitchen",
      "Study room",
      "CCTV",
      "Security guard",
    ],
    gender: "Mixed",
    availability: "Available now",
    verified: true,
    nearby: ["Shuttle stop", "Clinic"],
    summary:
      "Modern on-campus hall for continuing students. En-suite twin rooms and shared study spaces.",
    dateAdded: "2025-02-05",
    contact: {
      phone: "+233 30 221 2700",
      email: "jubilee@uni.edu.gh",
    },
  },
  {
    id: "acc-6",
    name: "International Students' Hostel",
    area: "Legon · North Campus",
    location: "on-campus",
    walkMinutes: 2,
    pricePerYear: 4200,
    pricePerSemester: 2300,
    payment: ["Full year", "Per semester", "Instalments"],
    roomTypes: ["Single", "Self-contained"],
    facilities: [
      "Wi-Fi",
      "Water supply",
      "Generator",
      "Air conditioning",
      "Private bathroom",
      "Kitchen",
      "Laundry",
      "Parking",
      "CCTV",
      "Security guard",
    ],
    gender: "Mixed",
    availability: "Available now",
    verified: true,
    nearby: ["Shuttle stop"],
    summary:
      "Dedicated hostel for international students with airport pickup and residence-permit assistance.",
    dateAdded: "2024-05-01",
    contact: { email: "ish@uni.edu.gh" },
  },
  {
    id: "acc-7",
    name: "Madina Square Hostel",
    area: "Madina",
    location: "off-campus",
    walkMinutes: 25,
    pricePerYear: 2200,
    pricePerSemester: 1200,
    payment: ["Per semester", "Instalments"],
    roomTypes: ["4 in a room"],
    facilities: [
      "Wi-Fi",
      "Water supply",
      "Fan",
      "Shared bathroom",
      "Laundry",
    ],
    gender: "Male",
    availability: "Available now",
    verified: false,
    nearby: ["Market/shops", "ATM"],
    summary:
      "Cheapest option on this list. Rooms sleep four and share facilities. No generator.",
    dateAdded: "2025-03-12",
    contact: { phone: "+233 54 110 3310" },
  },
  {
    id: "acc-8",
    name: "Ridge Royale Residence",
    area: "East Legon",
    location: "off-campus",
    walkMinutes: 35,
    pricePerYear: 8500,
    pricePerSemester: 4800,
    payment: ["Full year", "Per semester", "Instalments"],
    roomTypes: ["Single", "Self-contained"],
    facilities: [
      "Wi-Fi",
      "Water supply",
      "Generator",
      "Air conditioning",
      "Private bathroom",
      "Kitchen",
      "Study room",
      "Laundry",
      "Parking",
      "CCTV",
      "Security guard",
    ],
    gender: "Mixed",
    availability: "Available now",
    verified: true,
    nearby: ["Market/shops"],
    summary:
      "Premium residence with en-suite single rooms, dedicated study rooms and a quiet residential setting.",
    dateAdded: "2025-04-08",
    contact: {
      phone: "+233 54 110 4420",
      email: "stay@ridgeroyale.gh",
    },
  },
];
