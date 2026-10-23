import type { NotificationItem } from "@/data/types";

export const notifications: NotificationItem[] = [
  {
    id: "ntf-1",
    title: "Registration deadline tomorrow",
    body: "Semester 1 registration closes at 23:59 tomorrow.",
    date: "2026-10-21T08:00:00",
    read: false,
    target: { kind: "item", section: "academic", itemId: "acad-1" },
  },
  {
    id: "ntf-2",
    title: "New announcement",
    body: "Visa renewal clinic on Friday — see details.",
    date: "2026-10-19T11:00:00",
    read: false,
    target: { kind: "announcement", id: "ann-4" },
  },
  {
    id: "ntf-3",
    title: "Saved item updated",
    body: "Pentagon Hostel updated their contact details.",
    date: "2026-10-18T14:30:00",
    read: true,
    target: { kind: "item", section: "accommodation", itemId: "acc-3" },
  },
  {
    id: "ntf-4",
    title: "Event this week",
    body: "Freshers' Week Welcome Party on Saturday.",
    date: "2026-10-17T09:00:00",
    read: true,
    target: { kind: "event", id: "ev-1" },
  },
  {
    id: "ntf-5",
    title: "Opportunity closing soon",
    body: "MTN Internship application closes 1 December.",
    date: "2026-10-16T10:00:00",
    read: true,
    target: { kind: "item", section: "opportunities", itemId: "opp-1" },
  },
];
