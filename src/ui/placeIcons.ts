import {
  Banknote,
  BedDouble,
  Building2,
  HeartPulse,
  Library,
  School,
  Trophy,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { PlaceCategory } from "@/services";

export const PLACE_ICONS: Record<PlaceCategory, LucideIcon> = {
  Food: UtensilsCrossed,
  "Lecture halls": School,
  Libraries: Library,
  Offices: Building2,
  ATMs: Banknote,
  Health: HeartPulse,
  Hostels: BedDouble,
  Sports: Trophy,
};
