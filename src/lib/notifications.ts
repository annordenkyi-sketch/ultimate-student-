import {
  AlarmClock,
  Bell,
  BookOpen,
  CalendarClock,
  CalendarDays,
  Megaphone,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { AppNotification, NotificationCategory, NotificationTarget } from "@/services";

/** Deep link for a notification. `ref=notification` lets Back return to the notification centre. */
export const linkFor = (t: NotificationTarget): string => {
  const ref = "ref=notification";
  switch (t.kind) {
    case "lecture":
      return `/lectures/${encodeURIComponent(t.id)}?${ref}`;
    case "announcement":
      return `/announcements/${encodeURIComponent(t.id)}?${ref}`;
    case "event":
      return `/events/${encodeURIComponent(t.id)}?${ref}`;
    case "goal":
      return `/for-you/goals/${encodeURIComponent(t.id)}?${ref}`;
    case "deadline":
      return `/for-you/plan?day=${t.date}${t.id ? `&task=${encodeURIComponent(t.id)}` : ""}&${ref}`;
  }
};

export const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  lectures: "Lectures",
  news: "News",
  events: "Events",
  deadlines: "Deadlines",
  goals: "Goals",
};

/** Personal categories need a verified student; news and events are public. */
export const PERSONAL_CATEGORIES: NotificationCategory[] = ["lectures", "deadlines", "goals"];

/** Icon and short label, decided by category and whether it's a reminder or an update. */
export const describe = (n: Pick<AppNotification, "category" | "type">): { icon: LucideIcon; label: string } => {
  const reminder = n.type === "reminder";
  switch (n.category) {
    case "lectures":
      return reminder ? { icon: Bell, label: "Lecture reminder" } : { icon: BookOpen, label: "Lecture update" };
    case "news":
      return { icon: Megaphone, label: "News" };
    case "events":
      return reminder ? { icon: CalendarClock, label: "Event reminder" } : { icon: CalendarDays, label: "Event update" };
    case "deadlines":
      return { icon: AlarmClock, label: "Deadline" };
    case "goals":
      return { icon: Target, label: reminder ? "Goal reminder" : "Goal update" };
  }
};
