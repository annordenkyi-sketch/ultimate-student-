import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDateTime } from "@/lib/format";
import type { NotificationItem } from "@/data/types";

const targetTo = (n: NotificationItem): string => {
  switch (n.target.kind) {
    case "item":
      return `/section/${n.target.section}/${n.target.itemId}`;
    case "announcement":
      return "/";
    case "event":
      return "/section/social";
    case "deadline":
      return "/section/academic";
  }
};

export const NotificationsPage = () => {
  const { notifications, markAsRead, markAllRead, unreadCount } =
    useNotifications();

  return (
    <>
      <AppHeader title="Notifications" showSearch={false} />
      <div className="px-4 pb-6">
        {unreadCount > 0 && (
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              Mark all read
            </button>
          </div>
        )}
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You're all caught up."
          />
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  to={targetTo(n)}
                  onClick={() => markAsRead(n.id)}
                  className={`block rounded-xl border p-3 shadow-sm transition ${
                    n.read
                      ? "border-slate-200 bg-white"
                      : "border-brand-200 bg-brand-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {n.title}
                    </p>
                    {!n.read && (
                      <span
                        aria-label="Unread"
                        className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600"
                      />
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{n.body}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {formatDateTime(n.date)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};
