import { useEffect, useMemo } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AttributionControl,
  Circle,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Flag, MapPin } from "lucide-react";
import type { CampusPlace, GeoFix, LatLng, WalkRoute } from "@/services";
import { PLACE_ICONS } from "@/ui/placeIcons";

export type MapFocus =
  | { kind: "campus" }
  | { kind: "point"; at: LatLng; zoom?: number }
  | { kind: "route"; route: WalkRoute }
  | { kind: "follow"; at: LatLng };

interface Props {
  center: LatLng;
  places: CampusPlace[];
  selectedId: string | null;
  /** Only show this place's marker (while routing and navigating). */
  onlyId?: string | null;
  onSelect?: (id: string) => void;
  route: WalkRoute | null;
  user: GeoFix | null;
  start: LatLng | null;
  /** Pulse at this entrance (arrival). */
  entrance: LatLng | null;
  /** Current step while following steps without GPS. */
  stepAt?: LatLng | null;
  onMapClick?: (p: LatLng) => void;
  focus: MapFocus;
  /** Bottom padding (px) so a sheet doesn't cover what's in focus. */
  padBottom: number;
  padLeft: number;
}

const toLL = (p: LatLng): [number, number] => [p.lat, p.lng];

/** SVG attributes can't read CSS variables, so resolve the theme colour once. */
const themeRgb = (name: string, fallback: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `rgb(${v.split(/\s+/).join(", ")})` : fallback;
};

const placeIcon = (place: CampusPlace, selected: boolean) => {
  const Icon = PLACE_ICONS[place.category];
  const size = selected ? 46 : 38;
  const svg = renderToStaticMarkup(<Icon width={size * 0.45} height={size * 0.45} strokeWidth={2.2} aria-hidden="true" />);
  return L.divIcon({
    className: "us-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span class="us-marker-dot${selected ? " is-selected" : ""}" style="width:${size}px;height:${size}px">${svg}</span>`,
  });
};

const pinIcon = (kind: "start" | "step") => {
  const svg = renderToStaticMarkup(
    kind === "start" ? <MapPin width={18} height={18} strokeWidth={2.4} aria-hidden="true" /> : <Flag width={16} height={16} strokeWidth={2.4} aria-hidden="true" />,
  );
  return L.divIcon({
    className: "us-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `<span class="us-marker-dot us-marker-${kind}" style="width:36px;height:36px">${svg}</span>`,
  });
};

const userIcon = L.divIcon({ className: "us-marker", iconSize: [22, 22], iconAnchor: [11, 11], html: '<span class="us-user-dot"></span>' });
const entranceIcon = L.divIcon({ className: "us-marker", iconSize: [28, 28], iconAnchor: [14, 14], html: '<span class="us-entrance"></span>' });

const Controller = ({ focus, padBottom, padLeft }: { focus: MapFocus; padBottom: number; padLeft: number }) => {
  const map = useMap();
  const key =
    focus.kind === "route"
      ? `route:${focus.route.points.length}:${focus.route.distance}`
      : focus.kind === "point"
        ? `point:${focus.at.lat},${focus.at.lng}`
        : focus.kind === "follow"
          ? "follow"
          : "campus";

  // Re-fit when the focus changes, or the panels around the map resize.
  useEffect(() => {
    const apply = () => {
      const pad = { paddingTopLeft: [padLeft + 24, 72] as L.PointTuple, paddingBottomRight: [24, padBottom + 24] as L.PointTuple };
      if (focus.kind === "route") {
        map.fitBounds(L.latLngBounds(focus.route.points.map(toLL)), { ...pad, maxZoom: 18, animate: false });
      } else if (focus.kind === "point") {
        const z = focus.zoom ?? 17;
        const target = map.project(toLL(focus.at), z).add([-padLeft / 2, padBottom / 2]);
        map.setView(map.unproject(target, z), z, { animate: false });
      }
    };
    apply();
    // Again once the sheet has finished resizing.
    const t = window.setTimeout(() => {
      map.invalidateSize({ pan: false });
      apply();
    }, 320);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, padBottom, padLeft]);

  // Follow the student while navigating.
  useEffect(() => {
    if (focus.kind !== "follow") return;
    const z = Math.max(map.getZoom(), 18);
    const target = map.project(toLL(focus.at), z).add([-padLeft / 2, padBottom / 2]);
    map.setView(map.unproject(target, z), z, { animate: true });
  }, [focus, map, padBottom, padLeft]);

  return null;
};

const ClickHandler = ({ onClick }: { onClick: (p: LatLng) => void }) => {
  useMapEvents({ click: (e) => onClick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
};

/** Leaflet + OpenStreetMap campus map with category markers, a walking route and the student's position. */
export const CampusMap = ({
  center,
  places,
  selectedId,
  onlyId,
  onSelect,
  route,
  user,
  start,
  entrance,
  stepAt,
  onMapClick,
  focus,
  padBottom,
  padLeft,
}: Props) => {
  const ink = useMemo(() => themeRgb("--us-ink", "rgb(14, 27, 58)"), []);
  const shown = onlyId ? places.filter((p) => p.id === onlyId) : places;
  const icons = useMemo(
    () => Object.fromEntries(places.map((p) => [p.id, { normal: placeIcon(p, false), selected: placeIcon(p, true) }])),
    [places],
  );

  return (
    <MapContainer
      center={toLL(center)}
      zoom={16}
      minZoom={14}
      maxZoom={19}
      zoomControl={false}
      attributionControl={false}
      className={`h-full w-full ${onMapClick ? "us-map-picking" : ""}`}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      <ZoomControl position="topright" />
      <AttributionControl position="topright" prefix={false} />
      <Controller focus={focus} padBottom={padBottom} padLeft={padLeft} />
      {onMapClick && <ClickHandler onClick={onMapClick} />}

      {route && (
        <>
          <Polyline positions={route.points.map(toLL)} pathOptions={{ color: "#ffffff", weight: 10, opacity: 0.9, lineCap: "round", lineJoin: "round" }} />
          <Polyline positions={route.points.map(toLL)} pathOptions={{ color: ink, weight: 5, opacity: 1, lineCap: "round", lineJoin: "round" }} />
        </>
      )}

      {shown.map((p) => (
        <Marker
          key={p.id}
          position={toLL(p)}
          icon={p.id === selectedId ? icons[p.id]!.selected : icons[p.id]!.normal}
          title={p.name}
          alt={p.name}
          zIndexOffset={p.id === selectedId ? 500 : 0}
          eventHandlers={onSelect ? { click: () => onSelect(p.id) } : undefined}
          keyboard={Boolean(onSelect)}
        />
      ))}

      {entrance && <Marker position={toLL(entrance)} icon={entranceIcon} interactive={false} keyboard={false} zIndexOffset={600} />}
      {start && <Marker position={toLL(start)} icon={pinIcon("start")} title="Starting point" alt="Starting point" interactive={false} keyboard={false} zIndexOffset={700} />}
      {stepAt && <Marker position={toLL(stepAt)} icon={pinIcon("step")} interactive={false} keyboard={false} zIndexOffset={650} />}
      {user && (
        <>
          <Circle center={toLL(user)} radius={user.accuracy} pathOptions={{ color: ink, weight: 1, fillOpacity: 0.08, opacity: 0.3 }} interactive={false} />
          <Marker position={toLL(user)} icon={userIcon} title="Your location" alt="Your location" interactive={false} keyboard={false} zIndexOffset={800} />
        </>
      )}
    </MapContainer>
  );
};
