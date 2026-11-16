import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Footprints,
  Info,
  Loader2,
  LocateFixed,
  MapPin,
  MapPinOff,
  Navigation,
  RefreshCw,
  SignalLow,
} from "lucide-react";
import { services, type CampusPlace, type GeoFix, type WalkRoute } from "@/services";
import { formatDistance, walkMinutes } from "@/lib/geo";
import { btn } from "@/ui/button";
import { OpenBadge } from "@/ui/OpenBadge";
import { PLACE_ICONS } from "@/ui/placeIcons";
import { SearchField } from "@/ui/SearchField";
import { WalkTime } from "@/ui/WalkTime";

/** Panel title. Takes focus when the step changes so screen readers announce it. */
export const PanelHeading = ({ children, sub }: { children: ReactNode; sub?: ReactNode }) => {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="mb-4">
      <h2 ref={ref} tabIndex={-1} className="font-serif text-2xl font-medium leading-tight text-oxford-ink outline-none">
        {children}
      </h2>
      {sub && <div className="mt-1 text-sm leading-relaxed text-oxford-mute">{sub}</div>}
    </div>
  );
};

const Note = ({ tone = "info", icon: Icon = Info, children }: { tone?: "info" | "warn" | "ok"; icon?: typeof Info; children: ReactNode }) => {
  const cls =
    tone === "warn"
      ? "border-oxford-danger/30 bg-oxford-danger/5"
      : tone === "ok"
        ? "border-oxford-success/30 bg-oxford-success/5"
        : "border-oxford-rule bg-oxford-cream/60";
  const iconCls = tone === "warn" ? "text-oxford-danger" : tone === "ok" ? "text-oxford-success" : "text-oxford-ink2";
  return (
    <div className={`flex gap-3 rounded-xl border p-3 text-sm text-oxford-ink ${cls}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconCls}`} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
};

const Actions = ({ children }: { children: ReactNode }) => <div className="mt-5 flex flex-col gap-2">{children}</div>;

const PlaceRow = ({
  place,
  now,
  minutes,
  onClick,
  selected,
}: {
  place: CampusPlace;
  now: Date;
  minutes?: number;
  onClick: () => void;
  selected?: boolean;
}) => {
  const Icon = PLACE_ICONS[place.category];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-oxford-cream ${selected ? "bg-oxford-sandSoft" : ""}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-oxford-sandSoft text-oxford-ink">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug text-oxford-ink">{place.name}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-1 text-sm text-oxford-mute">
          {place.category} · <OpenBadge periods={place.periods} now={now} size="xs" />
          {minutes != null && <WalkTime minutes={minutes} />}
        </span>
      </span>
    </button>
  );
};

const filterPlaces = (places: CampusPlace[], q: string) => {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  return places.filter((p) => words.every((w) => `${p.name} ${p.category} ${p.summary}`.toLowerCase().includes(w)));
};

// ── Browse ────────────────────────────────────────────────────────────

export const BrowsePanel = ({
  places,
  selected,
  now,
  walk,
  onSelect,
  onDirections,
}: {
  places: CampusPlace[];
  selected: CampusPlace | null;
  now: Date;
  walk: Record<string, number> | null;
  onSelect: (id: string | null) => void;
  onDirections: () => void;
}) => {
  const [q, setQ] = useState("");
  const list = filterPlaces(places, q);

  if (selected) {
    const Icon = PLACE_ICONS[selected.category];
    return (
      <div>
        <button type="button" onClick={() => onSelect(null)} className="-ml-2 mb-2 inline-flex min-h-[44px] items-center gap-1 rounded-md px-2 text-sm font-semibold text-oxford-ink hover:bg-oxford-cream">
          All places
        </button>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-oxford-gold/30 text-oxford-ink">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <PanelHeading sub={selected.summary}>{selected.name}</PanelHeading>
          </div>
        </div>
        <p className="-mt-2 flex flex-wrap items-center gap-x-1 text-sm text-oxford-mute">
          {selected.category} · <OpenBadge periods={selected.periods} now={now} size="xs" />
          {walk?.[selected.id] != null && <WalkTime minutes={walk[selected.id]!} />}
        </p>
        <Actions>
          <button type="button" onClick={onDirections} className={btn("primary", "w-full")}>
            <Navigation className="h-4 w-4" aria-hidden="true" />
            Get directions
          </button>
          <Link to={`/places/${selected.id}`} className={btn("secondary", "w-full")}>
            Details
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Actions>
      </div>
    );
  }

  return (
    <div>
      <PanelHeading sub="Search, or tap a marker on the map.">Find a place</PanelHeading>
      <SearchField id="map-search" value={q} onChange={setQ} label="Search campus places" placeholder="Search buildings, food, ATMs…" />
      <div className="mt-3" aria-live="polite">
        {list.length === 0 ? (
          <p className="px-1 py-4 text-sm text-oxford-mute">No places match "{q.trim()}". Try a building name or a category such as "food".</p>
        ) : (
          <ul className="-mx-1">
            {list.map((p) => (
              <li key={p.id}>
                <PlaceRow place={p} now={now} minutes={walk?.[p.id]} onClick={() => onSelect(p.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// ── Location permission ───────────────────────────────────────────────

export const AskPanel = ({ dest, onAllow, onChoose }: { dest: CampusPlace; onAllow: () => void; onChoose: () => void }) => (
  <div>
    <PanelHeading sub={<>Directions to <strong className="text-oxford-ink">{dest.name}</strong></>}>Use your location?</PanelHeading>
    <Note icon={LocateFixed}>
      We use your location only to draw the route and guide you while you walk. It isn't stored or shared.
    </Note>
    <Actions>
      <button type="button" onClick={onAllow} className={btn("primary", "w-full")}>
        <LocateFixed className="h-4 w-4" aria-hidden="true" />
        Use my location
      </button>
      <button type="button" onClick={onChoose} className={btn("secondary", "w-full")}>
        Choose a starting point instead
      </button>
    </Actions>
  </div>
);

export const BusyPanel = ({ title, body }: { title: string; body: string }) => (
  <div role="status" className="flex items-start gap-3">
    <Loader2 className="mt-1 h-5 w-5 shrink-0 animate-spin text-oxford-ink" aria-hidden="true" />
    <div>
      <p className="font-serif text-2xl font-medium leading-tight text-oxford-ink">{title}</p>
      <p className="mt-1 text-sm text-oxford-mute">{body}</p>
    </div>
  </div>
);

// ── Choose a starting point ───────────────────────────────────────────

export type PickReason = "denied" | "unavailable" | "inaccurate" | "off-campus" | "chosen";

const PICK_REASON: Record<PickReason, string | null> = {
  denied: "Location is turned off for this app, so we can't see where you are.",
  unavailable: "We couldn't get your location just now.",
  inaccurate: "Your location isn't accurate enough to guide you yet.",
  "off-campus": "You seem to be away from campus, so we can't route from where you are.",
  chosen: null,
};

export const PickStartPanel = ({
  reason,
  fix,
  places,
  dest,
  pick,
  onPick,
  onConfirm,
  onRetry,
}: {
  reason: PickReason;
  fix: GeoFix | null;
  places: CampusPlace[];
  dest: CampusPlace;
  pick: { label: string } | null;
  onPick: (place: CampusPlace) => void;
  onConfirm: () => void;
  onRetry: (() => void) | null;
}) => {
  const [q, setQ] = useState("");
  const matches = q.trim() ? filterPlaces(places.filter((p) => p.id !== dest.id), q).slice(0, 6) : [];
  const why = PICK_REASON[reason];

  return (
    <div>
      <PanelHeading sub={<>Then we'll show the walk to <strong className="text-oxford-ink">{dest.name}</strong>.</>}>
        Choose your starting point
      </PanelHeading>
      {why && (
        <div className="mb-4">
          <Note tone="warn" icon={reason === "inaccurate" ? SignalLow : MapPinOff}>
            {reason === "inaccurate" && fix
              ? `Your location is only accurate to about ${formatDistance(fix.accuracy)}, which isn't enough to guide you.`
              : why}
          </Note>
        </div>
      )}

      <SearchField id="start-search" value={q} onChange={setQ} label="Search for your starting point" placeholder="Where are you? e.g. Balme Library" />
      {q.trim() && (
        <div aria-live="polite">
          {matches.length === 0 ? (
            <p className="px-1 py-3 text-sm text-oxford-mute">No places match "{q.trim()}".</p>
          ) : (
            <ul className="-mx-1 mt-2">
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(p);
                      setQ("");
                    }}
                    className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-oxford-mute" aria-hidden="true" />
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <p className="mt-3 text-sm text-oxford-mute">Or tap the map where you are.</p>

      {pick && (
        <p role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-oxford-ink/20 bg-white p-3 text-sm">
          <MapPin className="h-4 w-4 shrink-0 text-oxford-ink" aria-hidden="true" />
          <span>
            Starting from <strong>{pick.label}</strong>
          </span>
        </p>
      )}

      <Actions>
        <button type="button" onClick={onConfirm} disabled={!pick} className={btn("primary", "w-full")}>
          Show route
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        {onRetry && (
          <button type="button" onClick={onRetry} className={btn("secondary", "w-full")}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try my location again
          </button>
        )}
      </Actions>
    </div>
  );
};

// ── No route ──────────────────────────────────────────────────────────

export const NoRoutePanel = ({
  dest,
  onChangeStart,
  onBack,
}: {
  dest: CampusPlace;
  onChangeStart: () => void;
  onBack: () => void;
}) => {
  const [reporting, setReporting] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const send = async () => {
    setSent("sending");
    try {
      await services.campus.reportIssue(dest.id, note.trim());
      setSent("sent");
    } catch {
      setSent("failed");
    }
  };

  return (
    <div>
      <PanelHeading sub="We only give directions along verified campus paths.">No walking route found</PanelHeading>
      <Note tone="warn" icon={MapPinOff}>
        We can't find a verified path from your starting point to <strong>{dest.name}</strong>. Its location is marked on the
        map.
      </Note>

      {sent === "sent" ? (
        <div className="mt-4">
          <Note tone="ok" icon={CheckCircle2}>
            Thanks. Your report has been sent to the campus map team.
          </Note>
        </div>
      ) : reporting ? (
        <div className="mt-4">
          <label htmlFor="issue-note" className="block text-sm font-semibold text-oxford-ink">
            What's wrong? <span className="font-normal text-oxford-mute">(optional)</span>
          </label>
          <textarea
            id="issue-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="For example: the entrance is on the other side"
            className="mt-1 w-full rounded-lg border border-oxford-ink/20 bg-white p-3 text-sm text-oxford-ink placeholder:text-oxford-mute focus:border-oxford-ink"
          />
          {sent === "failed" && (
            <p role="alert" className="mt-1 text-sm font-semibold text-oxford-danger">
              The report didn't send. Try again.
            </p>
          )}
          <button type="button" onClick={send} disabled={sent === "sending"} className={btn("primary", "mt-3 w-full")}>
            {sent === "sending" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {sent === "sending" ? "Sending…" : "Send report"}
          </button>
        </div>
      ) : null}

      <Actions>
        {!reporting && sent !== "sent" && (
          <button type="button" onClick={() => setReporting(true)} className={btn("secondary", "w-full")}>
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Report an issue with this location
          </button>
        )}
        <button type="button" onClick={onChangeStart} className={btn("secondary", "w-full")}>
          Choose a different starting point
        </button>
        <button type="button" onClick={onBack} className={btn("secondary", "w-full")}>
          Back
        </button>
      </Actions>
    </div>
  );
};

export const RouteErrorPanel = ({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) => (
  <div>
    <PanelHeading>We couldn't load the route</PanelHeading>
    <Note tone="warn" icon={AlertTriangle}>
      Check your connection and try again.
    </Note>
    <Actions>
      <button type="button" onClick={onRetry} className={btn("primary", "w-full")}>
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Try again
      </button>
      <button type="button" onClick={onBack} className={btn("secondary", "w-full")}>
        Back
      </button>
    </Actions>
  </div>
);

// ── Route preview ─────────────────────────────────────────────────────

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-oxford-cream/70 px-3 py-2.5">
    <dt className="text-xs font-semibold uppercase tracking-wider text-oxford-mute">{label}</dt>
    <dd className="mt-0.5 font-serif text-2xl font-semibold leading-none text-oxford-ink">{value}</dd>
  </div>
);

export const PreviewPanel = ({
  route,
  startLabel,
  onStart,
  onBack,
}: {
  route: WalkRoute;
  startLabel: string;
  onStart: () => void;
  onBack: () => void;
}) => (
  <div>
    <PanelHeading sub={<>From {startLabel}</>}>Walk to {route.destination.name}</PanelHeading>
    <dl className="grid grid-cols-2 gap-2">
      <Stat label="Walking time" value={`${route.minutes} min`} />
      <Stat label="Distance" value={formatDistance(route.distance)} />
    </dl>
    <details className="group mt-4 rounded-xl border border-oxford-rule bg-white">
      <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-semibold text-oxford-ink">
        Steps ({route.steps.length})
        <ChevronRight className="h-4 w-4 transition group-open:rotate-90" aria-hidden="true" />
      </summary>
      <ol className="space-y-2 border-t border-oxford-rule px-4 py-3 text-sm text-oxford-ink2">
        {route.steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="w-5 shrink-0 text-right font-semibold text-oxford-mute">{i + 1}.</span>
            {s.instruction}
          </li>
        ))}
      </ol>
    </details>
    <Actions>
      <button type="button" onClick={onStart} className={btn("primary", "w-full")}>
        <Navigation className="h-4 w-4" aria-hidden="true" />
        Start
      </button>
      <button type="button" onClick={onBack} className={btn("secondary", "w-full")}>
        Back
      </button>
    </Actions>
  </div>
);

// ── Active navigation ─────────────────────────────────────────────────

export type NavNotice = "recalculating" | "updated" | "no-new-route" | null;

const Instruction = ({ text, sub }: { text: string; sub?: string }) => (
  <div className="rounded-2xl bg-oxford-ink p-4 text-white">
    <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Next</p>
    <p aria-live="polite" className="mt-1 text-lg font-semibold leading-snug">
      {text}
    </p>
    {sub && <p className="mt-1 text-sm text-white/80">{sub}</p>}
  </div>
);

export const NavigatingPanel = ({
  route,
  along,
  signal,
  notice,
  onCancel,
  devtools,
}: {
  route: WalkRoute;
  along: number;
  signal: "ok" | "lost";
  notice: NavNotice;
  onCancel: () => void;
  devtools?: ReactNode;
}) => {
  const next = route.steps.find((s) => s.distanceFromStart > along + 8) ?? route.steps[route.steps.length - 1]!;
  const toNext = Math.max(0, next.distanceFromStart - along);
  const remaining = Math.max(0, route.distance - along);

  return (
    <div>
      <h2 className="sr-only">Walking to {route.destination.name}</h2>
      {signal === "lost" ? (
        <div role="alert" className="rounded-2xl border border-oxford-danger/30 bg-oxford-danger/5 p-4">
          <p className="flex items-center gap-2 font-semibold text-oxford-ink">
            <SignalLow className="h-5 w-5 text-oxford-danger" aria-hidden="true" />
            GPS signal lost
          </p>
          <p className="mt-1 text-sm text-oxford-ink2">
            Navigation is paused. It will carry on as soon as your signal returns.
          </p>
        </div>
      ) : (
        <Instruction text={next.instruction} sub={`In ${formatDistance(toNext)}`} />
      )}

      {notice && signal === "ok" && (
        <div className="mt-3" role="status">
          {notice === "recalculating" && (
            <Note icon={RefreshCw}>You've left the route. Finding a new one…</Note>
          )}
          {notice === "updated" && <Note tone="ok" icon={CheckCircle2}>Route updated from where you are.</Note>}
          {notice === "no-new-route" && (
            <Note tone="warn" icon={AlertTriangle}>No path from here. Head back towards the route on the map.</Note>
          )}
        </div>
      )}

      <dl className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Time left" value={signal === "lost" ? "Paused" : `${walkMinutes(remaining)} min`} />
        <Stat label="Distance left" value={formatDistance(remaining)} />
      </dl>

      {devtools}

      <Actions>
        <button type="button" onClick={onCancel} className={btn("secondary", "w-full")}>
          Cancel navigation
        </button>
      </Actions>
    </div>
  );
};

/** Without GPS the student steps through the instructions themselves. */
export const StepsPanel = ({
  route,
  index,
  onPrev,
  onNext,
  onCancel,
}: {
  route: WalkRoute;
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onCancel: () => void;
}) => {
  const step = route.steps[index]!;
  const last = index === route.steps.length - 1;
  const remaining = Math.max(0, route.distance - step.distanceFromStart);
  return (
    <div>
      <h2 className="sr-only">Walking to {route.destination.name}</h2>
      <Instruction text={step.instruction} sub={`Step ${index + 1} of ${route.steps.length}`} />
      <p className="mt-3 flex gap-2 text-sm text-oxford-mute">
        <Footprints className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Your position isn't being tracked. Move to the next step when you reach the flag on the map.
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Time left" value={`${walkMinutes(remaining)} min`} />
        <Stat label="Distance left" value={formatDistance(remaining)} />
      </dl>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={onPrev} disabled={index === 0} className={btn("secondary")}>
          Previous
        </button>
        <button type="button" onClick={onNext} className={btn("primary")}>
          {last ? "I've arrived" : "Next step"}
        </button>
      </div>
      <Actions>
        <button type="button" onClick={onCancel} className={btn("secondary", "w-full")}>
          Cancel navigation
        </button>
      </Actions>
    </div>
  );
};

export const ArrivedPanel = ({ route, onDone }: { route: WalkRoute; onDone: () => void }) => (
  <div>
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-oxford-success/10 text-oxford-success">
      <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
    </div>
    <PanelHeading
      sub={
        <>
          <strong className="text-oxford-ink">{route.destination.name}</strong>
          <br />
          Entrance: {route.destination.entrance.label}. It's marked in green on the map.
        </>
      }
    >
      You've arrived
    </PanelHeading>
    <Actions>
      <button type="button" onClick={onDone} className={btn("primary", "w-full")}>
        Done
      </button>
    </Actions>
  </div>
);
