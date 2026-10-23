export type SectionId =
  | "academic"
  | "navigation"
  | "accommodation"
  | "services"
  | "social"
  | "opportunities";

export type StudentType =
  | "prospective"
  | "new"
  | "continuing"
  | "postgraduate"
  | "final-year";

export type LivingSituation = "on-campus" | "off-campus";

export interface Profile {
  id: string;
  name: string;
  identifier: string; // email or student ID
  studentType: StudentType;
  isInternational: boolean;
  living: LivingSituation;
  interests: string[]; // e.g. ["Debate Club", "Internships"]
  createdAt: string;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  office?: string;
}

export interface Location {
  label: string;
  lat?: number;
  lng?: number;
  mapsQuery?: string;
}

export interface SectionItem {
  id: string;
  section: SectionId;
  title: string;
  subtitle?: string;
  summary: string;
  details?: string;
  tags: string[];
  location?: Location;
  contact?: ContactInfo;
  nextAction: ActionKind;
  // Opt-in extras per section
  deadline?: string; // ISO
  eventDate?: string; // ISO
  rating?: number; // accommodation
}

export type ActionKind =
  | "save-deadline"
  | "contact-department"
  | "get-directions"
  | "save-hostel"
  | "contact-hostel"
  | "call-office"
  | "visit-office"
  | "rsvp"
  | "join-club"
  | "save-opportunity"
  | "apply";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string; // ISO
  audience: {
    studentTypes?: StudentType[];
    living?: LivingSituation[];
    /** If true, only shown to students who marked themselves as international. */
    international?: boolean;
  };
}

export interface Deadline {
  id: string;
  title: string;
  date: string; // ISO
  sectionItemId?: string; // link back to a section item
  category: "registration" | "exam" | "fees" | "other";
}

export interface EventItem {
  id: string;
  title: string;
  date: string; // ISO
  location: string;
  sectionItemId?: string;
}

export interface ChecklistTask {
  id: string;
  title: string;
  done: boolean;
  helpItemId?: string; // link to a section item that helps
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  date: string; // ISO
  read: boolean;
  // Deep link target: either a saved item or an announcement
  target:
    | { kind: "item"; section: SectionId; itemId: string }
    | { kind: "announcement"; id: string }
    | { kind: "deadline"; id: string }
    | { kind: "event"; id: string };
}

export interface SearchResultGroup {
  section: SectionId;
  items: SectionItem[];
}
