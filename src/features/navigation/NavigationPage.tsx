import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { LatLngTuple } from "leaflet";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Loader2,
  Locate,
  MapPin,
  Phone,
  Route,
  Search,
  X,
} from "lucide-react";
import {
  CAMPUS_CATEGORIES,
  CAMPUS_PLACES,
  type CampusCategory,
  type CampusPlace,
} from "@/data/mocks/campusPlaces";
import { unsplash, unsplashSrcSet } from "@/lib/images";
import { MobileBackButton } from "@/components/MobileBackButton";
import { useBackIntercept } from "@/hooks/useBackIntercept";
import { CampusMap } from "./CampusMap";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ utilities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ walking-route fetch (OSRM foot profile) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface RouteResult {
  path: LatLngTuple[];
  distanceMeters: number;
  durationSeconds: number;
}

const fetchWalkingRoute = async (
  from: Coord,
  to: Coord,
  signal: AbortSignal,
): Promise<RouteResult | null> => {
  const url = `https://router.project-osrm.org/route/v1/foot/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    routes?: Array<{
      geometry: { coordinates: [number, number][] };
      distance: number;
      duration: number;
    }>;
  };
  const route = data.routes?.[0];
  if (!route) return null;
  const path: LatLngTuple[] = route.geometry.coordinates.map(
    ([lng, lat]) => [lat, lng],
  );
  return {
    path,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Selected card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface SelectedCardProps {
  place: CampusPlace;
  userLocation: Coord | null;
  locationStatus: LocationStatus;
  routeResult: RouteResult | null;
  routeLoading: boolean;
  routeError: string | null;
  onGetDirections: () => void;
  onClearRoute: () => void;
  compact?: boolean;
}

const SelectedCard = ({
  place,
  userLocation,
  locationStatus,
  routeResult,
  routeLoading,
  routeError,
  onGetDirections,
  onClearRoute,
  compact,
}: SelectedCardProps) => {
  const canShowWalk =
    userLocation !== null && locationStatus === "granted";
  const straightLineMeters = canShowWalk
    ? haversineMeters(userLocation, { lat: place.lat, lng: place.lng })
    : null;
  const routedMinutes = routeResult
    ? Math.max(1, Math.round(routeResult.durationSeconds / 60))
    : null;

  return (
    <article className="rounded-2xl border border-line bg-white p-4 shadow-lg shadow-brand-900/10">
      <div className={`flex gap-3 ${compact ? "items-center" : "items-start"}`}>
        <div
          className={`shrink-0 overflow-hidden rounded-xl bg-brand-50 ${
            compact ? "h-14 w-14" : "h-20 w-20"
          }`}
        >
          <img
            src={unsplash(place.photoId, 400)}
            srcSet={unsplashSrcSet(place.photoId)}
            sizes="80px"
            alt={place.photoAlt}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-700">
            {place.category}
          </p>
          <h2 className="truncate text-lg font-bold text-ink">
            {place.name}
          </h2>
          {place.subtitle && (
            <p className="truncate text-xs text-muted">{place.subtitle}</p>
          )}
        </div>
      </div>

      <p className="mt-3 flex items-center gap-2 text-sm text-ink">
        <Route className="h-4 w-4 text-muted" aria-hidden="true" />
        {routeResult ? (
          <>
            {formatDistance(routeResult.distanceMeters)} Â· {routedMinutes} min
            walk
          </>
        ) : straightLineMeters !== null ? (
          <>
            {formatDistance(straightLineMeters)} Â·{" "}
            {walkMinutes(straightLineMeters)} min walk
          </>
        ) : (
          <span className="text-muted">
            Turn on location to see walking times
          </span>
        )}
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onGetDirections}
          disabled={routeLoading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-500 hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-70 motion-safe:active:scale-[0.98]"
        >
          {routeLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Finding route
            </>
          ) : (
            <>
              Get directions
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
        {routeResult && (
          <button
            type="button"
            onClick={onClearRoute}
            className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-semibold text-ink hover:bg-paper"
            aria-label="Clear route"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {routeError && (
        <p className="mt-2 text-xs text-rose-600">{routeError}</p>
      )}

      {(place.hours || place.phone) && (
        <dl className="mt-4 space-y-2 border-t border-line/60 pt-3 text-xs text-muted">
          {place.hours && (
            <div className="flex items-start gap-2">
              <Clock
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted"
                aria-hidden="true"
              />
              <div>
                <dt className="sr-only">Opening hours</dt>
                <dd>{place.hours}</dd>
              </div>
            </div>
          )}
          {place.phone && (
            <div className="flex items-start gap-2">
              <Phone
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted"
                aria-hidden="true"
              />
              <div>
                <dt className="sr-only">Phone</dt>
                <dd>
                  <a
                    href={`tel:${place.phone.replace(/\s/g, "")}`}
                    className="font-medium text-ink hover:text-brand-700 hover:underline"
                  >
                    {place.phone}
                  </a>
                </dd>
              </div>
            </div>
          )}
        </dl>
      )}

      <Link
        to={`/section/navigation/${place.id}`}
        className="mt-3 inline-block text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline"
      >
        View full details â†’
      </Link>
    </article>
  );
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ List row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface PlaceRowProps {
  place: CampusPlace;
  query: string;
  isSelected: boolean;
  distanceLabel: string | null;
  onSelect: () => void;
}

const PlaceRow = ({
  place,
  query,
  isSelected,
  distanceLabel,
  onSelect,
}: PlaceRowProps) => (
  <li>
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`flex w-full items-center gap-3 p-3 text-left transition ${
        isSelected ? "bg-brand-50" : "hover:bg-paper"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          isSelected
            ? "bg-brand-600 text-white"
            : "bg-paper text-muted"
        }`}
      >
        <MapPin className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">
          <Highlight text={place.name} query={query} />
        </span>
        <span className="block truncate text-xs text-muted">
          {distanceLabel ?? place.subtitle ?? place.category}
        </span>
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted"
        aria-hidden="true"
      />
    </button>
  </li>
);

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Location banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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
      ? "Location is off"
      : status === "unavailable"
        ? "Location isn't available on this device"
        : "Allow location to see walking times";
  const buttonLabel = status === "denied" ? "Try again" : "Allow";
  const showButton = status !== "unavailable";

  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 shadow-sm">
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        <Locate className="h-4 w-4" aria-hidden="true" />
      </span>
      <p className="min-w-0 flex-1 truncate text-xs text-ink">{title}</p>
      {showButton && (
        <button
          type="button"
          onClick={onAllow}
          disabled={status === "requesting"}
          className="shrink-0 rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-accent-500 hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "requesting" ? "â€¦" : buttonLabel}
        </button>
      )}
    </div>
  );
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

type CategoryChoice = "All" | CampusCategory;

export const NavigationPage = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryChoice>("All");
  const [selectedId, setSelectedId] = useState<string>(CAMPUS_PLACES[0].id);
  const [userLocation, setUserLocation] = useState<Coord | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const routeAbortRef = useRef<AbortController | null>(null);

  /* ---------- geolocation ---------- */

  const startWatching = () => {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }
    setLocationStatus("requesting");
    const id = navigator.geolocation.watchPosition(
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
    watchIdRef.current = id;
  };

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }
    const permissions = navigator.permissions;
    if (!permissions || typeof permissions.query !== "function") return;
    permissions
      .query({ name: "geolocation" as PermissionName })
      .then((result) => {
        if (result.state === "granted") startWatching();
        else if (result.state === "denied") setLocationStatus("denied");
      })
      .catch(() => {});
    // startWatching is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    },
    [],
  );

  /* ---------- filtering ---------- */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CAMPUS_PLACES.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (!q) return true;
      const hay = `${p.name} ${p.subtitle ?? ""} ${p.summary} ${p.tags.join(" ")} ${p.category}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, category]);

  const canSortByNearest =
    locationStatus === "granted" && userLocation !== null;

  const sorted = useMemo(() => {
    if (!canSortByNearest || !userLocation) {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...filtered].sort(
      (a, b) =>
        haversineMeters(userLocation, { lat: a.lat, lng: a.lng }) -
        haversineMeters(userLocation, { lat: b.lat, lng: b.lng }),
    );
  }, [filtered, canSortByNearest, userLocation]);

  const selected =
    CAMPUS_PLACES.find((p) => p.id === selectedId) ??
    sorted[0] ??
    CAMPUS_PLACES[0];

  // If the current selection falls outside the filter, fall through to first visible.
  const effectiveSelected =
    sorted.some((p) => p.id === selected.id) || sorted.length === 0
      ? selected
      : sorted[0];

  /* ---------- selection changes clear any route ---------- */

  useEffect(() => {
    setRouteResult(null);
    setRouteError(null);
    if (routeAbortRef.current) routeAbortRef.current.abort();
  }, [selectedId]);

  /* ---------- directions ---------- */

  const handleGetDirections = async () => {
    if (!userLocation) {
      setRouteError("Allow location to see walking directions.");
      startWatching();
      return;
    }
    if (routeAbortRef.current) routeAbortRef.current.abort();
    const controller = new AbortController();
    routeAbortRef.current = controller;
    setRouteLoading(true);
    setRouteError(null);
    try {
      const res = await fetchWalkingRoute(
        userLocation,
        { lat: effectiveSelected.lat, lng: effectiveSelected.lng },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      if (!res) {
        setRouteError("Couldn't load a walking route. Try again.");
        setRouteResult(null);
      } else {
        setRouteResult(res);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setRouteError("Couldn't load a walking route. Check your connection.");
    } finally {
      setRouteLoading(false);
    }
  };

  const handleClearRoute = () => {
    if (routeAbortRef.current) routeAbortRef.current.abort();
    setRouteResult(null);
    setRouteError(null);
  };

  /* ---------- derived values ---------- */

  const rowDistanceLabel = (p: CampusPlace): string | null => {
    if (!canSortByNearest || !userLocation) return null;
    const m = haversineMeters(userLocation, { lat: p.lat, lng: p.lng });
    return `${formatDistance(m)} Â· ${walkMinutes(m)} min walk`;
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  };

  const userLatLng: LatLngTuple | null = userLocation
    ? [userLocation.lat, userLocation.lng]
    : null;

  /* ---------- back-button intercept ---------- */

  const handleMobileBack = (): boolean => {
    if (routeResult || routeLoading) {
      handleClearRoute();
      return true;
    }
    if (sheetOpen) {
      setSheetOpen(false);
      return true;
    }
    return false;
  };

  // Phone back / swipe mirrors the visible back button.
  useBackIntercept(sheetOpen || routeResult !== null, () => {
    if (routeResult) handleClearRoute();
    else if (sheetOpen) setSheetOpen(false);
  });

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

  return (
    <div className="-mx-4 -mt-4 sm:-mx-6 lg:mx-0 lg:mt-0">
      {/* Desktop header (list / map share the page width) */}
      <header className="hidden lg:block lg:mb-4">
        <h1 className="text-2xl font-bold text-ink">Campus map</h1>
        <p className="mt-1 text-sm text-muted">
          Find halls, libraries, offices, food, health, ATMs, transport and
          emergency points on campus.
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[360px_1fr] lg:gap-6">
        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Desktop: left list column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <aside className="hidden lg:flex lg:flex-col lg:gap-3 lg:self-start">
          <LocationBanner status={locationStatus} onAllow={startWatching} />

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search places on campusâ€¦"
              aria-label="Search places on campus"
              className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-brand-500"
            />
          </div>

          <CategoryChips
            selected={category}
            onChange={setCategory}
          />

          <SelectedCard
            place={effectiveSelected}
            userLocation={userLocation}
            locationStatus={locationStatus}
            routeResult={routeResult}
            routeLoading={routeLoading}
            routeError={routeError}
            onGetDirections={handleGetDirections}
            onClearRoute={handleClearRoute}
          />

          <section>
            <h3 className="mb-2 mt-2 text-sm font-semibold text-ink">
              {sorted.length === 0
                ? "No places match"
                : `Places on campus (${sorted.length})`}
            </h3>
            {sorted.length === 0 ? (
              <div className="rounded-xl border border-line bg-white p-4 text-sm text-muted">
                No results in Campus map.
                <Link
                  to={`/search?q=${encodeURIComponent(query)}`}
                  className="mt-1 block text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                >
                  Search all of Ultimate Student
                </Link>
              </div>
            ) : (
              <ul
                className="max-h-[420px] divide-y divide-line/60 overflow-y-auto rounded-xl border border-line bg-white"
                role="listbox"
                aria-label="Places on campus"
              >
                {sorted.map((p) => (
                  <PlaceRow
                    key={p.id}
                    place={p}
                    query={query}
                    isSelected={p.id === effectiveSelected.id}
                    distanceLabel={rowDistanceLabel(p)}
                    onSelect={() => handleSelect(p.id)}
                  />
                ))}
              </ul>
            )}
          </section>
        </aside>

        {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Map column (both desktop + mobile) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="relative">
          {/* Mobile header overlay above the map */}
          <div className="relative z-[1050] border-b border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
            <MobileBackButton
              onBeforeNavigate={handleMobileBack}
              className="absolute left-3 top-3"
            />
            <h1 className="pl-14 text-lg font-bold text-ink">Campus map</h1>
            <div className="relative mt-2">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search placesâ€¦"
                aria-label="Search places on campus"
                className="min-h-[40px] w-full rounded-xl border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-brand-500"
              />
            </div>
            <div className="mt-2">
              <LocationBanner
                status={locationStatus}
                onAllow={startWatching}
              />
            </div>
            <div className="mt-2">
              <CategoryChips
                selected={category}
                onChange={setCategory}
                compact
              />
            </div>
          </div>

          {/* The map itself â€” fills the remaining viewport on mobile,
             fixed-height on desktop. */}
          <div
            className="relative h-[calc(100dvh-14.5rem)] min-h-[320px] lg:h-[640px]"
            aria-label="Interactive campus map"
          >
            <CampusMap
              places={sorted}
              selectedId={effectiveSelected.id}
              onSelect={handleSelect}
              userLocation={userLatLng}
              routePath={routeResult?.path ?? null}
              resizeToken={sheetOpen}
              className="h-full w-full"
            />
          </div>

          {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Mobile pull-up sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <MobileSheet
            open={sheetOpen}
            onToggle={() => setSheetOpen((v) => !v)}
            selectedCard={
              <SelectedCard
                place={effectiveSelected}
                userLocation={userLocation}
                locationStatus={locationStatus}
                routeResult={routeResult}
                routeLoading={routeLoading}
                routeError={routeError}
                onGetDirections={handleGetDirections}
                onClearRoute={handleClearRoute}
              />
            }
            places={sorted}
            selectedId={effectiveSelected.id}
            onSelect={handleSelect}
            query={query}
            rowDistanceLabel={rowDistanceLabel}
          />
        </div>
      </div>
    </div>
  );
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Category chips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface CategoryChipsProps {
  selected: CategoryChoice;
  onChange: (c: CategoryChoice) => void;
  compact?: boolean;
}

const CategoryChips = ({
  selected,
  onChange,
  compact,
}: CategoryChipsProps) => {
  const chips: CategoryChoice[] = ["All", ...CAMPUS_CATEGORIES];
  return (
    <div
      role="group"
      aria-label="Category filter"
      className={`scrollbar-hide -mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 ${
        compact ? "pb-0" : "pb-1"
      }`}
    >
      {chips.map((c) => {
        const isActive = selected === c;
        return (
          <button
            key={c}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(c)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
              isActive
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-line bg-white text-ink hover:border-brand-400 hover:bg-paper"
            }`}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Mobile pull-up sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface MobileSheetProps {
  open: boolean;
  onToggle: () => void;
  selectedCard: React.ReactNode;
  places: CampusPlace[];
  selectedId: string;
  onSelect: (id: string) => void;
  query: string;
  rowDistanceLabel: (p: CampusPlace) => string | null;
}

const MobileSheet = ({
  open,
  onToggle,
  selectedCard,
  places,
  selectedId,
  onSelect,
  query,
  rowDistanceLabel,
}: MobileSheetProps) => (
  <div
    className={`fixed inset-x-0 bottom-0 z-[1100] mx-auto flex max-h-[80dvh] w-full max-w-[720px] flex-col rounded-t-2xl border border-line bg-white shadow-2xl shadow-brand-900/15 transition-transform duration-300 ease-out lg:hidden ${
      open ? "translate-y-0" : "translate-y-[calc(100%-13rem)]"
    }`}
    style={{
      paddingBottom:
        "calc(env(safe-area-inset-bottom) + 4.25rem)" /* clears bottom tab bar */,
    }}
    role="dialog"
    aria-label="Places on campus"
    aria-expanded={open}
  >
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-center gap-2 py-2 text-xs font-semibold text-muted hover:text-ink"
      aria-label={open ? "Collapse list" : "Expand list"}
    >
      <span
        aria-hidden="true"
        className="block h-1 w-10 rounded-full bg-line"
      />
    </button>
    <div className="px-4 pb-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">
          {places.length === 0 ? "No places match" : `${places.length} places`}
        </h3>
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-paper"
          aria-label={open ? "Collapse list" : "Expand list"}
        >
          {open ? (
            <>
              Hide <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </>
          ) : (
            <>
              See all <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
      <div className="mt-2">{selectedCard}</div>
    </div>

    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
      {places.length === 0 ? (
        <div className="rounded-xl border border-line bg-white p-4 text-sm text-muted">
          No results in Campus map.
          <Link
            to={`/search?q=${encodeURIComponent(query)}`}
            className="mt-1 block text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline"
          >
            Search all of Ultimate Student
          </Link>
        </div>
      ) : (
        <ul
          className="divide-y divide-line/60 overflow-hidden rounded-xl border border-line bg-white"
          role="listbox"
          aria-label="Places on campus"
        >
          {places.map((p) => (
            <PlaceRow
              key={p.id}
              place={p}
              query={query}
              isSelected={p.id === selectedId}
              distanceLabel={rowDistanceLabel(p)}
              onSelect={() => onSelect(p.id)}
            />
          ))}
        </ul>
      )}
    </div>
  </div>
);
