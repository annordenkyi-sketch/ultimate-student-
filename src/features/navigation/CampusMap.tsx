import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L, { type LatLngExpression, type LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CAMPUS_CENTER,
  type CampusCategory,
  type CampusPlace,
} from "@/data/mocks/campusPlaces";

/* ─────────────── Category icon SVGs ─────────────── */

const ICON_SVG: Record<CampusCategory, string> = {
  "Lecture halls":
    '<path d="M3 10v9h18v-9"/><path d="M12 3 2 9h20z"/><path d="M8 19v-7h8v7"/>',
  Libraries:
    '<path d="M4 4h4v16H4z"/><path d="M8 4h4v16H8z"/><path d="M14 4l5 1-3 15-5-1z"/>',
  Offices:
    '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/>',
  Food:
    '<path d="M4 6v16"/><path d="M4 6H2m2 4H2m2 4H2"/><path d="M4 2v20"/><path d="M14 2v8a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V2"/><path d="M17 13v9"/>',
  Health:
    '<path d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="9"/>',
  "Banks & ATMs":
    '<path d="M3 10h18M3 10l9-6 9 6"/><path d="M6 10v8M10 10v8M14 10v8M18 10v8"/><path d="M3 20h18"/>',
  Transport:
    '<rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 11h16"/><circle cx="8" cy="19" r="2"/><circle cx="16" cy="19" r="2"/>',
  Emergency:
    '<path d="M12 2 2 20h20z"/><path d="M12 9v5"/><circle cx="12" cy="17" r="1"/>',
  Hostels:
    '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
};

const BRAND_600 = "#1A3A8F";
const ACCENT_500 = "#C9A227";

const markerSvg = (
  category: CampusCategory,
  { selected }: { selected: boolean },
): string => {
  const pin = selected ? ACCENT_500 : BRAND_600;
  const ring = selected ? BRAND_600 : "#ffffff";
  const icon = ICON_SVG[category] ?? "";
  // 40x50 pin shape, white icon centred in the head.
  return `
    <div style="position:relative;transform:translate(-50%,-100%);filter:drop-shadow(0 2px 4px rgba(10,22,58,.35));will-change:transform;">
      <svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M17 1C8.2 1 1 8 1 16.7 1 28.5 17 43 17 43s16-14.5 16-26.3C33 8 25.8 1 17 1Z"
              fill="${pin}" stroke="${ring}" stroke-width="2"/>
        <circle cx="17" cy="16.5" r="8.2" fill="#ffffff"/>
        <g transform="translate(5 4.5) scale(0.5)" stroke="${pin}" stroke-width="2.2"
           stroke-linecap="round" stroke-linejoin="round" fill="none">
          ${icon}
        </g>
      </svg>
    </div>
  `;
};

const buildMarkerIcon = (
  category: CampusCategory,
  selected: boolean,
): L.DivIcon =>
  L.divIcon({
    className: "us-marker",
    html: markerSvg(category, { selected }),
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -40],
  });

const USER_LOCATION_ICON = L.divIcon({
  className: "us-you-dot",
  html: `
    <div style="position:relative;transform:translate(-50%,-50%);">
      <span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:36px;height:36px;border-radius:9999px;background:rgba(26,58,143,0.18);"></span>
      <span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:9999px;background:#1A3A8F;border:3px solid #ffffff;box-shadow:0 1px 3px rgba(10,22,58,0.45);"></span>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

/* ─────────────── Fit-bounds helper ─────────────── */

interface FitBoundsProps {
  points: LatLngTuple[];
}
const FitBounds = ({ points }: FitBoundsProps) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 17);
      return;
    }
    map.fitBounds(points, { padding: [40, 40], maxZoom: 18 });
  }, [map, points]);
  return null;
};

/** Pans to a given point when it changes (used when the user selects a place). */
interface PanToProps {
  point: LatLngTuple | null;
  zoom?: number;
}
const PanTo = ({ point, zoom }: PanToProps) => {
  const map = useMap();
  useEffect(() => {
    if (!point) return;
    map.flyTo(point, zoom ?? Math.max(map.getZoom(), 17), { duration: 0.6 });
  }, [map, point, zoom]);
  return null;
};

/** Ensures Leaflet recalculates size after the container becomes visible/resizes. */
const InvalidateSize = ({ trigger }: { trigger: unknown }) => {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 60);
    return () => window.clearTimeout(id);
  }, [map, trigger]);
  return null;
};

/* ─────────────── Props ─────────────── */

export interface CampusMapProps {
  places: CampusPlace[];
  selectedId: string;
  onSelect: (id: string) => void;
  userLocation: LatLngTuple | null;
  /** [[lat,lng], …] — the walking-route polyline if one has been requested. */
  routePath: LatLngTuple[] | null;
  /** Re-run invalidateSize whenever this changes (e.g. the mobile sheet height). */
  resizeToken?: unknown;
  /** Extra classes for the wrapper. */
  className?: string;
}

/* ─────────────── Component ─────────────── */

export const CampusMap = ({
  places,
  selectedId,
  onSelect,
  userLocation,
  routePath,
  resizeToken,
  className = "",
}: CampusMapProps) => {
  const center: LatLngExpression = [CAMPUS_CENTER.lat, CAMPUS_CENTER.lng];

  const selectedPlace = useMemo(
    () => places.find((p) => p.id === selectedId) ?? null,
    [places, selectedId],
  );

  const boundsPoints = useMemo<LatLngTuple[]>(
    () => places.map((p) => [p.lat, p.lng] as LatLngTuple),
    [places],
  );

  const flyTarget: LatLngTuple | null = selectedPlace
    ? [selectedPlace.lat, selectedPlace.lng]
    : null;

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom
        preferCanvas
        className="h-full w-full"
        style={{ background: "#EEF2FA" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <FitBounds points={boundsPoints} />
        <PanTo point={flyTarget} />
        <InvalidateSize trigger={resizeToken} />

        {places.map((p) => {
          const isSelected = selectedId === p.id;
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={buildMarkerIcon(p.category, isSelected)}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{
                click: () => onSelect(p.id),
                keypress: (e) => {
                  if (e.originalEvent.key === "Enter") onSelect(p.id);
                },
              }}
              keyboard
              title={p.name}
            />
          );
        })}

        {userLocation && (
          <Marker
            position={userLocation}
            icon={USER_LOCATION_ICON}
            keyboard={false}
            interactive={false}
          />
        )}

        {routePath && routePath.length >= 2 && (
          <>
            <Polyline
              positions={routePath}
              pathOptions={{
                color: "#1A3A8F",
                weight: 6,
                opacity: 0.85,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            <Polyline
              positions={routePath}
              pathOptions={{
                color: "#C9A227",
                weight: 2,
                dashArray: "1 10",
                opacity: 0.95,
                lineCap: "round",
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
};
