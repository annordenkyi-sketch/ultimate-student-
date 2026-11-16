import { useEffect, useState, useSyncExternalStore } from "react";
import { FlaskConical } from "lucide-react";
import type { WalkRoute } from "@/services";
import { bearing, locateOnLine, pointAlong } from "@/lib/geo";
import { locationSim } from "@/services/mock/locationService";

const STEP_M = 25;

const walk = (route: WalkRoute, metres: number) => {
  const fix = locationSim.fix();
  if (!fix) return;
  const { along } = locateOnLine(fix, route.points);
  locationSim.setFix({ ...pointAlong(route.points, along + metres), accuracy: 8 });
};

/** Development only: move the simulated device along the route, off it, or drop its signal. */
export const SimWalkPanel = ({ route }: { route: WalkRoute }) => {
  const lost = useSyncExternalStore(locationSim.subscribe, locationSim.isLost);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto || lost) return;
    const t = window.setInterval(() => walk(route, 12), 900);
    return () => window.clearInterval(t);
  }, [auto, lost, route]);

  const stepOff = () => {
    const fix = locationSim.fix();
    if (!fix) return;
    // About 60 m to the side of the path, whichever way it's heading.
    const { along } = locateOnLine(fix, route.points);
    const a = pointAlong(route.points, along);
    const b = pointAlong(route.points, along + 10);
    const side = ((bearing(a, b) + 90) * Math.PI) / 180;
    const metresPerDegLng = 111_320 * Math.cos((a.lat * Math.PI) / 180);
    locationSim.setFix({
      lat: a.lat + (60 * Math.cos(side)) / 111_320,
      lng: a.lng + (60 * Math.sin(side)) / metresPerDegLng,
      accuracy: 8,
    });
  };

  const chip = "min-h-[40px] rounded-full border border-oxford-ink/20 bg-white px-3 text-xs font-semibold text-oxford-ink transition hover:bg-oxford-cream disabled:opacity-50";

  return (
    <div data-devtools className="mt-4 rounded-xl border border-dashed border-oxford-ink/30 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-oxford-mute">
        <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
        Test: simulated walk
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className={chip} disabled={lost} onClick={() => walk(route, STEP_M)}>
          Walk {STEP_M} m
        </button>
        <button type="button" className={chip} disabled={lost} aria-pressed={auto} onClick={() => setAuto((a) => !a)}>
          {auto ? "Stop walking" : "Auto-walk"}
        </button>
        <button type="button" className={chip} disabled={lost} onClick={stepOff}>
          Step off route
        </button>
        {lost ? (
          <button type="button" className={chip} onClick={() => locationSim.restore()}>
            Restore GPS signal
          </button>
        ) : (
          <button type="button" className={chip} onClick={() => locationSim.loseSignal()}>
            Lose GPS signal
          </button>
        )}
      </div>
    </div>
  );
};
