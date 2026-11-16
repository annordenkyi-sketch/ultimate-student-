import { bearing, distance, pointAlong, walkMinutes } from "@/lib/geo";
import type { CampusService, LatLng, RouteStep, WalkRoute } from "../types";
import { CAMPUS_AREA, LANDMARKS, PLACES, ROUTABLE } from "./campusData";
import { wait } from "./db";

// Walking routes over the campus path network in ./campusPaths.json: footways,
// paths and campus roads from OpenStreetMap (© OpenStreetMap contributors,
// ODbL). A real backend would serve verified paths instead.

/** Furthest a start point can be from a path and still get a route. */
const MAX_CONNECT_M = 300;
/** A bearing change bigger than this at a junction is a turn. */
const TURN_DEG = 35;
/** Name a junction after a place within this distance. */
const LANDMARK_M = 70;

interface RawGraph {
  names: string[];
  nodes: [number, number][];
  edges: [number, number, number][];
}

interface Graph {
  nodes: LatLng[];
  adj: { to: number; m: number; name: string | null }[][];
  /** Path node at each routable place's entrance. */
  entranceNode: Record<string, number>;
}

const nearestNode = (nodes: LatLng[], p: LatLng) => {
  let best = 0;
  let bestM = Infinity;
  nodes.forEach((n, i) => {
    const m = distance(p, n);
    if (m < bestM) {
      bestM = m;
      best = i;
    }
  });
  return { i: best, m: bestM };
};

let graph: Promise<Graph> | null = null;
const loadGraph = () =>
  (graph ??= import("./campusPaths.json").then(({ default: raw }) => {
    const g = raw as unknown as RawGraph;
    const nodes = g.nodes.map(([lat, lng]) => ({ lat, lng }));
    const adj: Graph["adj"] = nodes.map(() => []);
    for (const [a, b, n] of g.edges) {
      const m = distance(nodes[a]!, nodes[b]!);
      const name = n >= 0 ? (g.names[n] ?? null) : null;
      adj[a]!.push({ to: b, m, name });
      adj[b]!.push({ to: a, m, name });
    }
    const entranceNode: Record<string, number> = {};
    for (const p of PLACES) if (ROUTABLE.has(p.id)) entranceNode[p.id] = nearestNode(nodes, p.entrance).i;
    return { nodes, adj, entranceNode };
  }));

/** Shortest distances from `source` to every node (Dijkstra with a binary heap). */
const shortestFrom = (g: Graph, source: number) => {
  const dist = new Float64Array(g.nodes.length).fill(Infinity);
  const prev = new Int32Array(g.nodes.length).fill(-1);
  dist[source] = 0;
  const heap: [number, number][] = [[0, source]];
  const push = (item: [number, number]) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent]![0] <= heap[i]![0]) break;
      [heap[parent], heap[i]] = [heap[i]!, heap[parent]!];
      i = parent;
    }
  };
  const pop = () => {
    const top = heap[0]!;
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && heap[l]![0] < heap[m]![0]) m = l;
        if (r < heap.length && heap[r]![0] < heap[m]![0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i]!, heap[m]!];
        i = m;
      }
    }
    return top;
  };
  while (heap.length) {
    const [d, u] = pop();
    if (d > dist[u]!) continue;
    for (const { to, m } of g.adj[u]!) {
      const alt = d + m;
      if (alt < dist[to]!) {
        dist[to] = alt;
        prev[to] = u;
        push([alt, to]);
      }
    }
  }
  return { dist, prev };
};

const COMPASS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
const compass = (deg: number) => COMPASS[Math.round(deg / 45) % 8]!;

const landmarkNear = (p: LatLng, exceptId: string) => {
  let best: { name: string; m: number } | null = null;
  for (const place of PLACES) {
    if (place.id === exceptId) continue;
    const m = Math.min(distance(p, place), distance(p, place.entrance));
    if (m <= LANDMARK_M && (!best || m < best.m)) best = { name: LANDMARKS[place.id] ?? place.name, m };
  }
  return best?.name ?? null;
};

const buildRoute = (g: Graph, from: LatLng, placeId: string): WalkRoute | null => {
  const place = PLACES.find((p) => p.id === placeId);
  const end = g.entranceNode[placeId];
  if (!place || end === undefined) return null;
  const start = nearestNode(g.nodes, from);
  if (start.m > MAX_CONNECT_M) return null;
  const { dist, prev } = shortestFrom(g, start.i);
  if (!Number.isFinite(dist[end]!)) return null;

  const path: number[] = [end];
  while (path[0] !== start.i) path.unshift(prev[path[0]!]!);

  const points: LatLng[] = [from, ...path.map((i) => g.nodes[i]!)];
  if (distance(points[0]!, points[1]!) < 1) points.shift();
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) cumulative.push(cumulative[i - 1]! + distance(points[i - 1]!, points[i]!));
  const total = cumulative[cumulative.length - 1]!;
  const offset = points.length - path.length; // 1 when the start connector was kept

  const edgeName = (a: number, b: number) => g.adj[a]!.find((e) => e.to === b)?.name ?? null;

  const steps: RouteStep[] = [];
  const firstName = path.length > 1 ? edgeName(path[0]!, path[1]!) : null;
  const ahead = pointAlong(points, Math.min(total, 25));
  steps.push({
    at: points[0]!,
    instruction: `Head ${compass(bearing(points[0]!, ahead))}${firstName ? ` on ${firstName}` : ""}`,
    distanceFromStart: 0,
  });

  // Turns at junctions, judged over ~15 m either side so short kinks don't count.
  for (let k = 1; k < path.length - 1; k++) {
    const node = path[k]!;
    if (g.adj[node]!.length < 3) continue;
    const at = cumulative[k + offset]!;
    if (at < 15 || total - at < 15) continue;
    const before = pointAlong(points, Math.max(0, at - 15));
    const after = pointAlong(points, Math.min(total, at + 15));
    const here = g.nodes[node]!;
    const delta = ((bearing(here, after) - bearing(before, here) + 540) % 360) - 180;
    if (Math.abs(delta) < TURN_DEG) continue;
    const prevStep = steps[steps.length - 1]!;
    if (at - prevStep.distanceFromStart < 20) continue;
    const dir = delta > 0 ? "right" : "left";
    const slight = Math.abs(delta) < 60;
    const street = edgeName(node, path[k + 1]!);
    const sameStreet = street !== null && street === edgeName(path[k - 1]!, node);
    // A bend in the same street (e.g. round the fountain) isn't a turn worth announcing.
    if (sameStreet && slight) continue;
    let landmark = landmarkNear(here, placeId);
    if (landmark && prevStep.instruction.endsWith(`at ${landmark}`)) landmark = null;
    const instruction = sameStreet
      ? `Bear ${dir} to stay on ${street}`
      : `Turn ${slight ? "slightly " : ""}${dir}${landmark ? ` at ${landmark}` : street ? ` onto ${street}` : ""}`;
    steps.push({ at: here, instruction, distanceFromStart: at });
  }

  steps.push({
    at: place.entrance,
    instruction: `Arrive at ${place.name}, ${place.entrance.label.charAt(0).toLowerCase()}${place.entrance.label.slice(1)}`,
    distanceFromStart: total,
  });

  return {
    points,
    distance: total,
    minutes: walkMinutes(total),
    steps,
    destination: { placeId, name: place.name, entrance: place.entrance },
  };
};

export const mockCampusService: CampusService = {
  area: CAMPUS_AREA,
  async places() {
    await wait(300);
    return PLACES;
  },
  async place(id) {
    await wait(200);
    return PLACES.find((p) => p.id === id) ?? null;
  },
  async route(from, placeId) {
    const [g] = await Promise.all([loadGraph(), wait(700)]);
    return buildRoute(g, from, placeId);
  },
  async walkingMinutes(from, placeIds) {
    const [g] = await Promise.all([loadGraph(), wait(150)]);
    const start = nearestNode(g.nodes, from);
    if (start.m > MAX_CONNECT_M) return {};
    const { dist } = shortestFrom(g, start.i);
    const out: Record<string, number> = {};
    for (const id of placeIds) {
      const end = g.entranceNode[id];
      if (end !== undefined && Number.isFinite(dist[end]!)) out[id] = walkMinutes(dist[end]! + start.m);
    }
    return out;
  },
  async reportIssue() {
    await wait(600);
  },
};
