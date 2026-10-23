import type { SectionItem } from "@/data/types";

export const accommodation: SectionItem[] = [
  {
    id: "acc-1",
    section: "accommodation",
    title: "Legon Hall",
    summary: "Traditional on-campus hall. Shared rooms, cafeteria and library.",
    tags: ["on-campus", "mixed"],
    nextAction: "save-hostel",
    location: { label: "Legon Hall, Central Campus", mapsQuery: "Legon Hall" },
    contact: {
      phone: "+233 30 221 2500",
      email: "legon.hall@uni.edu.gh",
      office: "Hall Master's Office",
    },
  },
  {
    id: "acc-2",
    section: "accommodation",
    title: "Volta Hall",
    summary: "Hall for women. En-suite options and 24/7 security.",
    tags: ["on-campus", "women"],
    nextAction: "save-hostel",
    location: { label: "Volta Hall", mapsQuery: "Volta Hall" },
    contact: { phone: "+233 30 221 2600" },
  },
  {
    id: "acc-3",
    section: "accommodation",
    title: "Pentagon Hostel",
    summary:
      "Private hostel near campus with Wi-Fi, laundry and 24/7 power backup.",
    tags: ["off-campus", "private"],
    nextAction: "contact-hostel",
    location: { label: "Haatso Road", mapsQuery: "Pentagon Hostel" },
    contact: {
      phone: "+233 54 110 2210",
      email: "info@pentagonhostel.gh",
    },
  },
  {
    id: "acc-4",
    section: "accommodation",
    title: "Bani Hostel",
    summary: "Affordable off-campus hostel popular with first-year students.",
    tags: ["off-campus", "budget"],
    nextAction: "contact-hostel",
    location: { label: "Bani Street", mapsQuery: "Bani Hostel" },
    contact: { phone: "+233 54 110 2200" },
  },
  {
    id: "acc-5",
    section: "accommodation",
    title: "Jubilee Hall",
    summary: "Modern on-campus hall for continuing students, en-suite rooms.",
    tags: ["on-campus", "mixed"],
    nextAction: "save-hostel",
    location: { label: "Jubilee Hall", mapsQuery: "Jubilee Hall" },
  },
  {
    id: "acc-6",
    section: "accommodation",
    title: "International Students' Hostel",
    summary:
      "Dedicated hostel for international students with airport pickup support.",
    tags: ["international", "on-campus"],
    nextAction: "save-hostel",
    location: { label: "ISH, North Campus", mapsQuery: "International Students Hostel" },
    contact: { email: "ish@uni.edu.gh" },
  },
];
