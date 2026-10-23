import type { ChecklistTask } from "@/data/types";

export const defaultChecklist: ChecklistTask[] = [
  { id: "chk-1", title: "Complete course registration", done: false, helpItemId: "acad-1" },
  { id: "chk-2", title: "Pay tuition (first instalment)", done: false, helpItemId: "acad-5" },
  { id: "chk-3", title: "Collect your student ID", done: false },
  { id: "chk-4", title: "Visit the Health Service for immunisation check", done: false, helpItemId: "svc-1" },
  { id: "chk-5", title: "Set up your university email on your phone", done: false, helpItemId: "svc-3" },
  { id: "chk-6", title: "Attend one Welcome Week event", done: false, helpItemId: "soc-1" },
  { id: "chk-7", title: "Locate the Main Library", done: false, helpItemId: "nav-1" },
];
