import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronRight,
  Clock,
  Locate,
  MapPin,
  Phone,
  Search,
} from "lucide-react";
import { navigation as PLACES } from "@/data/mocks/navigation";
import type { SectionItem } from "@/data/types";

type Category =
  | "All"
  | "Halls"
  | "Libraries"
  | "Services"
  | "Food"
  | "ATMs"
  | "Sports";

interface Meta {
  mapX: number; // 0–100 % of SVG viewBox for the illustrative map
  mapY: number;
  lat: number;
  lng: number;
  categories: Category[];
  hours?: string;
}

/** Illustrative map positions + approximate University of Ghana (Legon) coords. */
const META: Record<string, Meta> = {
  "nav-1": {
    mapX: 32, mapY: 44,
    lat: 5.6509, lng: -0.1870,
    categories: ["Libraries"],
    hours: "Open daily · 24/7 reading area",
  },
  "nav-2": {
    mapX: 72, mapY: 28,
    lat: 5.6530, lng: -0.1845,
    categories: ["Halls"],
    hours: "Residents only",
  },
  "nav-3": {
    mapX: 54, mapY: 60,
    lat: 5.6504, lng: -0.1868,
    categories: ["Services"],
    hours: "Mon–Fri · 09:00–17:00",
  },
  "nav-4": {
    mapX: 82, mapY: 68,
    lat: 5.6497, lng: -0.1855,
    categories: ["ATMs"],
    hours: "Open 24/7",
  },
  "nav-5": {
    mapX: 20, mapY: 68,
    lat: 5.6488, lng: -0.1893,
    categories: ["Services"],
    hours: "Mon–Sun · 08:00–20:00",
  },
  "nav-6": {
    mapX: 50, mapY: 18,
    lat: 5.6515, lng: -0.1872,
    categories: ["Halls"],
    hours: "Open for scheduled events",
  },
  "nav-7": {
    mapX: 86, mapY: 84,
    lat: 5.6482, lng: -0.1848,
    categories: ["Food"],
    hours: "Daily · 10:00–23:00",
  },
  "nav-8": {
    mapX: 16, mapY: 84,
    lat: 5.6479, lng: -0.1901,
    categories: ["Sports"],
    hours: "Mon–Sat · 06:00–21:00",
  },
};

const YOU_ARE_HERE = { x: 48, y: 52 };

const CATEGORIES: Category[] = [
  "All",
  "Halls",
  "Libraries",
  "Services",
  "Food",
  "ATMs",
  "Sports",
];

const WALK_SPEED_M_PER_MIN = 80;

type LocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable";

interface Coord {
  lat: number;
  lng: number;
}

const haversineMeters = (a: Coord, b: Coord): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

const formatDistance = (meters: number): string =>
  meters >= 1000
    ? `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`
    : `${Math.round(meters / 10) * 10} m`;

const walkMinutes = (meters: number): number =>
  Math.max(1, Math.round(meters / WALK_SPEED_M_PER_MIN));

/* ───────────────────────────── Highlight helper ───────────────────────────── */

const escapeRegExp = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(query.trim())})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-accent-200 px-0.5 text-ink">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
};

/* ───────────────────────────── Directions helper ───────────────────────────── */

const openInMaps = (item: SectionItem, origin: Coord | null) => {
  const destination =
    item.location?.mapsQuery ?? item.location?.label ?? item.title;
  const url = origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${encodeURIComponent(destination)}&travelmode=walking`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
  window.open(url, "_blank", "noopener,noreferrer");
};

/* ───────────────────────────── Map SVG ───────────────────────────── */

interface CampusMapProps {
  places: SectionItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const CampusMap = ({ places, selectedId, onSelect }: CampusMapProps) => {
  const w = 500;
  const h = 300;
  return (
    <div className="relative aspect-[5/3] w-full overflow-hidden rounded-xl border border-line bg-emerald-50 lg:aspect-auto lg:h-[520px]">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        role="img"
        aria-label="Illustrative campus map"
      >
        <ellipse cx="190" cy="190" rx="150" ry="55" fill="#d1fae5" />
        <ellipse cx="380" cy="110" rx="80" ry="50" fill="#d1fae5" />
        <ellipse cx="100" cy="90" rx="60" ry="35" fill="#d1fae5" />

        <path d="M 30 200 L 470 200" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 3" fill="none" />
        <path d="M 250 20 L 250 280" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 3" fill="none" />
        <path d="M 60 60 Q 220 110 440 55" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 3" fill="none" />

        <g>
          <circle cx={(YOU_ARE_HERE.x / 100) * w} cy={(YOU_ARE_HERE.y / 100) * h} r="18" fill="rgba(16, 185, 129, 0.18)" />
          <circle cx={(YOU_ARE_HERE.x / 100) * w} cy={(YOU_ARE_HERE.y / 100) * h} r="7" fill="#10b981" stroke="white" strokeWidth="3" />
          <text x={(YOU_ARE_HERE.x / 100) * w} y={(YOU_ARE_HERE.y / 100) * h + 24} textAnchor="middle" fontSize="10" fontWeight="600" fill="#065f46">
            You are here
          </text>
        </g>

        {places.map((p) => {
          const m = META[p.id];
          if (!m) return null;
          const x = (m.mapX / 100) * w;
          const y = (m.mapY / 100) * h;
          const isSelected = selectedId === p.id;
          return (
            <g key={p.id} style={{ cursor: "pointer" }} onClick={() => onSelect(p.id)}>
              {isSelected && <circle cx={x} cy={y} r="18" fill="rgba(79, 70, 229, 0.18)" />}
              <circle cx={x} cy={y} r={isSelected ? 9 : 7} fill={isSelected ? "#4f46e5" : "#64748b"} stroke="white" strokeWidth="2" />
              <text x={x} y={y - 14} textAnchor="middle" fontSize="9" fontWeight="600" fill={isSelected ? "#312e81" : "#334155"}>
                {p.title}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="pointer-events-none absolute bottom-2 left-3 text-[10px] text-muted">
        Illustrative campus map · not to scale
      </p>
    </div>
  );
};

/* ───────────────────────────── Selected card ───────────────────────────── */

interface SelectedCardProps {
  item: SectionItem;
  meta: Meta;
  userLocation: Coord | null;
  locationStatus: LocationStatus;
}

const SelectedCard = ({
  item,
  meta,
  userLocation,
  locationStatus,
}: SelectedCardProps) => {
  const canShowWalk =
    userLocation !== null && locationStatus === "granted";
  const meters = canShowWalk
    ? haversineMeters(userLocation, { lat: meta.lat, lng: meta.lng })
    : null;

  return (
    <article className="rounded-xl border border-line bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        Explore your campus
      </p>
      <h2 className="mt-1 text-xl font-bold text-ink">{item.title}</h2>
      {item.subtitle && (
        <p className="text-sm text-muted">{item.subtitle}</p>
      )}

      <p className="mt-3 flex items-center gap-2 text-sm text-ink">
        <Clock className="h-4 w-4 text-muted" aria-hidden="true" />
        {meters !== null ? (
          <>
            {formatDistance(meters)} · {walkMinutes(meters)} min walk
          </>
        ) : (
          <span className="text-muted">
            Turn on location to see walking times
          </span>
        )}
      </p>

      <button
        type="button"
        onClick={() => openInMaps(item, userLocation)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 motion-safe:active:scale-[0.98]"
      >
        Get directions
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </button>

      {(meta.hours || item.contact?.phone) && (
        <dl className="mt-4 space-y-2 border-t border-line/60 pt-3 text-xs text-muted">
          {meta.hours && (
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
              <div>
                <dt className="sr-only">Opening hours</dt>
                <dd>{meta.hours}</dd>
              </div>
            </div>
          )}
          {item.contact?.phone && (
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
              <div>
                <dt className="sr-only">Phone</dt>
                <dd>
                  <a
                    href={`tel:${item.contact.phone.replace(/\s/g, "")}`}
                    className="font-medium text-ink hover:text-brand-700"
                  >
                    {item.contact.phone}
                  </a>
                </dd>
              </div>
            </div>
          )}
        </dl>
      )}

      <Link
        to={`/section/navigation/${item.id}`}
        className="mt-3 inline-block text-xs font-semibold text-brand-700 hover:text-brand-800"
      >
        View full details →
      </Link>
    </article>
  );
};

/* ───────────────────────────── Places list ───────────────────────────── */

interface PlacesListProps {
  places: SectionItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  query: string;
  userLocation: Coord | null;
  locationStatus: LocationStatus;
}

const PlacesList = ({
  places,
  selectedId,
  onSelect,
  query,
  userLocation,
  locationStatus,
}: PlacesListProps) => {
  const canShowWalk =
    userLocation !== null && locationStatus === "granted";
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-ink">
        Places on campus
      </h3>
      {places.length === 0 ? (
        <div className="rounded-xl border border-line bg-white p-4 text-sm text-muted">
          No results for{" "}
          <strong className="text-ink">"{query}"</strong> in Campus map.
          <Link
            to={`/search?q=${encodeURIComponent(query)}`}
            className="mt-1 block text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            Search all of Ultimate Student
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-line/60 overflow-hidden rounded-xl border border-line bg-white">
          {places.map((p) => {
            const m = META[p.id];
            const isSelected = selectedId === p.id;
            const meters =
              canShowWalk && m
                ? haversineMeters(userLocation, { lat: m.lat, lng: m.lng })
                : null;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelect(p.id)}
                  aria-pressed={isSelected}
                  className={`flex w-full items-center gap-3 p-3 text-left transition ${
                    isSelected ? "bg-brand-50" : "hover:bg-paper"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isSelected
                        ? "bg-brand-100 text-brand-700"
                        : "bg-paper text-muted"
                    }`}
                  >
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      <Highlight text={p.title} query={query} />
                    </span>
                    {meters !== null ? (
                      <span className="block truncate text-xs text-muted">
                        {formatDistance(meters)} · {walkMinutes(meters)} min walk
                      </span>
                    ) : (
                      p.location?.label && (
                        <span className="block truncate text-xs text-muted">
                          {p.location.label}
                        </span>
                      )
                    )}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

/* ───────────────────────────── Location banner ───────────────────────────── */

const LocationBanner = ({
  status,
  onAllow,
}: {
  status: LocationStatus;
  onAllow: () => void;
}) => {
  if (status === "granted") return null;
  const title =
    status === "denied"
      ? "Location permission is off"
      : status === "unavailable"
        ? "Location isn't available on this device"
        : "Allow location to see how far each place is from you";
  const buttonLabel = status === "denied" ? "Try again" : "Allow location";
  const showButton = status !== "unavailable";

  return (
    <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-line bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
          <Locate className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="text-sm text-ink">{title}</p>
      </div>
      {showButton && (
        <button
          type="button"
          onClick={onAllow}
          disabled={status === "requesting"}
          className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "requesting" ? "Asking…" : buttonLabel}
        </button>
      )}
    </div>
  );
};

/* ───────────────────────────── Page ───────────────────────────── */

export const NavigationPage = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [selectedId, setSelectedId] = useState<string>(PLACES[0].id);
  const [sort, setSort] = useState<"nearest" | "alpha">("nearest");
  const [userLocation, setUserLocation] = useState<Coord | null>(null);
  const [locationStatus, setLocationStatus] =
    useState<LocationStatus>("idle");

  // Check permission state up-front; auto-start watch if already granted.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }
    const permissions = navigator.permissions;
    if (!permissions || typeof permissions.query !== "function") {
      // Can't query without triggering a prompt — leave the banner visible.
      return;
    }
    permissions
      .query({ name: "geolocation" as PermissionName })
      .then((result) => {
        if (result.state === "granted") {
          startWatching();
        } else if (result.state === "denied") {
          setLocationStatus("denied");
        }
      })
      .catch(() => {
        /* ignore — leave as idle */
      });
    // startWatching never changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startWatching = () => {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }
    setLocationStatus("requesting");
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationStatus("granted");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setLocationStatus("denied");
        else setLocationStatus("unavailable");
      },
      { enableHighAccuracy: false, maximumAge: 15000, timeout: 15000 },
    );
    // Store watchId on window so hot reloads don't leak — small MVP concession
    (window as unknown as { __locWatch?: number }).__locWatch = watchId;
  };

  // Cleanup
  useEffect(() => {
    return () => {
      const id = (window as unknown as { __locWatch?: number }).__locWatch;
      if (id != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(id);
      }
    };
  }, []);

  const canSortByNearest =
    locationStatus === "granted" && userLocation !== null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = PLACES.filter((p) => {
      const m = META[p.id];
      if (!m) return false;
      if (category !== "All" && !m.categories.includes(category)) return false;
      if (q) {
        const hay = `${p.title} ${p.summary} ${p.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sort === "nearest" && canSortByNearest && userLocation) {
      list = [...list].sort((a, b) => {
        const ma = META[a.id];
        const mb = META[b.id];
        return (
          haversineMeters(userLocation, { lat: ma.lat, lng: ma.lng }) -
          haversineMeters(userLocation, { lat: mb.lat, lng: mb.lng })
        );
      });
    } else {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [query, category, sort, canSortByNearest, userLocation]);

  const selected =
    PLACES.find((p) => p.id === selectedId) ?? filtered[0] ?? PLACES[0];
  const selectedMeta = META[selected.id];

  const visibleIds = filtered.map((p) => p.id);
  const effectiveSelected =
    visibleIds.includes(selectedId) || visibleIds.length === 0
      ? selected
      : filtered[0];
  const effectiveMeta = META[effectiveSelected.id] ?? selectedMeta;

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-ink">Campus map</h1>
        <p className="mt-1 text-sm text-muted">
          Find buildings, halls, offices, ATMs and clinics on campus.
        </p>
      </header>

      <LocationBanner status={locationStatus} onAllow={startWatching} />

      <div className="mb-4 space-y-3">
        <label htmlFor="place-search" className="sr-only">
          Search places on campus
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            id="place-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places on campus…"
            className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-brand-500"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Category filter"
            className="scrollbar-hide -mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1"
          >
            {CATEGORIES.map((c) => {
              const isActive = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setCategory(c)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
                    isActive
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-line bg-white text-ink hover:border-line hover:bg-paper"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* Sort toggle */}
          <div
            role="group"
            aria-label="Sort places"
            className="shrink-0 overflow-hidden rounded-full border border-line bg-white text-xs font-medium"
          >
            <button
              type="button"
              onClick={() => setSort("nearest")}
              disabled={!canSortByNearest}
              aria-pressed={sort === "nearest" && canSortByNearest}
              className={`px-3 py-1 transition ${
                sort === "nearest" && canSortByNearest
                  ? "bg-ink text-white"
                  : "text-ink hover:bg-paper disabled:cursor-not-allowed disabled:text-muted"
              }`}
            >
              Nearest
            </button>
            <button
              type="button"
              onClick={() => setSort("alpha")}
              aria-pressed={sort === "alpha" || !canSortByNearest}
              className={`border-l border-line px-3 py-1 transition ${
                sort === "alpha" || !canSortByNearest
                  ? "bg-ink text-white"
                  : "text-ink hover:bg-paper"
              }`}
            >
              A–Z
            </button>
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[360px_1fr] lg:gap-6">
        <div className="space-y-4 lg:order-2">
          <CampusMap
            places={filtered}
            selectedId={effectiveSelected.id}
            onSelect={setSelectedId}
          />
          {effectiveMeta && (
            <SelectedCard
              item={effectiveSelected}
              meta={effectiveMeta}
              userLocation={userLocation}
              locationStatus={locationStatus}
            />
          )}
        </div>

        <aside className="mt-6 lg:order-1 lg:mt-0">
          <PlacesList
            places={filtered}
            selectedId={effectiveSelected.id}
            onSelect={setSelectedId}
            query={query}
            userLocation={userLocation}
            locationStatus={locationStatus}
          />
        </aside>
      </div>
    </div>
  );
};
