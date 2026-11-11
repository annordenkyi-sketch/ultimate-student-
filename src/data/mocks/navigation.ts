import type { SectionItem } from "@/data/types";
import { CAMPUS_PLACES } from "@/data/mocks/campusPlaces";

/**
 * Derived from CAMPUS_PLACES so the Section detail page (`/section/navigation/:id`)
 * and the map share one source of truth.
 */
export const navigation: SectionItem[] = CAMPUS_PLACES.map((p) => ({
  id: p.id,
  section: "navigation",
  title: p.name,
  subtitle: p.subtitle,
  summary: p.summary,
  details: p.details,
  tags: p.tags,
  nextAction: "get-directions",
  location: {
    label: p.subtitle ? `${p.name}, ${p.subtitle}` : p.name,
    lat: p.lat,
    lng: p.lng,
    mapsQuery: p.mapsQuery ?? p.name,
  },
  contact: {
    phone: p.phone,
    email: p.email,
  },
}));
