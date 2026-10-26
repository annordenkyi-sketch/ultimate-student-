import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  Clock,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Highlight } from "@/lib/highlight";
import {
  HOSTELS,
  type Availability,
  type Facility,
  type Gender,
  type Hostel,
  type Location as HostelLocation,
  type Nearby,
  type PaymentOption,
  type RoomType,
} from "./data";

/* ───────────────────────────── Types & options ───────────────────────────── */

type SortKey =
  | "recommended"
  | "price-asc"
  | "price-desc"
  | "nearest"
  | "newest";

interface FilterState {
  locations: HostelLocation[];
  maxWalk: number | null; // 5, 10, 20, null (any)
  areas: string[];
  priceMode: "year" | "semester";
  priceMax: number | null;
  payments: PaymentOption[];
  roomTypes: RoomType[];
  facilities: Facility[];
  genders: Gender[];
  availabilities: Availability[];
  verifiedOnly: boolean;
  nearby: Nearby[];
  search: string;
  sort: SortKey;
}

const LOCATION_OPTIONS: HostelLocation[] = ["on-campus", "off-campus"];
const LOCATION_LABEL: Record<HostelLocation, string> = {
  "on-campus": "On campus",
  "off-campus": "Off campus",
};
const WALK_OPTIONS = [
  { value: 5, label: "Under 5 min" },
  { value: 10, label: "Under 10 min" },
  { value: 20, label: "Under 20 min" },
  { value: 999, label: "30+ min" },
] as const;
const AREAS = Array.from(new Set(HOSTELS.map((h) => h.area))).sort();
const PAYMENT_OPTIONS: PaymentOption[] = ["Full year", "Per semester", "Instalments"];
const ROOM_OPTIONS: RoomType[] = [
  "Single",
  "2 in a room",
  "3 in a room",
  "4 in a room",
  "Self-contained",
];
const FACILITY_OPTIONS: Facility[] = [
  "Wi-Fi",
  "Water supply",
  "Generator",
  "Air conditioning",
  "Fan",
  "Private bathroom",
  "Shared bathroom",
  "Kitchen",
  "Study room",
  "Laundry",
  "Parking",
  "CCTV",
  "Security guard",
];
const GENDER_OPTIONS: Gender[] = ["Male", "Female", "Mixed"];
const AVAILABILITY_OPTIONS: Availability[] = ["Available now", "Next semester"];
const NEARBY_OPTIONS: Nearby[] = ["Shuttle stop", "Market/shops", "Clinic", "ATM"];

const SORT_LABEL: Record<SortKey, string> = {
  recommended: "Recommended",
  "price-asc": "Price · low to high",
  "price-desc": "Price · high to low",
  nearest: "Nearest to campus",
  newest: "Newest",
};

const PRICE_RANGES = {
  year: {
    min: Math.min(...HOSTELS.map((h) => h.pricePerYear)),
    max: Math.max(...HOSTELS.map((h) => h.pricePerYear)),
  },
  semester: {
    min: Math.min(...HOSTELS.map((h) => h.pricePerSemester)),
    max: Math.max(...HOSTELS.map((h) => h.pricePerSemester)),
  },
};

/* ───────────────────────────── URL sync ───────────────────────────── */

const splitList = (v: string | null): string[] =>
  v ? v.split(",").filter(Boolean) : [];

const fromParams = (p: URLSearchParams): FilterState => ({
  locations: splitList(p.get("loc")) as HostelLocation[],
  maxWalk: p.get("walk") ? Number(p.get("walk")) : null,
  areas: splitList(p.get("areas")),
  priceMode: p.get("priceMode") === "semester" ? "semester" : "year",
  priceMax: p.get("priceMax") ? Number(p.get("priceMax")) : null,
  payments: splitList(p.get("payment")) as PaymentOption[],
  roomTypes: splitList(p.get("rooms")) as RoomType[],
  facilities: splitList(p.get("fac")) as Facility[],
  genders: splitList(p.get("gender")) as Gender[],
  availabilities: splitList(p.get("avail")) as Availability[],
  verifiedOnly: p.get("verified") === "1",
  nearby: splitList(p.get("nearby")) as Nearby[],
  search: p.get("q") ?? "",
  sort: (p.get("sort") as SortKey) || "recommended",
});

const toParams = (s: FilterState): URLSearchParams => {
  const p = new URLSearchParams();
  if (s.locations.length) p.set("loc", s.locations.join(","));
  if (s.maxWalk != null) p.set("walk", String(s.maxWalk));
  if (s.areas.length) p.set("areas", s.areas.join(","));
  if (s.priceMode !== "year") p.set("priceMode", s.priceMode);
  if (s.priceMax != null) p.set("priceMax", String(s.priceMax));
  if (s.payments.length) p.set("payment", s.payments.join(","));
  if (s.roomTypes.length) p.set("rooms", s.roomTypes.join(","));
  if (s.facilities.length) p.set("fac", s.facilities.join(","));
  if (s.genders.length) p.set("gender", s.genders.join(","));
  if (s.availabilities.length) p.set("avail", s.availabilities.join(","));
  if (s.verifiedOnly) p.set("verified", "1");
  if (s.nearby.length) p.set("nearby", s.nearby.join(","));
  if (s.search) p.set("q", s.search);
  if (s.sort !== "recommended") p.set("sort", s.sort);
  return p;
};

/* ───────────────────────────── Filter matching ───────────────────────────── */

const matchesFilter = (h: Hostel, s: FilterState): boolean => {
  if (s.locations.length && !s.locations.includes(h.location)) return false;
  if (s.maxWalk != null) {
    const limit = s.maxWalk;
    if (limit === 999 ? h.walkMinutes < 30 : h.walkMinutes >= limit) return false;
  }
  if (s.areas.length && !s.areas.includes(h.area)) return false;
  if (s.priceMax != null) {
    const price =
      s.priceMode === "semester" ? h.pricePerSemester : h.pricePerYear;
    if (price > s.priceMax) return false;
  }
  if (s.payments.length && !s.payments.some((p) => h.payment.includes(p)))
    return false;
  if (s.roomTypes.length && !s.roomTypes.some((r) => h.roomTypes.includes(r)))
    return false;
  if (s.facilities.length && !s.facilities.every((f) => h.facilities.includes(f)))
    return false;
  if (s.genders.length && !s.genders.includes(h.gender)) return false;
  if (s.availabilities.length && !s.availabilities.includes(h.availability))
    return false;
  if (s.verifiedOnly && !h.verified) return false;
  if (s.nearby.length && !s.nearby.every((n) => h.nearby.includes(n)))
    return false;
  if (s.search.trim()) {
    const q = s.search.trim().toLowerCase();
    const hay = `${h.name} ${h.area} ${h.summary} ${h.facilities.join(" ")} ${h.roomTypes.join(" ")} ${h.nearby.join(" ")}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
};

const sortHostels = (list: Hostel[], sort: SortKey, priceMode: "year" | "semester"): Hostel[] => {
  const sorted = [...list];
  switch (sort) {
    case "price-asc":
      sorted.sort((a, b) =>
        priceMode === "semester"
          ? a.pricePerSemester - b.pricePerSemester
          : a.pricePerYear - b.pricePerYear,
      );
      break;
    case "price-desc":
      sorted.sort((a, b) =>
        priceMode === "semester"
          ? b.pricePerSemester - a.pricePerSemester
          : b.pricePerYear - a.pricePerYear,
      );
      break;
    case "nearest":
      sorted.sort((a, b) => a.walkMinutes - b.walkMinutes);
      break;
    case "newest":
      sorted.sort(
        (a, b) =>
          new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime(),
      );
      break;
    default:
      // Recommended: verified first, then by walking distance
      sorted.sort((a, b) => {
        if (a.verified !== b.verified) return a.verified ? -1 : 1;
        return a.walkMinutes - b.walkMinutes;
      });
  }
  return sorted;
};

/* ───────────────────────────── Count helpers ───────────────────────────── */

const countFor = (
  facet: keyof FilterState,
  option: unknown,
  state: FilterState,
): number => {
  const cleared = { ...state, [facet]: [] as unknown };
  const matches = HOSTELS.filter((h) => matchesFilter(h, cleared as FilterState));
  switch (facet) {
    case "locations":
      return matches.filter((h) => h.location === option).length;
    case "areas":
      return matches.filter((h) => h.area === option).length;
    case "payments":
      return matches.filter((h) => h.payment.includes(option as PaymentOption)).length;
    case "roomTypes":
      return matches.filter((h) => h.roomTypes.includes(option as RoomType)).length;
    case "facilities":
      return matches.filter((h) => h.facilities.includes(option as Facility)).length;
    case "genders":
      return matches.filter((h) => h.gender === option).length;
    case "availabilities":
      return matches.filter((h) => h.availability === option).length;
    case "nearby":
      return matches.filter((h) => h.nearby.includes(option as Nearby)).length;
    default:
      return 0;
  }
};

/* ───────────────────────────── UI pieces ───────────────────────────── */

interface GroupProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const Group = ({ title, defaultOpen = true, children }: GroupProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-line py-3 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left text-sm font-semibold text-ink"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 text-muted transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden="true"
        />
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </section>
  );
};

interface CheckProps {
  label: string;
  count: number;
  checked: boolean;
  onToggle: () => void;
}

const CheckOption = ({ label, count, checked, onToggle }: CheckProps) => {
  const disabled = count === 0 && !checked;
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 text-sm ${
        disabled ? "cursor-not-allowed text-muted" : "text-ink"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
        className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500 disabled:opacity-40"
      />
      <span className="flex-1">{label}</span>
      <span
        className={`text-xs ${disabled ? "text-muted" : "text-muted"}`}
      >
        {count}
      </span>
    </label>
  );
};

interface FilterPanelProps {
  state: FilterState;
  update: (patch: Partial<FilterState>) => void;
}

const FilterPanel = ({ state, update }: FilterPanelProps) => {
  const toggle = <K extends keyof FilterState>(
    key: K,
    value: unknown,
  ) => {
    const current = state[key] as unknown as string[];
    const has = current.includes(value as string);
    update({
      [key]: has ? current.filter((v) => v !== value) : [...current, value],
    } as unknown as Partial<FilterState>);
  };

  const priceRange = PRICE_RANGES[state.priceMode];
  const sliderMax = priceRange.max;
  const sliderMin = priceRange.min;
  const currentMax = state.priceMax ?? sliderMax;

  return (
    <div className="divide-y divide-line">
      {/* Location */}
      <Group title="Location">
        {LOCATION_OPTIONS.map((o) => (
          <CheckOption
            key={o}
            label={LOCATION_LABEL[o]}
            count={countFor("locations", o, state)}
            checked={state.locations.includes(o)}
            onToggle={() => toggle("locations", o)}
          />
        ))}

        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Walking time
        </p>
        <div className="flex flex-wrap gap-2">
          {WALK_OPTIONS.map((o) => {
            const isActive = state.maxWalk === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() =>
                  update({ maxWalk: isActive ? null : o.value })
                }
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  isActive
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-line bg-white text-ink hover:border-line"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>

        {AREAS.length > 1 && (
          <>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Area
            </p>
            {AREAS.map((a) => (
              <CheckOption
                key={a}
                label={a}
                count={countFor("areas", a, state)}
                checked={state.areas.includes(a)}
                onToggle={() => toggle("areas", a)}
              />
            ))}
          </>
        )}
      </Group>

      {/* Price */}
      <Group title="Price">
        <div className="flex overflow-hidden rounded-lg border border-line text-xs font-semibold">
          {(["year", "semester"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => update({ priceMode: mode, priceMax: null })}
              className={`flex-1 px-2 py-1.5 transition ${
                state.priceMode === mode
                  ? "bg-ink text-white"
                  : "bg-white text-ink hover:bg-paper"
              }`}
            >
              {mode === "year" ? "Per year" : "Per semester"}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <label className="flex justify-between text-xs text-muted">
            <span>Max price</span>
            <span className="font-semibold text-ink">
              GHS {currentMax.toLocaleString()}
            </span>
          </label>
          <input
            type="range"
            min={sliderMin}
            max={sliderMax}
            step={100}
            value={currentMax}
            onChange={(e) =>
              update({
                priceMax:
                  Number(e.target.value) === sliderMax
                    ? null
                    : Number(e.target.value),
              })
            }
            className="mt-1 w-full accent-brand-600"
          />
          <div className="mt-1 flex justify-between text-[11px] text-muted">
            <span>GHS {sliderMin.toLocaleString()}</span>
            <span>GHS {sliderMax.toLocaleString()}</span>
          </div>
        </div>

        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Payment
        </p>
        {PAYMENT_OPTIONS.map((p) => (
          <CheckOption
            key={p}
            label={p}
            count={countFor("payments", p, state)}
            checked={state.payments.includes(p)}
            onToggle={() => toggle("payments", p)}
          />
        ))}
      </Group>

      {/* Room type */}
      <Group title="Room type">
        {ROOM_OPTIONS.map((r) => (
          <CheckOption
            key={r}
            label={r}
            count={countFor("roomTypes", r, state)}
            checked={state.roomTypes.includes(r)}
            onToggle={() => toggle("roomTypes", r)}
          />
        ))}
      </Group>

      {/* Facilities */}
      <Group title="Facilities">
        {FACILITY_OPTIONS.map((f) => (
          <CheckOption
            key={f}
            label={f}
            count={countFor("facilities", f, state)}
            checked={state.facilities.includes(f)}
            onToggle={() => toggle("facilities", f)}
          />
        ))}
      </Group>

      {/* Gender */}
      <Group title="Gender">
        {GENDER_OPTIONS.map((g) => (
          <CheckOption
            key={g}
            label={g}
            count={countFor("genders", g, state)}
            checked={state.genders.includes(g)}
            onToggle={() => toggle("genders", g)}
          />
        ))}
      </Group>

      {/* Availability */}
      <Group title="Availability">
        {AVAILABILITY_OPTIONS.map((a) => (
          <CheckOption
            key={a}
            label={a}
            count={countFor("availabilities", a, state)}
            checked={state.availabilities.includes(a)}
            onToggle={() => toggle("availabilities", a)}
          />
        ))}
      </Group>

      {/* Trust */}
      <Group title="Trust">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={state.verifiedOnly}
            onChange={() => update({ verifiedOnly: !state.verifiedOnly })}
            className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
          />
          <span className="flex-1">Verified hostels only</span>
          <span className="text-xs text-muted">
            {HOSTELS.filter((h) => h.verified).length}
          </span>
        </label>
      </Group>

      {/* Nearby */}
      <Group title="Nearby">
        {NEARBY_OPTIONS.map((n) => (
          <CheckOption
            key={n}
            label={n}
            count={countFor("nearby", n, state)}
            checked={state.nearby.includes(n)}
            onToggle={() => toggle("nearby", n)}
          />
        ))}
      </Group>
    </div>
  );
};

/* ───────────────────────────── Active chips ───────────────────────────── */

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

const buildChips = (
  state: FilterState,
  update: (p: Partial<FilterState>) => void,
): Chip[] => {
  const chips: Chip[] = [];
  const removeFrom = <K extends keyof FilterState>(key: K, v: unknown) => {
    const current = state[key] as unknown as string[];
    update({ [key]: current.filter((x) => x !== v) } as unknown as Partial<FilterState>);
  };
  for (const o of state.locations) {
    chips.push({
      key: `loc-${o}`,
      label: LOCATION_LABEL[o],
      onRemove: () => removeFrom("locations", o),
    });
  }
  if (state.maxWalk != null) {
    const w = WALK_OPTIONS.find((o) => o.value === state.maxWalk);
    chips.push({
      key: "walk",
      label: w?.label ?? `≤ ${state.maxWalk} min walk`,
      onRemove: () => update({ maxWalk: null }),
    });
  }
  for (const a of state.areas) {
    chips.push({ key: `area-${a}`, label: a, onRemove: () => removeFrom("areas", a) });
  }
  if (state.priceMax != null) {
    chips.push({
      key: "price",
      label: `Max GHS ${state.priceMax.toLocaleString()} / ${state.priceMode === "semester" ? "sem" : "yr"}`,
      onRemove: () => update({ priceMax: null }),
    });
  }
  for (const p of state.payments)
    chips.push({ key: `pay-${p}`, label: p, onRemove: () => removeFrom("payments", p) });
  for (const r of state.roomTypes)
    chips.push({ key: `rm-${r}`, label: r, onRemove: () => removeFrom("roomTypes", r) });
  for (const f of state.facilities)
    chips.push({ key: `fac-${f}`, label: f, onRemove: () => removeFrom("facilities", f) });
  for (const g of state.genders)
    chips.push({ key: `g-${g}`, label: g, onRemove: () => removeFrom("genders", g) });
  for (const a of state.availabilities)
    chips.push({ key: `av-${a}`, label: a, onRemove: () => removeFrom("availabilities", a) });
  if (state.verifiedOnly)
    chips.push({ key: "verified", label: "Verified only", onRemove: () => update({ verifiedOnly: false }) });
  for (const n of state.nearby)
    chips.push({ key: `nb-${n}`, label: `Near ${n}`, onRemove: () => removeFrom("nearby", n) });
  return chips;
};

/* ───────────────────────────── Hostel card ───────────────────────────── */

interface CardProps {
  hostel: Hostel;
  priceMode: "year" | "semester";
  query: string;
}

const HostelCard = ({ hostel, priceMode, query }: CardProps) => {
  const price =
    priceMode === "semester" ? hostel.pricePerSemester : hostel.pricePerYear;
  return (
    <Link
      to={`/section/accommodation/${hostel.id}`}
      className="group block overflow-hidden rounded-xl border border-line bg-white p-4 transition hover:border-line hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-ink group-hover:text-brand-700">
            <Highlight text={hostel.name} query={query} />
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              <Highlight text={hostel.area} query={query} />
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {hostel.walkMinutes} min walk
            </span>
            {hostel.verified && (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                Verified
              </span>
            )}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-base font-bold text-ink">
            GHS {price.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted">
            per {priceMode === "semester" ? "semester" : "year"}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted">
        <Highlight text={hostel.summary} query={query} />
      </p>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        <li className="rounded-full bg-paper px-2.5 py-0.5 text-[11px] font-medium text-ink">
          {hostel.gender}
        </li>
        {hostel.roomTypes.slice(0, 2).map((r) => (
          <li
            key={r}
            className="rounded-full bg-paper px-2.5 py-0.5 text-[11px] font-medium text-ink"
          >
            {r}
          </li>
        ))}
        {hostel.facilities.slice(0, 3).map((f) => (
          <li
            key={f}
            className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-700"
          >
            {f}
          </li>
        ))}
        {hostel.facilities.length > 3 && (
          <li className="text-[11px] text-muted">
            +{hostel.facilities.length - 3} more
          </li>
        )}
      </ul>

      <p
        className={`mt-3 text-[11px] font-semibold uppercase tracking-wider ${
          hostel.availability === "Available now"
            ? "text-emerald-700"
            : "text-accent-600"
        }`}
      >
        {hostel.availability}
      </p>
    </Link>
  );
};

/* ───────────────────────────── Page ───────────────────────────── */

export const AccommodationPage = () => {
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => fromParams(params), [params]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const update = (patch: Partial<FilterState>) => {
    const next = { ...state, ...patch };
    setParams(toParams(next), { replace: true });
  };

  const clearAll = () => setParams(new URLSearchParams(), { replace: true });

  const filtered = useMemo(
    () =>
      sortHostels(
        HOSTELS.filter((h) => matchesFilter(h, state)),
        state.sort,
        state.priceMode,
      ),
    [state],
  );

  const chips = buildChips(state, update);

  // Lock body scroll while mobile sheet is open
  useEffect(() => {
    if (!showMobileFilters) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showMobileFilters]);

  return (
    <div className="pb-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-ink">Accommodation</h1>
        <p className="mt-1 text-sm text-muted">
          Compare on-campus halls and private hostels near the university.
        </p>
      </header>

      {/* Search + toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={state.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search hostels…"
            className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-brand-500"
            aria-label="Search within filtered results"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowMobileFilters(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-paper lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
          {chips.length > 0 && (
            <span className="rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold leading-5 text-white">
              {chips.length}
            </span>
          )}
        </button>

        <label className="flex items-center gap-2 text-xs text-muted">
          <span className="hidden sm:inline">Sort</span>
          <select
            value={state.sort}
            onChange={(e) =>
              update({ sort: e.target.value as SortKey })
            }
            className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm font-medium text-ink focus:border-brand-500"
          >
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Active chips */}
      {chips.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={c.onRemove}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-paper py-0.5 pl-2.5 pr-1 text-xs font-medium text-ink hover:border-line hover:bg-line"
            >
              {c.label}
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Grid: sidebar + results */}
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-xl border border-line bg-white p-4">
            <FilterPanel state={state} update={update} />
          </div>
        </aside>

        <div>
          <p className="mb-3 text-xs font-medium text-muted">
            {filtered.length} {filtered.length === 1 ? "hostel" : "hostels"} found
          </p>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-line bg-white p-6 text-center">
              <p className="text-sm font-semibold text-ink">
                No hostels match these filters.
              </p>
              <p className="mt-1 text-xs text-muted">
                Try removing a filter or two to see more results.
              </p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-4 inline-flex rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="grid gap-3 xl:grid-cols-2">
              {filtered.map((h) => (
                <li key={h.id}>
                  <HostelCard
                    hostel={h}
                    priceMode={state.priceMode}
                    query={state.search}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      {showMobileFilters && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter hostels"
          className="fixed inset-0 z-40 flex flex-col bg-white lg:hidden"
        >
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Filters</h2>
            <button
              type="button"
              onClick={() => setShowMobileFilters(false)}
              aria-label="Close filters"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-paper"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-4">
            <FilterPanel state={state} update={update} />
          </div>
          <footer
            className="flex items-center gap-3 border-t border-line bg-white px-4 py-3"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
          >
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-semibold text-muted hover:text-ink"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={() => setShowMobileFilters(false)}
              className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Show {filtered.length}{" "}
              {filtered.length === 1 ? "hostel" : "hostels"}
            </button>
          </footer>
        </div>
      )}
    </div>
  );
};
