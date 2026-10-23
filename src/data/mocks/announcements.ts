import type { Announcement } from "@/data/types";

export const announcements: Announcement[] = [
  {
    id: "ann-1",
    title: "Welcome Week schedule now live",
    body: "New students: your orientation schedule is now available in the Social Life section.",
    date: "2026-10-20T09:00:00",
    audience: { studentTypes: ["new"] },
  },
  {
    id: "ann-2",
    title: "Tuition deadline reminder",
    body: "Second-instalment tuition is due 30 November. Pay via the portal to avoid late fees.",
    date: "2026-10-18T12:00:00",
    audience: {},
  },
  {
    id: "ann-3",
    title: "Hostel allocation results",
    body: "On-campus hostel allocation results have been published. Check your student portal.",
    date: "2026-10-15T08:30:00",
    audience: { living: ["on-campus"] },
  },
  {
    id: "ann-4",
    title: "Visa renewal clinic",
    body: "International students: free visa renewal clinic on Friday at the ISO.",
    date: "2026-10-19T11:00:00",
    audience: { international: true },
  },
  {
    id: "ann-5",
    title: "Postgraduate research seminar",
    body: "This month's PG research seminar: 'Open data for African cities'.",
    date: "2026-10-14T15:00:00",
    audience: { studentTypes: ["postgraduate"] },
  },
  {
    id: "ann-6",
    title: "Campus Wi-Fi upgrade this weekend",
    body: "ICT will perform a Wi-Fi upgrade Saturday 02:00–06:00. Brief outages expected.",
    date: "2026-10-17T10:00:00",
    audience: {},
  },
];
