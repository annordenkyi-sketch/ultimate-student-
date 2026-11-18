import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BellRing, Check, Info } from "lucide-react";
import { services, type AlertPermission } from "@/services";
import { btn } from "@/ui/button";
import { Modal } from "@/ui/Modal";

/** What the student just turned on, so the pre-prompt can say what they'll get. */
export type PermissionReason = "lectures" | "goals" | "events" | "general";

const BENEFITS: Record<PermissionReason, { title: string; items: string[] }> = {
  lectures: {
    title: "Get lecture reminders on this device?",
    items: ["A reminder before each lecture, at the time you chose", "A heads-up when a lecture time or venue changes"],
  },
  goals: {
    title: "Get goal reminders on this device?",
    items: ["A reminder at the time you set for this goal", "Your next step, so you know what to do"],
  },
  events: {
    title: "Get event alerts on this device?",
    items: ["Reminders before events you're interested in", "Updates when an event changes or opens registration"],
  },
  general: {
    title: "Turn on notifications?",
    items: ["Lecture and goal reminders at the times you choose", "News, events and deadlines that affect you"],
  },
};

interface PermissionCtx {
  permission: AlertPermission;
  /**
   * Call when the student turns on something that needs notifications. Shows
   * the pre-prompt the first time; resolves with the permission either way.
   */
  ensure: (reason: PermissionReason) => Promise<AlertPermission>;
  refresh: () => void;
}

const Ctx = createContext<PermissionCtx | null>(null);

/** Flow 09 "Notification permission": never asked on launch, only when something needs it. */
export const NotificationPermissionProvider = ({ children }: { children: ReactNode }) => {
  const [permission, setPermission] = useState<AlertPermission>(() => services.device.notificationPermission());
  const [asking, setAsking] = useState<PermissionReason | null>(null);
  const resolver = useRef<((p: AlertPermission) => void) | null>(null);

  const refresh = useCallback(() => setPermission(services.device.notificationPermission()), []);

  const ensure = useCallback((reason: PermissionReason) => {
    const current = services.device.notificationPermission();
    setPermission(current);
    // Already decided (or not possible): don't ask again.
    if (current !== "default") return Promise.resolve(current);
    setAsking(reason);
    return new Promise<AlertPermission>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const finish = (p: AlertPermission) => {
    setPermission(p);
    setAsking(null);
    resolver.current?.(p);
    resolver.current = null;
  };

  const value = useMemo(() => ({ permission, ensure, refresh }), [permission, ensure, refresh]);
  const copy = BENEFITS[asking ?? "general"];

  return (
    <Ctx.Provider value={value}>
      {children}
      <Modal open={asking !== null} onClose={() => finish(services.device.notificationPermission())} title={copy.title}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-oxford-sandSoft text-oxford-ink">
          <BellRing className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-4 text-sm text-oxford-ink2">You'll get:</p>
        <ul className="mt-2 space-y-2">
          {copy.items.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-oxford-ink">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-oxford-success" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-oxford-mute">
          Your browser will ask you to confirm. If you choose not now, everything still works: reminders appear in your
          notification centre instead.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" className={btn("primary", "w-full")} onClick={async () => finish(await services.device.requestNotificationPermission())}>
            Allow notifications
          </button>
          <button type="button" className={btn("secondary", "w-full")} onClick={() => finish(services.device.notificationPermission())}>
            Not now
          </button>
        </div>
      </Modal>
    </Ctx.Provider>
  );
};

export const useNotificationPermission = (): PermissionCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotificationPermission must be used inside NotificationPermissionProvider");
  return ctx;
};

/** Shown next to a reminder that's on while notifications aren't allowed. */
export const PermissionNote = ({ permission, className = "" }: { permission: AlertPermission; className?: string }) => {
  if (permission === "granted") return null;
  return (
    <p className={`flex gap-2 rounded-lg border border-oxford-rule bg-oxford-cream/60 p-3 text-sm text-oxford-ink2 ${className}`}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        {permission === "denied" || permission === "unsupported"
          ? "Notifications are blocked on this device, so this will appear in your notification centre only."
          : "Notifications aren't turned on, so this will appear in your notification centre only."}{" "}
        <Link to="/more/settings" className="font-semibold text-oxford-ink underline underline-offset-4 hover:no-underline">
          Notification settings
        </Link>
      </span>
    </p>
  );
};
