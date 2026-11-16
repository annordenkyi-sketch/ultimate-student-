import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { services, type GeoFix, type LatLng, type WalkRoute } from "@/services";
import { useNow } from "@/lib/dates";
import { distance, isReliable, locateOnLine } from "@/lib/geo";
import { useAsync } from "@/lib/useAsync";
import { useGoBack } from "@/lib/useGoBack";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { useWalkTimes } from "@/lib/useWalkTimes";
import { locationSim } from "@/services/mock/locationService";
import { btn } from "@/ui/button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { LoadError } from "@/ui/DashCard";
import { CampusMap, type MapFocus } from "./CampusMap";
import {
  ArrivedPanel,
  AskPanel,
  BrowsePanel,
  BusyPanel,
  NavigatingPanel,
  NoRoutePanel,
  PanelHeading,
  PickStartPanel,
  PreviewPanel,
  RouteErrorPanel,
  StepsPanel,
  type NavNotice,
  type PickReason,
} from "./MapPanels";
import { SimWalkPanel } from "./SimWalkPanel";

type Start = { kind: "gps"; fix: GeoFix } | { kind: "manual"; point: LatLng; label: string };

type Phase =
  | { k: "browse" }
  | { k: "checking" }
  | { k: "ask" }
  | { k: "locating" }
  | { k: "pick-start"; reason: PickReason; fix: GeoFix | null }
  | { k: "routing"; start: Start }
  | { k: "route-error"; start: Start }
  | { k: "no-route"; start: Start }
  | { k: "preview"; start: Start; route: WalkRoute }
  | { k: "navigating"; start: Start; route: WalkRoute }
  | { k: "arrived"; route: WalkRoute; user: GeoFix | null };

const startPoint = (s: Start): LatLng => (s.kind === "gps" ? s.fix : s.point);

/** Arrival when this close to the entrance, in metres. */
const ARRIVE_M = 20;
/** Recalculate when further than this from the route, with an accurate fix. */
const OFF_ROUTE_M = 35;


/**
 * Flow 05 "Campus walking navigation". Full-screen map; the steps live in a
 * pull-up sheet on mobile and a side panel on desktop.
 */
export const MapScreen = () => {
  const [params] = useSearchParams();
  const toParam = params.get("to");
  const goBack = useGoBack("/explore");
  const now = useNow();
  const desktop = useIsDesktop();

  const placesQuery = useAsync(() => services.campus.places(), []);
  const places = placesQuery.state.status === "ready" ? placesQuery.state.data : null;

  const [selectedId, setSelectedId] = useState<string | null>(toParam);
  const [destId, setDestId] = useState<string | null>(toParam);
  const [phase, setPhase] = useState<Phase>(toParam ? { k: "checking" } : { k: "browse" });
  const [pick, setPick] = useState<{ point: LatLng; label: string } | null>(null);
  const [user, setUser] = useState<GeoFix | null>(null);
  const [signal, setSignal] = useState<"ok" | "lost">("ok");
  const [along, setAlong] = useState(0);
  const [notice, setNotice] = useState<NavNotice>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [confirmStop, setConfirmStop] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const dest = places?.find((p) => p.id === destId) ?? null;
  const selected = places?.find((p) => p.id === selectedId) ?? null;
  const walk = useWalkTimes(phase.k === "browse" && places ? places.map((p) => p.id) : []);

  // ── Getting a starting point ──────────────────────────────────────

  const applyFix = useCallback((fix: GeoFix) => {
    if (isReliable(fix, services.campus.area)) {
      setUser(fix);
      setPhase({ k: "routing", start: { kind: "gps", fix } });
    } else {
      setPhase({ k: "pick-start", reason: fix.accuracy > 50 ? "inaccurate" : "off-campus", fix });
    }
  }, []);

  /** "Get directions": use location if already shared, otherwise explain and ask. */
  const getDirections = useCallback(async () => {
    setPick(null);
    setPhase({ k: "checking" });
    const fix = await services.location.peek();
    if (fix) applyFix(fix);
    else setPhase({ k: "ask" });
  }, [applyFix]);

  const askLocation = async () => {
    setPhase({ k: "locating" });
    const r = await services.location.request();
    if (r.status === "ok") applyFix(r.fix);
    else setPhase({ k: "pick-start", reason: r.status, fix: null });
  };

  // Opened with a destination: straight to directions.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || !toParam) return;
    opened.current = true;
    void getDirections();
  }, [toParam, getDirections]);

  // ── Routing ────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase.k !== "routing" || !destId) return;
    let live = true;
    const start = phase.start;
    services.campus.route(startPoint(start), destId).then(
      (route) => live && setPhase(route ? { k: "preview", start, route } : { k: "no-route", start }),
      () => live && setPhase({ k: "route-error", start }),
    );
    return () => {
      live = false;
    };
  }, [phase, destId]);

  // ── Live navigation with GPS ───────────────────────────────────────

  const recalculating = useRef(false);
  const navRoute = phase.k === "navigating" ? phase.route : null;
  const navStart = phase.k === "navigating" ? phase.start : null;

  useEffect(() => {
    if (!navRoute || !navStart || navStart.kind !== "gps" || !destId) return;
    let live = true;
    const route = navRoute;
    const stop = services.location.watch((u) => {
      if (!live) return;
      if (u.status === "lost") {
        setSignal("lost");
        return;
      }
      setSignal("ok");
      setUser(u.fix);
      const pos = locateOnLine(u.fix, route.points);
      if (distance(u.fix, route.destination.entrance) < ARRIVE_M || route.distance - pos.along < ARRIVE_M / 2) {
        setPhase({ k: "arrived", route, user: u.fix });
        return;
      }
      if (pos.offBy > OFF_ROUTE_M && u.fix.accuracy <= 50) {
        if (recalculating.current) return;
        recalculating.current = true;
        setNotice("recalculating");
        services.campus
          .route(u.fix, destId)
          .then(
            (next) => {
              if (!live) return;
              if (next) {
                setNotice("updated");
                setPhase({ k: "navigating", start: { kind: "gps", fix: u.fix }, route: next });
              } else setNotice("no-new-route");
            },
            () => live && setNotice("no-new-route"),
          )
          .finally(() => {
            recalculating.current = false;
          });
        return;
      }
      setAlong(pos.along);
      setNotice((n) => (n === "no-new-route" ? null : n));
    });
    return () => {
      live = false;
      stop();
    };
  }, [navRoute, navStart, destId]);

  useEffect(() => {
    if (notice !== "updated") return;
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  // ── Leaving ────────────────────────────────────────────────────────

  const toBrowse = () => {
    setPhase({ k: "browse" });
    setDestId(null);
    setPick(null);
  };

  /** Back: to the screen the student came from, or to browsing if they picked a place here. */
  const back = () => {
    if (phase.k === "navigating") return setConfirmStop(true);
    if (!toParam && phase.k !== "browse") return toBrowse();
    if (phase.k === "browse" && selectedId && !toParam) return setSelectedId(null);
    goBack();
  };

  const startNavigation = (start: Start, route: WalkRoute) => {
    setAlong(0);
    setStepIdx(0);
    setNotice(null);
    setSignal("ok");
    setExpanded(false);
    setPhase({ k: "navigating", start, route });
  };

  // ── Sheet sizing (mobile) ──────────────────────────────────────────

  const panelRef = useRef<HTMLDivElement>(null);
  const [panelH, setPanelH] = useState(0);
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPanelH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Collapse the sheet whenever the step changes, so the map stays visible.
  useEffect(() => setExpanded(false), [phase.k]);

  // ── What the map shows ─────────────────────────────────────────────

  const route = phase.k === "preview" || phase.k === "navigating" || phase.k === "arrived" ? phase.route : null;
  const manualStart =
    phase.k === "pick-start"
      ? (pick?.point ?? null)
      : "start" in phase && phase.start.kind === "manual"
        ? phase.start.point
        : null;
  const followingSteps = phase.k === "navigating" && phase.start.kind === "manual";
  const currentStep = followingSteps ? (phase.route.steps[stepIdx] ?? null) : null;
  const showUser =
    phase.k === "navigating" && phase.start.kind === "gps"
      ? user
      : phase.k === "preview" && phase.start.kind === "gps"
        ? phase.start.fix
        : phase.k === "arrived"
          ? phase.user
          : null;

  let focus: MapFocus = { kind: "campus" };
  if (phase.k === "browse") focus = selected ? { kind: "point", at: selected, zoom: 17 } : { kind: "campus" };
  else if (phase.k === "preview") focus = { kind: "route", route: phase.route };
  else if (phase.k === "navigating")
    focus = currentStep
      ? { kind: "point", at: currentStep.at, zoom: 18 }
      : user && signal === "ok"
        ? { kind: "follow", at: user }
        : { kind: "route", route: phase.route };
  else if (phase.k === "arrived") focus = { kind: "point", at: phase.route.destination.entrance, zoom: 18 };
  else if (phase.k === "pick-start" && pick) focus = { kind: "point", at: pick.point, zoom: 16 };
  else if (dest) focus = { kind: "point", at: dest, zoom: 17 };

  // ── Panel content ──────────────────────────────────────────────────

  const panel = () => {
    if (placesQuery.state.status === "loading") return <BusyPanel title="Loading the map" body="Getting campus places…" />;
    if (placesQuery.state.status === "error") return <LoadError what="campus places" onRetry={placesQuery.reload} />;
    if (!places) return null;

    if (phase.k === "browse") {
      return (
        <BrowsePanel
          places={places}
          selected={selected}
          now={now}
          walk={walk}
          onSelect={setSelectedId}
          onDirections={() => {
            setDestId(selectedId);
            void getDirections();
          }}
        />
      );
    }

    if (!dest) {
      return (
        <div>
          <PanelHeading sub="It may have been removed, or the link is out of date.">Place not found</PanelHeading>
          <button type="button" onClick={toBrowse} className={btn("primary", "w-full")}>
            Browse the map
          </button>
        </div>
      );
    }

    switch (phase.k) {
      case "checking":
        return <BusyPanel title="Getting directions" body={`To ${dest.name}`} />;
      case "ask":
        return <AskPanel dest={dest} onAllow={askLocation} onChoose={() => setPhase({ k: "pick-start", reason: "chosen", fix: null })} />;
      case "locating":
        return <BusyPanel title="Finding your location" body="This can take a few seconds outdoors." />;
      case "pick-start":
        return (
          <PickStartPanel
            reason={phase.reason}
            fix={phase.fix}
            places={places}
            dest={dest}
            pick={pick}
            onPick={(p) => setPick({ point: p.entrance, label: p.name })}
            onConfirm={() => pick && setPhase({ k: "routing", start: { kind: "manual", ...pick } })}
            onRetry={phase.reason === "chosen" ? null : askLocation}
          />
        );
      case "routing":
        return <BusyPanel title="Finding a walking route" body={`To ${dest.name}, along campus paths`} />;
      case "route-error":
        return <RouteErrorPanel onRetry={() => setPhase({ k: "routing", start: phase.start })} onBack={back} />;
      case "no-route":
        return (
          <NoRoutePanel
            dest={dest}
            onChangeStart={() => {
              setPick(null);
              setPhase({ k: "pick-start", reason: "chosen", fix: null });
            }}
            onBack={back}
          />
        );
      case "preview":
        return (
          <PreviewPanel
            route={phase.route}
            startLabel={phase.start.kind === "gps" ? "your location" : phase.start.label}
            onStart={() => startNavigation(phase.start, phase.route)}
            onBack={back}
          />
        );
      case "navigating":
        return phase.start.kind === "manual" ? (
          <StepsPanel
            route={phase.route}
            index={stepIdx}
            onPrev={() => setStepIdx((i) => Math.max(0, i - 1))}
            onNext={() =>
              stepIdx >= phase.route.steps.length - 1
                ? setPhase({ k: "arrived", route: phase.route, user: null })
                : setStepIdx((i) => i + 1)
            }
            onCancel={() => setConfirmStop(true)}
          />
        ) : (
          <NavigatingPanel
            route={phase.route}
            along={along}
            signal={signal}
            notice={notice}
            onCancel={() => setConfirmStop(true)}
            devtools={import.meta.env.DEV && locationSim.mode() !== "real" ? <SimWalkPanel route={phase.route} /> : null}
          />
        );
      case "arrived":
        return <ArrivedPanel route={phase.route} onDone={goBack} />;
    }
  };

  const backLabel = phase.k === "navigating" ? "Cancel navigation" : "Back";

  return (
    <div className="fixed inset-0 flex bg-oxford-paper">
      <h1 className="sr-only">Campus map</h1>

      {/* Side panel on desktop, pull-up sheet on mobile. */}
      <section
        ref={panelRef}
        aria-label="Map panel"
        className={`absolute inset-x-0 bottom-0 z-[1000] flex flex-col rounded-t-3xl border-t border-oxford-rule bg-oxford-paper shadow-[0_-8px_30px_rgb(0_0_0/0.12)] transition-[max-height] duration-300 lg:relative lg:inset-auto lg:h-full lg:max-h-none lg:w-[400px] lg:shrink-0 lg:rounded-none lg:border-r lg:border-t-0 lg:shadow-none ${
          expanded ? "max-h-[85dvh]" : "max-h-[48dvh]"
        }`}
      >
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="flex min-h-[44px] w-full shrink-0 flex-col items-center justify-center gap-0.5 rounded-t-3xl text-oxford-mute lg:hidden"
        >
          <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-oxford-rule" />
          <span className="sr-only">{expanded ? "Show less" : "Show more"}</span>
          {expanded ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronUp className="h-4 w-4" aria-hidden="true" />}
        </button>
        <div className="hidden items-center gap-2 border-b border-oxford-rule px-4 py-3 lg:flex">
          <button type="button" onClick={back} className="-ml-1 inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {backLabel}
          </button>
          <span className="ml-auto font-serif text-lg text-oxford-ink">Campus map</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1 lg:p-6">
          {panel()}
        </div>
      </section>

      <div className="absolute inset-0 lg:relative lg:inset-auto lg:flex-1">
        <CampusMap
          center={services.campus.area.center}
          places={places ?? []}
          selectedId={phase.k === "browse" ? selectedId : destId}
          onlyId={phase.k === "browse" || phase.k === "pick-start" ? null : destId}
          onSelect={phase.k === "browse" ? setSelectedId : undefined}
          route={route}
          user={showUser}
          start={manualStart}
          entrance={phase.k === "arrived" ? phase.route.destination.entrance : null}
          stepAt={currentStep?.at ?? null}
          onMapClick={phase.k === "pick-start" ? (p) => setPick({ point: p, label: "the point you chose on the map" }) : undefined}
          focus={focus}
          padBottom={desktop ? 0 : panelH}
          padLeft={0}
        />
        <button
          type="button"
          onClick={back}
          aria-label={backLabel}
          className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[1000] flex h-12 w-12 items-center justify-center rounded-full bg-white text-oxford-ink shadow-lg transition hover:bg-oxford-cream lg:hidden"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <ConfirmDialog
        open={confirmStop}
        title="Stop navigation?"
        body="You'll go back to where you started from."
        confirmLabel="Stop"
        cancelLabel="Keep going"
        onConfirm={() => {
          setConfirmStop(false);
          goBack();
        }}
        onCancel={() => setConfirmStop(false)}
      />
    </div>
  );
};

