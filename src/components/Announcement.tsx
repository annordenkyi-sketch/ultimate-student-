import { Megaphone } from "lucide-react";
import type { Announcement as A } from "@/data/types";
import { formatDate } from "@/lib/format";

interface Props {
  announcement: A;
}

export const AnnouncementCard = ({ announcement }: Props) => (
  <article
    className="flex gap-3 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-3.5 shadow-card"
    aria-labelledby={`ann-${announcement.id}`}
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
      <Megaphone className="h-4 w-4" aria-hidden="true" />
    </span>
    <div className="min-w-0 flex-1">
      <h3
        id={`ann-${announcement.id}`}
        className="text-[15px] font-semibold text-ink"
      >
        {announcement.title}
      </h3>
      <p className="mt-0.5 text-xs leading-relaxed text-muted">
        {announcement.body}
      </p>
      <p className="mt-1 text-[11px] font-medium text-brand-700">
        {formatDate(announcement.date)}
      </p>
    </div>
  </article>
);
