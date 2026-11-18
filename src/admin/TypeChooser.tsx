import { Link } from "react-router-dom";
import { CalendarDays, Landmark, MapPin, Megaphone, Table2, type LucideIcon } from "lucide-react";
import type { ContentType } from "@/services";
import { useAdmin, canWrite } from "./AdminAuth";
import { abtn, PageTitle } from "./ui";

const TYPES: { type: ContentType; icon: LucideIcon; title: string; body: string }[] = [
  { type: "timetable", icon: Table2, title: "Timetable", body: "Official course sessions for a semester. Import a CSV or enter them by hand." },
  { type: "news", icon: Megaphone, title: "News", body: "An announcement for all students, a level or a programme." },
  { type: "event", icon: CalendarDays, title: "Event", body: "Something on campus with a date, venue and optional registration." },
  { type: "service", icon: Landmark, title: "Service", body: "A university service with opening hours, contacts and a location." },
  { type: "place", icon: MapPin, title: "Place", body: "A building or spot on the campus map, with entrances for walking directions." },
];

/** Flow 10 "Choose content type". */
export const TypeChooser = () => {
  const { user } = useAdmin();
  if (!canWrite(user))
    return (
      <>
        <PageTitle title="Create content" />
        <p className="max-w-lg text-sm text-oxford-ink2">Reviewers approve and publish content but don't create it. Ask an editor or a super admin if something needs adding.</p>
        <Link to="/admin/review" className={abtn("secondary", "mt-4")}>
          Go to the review queue
        </Link>
      </>
    );

  return (
    <>
      <PageTitle title="Create content" description="What would you like to add to the student app?" />
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {TYPES.map(({ type, icon: Icon, title, body }) => (
          <li key={type}>
            <Link
              to={`/admin/content/new/${type}`}
              className="flex h-full items-start gap-3 rounded-xl border border-oxford-rule bg-white p-4 transition hover:border-oxford-ink/30 hover:shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-oxford-sandSoft">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold text-oxford-ink">{title}</span>
                <span className="mt-0.5 block text-sm text-oxford-mute">{body}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
};
