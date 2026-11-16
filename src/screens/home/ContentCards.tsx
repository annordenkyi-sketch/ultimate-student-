import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { services } from "@/services";
import { dayLabel, relativeTime, time24 } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { useActivity } from "@/session/ActivityProvider";
import { DashCard, EmptyNote, LoadError, Skeleton } from "@/ui/DashCard";
import { SERVICE_ICONS } from "@/ui/serviceIcons";

export const NewsCard = ({ now, className = "" }: { now: Date; className?: string }) => {
  const { state, reload } = useAsync(() => services.content.announcements(), []);
  const { isAnnouncementRead } = useActivity();

  return (
    <DashCard id="news-title" title="News" action={{ to: "/announcements", label: "See all" }} className={className} order={2}>
      {state.status === "loading" && <Skeleton lines={4} />}
      {state.status === "error" && <LoadError what="the latest news" onRetry={reload} />}
      {state.status === "ready" &&
        (state.data.length === 0 ? (
          <EmptyNote>No announcements right now.</EmptyNote>
        ) : (
          <ul className="divide-y divide-oxford-rule/70">
            {state.data.slice(0, 4).map((a) => {
              const unread = !isAnnouncementRead(a.id);
              return (
                <li key={a.id}>
                  <Link to={`/announcements/${a.id}`} className="flex items-start gap-3 rounded-lg px-1 py-3 transition hover:bg-oxford-cream">
                    <span
                      aria-hidden="true"
                      className={`mt-2 h-2 w-2 shrink-0 rounded-full ${unread ? "bg-oxford-ink" : "bg-transparent"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm text-oxford-ink ${unread ? "font-semibold" : "font-medium"}`}>
                        {a.title}
                        {unread && <span className="sr-only"> (unread)</span>}
                      </span>
                      <span className="mt-0.5 block text-xs text-oxford-mute">
                        {a.source} · {relativeTime(a.publishedAt, now)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
    </DashCard>
  );
};

export const QuickActions = ({ className = "" }: { className?: string }) => {
  const { state, reload } = useAsync(() => services.content.universityServices(), []);
  return (
    <DashCard id="quick-title" title="Quick actions" className={className} order={1}>
      {state.status === "loading" && <Skeleton lines={1} />}
      {state.status === "error" && <LoadError what="university services" onRetry={reload} />}
      {state.status === "ready" && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {state.data.map((s) => {
            const Icon = SERVICE_ICONS[s.icon];
            return (
              <li key={s.id}>
                <Link
                  to={`/services/${s.id}`}
                  className="flex h-full flex-col items-center gap-2 rounded-xl border border-oxford-rule bg-white px-2 py-3.5 text-center transition hover:-translate-y-0.5 hover:border-oxford-ink/30 motion-reduce:hover:translate-y-0"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-oxford-sandSoft text-oxford-ink">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold text-oxford-ink">{s.shortName}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashCard>
  );
};

export const EventsCard = ({ now, className = "" }: { now: Date; className?: string }) => {
  const { state, reload } = useAsync(() => services.content.events(), []);
  const { isRegistered } = useActivity();
  const weekAhead = now.getTime() + 7 * 86_400_000;

  return (
    <DashCard id="events-title" title="Events this week" className={className} order={3}>
      {state.status === "loading" && <Skeleton lines={3} />}
      {state.status === "error" && <LoadError what="events" onRetry={reload} />}
      {state.status === "ready" &&
        (() => {
          const upcoming = state.data.filter((e) => {
            const t = new Date(e.startsAt).getTime();
            return new Date(e.endsAt).getTime() > now.getTime() && t < weekAhead;
          });
          if (upcoming.length === 0) return <EmptyNote>No events this week.</EmptyNote>;
          return (
            <ul className="space-y-2">
              {upcoming.map((e) => {
                const start = new Date(e.startsAt);
                return (
                  <li key={e.id}>
                    <Link
                      to={`/events/${e.id}`}
                      className="flex gap-3 rounded-xl border border-oxford-rule bg-white p-3 transition hover:border-oxford-ink/30"
                    >
                      <span className="flex w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-oxford-sandSoft py-1.5 text-oxford-ink">
                        <span className="text-[11px] font-semibold uppercase">
                          {start.toLocaleDateString("en-GB", { month: "short" })}
                        </span>
                        <span className="font-serif text-xl font-semibold leading-none">{start.getDate()}</span>
                      </span>
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="block font-semibold leading-snug text-oxford-ink">{e.title}</span>
                        <span className="mt-0.5 block text-oxford-mute">
                          {dayLabel(start, now)}, {time24(start)} · {e.venue}
                        </span>
                        {isRegistered(e.id) && (
                          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-oxford-success">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Registered
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          );
        })()}
    </DashCard>
  );
};
