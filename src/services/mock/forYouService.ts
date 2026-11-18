import { ASSESSMENTS } from "@/config/grading";
import { toISODate, addDays } from "@/lib/days";
import { summariseGpa } from "@/lib/gpa";
import { storage } from "@/lib/storage";
import type {
  CheckIn,
  CourseResult,
  Goal,
  GoalInput,
  GoalsService,
  OpportunitiesService,
  Opportunity,
  PlanService,
  PlanTask,
} from "../types";
import { PROGRAMMES } from "./catalogService";
import { mockClockService } from "./clockService";
import { liveEvents } from "./liveContent";
import { SEMESTERS } from "./courseData";
import { db, wait } from "./db";
import {
  DEPARTMENT_TOPICS,
  EVENT_TOPICS,
  GOAL_TOPICS,
  SETUP_GOAL_ALIASES,
  SUGGESTED_GOALS,
  resourcesAt,
  seedForYou,
} from "./forYouData";
import { PREFS_KEY } from "./setupService";
import { mockTimetableService } from "./timetableService";

const KEY = "us.v7.forYou";
const DEMO_ACCOUNT = "stu-ama";

interface Store {
  goals: Goal[];
  checkIns: CheckIn[];
  tasks: PlanTask[];
  results: CourseResult[];
}

const now = () => mockClockService.now();
const semesterEnd = () => (SEMESTERS.find((s) => s.current) ?? SEMESTERS[SEMESTERS.length - 1]!).endsOn;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** First visit: the demo student gets sample data; others start from the goal they chose in setup, if any. */
const initialStore = (accountId: string): Store => {
  if (accountId === DEMO_ACCOUNT) return seedForYou(now(), semesterEnd());
  const setupGoal = storage.get<Record<string, { goal: string | null }>>(PREFS_KEY, {})[accountId]?.goal ?? null;
  if (!setupGoal) return { goals: [], checkIns: [], tasks: [], results: [] };
  const suggestion = SUGGESTED_GOALS.find((s) => s.title === setupGoal || s.id === SETUP_GOAL_ALIASES[setupGoal]);
  const goal: Goal = {
    id: newId("g"),
    title: setupGoal,
    target: suggestion?.target ?? { kind: "description", text: setupGoal },
    deadline: semesterEnd(),
    steps: (suggestion?.steps ?? []).map((text, i) => ({ id: `s${i + 1}`, text, done: false })),
    reminder: null,
    status: "active",
    progress: 0,
    createdAt: now().toISOString(),
    completedAt: null,
    archivedAt: null,
  };
  return { goals: [goal], checkIns: [], tasks: [], results: [] };
};

const load = (accountId: string): Store => {
  const all = storage.get<Record<string, Store>>(KEY, {});
  const existing = all[accountId];
  if (existing) return existing;
  const fresh = initialStore(accountId);
  all[accountId] = fresh;
  storage.set(KEY, all);
  return fresh;
};

const save = (accountId: string, store: Store) => {
  const all = storage.get<Record<string, Store>>(KEY, {});
  all[accountId] = store;
  storage.set(KEY, all);
};

const mutateGoal = (accountId: string, goalId: string, change: (g: Goal) => Goal): Goal => {
  const store = load(accountId);
  const idx = store.goals.findIndex((g) => g.id === goalId);
  if (idx === -1) throw new Error("Goal not found");
  const next = change(store.goals[idx]!);
  store.goals[idx] = next;
  save(accountId, store);
  return next;
};

const fullValue = (g: Goal) => (g.target.kind === "description" ? 100 : g.target.value);

const applyInput = (input: GoalInput) => ({
  title: input.title.trim(),
  target: input.target,
  deadline: input.deadline,
  steps: input.steps
    .filter((s) => s.text.trim())
    .map((s, i) => ({ id: s.id ?? newId(`s${i}`), text: s.text.trim(), done: s.done ?? false })),
  reminder: input.reminder,
});

export const mockGoalsService: GoalsService = {
  suggestions: () => SUGGESTED_GOALS,

  async list(accountId) {
    await wait(350);
    return load(accountId).goals;
  },

  async get(accountId, goalId) {
    await wait(300);
    const store = load(accountId);
    const goal = store.goals.find((g) => g.id === goalId);
    if (!goal) return null;
    const checkIns = store.checkIns.filter((c) => c.goalId === goalId).sort((a, b) => b.at.localeCompare(a.at));
    return { goal, checkIns };
  },

  async create(accountId, input) {
    await wait(600);
    const store = load(accountId);
    const goal: Goal = {
      id: newId("g"),
      ...applyInput(input),
      status: "active",
      progress: 0,
      createdAt: now().toISOString(),
      completedAt: null,
      archivedAt: null,
    };
    store.goals.unshift(goal);
    save(accountId, store);
    return goal;
  },

  async update(accountId, goalId, input) {
    await wait(500);
    return mutateGoal(accountId, goalId, (g) => ({ ...g, ...applyInput(input) }));
  },

  async setStepDone(accountId, goalId, stepId, done) {
    await wait(150);
    return mutateGoal(accountId, goalId, (g) => ({
      ...g,
      steps: g.steps.map((s) => (s.id === stepId ? { ...s, done } : s)),
    }));
  },

  async checkIn(accountId, goalId, { value, note }) {
    await wait(500);
    const entry: CheckIn = { id: newId("c"), goalId, at: now().toISOString(), value, note };
    mutateGoal(accountId, goalId, (g) => ({ ...g, progress: value }));
    const store = load(accountId);
    store.checkIns.push(entry);
    save(accountId, store);
    return entry;
  },

  async complete(accountId, goalId) {
    await wait(500);
    return mutateGoal(accountId, goalId, (g) => ({
      ...g,
      status: "completed",
      // A GPA comes from course results, so completing doesn't change it.
      progress: g.target.kind === "gpa" ? g.progress : Math.max(g.progress, fullValue(g)),
      reminder: null,
      completedAt: now().toISOString(),
    }));
  },

  async archive(accountId, goalId) {
    await wait(500);
    return mutateGoal(accountId, goalId, (g) => ({ ...g, status: "archived", reminder: null, archivedAt: now().toISOString() }));
  },

  async reopen(accountId, goalId) {
    await wait(400);
    return mutateGoal(accountId, goalId, (g) => ({ ...g, status: "active", completedAt: null, archivedAt: null }));
  },

  async history(accountId) {
    await wait(350);
    return [...load(accountId).checkIns].sort((a, b) => b.at.localeCompare(a.at));
  },

  async results(accountId) {
    await wait(250);
    return load(accountId).results;
  },

  async recordResult(accountId, goalId, input, note) {
    await wait(500);
    const courses = (await mockTimetableService.get(accountId))?.courses ?? [];
    const store = load(accountId);
    const at = now().toISOString();
    const result: CourseResult = { id: newId("r"), ...input, recordedAt: at };
    // A new mid-semester or final result replaces the old one; assignments add up.
    if (input.assessment !== "assignment") {
      store.results = store.results.filter((r) => !(r.courseCode === input.courseCode && r.assessment === input.assessment));
    }
    store.results.push(result);

    const { gpa } = summariseGpa(courses, store.results);
    const goal = store.goals.find((g) => g.id === goalId);
    let checkIn: CheckIn | null = null;
    if (goal && gpa !== null) {
      goal.progress = gpa;
      const label = ASSESSMENTS.find((a) => a.id === input.assessment)?.label.toLowerCase() ?? input.assessment;
      const what = input.score !== null ? `${input.score}%` : input.grade;
      checkIn = { id: newId("c"), goalId, at, value: gpa, note: [`${input.courseCode} ${label}: ${what}`, note].filter(Boolean).join(". ") };
      store.checkIns.push(checkIn);
    }
    save(accountId, store);
    return { result, checkIn };
  },
};

export const mockPlanService: PlanService = {
  async week(accountId, weekStart) {
    await wait(300);
    const end = addDays(weekStart, 6);
    return load(accountId)
      .tasks.filter((t) => t.date >= weekStart && t.date <= end)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "99").localeCompare(b.time ?? "99"));
  },

  async add(accountId, input) {
    await wait(300);
    const store = load(accountId);
    const task: PlanTask = { id: newId("t"), ...input, title: input.title.trim(), done: false };
    store.tasks.push(task);
    save(accountId, store);
    return task;
  },

  async update(accountId, taskId, patch) {
    await wait(200);
    const store = load(accountId);
    const idx = store.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) throw new Error("Task not found");
    const next = { ...store.tasks[idx]!, ...patch };
    store.tasks[idx] = next;
    save(accountId, store);
    return next;
  },

  async remove(accountId, taskId) {
    await wait(200);
    const store = load(accountId);
    store.tasks = store.tasks.filter((t) => t.id !== taskId);
    save(accountId, store);
  },
};

const eventDetail = (startsAt: string, venue: string) =>
  `${new Date(startsAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · ${venue}`;

export const mockOpportunitiesService: OpportunitiesService = {
  async forStudent(accountId) {
    await wait(400);
    const at = now();
    const goals = load(accountId).goals.filter((g) => g.status === "active");
    const account = db.findById(accountId);
    const programme = PROGRAMMES.find((p) => p.id === account?.academic?.programmeId);
    const programmeTopics = new Set(DEPARTMENT_TOPICS[account?.academic?.departmentId ?? ""] ?? []);

    /** Why it's suggested: a matching goal first, then the programme. Null when it doesn't fit. */
    const reasonFor = (topics: string[]) => {
      const goal = goals.find((g) => GOAL_TOPICS.some(([re, topic]) => re.test(g.title) && topics.includes(topic)));
      if (goal) return `Matches your goal: ${goal.title}`;
      if (programme && topics.some((t) => programmeTopics.has(t))) return `For your programme: ${programme.name}`;
      return null;
    };

    const out: Opportunity[] = [];
    for (const e of liveEvents(at).sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
      if (new Date(e.endsAt) < at) continue;
      const reason = reasonFor(EVENT_TOPICS[e.id] ?? []);
      if (reason) out.push({ type: "event", id: e.id, title: e.title, kind: e.category, detail: eventDetail(e.startsAt, e.venue), reason });
    }
    for (const r of resourcesAt(at)) {
      if (r.deadline && r.deadline < toISODate(at)) continue;
      const reason = reasonFor(r.topics);
      if (reason) out.push({ type: "resource", id: r.id, title: r.title, kind: r.kind, detail: r.provider, reason });
    }
    // Goal matches before programme matches.
    return out.sort((a, b) => Number(b.reason.startsWith("Matches")) - Number(a.reason.startsWith("Matches")));
  },

  async resource(id) {
    await wait(300);
    const r = resourcesAt(now()).find((x) => x.id === id);
    if (!r) return null;
    const { topics, ...resource } = r;
    void topics;
    return resource;
  },
};
