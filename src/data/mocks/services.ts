import type { SectionItem } from "@/data/types";

export const services: SectionItem[] = [
  {
    id: "svc-1",
    section: "services",
    title: "University Health Service",
    summary: "GP consultations, emergency care, pharmacy and lab tests.",
    tags: ["health"],
    nextAction: "call-office",
    location: { label: "Hospital Road", mapsQuery: "University Hospital" },
    contact: {
      phone: "+233 30 221 3900",
      email: "health@uni.edu.gh",
    },
  },
  {
    id: "svc-2",
    section: "services",
    title: "Counselling and Placement Centre",
    summary: "Confidential student counselling and career placement support.",
    tags: ["mental health", "counselling"],
    nextAction: "visit-office",
    location: { label: "CPC Building, Block B", mapsQuery: "Counselling Centre" },
    contact: {
      phone: "+233 30 221 3800",
      email: "cpc@uni.edu.gh",
    },
  },
  {
    id: "svc-3",
    section: "services",
    title: "ICT Help Desk",
    summary:
      "Student portal, email, Wi-Fi and software troubleshooting. Walk-in or chat.",
    tags: ["IT", "support"],
    nextAction: "visit-office",
    location: { label: "UITS Building", mapsQuery: "ICT Help Desk" },
    contact: { email: "ict-help@uni.edu.gh" },
  },
  {
    id: "svc-4",
    section: "services",
    title: "Student Finance Office",
    summary: "Fees queries, scholarships, financial aid and payment plans.",
    tags: ["finance"],
    nextAction: "visit-office",
    location: { label: "Finance Office, Admin Block" },
    contact: {
      phone: "+233 30 221 3650",
      email: "finance@uni.edu.gh",
    },
  },
  {
    id: "svc-5",
    section: "services",
    title: "Campus Security — Emergency",
    summary: "24/7 emergency line and campus patrol dispatch.",
    tags: ["emergency", "security"],
    nextAction: "call-office",
    contact: { phone: "+233 30 221 3999" },
  },
  {
    id: "svc-6",
    section: "services",
    title: "International Students Office",
    summary:
      "Visa support, orientation, residence permits and homesickness help.",
    tags: ["international"],
    nextAction: "visit-office",
    location: { label: "ISO, Admin Block" },
    contact: { email: "iso@uni.edu.gh" },
  },
  {
    id: "svc-7",
    section: "services",
    title: "Disability and Accessibility Services",
    summary: "Accessibility support for students with disabilities.",
    tags: ["accessibility"],
    nextAction: "visit-office",
    contact: { email: "accessibility@uni.edu.gh" },
  },
];
