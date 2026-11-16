import { useNavigate } from "react-router-dom";
import { BellOff, BookOpen, CalendarDays, Megaphone } from "lucide-react";
import type { AppNotification, NotificationTarget } from "@/services";
import { isSameDay, relativeTime, useNow } from "@/lib/dates";
import { useActivity } from "@/session/ActivityProvider";
import { useSession } from "@/session/SessionProvider";
import { Skeleton } from "@/ui/DashCard";
import { LockedPanel } from "@/ui/LockedPanel";
import { PageHeader } from "@/ui/PageHeader";

const ICONS = { lecture: BookOpen, announcement: Megaphone, event: CalendarDays } as const;

const pathFor = (t: NotificationTarget) =>
  t.kind === "lecture" ? `/lectures/${t.id}` : t.kind === "announcement" ? `/announcements/${t.id}` : `/events/${t.id}`;

/** Flow 03/09 notification centre: newest first, grouped Today / Earlier. */
export const NotificationsScreen = () => {
  const { account } = useSession();
  const { notifications, isNotificationRead, unreadCount, markNotificationsRead } = useActivity();
  const navigate = useNavigate();
  const now = useNow(60_000);

  if (!account) {
    return (
      <>
        <PageHeader title="Notifications" />
        <LockedPanel
          feature="Notifications"
          includes={["Lecture reminders", "Announcements that affect you", "Event and deadline updates"]}
        />
      </>
    );
  }

  const open = (n: AppNotification) => {
    markNotificationsRead([n.id]);
    navigate(pathFor(n.target));
  };

  const today = notifications?.filter((n) => isSameDay(new Date(n.createdAt), now)) ?? [];
  const earlier = notifications?.filter((n) => !isSameDay(new Date(n.createdAt), now)) ?? [];

  const group = (label: string, items: AppNotification[]) =>
    items.length > 0 && (
      <section aria-labelledby={`group-${label}`} className="mb-6">
        <h2 id={`group-${label}`} className="mb-2 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-oxford-mute">
          {label}
        </h2>
        <ul className="divide-y divide-oxford-rule/70 overflow-hidden rounded-2xl border border-oxford-rule bg-white/80">
          {items.map((n) => {
            const unread = !isNotificationRead(n.id);
            const Icon = ICONS[n.target.kind];
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => open(n)}
                  className={`flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-oxford-cream md:px-5 ${unread ? "bg-oxford-sandSoft/50" : ""}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-oxford-ink ring-1 ring-oxford-rule">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-oxford-ink ${unread ? "font-semibold" : "font-medium"}`}>
                      {n.title}
                      {unread && <span className="sr-only"> (unread)</span>}
                    </span>
                    <span className="mt-0.5 block text-sm text-oxford-mute">{n.body}</span>
                    <span className="mt-1 block text-xs text-oxford-mute">{relativeTime(n.createdAt, now)}</span>
                  </span>
                  {unread && <span aria-hidden="true" className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-oxford-ink" />}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Notifications"
          description={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}
        />
        {notifications && notifications.length > 0 && (
          <button
            type="button"
            onClick={() => markNotificationsRead(notifications.map((n) => n.id))}
            disabled={unreadCount === 0}
            className="mt-2 inline-flex min-h-[44px] items-center rounded-md border border-oxford-ink/20 bg-white px-4 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream disabled:opacity-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications === null ? (
        <Skeleton lines={4} />
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-oxford-rule px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-oxford-sandSoft text-oxford-ink">
            <BellOff className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-medium">No notifications yet</h2>
          <p className="mt-1 max-w-sm text-sm text-oxford-mute">
            Lecture reminders, announcements and event updates will appear here.
          </p>
        </div>
      ) : (
        <>
          {group("Today", today)}
          {group("Earlier", earlier)}
        </>
      )}
    </>
  );
};
