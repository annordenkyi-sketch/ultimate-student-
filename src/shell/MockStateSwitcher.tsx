import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FlaskConical, X } from "lucide-react";
import { MOCK_SCENARIOS, scenarioIdFor, type MockScenario } from "@/services/mock/accounts";
import { setTestTime, testTime } from "@/services/mock/clockService";
import { locationSim, type LocationMode } from "@/services/mock/locationService";
import { setSyncScenario, syncScenario, type SyncScenario } from "@/services/mock/syncStore";
import { useSession } from "@/session/SessionProvider";

/** 12 November 2026 is a Thursday: Ama has lectures at 10:30, 13:30 and 16:30, then Friday 08:30. */
const TIMES: { at: string | null; label: string }[] = [
  { at: null, label: "Real time" },
  { at: "2026-11-12T07:30:00", label: "Thu 07:30, before the first lecture" },
  { at: "2026-11-12T10:00:00", label: "Thu 10:00, next lecture in 30 min" },
  { at: "2026-11-12T13:45:00", label: "Thu 13:45, lecture in progress" },
  { at: "2026-11-12T19:00:00", label: "Thu 19:00, after the last lecture" },
];

const LOCATION_MODES: { id: LocationMode; label: string }[] = [
  { id: "on-campus", label: "On campus, accurate GPS" },
  { id: "denied", label: "Location permission denied" },
  { id: "inaccurate", label: "On campus, inaccurate (±250 m)" },
  { id: "off-campus", label: "Off campus (central Accra)" },
  { id: "real", label: "Real device GPS" },
];

const SYNC_CASES: { id: SyncScenario; label: string }[] = [
  { id: "changes", label: "Changes detected" },
  { id: "conflict", label: "Changes with a conflict" },
  { id: "no-changes", label: "No changes" },
  { id: "failed", label: "Fetch failure" },
  { id: "not-authorised", label: "Not authorised" },
];

/** Dev-only panel to jump between the user states in flow 00, and to set a test time. */
export const MockStateSwitcher = () => {
  const [open, setOpen] = useState(false);
  const { session, setSession } = useSession();
  const navigate = useNavigate();
  const current = scenarioIdFor(session);
  // On the full-screen map, sit below the zoom controls so the bottom sheet stays clear.
  const onMap = useLocation().pathname === "/map";

  const choose = (scenario: MockScenario) => {
    setSession(scenario.session);
    setOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <div
      data-devtools
      className={`fixed z-[1200] flex items-end ${
        onMap ? "right-3 top-36 flex-col-reverse" : "bottom-24 right-4 flex-col lg:bottom-6 lg:right-6"
      }`}
    >
      {open && (
        <div
          id="mock-state-panel"
          className={`${onMap ? "mt-2 max-h-[60dvh] overflow-y-auto" : "mb-2"} w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-oxford-rule bg-white p-4 shadow-xl`}
        >
          <fieldset>
            <legend className="text-sm font-semibold text-oxford-ink">Test user state</legend>
            <p className="mt-0.5 text-xs text-oxford-mute">
              Development only. Picking a state reopens the app from the start.
            </p>
            <div className="mt-3 space-y-1">
              {MOCK_SCENARIOS.map((s) => (
                <label
                  key={s.id}
                  className={`flex cursor-pointer gap-3 rounded-lg p-2 transition ${
                    current === s.id ? "bg-oxford-sandSoft" : "hover:bg-oxford-cream"
                  }`}
                >
                  <input
                    type="radio"
                    name="mock-state"
                    checked={current === s.id}
                    onChange={() => choose(s)}
                    className="mt-1 accent-[rgb(var(--us-ink))]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-oxford-ink">{s.label}</span>
                    <span className="block text-xs text-oxford-mute">{s.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-4 border-t border-oxford-rule pt-3">
            <legend className="text-sm font-semibold text-oxford-ink">Time of day</legend>
            <select
              aria-label="Time of day"
              value={testTime() ?? ""}
              onChange={(e) => {
                setTestTime(e.target.value || null);
                window.location.reload();
              }}
              className="mt-2 w-full rounded-lg border border-oxford-ink/20 bg-white px-2 py-2 text-sm text-oxford-ink"
            >
              {TIMES.map((t) => (
                <option key={t.label} value={t.at ?? ""}>
                  {t.label}
                </option>
              ))}
            </select>
          </fieldset>
          <fieldset className="mt-4 border-t border-oxford-rule pt-3">
            <legend className="text-sm font-semibold text-oxford-ink">Location</legend>
            <select
              aria-label="Location"
              value={locationSim.mode()}
              onChange={(e) => {
                locationSim.setMode(e.target.value as LocationMode);
                window.location.reload();
              }}
              className="mt-2 w-full rounded-lg border border-oxford-ink/20 bg-white px-2 py-2 text-sm text-oxford-ink"
            >
              {LOCATION_MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-oxford-mute">Changing it resets location permission.</p>
          </fieldset>
          <fieldset className="mt-4 border-t border-oxford-rule pt-3">
            <legend className="text-sm font-semibold text-oxford-ink">Portal sync result</legend>
            <select
              aria-label="Portal sync result"
              defaultValue={syncScenario()}
              onChange={(e) => setSyncScenario(e.target.value as SyncScenario)}
              className="mt-2 w-full rounded-lg border border-oxford-ink/20 bg-white px-2 py-2 text-sm text-oxford-ink"
            >
              {SYNC_CASES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                try {
                  window.sessionStorage.removeItem("us.autoSynced");
                } catch {
                  /* ignore */
                }
                window.location.assign("/home");
              }}
              className="mt-2 text-xs font-semibold text-oxford-ink underline underline-offset-4"
            >
              Reopen the app (runs the automatic sync)
            </button>
          </fieldset>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mock-state-panel"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-oxford-ink px-4 py-2.5 text-xs font-semibold text-white shadow-lg"
      >
        {open ? (
          <X className="h-4 w-4" aria-hidden="true" />
        ) : (
          <FlaskConical className="h-4 w-4" aria-hidden="true" />
        )}
        Test states
      </button>
    </div>
  );
};
