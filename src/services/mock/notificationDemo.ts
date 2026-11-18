import type { NotificationDraft } from "../types";
import { mockClockService } from "./clockService";
import { liveAnnouncements, liveEvents } from "./liveContent";
import { mockGoalsService, mockPlanService } from "./forYouService";
import { readReminderPrefs, timetableFor } from "./timetableService";

// Sample notifications for the Test notifications panel (flow 09). Each one is
// built from the student's own data, so its deep link opens a real screen.
// "removed" points at content that no longer exists.

export type DemoKind = "lecture" | "news" | "event" | "deadline" | "goal" | "removed";

export const DEMO_KINDS: { id: DemoKind; label: string; personal: boolean }[] = [
  { id: "lecture", label: "Lecture reminder", personal: true },
  { id: "news", label: "News", personal: false },
  { id: "event", label: "Event", personal: false },
  { id: "deadline", label: "Deadline", personal: true },
  { id: "goal", label: "Goal reminder", personal: true },
  { id: "removed", label: "Removed event", personal: false },
];

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_NAME: Record<string, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday" };

const isoDay = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** A ready-to-send notification, or why this student can't get one of this kind. */
export const demoDraft = async (kind: DemoKind, userKey: string): Promise<NotificationDraft | { unavailable: string }> => {
  const now = mockClockService.now();

  if (kind === "lecture") {
    const timetable = timetableFor(userKey);
    // The next timetabled session from today onwards.
    const today = DAY_ORDER[(now.getDay() + 6) % 7] ?? "mon";
    const sessions = (timetable?.courses ?? []).flatMap((c) =>
      c.sessions.filter((s) => s.day && s.start).map((s) => ({ c, s })),
    );
    const order = (day: string) => (DAY_ORDER.indexOf(day as (typeof DAY_ORDER)[number]) - DAY_ORDER.indexOf(today) + 7) % 7;
    const next = sessions.sort((a, b) => order(a.s.day!) - order(b.s.day!) || a.s.start!.localeCompare(b.s.start!))[0];
    if (!next) return { unavailable: "Set up your courses first." };
    const lead = readReminderPrefs(userKey)?.minutesBefore ?? 15;
    return {
      category: "lectures",
      type: "reminder",
      title: `${next.c.code} ${next.s.kind} in ${lead} minutes`,
      body: `${next.c.title}, ${DAY_NAME[next.s.day!]} ${next.s.start}${next.s.venue ? ` in ${next.s.venue}` : ""}.`,
      target: { kind: "lecture", id: next.s.id },
    };
  }

  if (kind === "news") {
    const a = liveAnnouncements(now)[0]!;
    return { category: "news", type: "update", title: `New from ${a.source}`, body: a.title, target: { kind: "announcement", id: a.id } };
  }

  if (kind === "event") {
    const e = liveEvents(now)
      .filter((x) => new Date(x.endsAt) > now)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]!;
    const start = new Date(e.startsAt);
    return {
      category: "events",
      type: "reminder",
      title: `Coming up: ${e.title}`,
      body: `${start.toLocaleDateString("en-GB", { weekday: "long" })} at ${start.toTimeString().slice(0, 5)}, ${e.venue}.`,
      target: { kind: "event", id: e.id },
    };
  }

  if (kind === "deadline") {
    // Due in three days; it also goes into the weekly plan as a task.
    const due = new Date(now);
    due.setDate(due.getDate() + 3);
    const date = isoDay(due);
    const task = await mockPlanService.add(userKey, { title: "Pay the second fee instalment", date, time: null, goalId: null });
    return {
      category: "deadlines",
      type: "reminder",
      title: "Deadline: second fee instalment",
      body: `Due ${due.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}. It's in your weekly plan.`,
      target: { kind: "deadline", date, id: task.id },
    };
  }

  if (kind === "goal") {
    const goal = (await mockGoalsService.list(userKey)).find((g) => g.status === "active");
    if (!goal) return { unavailable: "Set an active goal in For You first." };
    const step = goal.steps.find((s) => !s.done);
    return {
      category: "goals",
      type: "reminder",
      title: `Goal reminder: ${goal.title}`,
      body: step ? `Next step: ${step.text}.` : "Record your progress when something changes.",
      target: { kind: "goal", id: goal.id },
    };
  }

  // Removed content: an event that has since been cancelled.
  return {
    category: "events",
    type: "update",
    title: "Venue change: Freshers' durbar",
    body: "The durbar has moved to the Great Hall.",
    target: { kind: "event", id: "freshers-durbar" },
  };
};
