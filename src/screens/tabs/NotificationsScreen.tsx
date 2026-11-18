import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BellOff, Info, X } from "lucide-react";
import { services, type AppNotification, type NotificationCategory } from "@/services";
import { isSameDay, relativeTime, useNow } from "@/lib/dates";
import { CATEGORY_LABEL, describe, linkFor } from "@/lib/notifications";
import { isLimited } from "@/session/access";
import { useActivity } from "@/session/ActivityProvider";
import { useNotificationPermission } from "@/session/NotificationPermission";
import { useSession } from "@/session/SessionProvider";
import { useUnlock } from "@/session/useUnlock";
import { btn } from "@/ui/button";
import { Chip, ChipRow } from "@/ui/Chip";
import { Skeleton } from "@/ui/DashCard";
import { PageHeader } from "@/ui/PageHeader";

const ALL_CATEGORIES: NotificationCategory[] = ["lectures", "news", "events", "deadlines", "goals"];
const PUBLIC_CATEGORIES: NotificationCategory[] = ["news", "events"];

/** Flow 09 notification centre: filters, Today / Earlier, unread, mark all as read, dismiss. */
export const NotificationsScreen = () => {
  const { account, access } = useSession();
  const { notifications, isNotificationRead, unreadCount, markNotificationsRead, dismissNotification, refreshNotifications } = useActivity();
  const { permission, ensure } = useNotificationPermission();
  const unlock = useUnlock();
  const navigate = useNavigate();
  const now = useNow(60_000);
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState<NotificationCategory | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [guestAlerts, setGuestAlerts] = useState(() => services.notifications.guestAlerts());

  const categories = isLimited(access) ? PUBLIC_CATEGORIES : ALL_CATEGORIES;
  const list = (notifications ?? []).filter((n) => !filter || n.category === filter);
  const today = list.filter((n) => isSameDay(new Date(n.createdAt), now));
  const earlier = list.filter((n) => !isSameDay(new Date(n.createdAt), now));

  // A swipe ends with a pointer-up on the row; don't treat that as a tap.
  const dragging = useRef(false);

  const open = (n: AppNotification) => {
    if (dragging.current) return;
    markNotificationsRead([n.id]);
    navigate(linkFor(n.target));
  };

  const dismiss = async (n: AppNotification) => {
    await dismissNotification(n.id);
    setStatus(`Dismissed "${n.title}".`);
  };

  const toggleGuestAlerts = async () => {
    const on = !guestAlerts;
    services.notifications.setGuestAlerts(on);
    setGuestAlerts(on);
    refreshNotifications();
    if (on) await ensure("events");
  };

  const row = (n: AppNotification) => {
    const unread = !isNotificationRead(n.id);
    const { icon: Icon, label } = describe(n);
    return (
      <motion.li
        key={n.id}
        layout={!reduce}
        initial={false}
        exit={reduce ? { opacity: 0 } : { opacity: 0, x: -80 }}
        transition={{ duration: 0.2 }}
        className="relative overflow-hidden"
      >
        {/* Swipe left to dismiss on touch screens; the X button does the same everywhere. */}
        <motion.div
          drag={reduce ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0.6, right: 0 }}
          onDragStart={() => {
            dragging.current = true;
          }}
          onDragEnd={(_, info) => {
            window.setTimeout(() => (dragging.current = false), 0);
            if (info.offset.x < -90) void dismiss(n);
          }}
          className={`flex items-start gap-1 bg-white ${unread ? "bg-oxford-sandSoft/60" : ""}`}
        >
          <button
            type="button"
            onClick={() => open(n)}
            className="flex min-w-0 flex-1 items-start gap-3 px-4 py-4 text-left transition hover:bg-oxford-cream md:px-5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-oxford-ink ring-1 ring-oxford-rule">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-oxford-mute">{label}</span>
              <span className={`mt-0.5 block text-oxford-ink ${unread ? "font-semibold" : "font-medium"}`}>
                {n.title}
                {unread && <span className="sr-only"> (unread)</span>}
              </span>
              <span className="mt-0.5 block text-sm text-oxford-mute">{n.body}</span>
              <span className="mt-1 block text-xs text-oxford-mute">{relativeTime(n.createdAt, now)}</span>
            </span>
            {unread && <span aria-hidden="true" className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-oxford-ink" />}
          </button>
          <button
            type="button"
            onClick={() => dismiss(n)}
            aria-label={`Dismiss: ${n.title}`}
            className="mr-2 mt-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-oxford-mute transition hover:bg-oxford-cream hover:text-oxford-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </motion.div>
      </motion.li>
    );
  };

  const group = (label: string, items: AppNotification[]) =>
    items.length > 0 && (
      <section aria-labelledby={`group-${label}`} className="mb-6">
        <h2 id={`group-${label}`} className="mb-2 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-oxford-mute">
          {label}
        </h2>
        <ul className="divide-y divide-oxford-rule/70 overflow-hidden rounded-2xl border border-oxford-rule bg-white/80">
          <AnimatePresence initial={false}>{items.map(row)}</AnimatePresence>
        </ul>
      </section>
    );

  const guestOff = !account && !guestAlerts;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Notifications"
          description={guestOff ? "Campus news and event alerts, if you'd like them." : unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}
        />
        {!guestOff && notifications && notifications.length > 0 && (
          <button
            type="button"
            onClick={() => {
              markNotificationsRead(notifications.map((n) => n.id));
              setStatus("All notifications marked as read.");
            }}
            disabled={unreadCount === 0}
            className="mt-2 inline-flex min-h-[44px] items-center rounded-md border border-oxford-ink/20 bg-white px-4 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream disabled:opacity-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      {!account && (
        <section aria-labelledby="guest-alerts" className="mb-5 rounded-2xl border border-oxford-rule bg-white/80 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 id="guest-alerts" className="font-sans text-base font-semibold text-oxford-ink">
                Campus news and event alerts
              </h2>
              <p className="mt-0.5 text-sm text-oxford-mute">Public alerts only. Lecture, deadline and goal reminders need a student account.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={guestAlerts}
              aria-labelledby="guest-alerts"
              onClick={toggleGuestAlerts}
              className={`relative h-8 w-14 shrink-0 rounded-full transition ${guestAlerts ? "bg-oxford-ink" : "bg-oxford-ink/20"}`}
            >
              <span aria-hidden="true" className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${guestAlerts ? "left-7" : "left-1"}`} />
            </button>
          </div>
          {unlock && (
            <Link to={unlock.to} className={btn("secondary", "mt-4")}>
              {unlock.label}
            </Link>
          )}
        </section>
      )}

      {!guestOff && permission !== "granted" && (
        <p className="mb-4 flex gap-2 rounded-xl border border-oxford-rule bg-oxford-cream/60 p-3 text-sm text-oxford-ink2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {permission === "default" ? "Notifications aren't turned on for this device" : "Notifications are blocked on this device"}, so new ones appear here only.{" "}
            {account && (
              <Link to="/more/settings" className="font-semibold text-oxford-ink underline underline-offset-4 hover:no-underline">
                Notification settings
              </Link>
            )}
          </span>
        </p>
      )}

      {!guestOff && (
        <div className="mb-5">
          <ChipRow label="Filter notifications">
            <Chip pressed={!filter} onClick={() => setFilter(null)}>
              All
            </Chip>
            {categories.map((c) => (
              <Chip key={c} pressed={filter === c} onClick={() => setFilter(c)}>
                {CATEGORY_LABEL[c]}
                <span className="sr-only">
                  , {(() => {
                    const count = (notifications ?? []).filter((n) => n.category === c).length;
                    return `${count} ${count === 1 ? "notification" : "notifications"}`;
                  })()}
                </span>
              </Chip>
            ))}
          </ChipRow>
        </div>
      )}

      <p role="status" className="sr-only">
        {status}
      </p>

      {guestOff ? null : notifications === null ? (
        <Skeleton lines={4} />
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-oxford-rule px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-oxford-sandSoft text-oxford-ink">
            <BellOff className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-medium">{filter ? `No ${CATEGORY_LABEL[filter].toLowerCase()} notifications` : "No notifications yet"}</h2>
          <p className="mt-1 max-w-sm text-sm text-oxford-mute">
            {filter ? "Try another filter, or choose All." : account ? "Lecture reminders, news, events, deadlines and goal reminders will appear here." : "Campus news and event alerts will appear here."}
          </p>
          {filter && (
            <button type="button" onClick={() => setFilter(null)} className={btn("secondary", "mt-4")}>
              Show all
            </button>
          )}
        </div>
      ) : (
        // Keyed by filter: changing filter swaps the list instantly; only a dismissed item slides away.
        <div key={filter ?? "all"}>
          {group("Today", today)}
          {group("Earlier", earlier)}
        </div>
      )}
    </>
  );
};
