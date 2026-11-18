import { useEffect, useState } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AlertTriangle, CheckCircle2, ImagePlus, MapPin, Plus, Trash2 } from "lucide-react";
import { services, type LatLng, type PlaceCategory, type PlacePayload } from "@/services";
import { distance } from "@/lib/geo";
import { abtn, Card, Field, SelectInput, TextArea, TextInput } from "../ui";
import { fid, HoursEditor, type FormProps } from "./fields";

const CATEGORIES: PlaceCategory[] = ["Food", "Lecture halls", "Libraries", "Offices", "ATMs", "Health", "Hostels", "Sports"];
/** An entrance this close to a verified path counts as connected. */
const CONNECT_M = 40;
/** An entrance further than this from the pin is probably a misplaced click. */
const FAR_M = 200;

const ll = (p: LatLng): [number, number] => [p.lat, p.lng];
const round = (n: number) => Math.round(n * 1e6) / 1e6;

const pinIcon = L.divIcon({
  className: "us-marker",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  html: '<span class="us-marker-dot is-selected" style="width:30px;height:30px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>',
});

const entranceIcon = (n: number) =>
  L.divIcon({
    className: "us-marker",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<span style="display:flex;width:26px;height:26px;align-items:center;justify-content:center;border-radius:9999px;background:rgb(var(--us-success));color:#fff;border:2px solid #fff;font:600 12px var(--us-font-sans);box-shadow:0 1px 4px rgb(0 0 0/.3)">${n}</span>`,
  });

/** Keeps Leaflet's size right when the form is shown again after the preview tab. */
const SizeWatcher = () => {
  const map = useMap();
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
};

/** Brings the pin into view when it's moved from the coordinate fields. */
const FollowPin = ({ pin }: { pin: LatLng | null }) => {
  const map = useMap();
  const lat = pin?.lat;
  const lng = pin?.lng;
  useEffect(() => {
    if (lat == null || lng == null) return;
    if (!map.getBounds().pad(-0.1).contains([lat, lng])) map.setView([lat, lng], Math.min(map.getZoom(), 16));
  }, [map, lat, lng]);
  return null;
};

const ClickToPlace = ({ onClick }: { onClick: (p: LatLng) => void }) => {
  useMapEvents({ click: (e) => onClick({ lat: round(e.latlng.lat), lng: round(e.latlng.lng) }) });
  return null;
};

/** Downscale an uploaded photo so it fits in local storage. Transparent areas become white. */
const shrinkPhoto = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1000 / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

type PathResult = { metres: number; name: string | null }[];

export const PlaceForm = ({ value: v, onChange, errors, reference }: FormProps<PlacePayload>) => {
  const [mode, setMode] = useState<"pin" | "entrance">(v.lat === null ? "pin" : "entrance");
  const [checking, setChecking] = useState(false);
  const [paths, setPaths] = useState<PathResult | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const campus = reference.campus;
  const pin = v.lat !== null && v.lng !== null ? { lat: v.lat, lng: v.lng } : null;
  const outside = pin ? distance(pin, campus.center) > campus.radiusM : false;
  const [centre] = useState(() => ll(pin ?? campus.center));
  const readCentre = map
    ? () => {
        const c = map.getCenter();
        return { lat: round(c.lat), lng: round(c.lng) };
      }
    : null;

  // Moving the pin or an entrance means the path needs checking again.
  const changeEntrances = (entrances: PlacePayload["entrances"]) => {
    setPaths(null);
    onChange({ entrances, pathChecked: false });
  };
  const setPin = (p: LatLng) => onChange({ lat: p.lat, lng: p.lng });
  const addEntrance = (p: LatLng) => changeEntrances([...v.entrances, { ...p, label: v.entrances.length === 0 ? "Main entrance" : `Entrance ${v.entrances.length + 1}` }]);

  const onMapClick = (p: LatLng) => {
    if (mode === "pin" || !pin) {
      setPin(p);
      setMode("entrance");
    } else addEntrance(p);
  };

  const checkPath = async () => {
    setChecking(true);
    try {
      const results = await Promise.all(v.entrances.map((e) => services.campus.nearestPath(e)));
      setPaths(results);
      onChange({ pathChecked: results.every((r) => r.metres <= CONNECT_M) });
    } finally {
      setChecking(false);
    }
  };

  const coord = "w-28 rounded-md border border-oxford-ink/25 bg-white px-2 py-1 text-sm";

  return (
    <>
      <Card title="Place details">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <TextInput id={fid("name")} label="Name" required value={v.name} onChange={(e) => onChange({ name: e.target.value })} error={errors.name} />
            <SelectInput id={fid("category")} label="Category" value={v.category} onChange={(e) => onChange({ category: e.target.value as PlaceCategory })}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </SelectInput>
          </div>
          <TextInput id={fid("summary")} label="Short summary" required value={v.summary} onChange={(e) => onChange({ summary: e.target.value })} error={errors.summary} maxLength={200} />
          <TextArea id={fid("description")} label="Description (optional)" rows={4} value={v.description} onChange={(e) => onChange({ description: e.target.value })} />
          <Field id={fid("photo")} label="Photo (optional)" hint={photoError ?? "JPEG or PNG. It's resized for the app."}>
            {v.photo ? (
              <div className="flex items-start gap-3">
                <img src={v.photo} alt="Uploaded photo of the place" className="h-24 w-40 rounded-md border border-oxford-rule object-cover" />
                <button type="button" onClick={() => onChange({ photo: "" })} className={abtn("secondary")}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Remove photo
                </button>
              </div>
            ) : (
              <label className={abtn("secondary", "cursor-pointer focus-within:ring-2 focus-within:ring-oxford-gold")}>
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                Upload a photo
                <input
                  id={fid("photo")}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setPhotoError(null);
                      onChange({ photo: await shrinkPhoto(file) });
                    } catch {
                      setPhotoError("That file couldn't be read as an image. Try a JPEG or PNG.");
                    }
                  }}
                />
              </label>
            )}
          </Field>
          <HoursEditor rows={v.hours} onChange={(hours) => onChange({ hours })} emptyNote="No hours listed. Students won't see “open now” for this place." />
        </div>
      </Card>

      <Card title="Map location and entrances">
        <div id={fid("location")} tabIndex={-1} className="outline-none">
          <div className="mb-2 flex flex-wrap items-center gap-2" role="group" aria-label="What a click on the map does">
            <span className="text-xs font-semibold">Clicking the map:</span>
            <button type="button" aria-pressed={mode === "pin"} onClick={() => setMode("pin")} className={abtn(mode === "pin" ? "primary" : "secondary")}>
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Moves the place pin
            </button>
            <button type="button" aria-pressed={mode === "entrance"} disabled={!pin} onClick={() => setMode("entrance")} className={abtn(mode === "entrance" ? "primary" : "secondary")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Adds an entrance
            </button>
          </div>
          <div className={`h-[340px] overflow-hidden rounded-lg border ${errors.location ? "border-oxford-danger" : "border-oxford-rule"}`}>
            <MapContainer ref={setMap} center={centre} zoom={pin ? 17 : 15} minZoom={13} maxZoom={19} className="us-map-picking h-full w-full">
              <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
                maxZoom={19}
              />
              <SizeWatcher />
              <FollowPin pin={pin} />
              <ClickToPlace onClick={onMapClick} />
              <Circle center={ll(campus.center)} radius={campus.radiusM} interactive={false} pathOptions={{ color: "#0e1b3a", weight: 1.5, dashArray: "6 6", fillOpacity: 0.03 }} />
              {pin && (
                <Marker
                  position={ll(pin)}
                  icon={pinIcon}
                  draggable
                  title="Place pin. Drag to move."
                  alt="Place pin"
                  zIndexOffset={500}
                  eventHandlers={{ dragend: (e) => setPin({ lat: round(e.target.getLatLng().lat), lng: round(e.target.getLatLng().lng) }) }}
                />
              )}
              {v.entrances.map((en, i) => (
                <Marker
                  key={i}
                  position={ll(en)}
                  icon={entranceIcon(i + 1)}
                  draggable
                  title={`${en.label}. Drag to move.`}
                  alt={en.label}
                  eventHandlers={{
                    dragend: (e) => changeEntrances(v.entrances.map((x, j) => (j === i ? { ...x, lat: round(e.target.getLatLng().lat), lng: round(e.target.getLatLng().lng) } : x))),
                  }}
                />
              ))}
            </MapContainer>
          </div>
          <p className="mt-1 text-xs text-oxford-mute">The dashed circle is the campus area. Pins and numbered entrances can be dragged.</p>
          {errors.location && <p className="mt-1 text-xs font-semibold text-oxford-danger">{errors.location}</p>}

          {outside && (
            <p role="status" className="mt-2 flex items-start gap-2 rounded-md border border-oxford-gold/60 bg-oxford-gold/10 p-2.5 text-sm text-oxford-ink">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              This pin is outside the campus area. Check it's in the right place: students won't get walking directions to places off campus.
            </p>
          )}

          <fieldset className="mt-4">
            <legend className="text-xs font-semibold">Place pin</legend>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <label>
                Latitude{" "}
                <input type="number" step="0.00001" value={v.lat ?? ""} onChange={(e) => onChange({ lat: e.target.value === "" ? null : Number(e.target.value), lng: v.lng ?? campus.center.lng })} className={coord} />
              </label>
              <label>
                Longitude{" "}
                <input type="number" step="0.00001" value={v.lng ?? ""} onChange={(e) => onChange({ lng: e.target.value === "" ? null : Number(e.target.value), lat: v.lat ?? campus.center.lat })} className={coord} />
              </label>
              <button type="button" onClick={() => readCentre && setPin(readCentre())} className={abtn("secondary")}>
                Place pin at map centre
              </button>
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="text-xs font-semibold">
              Entrances<span aria-hidden="true" className="text-oxford-danger"> *</span>
              <span className="sr-only"> (required)</span>
            </legend>
            <p className="text-xs text-oxford-mute">Walking directions end at the main entrance (number 1).</p>
            {errors.entrances && <p className="mt-1 text-xs font-semibold text-oxford-danger">{errors.entrances}</p>}
            <ol className="mt-2 space-y-2">
              {v.entrances.map((en, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-oxford-success text-xs font-semibold text-white" aria-hidden="true">
                    {i + 1}
                  </span>
                  <label className="sr-only" htmlFor={`entrance-label-${i}`}>
                    Entrance {i + 1} name
                  </label>
                  <input id={`entrance-label-${i}`} value={en.label} onChange={(e) => onChange({ entrances: v.entrances.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} className="w-44 rounded-md border border-oxford-ink/25 bg-white px-2 py-1 text-sm" />
                  <span className="text-xs text-oxford-mute">
                    {en.lat.toFixed(5)}, {en.lng.toFixed(5)}
                  </span>
                  {pin && distance(pin, en) > FAR_M && <span className="text-xs font-semibold text-oxford-ink">{Math.round(distance(pin, en))} m from the place pin. Is that right?</span>}
                  {paths?.[i] && (
                    <span className={`text-xs font-semibold ${paths[i]!.metres <= CONNECT_M ? "text-oxford-success" : "text-oxford-danger"}`}>
                      {paths[i]!.metres <= CONNECT_M ? `Connects${paths[i]!.name ? ` to ${paths[i]!.name}` : ""} (${paths[i]!.metres} m)` : `${paths[i]!.metres} m from the nearest path`}
                    </span>
                  )}
                  <button type="button" onClick={() => changeEntrances(v.entrances.filter((_, j) => j !== i))} className={abtn("ghost", "px-2")} aria-label={`Remove ${en.label}`}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
            <button id={fid("entrances")} type="button" disabled={!readCentre} onClick={() => readCentre && addEntrance(readCentre())} className={abtn("secondary", "mt-2")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add entrance at map centre
            </button>
          </fieldset>

          <div className="mt-4 rounded-lg border border-oxford-rule bg-oxford-paper p-3">
            <p className="text-sm font-semibold">Walking path</p>
            <p className="text-xs text-oxford-mute">Each entrance must be within {CONNECT_M} m of a verified campus path so students get walking directions.</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button id={fid("pathChecked")} type="button" disabled={v.entrances.length === 0 || checking} onClick={checkPath} className={abtn("secondary")}>
                {checking ? "Checking…" : "Check walking path"}
              </button>
              <span role="status" className="text-sm">
                {v.pathChecked ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-oxford-success">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Every entrance connects to a walking path
                  </span>
                ) : paths ? (
                  <span className="font-semibold text-oxford-danger">Move the entrances marked in red closer to a path, then check again.</span>
                ) : v.entrances.length ? (
                  <span className="text-oxford-mute">Not checked yet</span>
                ) : null}
              </span>
            </div>
            {errors.pathChecked && !v.pathChecked && <p className="mt-1 text-xs font-semibold text-oxford-danger">{errors.pathChecked}</p>}
          </div>
        </div>
      </Card>
    </>
  );
};
