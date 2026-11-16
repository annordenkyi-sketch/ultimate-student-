import { storage } from "@/lib/storage";
import type { GeoFix, LocationRequest, LocationService, LocationUpdate } from "../types";
import { SIM_OFF_CAMPUS, SIM_START } from "./campusData";
import { wait } from "./db";

// Location for the map. "real" uses the browser's GPS; the other modes
// simulate a device so every case can be tested from a desk:
//   on-campus   permission granted, accurate fix near the Great Hall
//   denied      the student declines location permission
//   inaccurate  permission granted, but accuracy is ±250 m
//   off-campus  permission granted, accurate fix in central Accra
// While navigating in a simulated mode, the Test states panel can move the
// student along the route, step off it, or drop the GPS signal.

export type LocationMode = "real" | "on-campus" | "denied" | "inaccurate" | "off-campus";

const MODE_KEY = "us.dev.location";
const GRANTED_KEY = "us.dev.locationGranted";

const mode = (): LocationMode => storage.get<LocationMode>(MODE_KEY, "on-campus");

const startFix = (m: LocationMode): GeoFix | null => {
  if (m === "on-campus") return { ...SIM_START, accuracy: 8 };
  if (m === "inaccurate") return { ...SIM_START, accuracy: 250 };
  if (m === "off-campus") return { ...SIM_OFF_CAMPUS, accuracy: 10 };
  return null;
};

// Simulated device state.
let simFix: GeoFix | null = startFix(mode());
let simLost = false;
const listeners = new Set<(u: LocationUpdate) => void>();
const simListeners = new Set<() => void>();

const emit = () => {
  const update: LocationUpdate = simLost || !simFix ? { status: "lost" } : { status: "ok", fix: simFix };
  listeners.forEach((l) => l(update));
  simListeners.forEach((l) => l());
};

/** Controls for the Test states panel. */
export const locationSim = {
  mode,
  setMode(next: LocationMode) {
    storage.set(MODE_KEY, next);
    storage.remove(GRANTED_KEY);
    simFix = startFix(next);
    simLost = false;
    emit();
  },
  fix: () => simFix,
  isLost: () => simLost,
  setFix(fix: GeoFix) {
    simFix = fix;
    simLost = false;
    emit();
  },
  loseSignal() {
    simLost = true;
    emit();
  },
  restore() {
    simLost = false;
    emit();
  },
  /** Back to the starting position for the current mode. */
  reset() {
    simFix = startFix(mode());
    simLost = false;
    emit();
  },
  subscribe(listener: () => void) {
    simListeners.add(listener);
    return () => simListeners.delete(listener);
  },
};

const toFix = (p: GeolocationPosition): GeoFix => ({
  lat: p.coords.latitude,
  lng: p.coords.longitude,
  accuracy: p.coords.accuracy,
});

const readGps = () =>
  new Promise<LocationRequest>((resolve) => {
    if (!("geolocation" in navigator)) return resolve({ status: "unavailable" });
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ status: "ok", fix: toFix(p) }),
      (e) => resolve(e.code === e.PERMISSION_DENIED ? { status: "denied" } : { status: "unavailable" }),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 15_000 },
    );
  });

const gpsGranted = async () => {
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state === "granted";
  } catch {
    return false;
  }
};

export const mockLocationService: LocationService = {
  async request() {
    const m = mode();
    if (m === "real") return readGps();
    await wait(900);
    if (m === "denied") return { status: "denied" };
    storage.set(GRANTED_KEY, true);
    return simFix ? { status: "ok", fix: simFix } : { status: "unavailable" };
  },

  async peek() {
    const m = mode();
    if (m === "real") {
      if (!(await gpsGranted())) return null;
      const r = await readGps();
      return r.status === "ok" ? r.fix : null;
    }
    if (!storage.get(GRANTED_KEY, false) || simLost) return null;
    return simFix;
  },

  watch(onUpdate) {
    if (mode() === "real") {
      if (!("geolocation" in navigator)) {
        onUpdate({ status: "lost" });
        return () => {};
      }
      const id = navigator.geolocation.watchPosition(
        (p) => onUpdate({ status: "ok", fix: toFix(p) }),
        () => onUpdate({ status: "lost" }),
        { enableHighAccuracy: true, timeout: 20_000, maximumAge: 5_000 },
      );
      return () => navigator.geolocation.clearWatch(id);
    }
    listeners.add(onUpdate);
    onUpdate(simLost || !simFix ? { status: "lost" } : { status: "ok", fix: simFix });
    return () => {
      listeners.delete(onUpdate);
    };
  },
};
