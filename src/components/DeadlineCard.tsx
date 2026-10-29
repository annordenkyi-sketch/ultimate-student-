import { AlarmClock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Deadline } from "@/data/types";
import { formatDate, relativeDays } from "@/lib/format";

interface Props {
  deadline: Deadline;
  linkTo?: string;
}

const categoryTone: Record<Deadline["category"], string> = {
  registration: "bg-brand-100 text-brand-700",
  exam: "bg-accent-100 text-accent-700",
  fees: "bg-accent-100 text-accent-700",
  other: "bg-paper text-ink",
};

export const DeadlineCard = ({ deadline, linkTo }: Props) => {
  const soon =
    new Date(deadline.date).getTime() - Date.now() <
    7 * 24 * 60 * 60 * 1000;

  const content = (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${categoryTone[deadline.category]}`}
      >
        <AlarmClock className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-ink">
          {deadline.title}
        </span>
        <span className="flex items-center gap-2 text-xs text-muted">
          <span>{formatDate(deadline.date)}</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              soon ? "bg-accent-100 text-accent-700" : "bg-paper text-muted"
            }`}
          >
            {relativeDays(deadline.date)}
          </span>
        </span>
      </span>
      {linkTo && (
        <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
      )}
    </>
  );
  const className =
    "flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-card transition hover:border-brand-200 hover:shadow-lift";
  if (linkTo) {
    return (
      <Link to={linkTo} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
};
