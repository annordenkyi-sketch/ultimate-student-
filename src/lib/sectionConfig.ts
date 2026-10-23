import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  GraduationCap,
  HeartPulse,
  Home as HomeIcon,
  MapPin,
  Users,
} from "lucide-react";
import type { ActionKind, SectionId } from "@/data/types";

export interface SectionMeta {
  id: SectionId;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  accent: string; // tailwind bg class
}

export const SECTIONS: SectionMeta[] = [
  {
    id: "academic",
    label: "Academic life",
    shortLabel: "Academic",
    description: "Programmes, calendar, registration, exams",
    icon: GraduationCap,
    accent: "bg-indigo-100 text-indigo-700",
  },
  {
    id: "navigation",
    label: "Campus map",
    shortLabel: "Campus map",
    description: "Buildings, halls, offices, ATMs, clinics",
    icon: MapPin,
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "accommodation",
    label: "Accommodation",
    shortLabel: "Accommodation",
    description: "Hostels, facilities, nearby services, reviews",
    icon: HomeIcon,
    accent: "bg-amber-100 text-amber-800",
  },
  {
    id: "services",
    label: "Student services",
    shortLabel: "Services",
    description: "Health, counselling, ICT, finance, emergency",
    icon: HeartPulse,
    accent: "bg-rose-100 text-rose-700",
  },
  {
    id: "social",
    label: "Social life",
    shortLabel: "Social",
    description: "Events, clubs, associations, sports",
    icon: Users,
    accent: "bg-sky-100 text-sky-700",
  },
  {
    id: "opportunities",
    label: "Opportunities",
    shortLabel: "Opportunities",
    description: "Internships, scholarships, competitions, jobs",
    icon: Briefcase,
    accent: "bg-violet-100 text-violet-700",
  },
];

export const sectionById = (id: SectionId): SectionMeta =>
  SECTIONS.find((s) => s.id === id) ?? SECTIONS[0];

export const actionLabels: Record<ActionKind, string> = {
  "save-deadline": "Save deadline",
  "contact-department": "Contact department",
  "get-directions": "Get directions",
  "save-hostel": "Save hostel",
  "contact-hostel": "Contact hostel",
  "call-office": "Call office",
  "visit-office": "Office location",
  rsvp: "RSVP",
  "join-club": "Join club",
  "save-opportunity": "Save",
  apply: "Apply",
};
