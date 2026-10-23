import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { EventItem } from "@/data/types";
import { formatDateTime } from "@/lib/format";

interface Props {
  event: EventItem;
  linkTo?: string;
}

export const EventCard = ({ event, linkTo }: Props) => {
  const content = (
    <>
      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent-100 px-2.5 py-1 text-[11px] font-semibold text-accent-600">
        <CalendarDays className="h-3 w-3" aria-hidden="true" />
        Event
      </span>
      <span className="block text-[15px] font-semibold leading-snug text-slate-900">
        {event.title}
      </span>
      <span className="mt-2 block text-xs text-slate-500">
        {formatDateTime(event.date)}
      </span>
      <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
        <MapPin className="h-3 w-3" aria-hidden="true" />
        {event.location}
      </span>
    </>
  );
  const className =
    "flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-brand-200 hover:shadow-lift";
  if (linkTo) {
    return (
      <Link to={linkTo} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
};
