import type { GeoFix, LatLng } from "@/services";

const R = 6_371_000;
const rad = (d: number) => (d * Math.PI) / 180;

/** Metres between two points. */
export const distance = (a: LatLng, b: LatLng): number => {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** Compass bearing in degrees from a to b. */
export const bearing = (a: LatLng, b: LatLng): number => {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

/** Average walking pace: about 4.8 km/h. */
export const WALK_METRES_PER_MIN = 80;
export const walkMinutes = (metres: number) => Math.max(1, Math.round(metres / WALK_METRES_PER_MIN));

export const formatDistance = (metres: number) =>
  metres < 1000 ? `${Math.max(10, Math.round(metres / 10) * 10)} m` : `${(metres / 1000).toFixed(1)} km`;

// Flat x/y in metres around a reference point; accurate enough at campus scale.
const project = (p: LatLng, ref: LatLng) => ({
  x: rad(p.lng - ref.lng) * R * Math.cos(rad(ref.lat)),
  y: rad(p.lat - ref.lat) * R,
});

/** Where a point sits relative to a polyline: how far along it, and how far off it. */
export const locateOnLine = (p: LatLng, line: LatLng[]): { along: number; offBy: number } => {
  let best = { along: 0, offBy: Infinity };
  let walked = 0;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i]!;
    const b = line[i + 1]!;
    const pa = project(a, a);
    const pb = project(b, a);
    const pp = project(p, a);
    const segLen = Math.hypot(pb.x - pa.x, pb.y - pa.y);
    const t = segLen === 0 ? 0 : Math.max(0, Math.min(1, ((pp.x - pa.x) * (pb.x - pa.x) + (pp.y - pa.y) * (pb.y - pa.y)) / segLen ** 2));
    const off = Math.hypot(pp.x - (pa.x + t * (pb.x - pa.x)), pp.y - (pa.y + t * (pb.y - pa.y)));
    if (off < best.offBy) best = { along: walked + t * segLen, offBy: off };
    walked += segLen;
  }
  return best;
};

/** The point `metres` along a polyline. */
export const pointAlong = (line: LatLng[], metres: number): LatLng => {
  let left = metres;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i]!;
    const b = line[i + 1]!;
    const seg = distance(a, b);
    if (left <= seg) {
      const t = seg === 0 ? 0 : left / seg;
      return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
    }
    left -= seg;
  }
  return line[line.length - 1]!;
};

/** Good enough to navigate with: precise, and on or near campus. */
export const isReliable = (fix: GeoFix, area: { center: LatLng; radiusM: number }) =>
  fix.accuracy <= 50 && distance(fix, area.center) <= area.radiusM;
