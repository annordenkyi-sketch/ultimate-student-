import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BellRing, X } from "lucide-react";
import { SHOW_NOTIFICATION_DEMO } from "@/config/demo";
import { services, type DeliveryOutcome } from "@/services";
import { permissionMode, setPermissionMode, type PermissionMode } from "@/services/mock/deviceService";
import { DEMO_KINDS, demoDraft, type DemoKind } from "@/services/mock/notificationDemo";
import { CATEGORY_LABEL, linkFor } from "@/lib/notifications";
import { useNotificationPermission } from "@/session/NotificationPermission";
import { useSession } from "@/session/SessionProvider";

// Demo only: trigger each kind of notification on demand. Remove by turning off
// SHOW_NOTIFICATION_DEMO in src/config/demo.ts, or deleting this folder.

const PERMISSIONS: { id: PermissionMode; label: string }[] = [
  { id: "browser", label: "Use this browser's setting" },
  { id: "granted", label: "Allowed" },
  { id: "denied", label: "Blocked" },
  { id: "ask-allow", label: "Not asked yet (will allow)" },
  { id: "ask-deny", label: "Not asked yet (will block)" },
];

const outcomeText = (o: DeliveryOutcome, category: string): string => {
  if (o.status === "shown") {
    return o.via === "banner"
      ? "Shown as a banner at the top, and saved to the notification centre."
      : "Shown as a system notification (the app was in the background), and saved to the notification centre.";
  }
  if (o.status === "centre-only") {
    return o.reason === "quiet-hours"
      ? "Not shown during quiet hours. Saved to the notification centre."
      : "Not shown: notifications aren't allowed on this device. Saved to the notification centre.";
  }
  switch (o.reason) {
    case "category-off":
      return `Not sent: ${category} notifications are off in Settings.`;
    case "not-for-guests":
      return "Not sent: guests only get public news and event alerts.";
    case "guest-not-opted-in":
      return "Not sent: turn on campus news and event alerts in Notifications first.";
    case "needs-verification":
      return "Not sent: personal notifications need a verified student account.";
  }
};

export const NotificationTestPanel = () => {
  const { account, expireSession } = useSession();
  const { refresh } = useNotificationPermission();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PermissionMode>(permissionMode);
  const [delay, setDelay] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState<DemoKind | null>(null);

  // Close when the student moves to another screen (e.g. after tapping a banner), so it doesn't cover it.
  useEffect(() => setOpen(false), [pathname]);

  if (!SHOW_NOTIFICATION_DEMO || pathname === "/map") return null;
  const userKey = account?.id ?? "guest";

  const send = async (kind: DemoKind) => {
    setBusy(kind);
    setResult(null);
    try {
      const draft = await demoDraft(kind, userKey);
      if ("unavailable" in draft) {
        setResult(draft.unavailable);
        return;
      }
      const label = DEMO_KINDS.find((k) => k.id === kind)!.label;
      const deliver = async () => {
        const { outcome } = await services.notifications.deliver(userKey, draft);
        setResult(`${label}: ${outcomeText(outcome, CATEGORY_LABEL[draft.category])}`);
      };
      if (delay) {
        setResult(`${label} arrives in 5 seconds. Move to another screen or tab to see it arrive.`);
        setOpen(false);
        window.setTimeout(() => void deliver(), 5000);
      } else await deliver();
    } finally {
      setBusy(null);
    }
  };

  const expireAndOpen = async () => {
    const draft = await demoDraft("lecture", userKey);
    const link = "unavailable" in draft ? "/for-you/plan?ref=notification" : linkFor(draft.target);
    setOpen(false);
    expireSession();
    navigate(link);
  };

  return (
    <div className="fixed bottom-24 left-4 z-[1050] flex flex-col items-start lg:bottom-6 lg:left-[17.5rem]">
      {open && (
        <section
          id="notification-test-panel"
          aria-labelledby="ntp-title"
          className="mb-2 max-h-[70dvh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-oxford-rule bg-white p-4 shadow-xl"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 id="ntp-title" className="font-sans text-sm font-semibold text-oxford-ink">
                Test notifications
              </h2>
              <p className="text-xs text-oxford-mute">For demos only. Sends to {account ? account.name : "this guest"}.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close test notifications" className="flex h-9 w-9 items-center justify-center rounded-full text-oxford-mute hover:bg-oxford-cream">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <label htmlFor="ntp-permission" className="mt-3 block text-xs font-semibold text-oxford-ink">
            Notification permission
          </label>
          <select
            id="ntp-permission"
            value={mode}
            onChange={(e) => {
              const m = e.target.value as PermissionMode;
              setPermissionMode(m);
              setMode(m);
              refresh();
            }}
            className="mt-1 w-full rounded-lg border border-oxford-ink/20 bg-white px-2 py-2 text-sm text-oxford-ink"
          >
            {PERMISSIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <fieldset className="mt-3">
            <legend className="text-xs font-semibold text-oxford-ink">Arrives</legend>
            <div className="mt-1 flex gap-2">
              {[
                [false, "Now"],
                [true, "In 5 seconds"],
              ].map(([v, label]) => (
                <label key={String(v)} className={`flex min-h-[40px] flex-1 cursor-pointer items-center justify-center rounded-lg border px-2 text-xs font-semibold ${delay === v ? "border-oxford-ink bg-oxford-ink text-white" : "border-oxford-ink/20 text-oxford-ink"}`}>
                  <input type="radio" name="ntp-delay" className="sr-only" checked={delay === v} onChange={() => setDelay(v as boolean)} />
                  {label as string}
                </label>
              ))}
            </div>
          </fieldset>

          <p className="mt-3 text-xs font-semibold text-oxford-ink">Send a notification</p>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {DEMO_KINDS.map((k) => {
              const blocked = k.personal && !account;
              return (
                <button
                  key={k.id}
                  type="button"
                  disabled={busy !== null || blocked}
                  onClick={() => send(k.id)}
                  title={blocked ? "Sign in to get personal notifications" : undefined}
                  className="min-h-[40px] rounded-lg border border-oxford-ink/20 bg-white px-2 text-xs font-semibold text-oxford-ink transition hover:bg-oxford-cream disabled:opacity-40"
                >
                  {k.label}
                </button>
              );
            })}
          </div>
          {!account && <p className="mt-1 text-xs text-oxford-mute">Guests only get news and events, once they turn on campus alerts.</p>}

          {account && (
            <button
              type="button"
              onClick={expireAndOpen}
              className="mt-3 min-h-[40px] w-full rounded-lg border border-dashed border-oxford-ink/30 px-2 text-xs font-semibold text-oxford-ink hover:bg-oxford-cream"
            >
              Expire my session, then open a lecture link
            </button>
          )}

          <p role="status" aria-live="polite" className="mt-3 min-h-[1rem] text-xs text-oxford-ink2">
            {result}
          </p>
        </section>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-controls="notification-test-panel"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-oxford-ink/20 bg-white px-4 py-2.5 text-xs font-semibold text-oxford-ink shadow-lg"
      >
        <BellRing className="h-4 w-4" aria-hidden="true" />
        Test notifications
      </button>
      {!open && result && (
        <p role="status" className="mt-2 max-w-[18rem] rounded-lg bg-white/95 px-3 py-2 text-xs text-oxford-ink2 shadow">
          {result}
        </p>
      )}
    </div>
  );
};
