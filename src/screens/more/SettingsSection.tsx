import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Bell, Lock, ShieldCheck } from "lucide-react";
import { errorCodeOf, services, type NotificationCategory, type QuietHours } from "@/services";
import { useAsync } from "@/lib/useAsync";
import { isLimited } from "@/session/access";
import { useSession } from "@/session/SessionProvider";
import { useSync } from "@/session/SyncProvider";
import { useActivity } from "@/session/ActivityProvider";
import { useNotificationPermission, type PermissionReason } from "@/session/NotificationPermission";
import { useUnlock } from "@/session/useUnlock";
import { btn } from "@/ui/button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { PasswordField } from "@/ui/form/PasswordField";
import { PasswordRules } from "@/ui/form/PasswordRules";
import { TextField } from "@/ui/form/TextField";
import { isStrongPassword } from "@/ui/form/validation";
import { SectionHeader } from "./MoreLayout";

const CATEGORIES: { id: NotificationCategory; label: string; body: string }[] = [
  { id: "lectures", label: "Lectures", body: "Reminders before lectures and changes to your timetable." },
  { id: "news", label: "News", body: "New university announcements." },
  { id: "events", label: "Events", body: "Registrations opening and events you've signed up for." },
  { id: "deadlines", label: "Deadlines", body: "Fees, registration and other university deadlines." },
  { id: "goals", label: "Goals", body: "Reminders you set for your goals in For You." },
];

const Card = ({ id, title, icon: Icon, children }: { id: string; title: string; icon: typeof Bell; children: ReactNode }) => (
  <section aria-labelledby={id} className="rounded-2xl border border-oxford-rule bg-white/80 p-5">
    <h2 id={id} className="flex items-center gap-2 font-sans text-base font-semibold text-oxford-ink">
      <Icon className="h-4 w-4" aria-hidden="true" />
      {title}
    </h2>
    <div className="mt-3">{children}</div>
  </section>
);

/** Flow 07 "Settings": notifications by category, privacy, and security. */
export const SettingsSection = () => {
  const { account, access } = useSession();
  const unlock = useUnlock();
  return (
    <div className="max-w-3xl space-y-5">
      <SectionHeader title="Settings" />
      {account ? (
        <NotificationSettings accountId={account.id} limited={isLimited(access)} />
      ) : (
        <Card id="notif-title" title="Notifications" icon={Bell}>
          <GuestAlerts />
          <p className="mt-4 text-sm text-oxford-mute">Sign in for lecture, deadline and goal reminders.</p>
          {unlock && (
            <Link to={unlock.to} className={btn("secondary", "mt-3")}>
              {unlock.label}
            </Link>
          )}
        </Card>
      )}
      <PrivacySettings verified={!isLimited(access)} />
      {account && <SecuritySettings accountId={account.id} />}
    </div>
  );
};

/** This device's notification permission, and how to change it (flow 09). */
const DevicePermission = () => {
  const { permission, ensure } = useNotificationPermission();
  return (
    <div className="mb-4 rounded-xl border border-oxford-rule bg-oxford-cream/50 p-4">
      <p className="text-sm font-semibold text-oxford-ink">
        On this device:{" "}
        {permission === "granted" ? "notifications allowed" : permission === "default" ? "notifications not turned on" : "notifications blocked"}
      </p>
      {permission === "default" && (
        <>
          <p className="mt-1 text-sm text-oxford-ink2">Until you turn them on, reminders and alerts appear in your notification centre only.</p>
          <button type="button" onClick={() => ensure("general")} className={btn("primary", "mt-3")}>
            Turn on notifications
          </button>
        </>
      )}
      {(permission === "denied" || permission === "unsupported") && (
        <p className="mt-1 text-sm text-oxford-ink2">
          {permission === "unsupported"
            ? "This browser can't show notifications. Reminders and alerts still appear in your notification centre."
            : "Reminders and alerts still appear in your notification centre. To get them on this device, allow notifications for this site in your browser's site settings (the icon next to the web address), then come back."}
        </p>
      )}
    </div>
  );
};

/** Guests can opt in to public news and event alerts only. */
const GuestAlerts = () => {
  const { ensure } = useNotificationPermission();
  const { refreshNotifications } = useActivity();
  const [on, setOn] = useState(() => services.notifications.guestAlerts());
  return (
    <div className="flex items-center justify-between gap-4">
      <span>
        <span id="guest-alerts-label" className="block font-semibold text-oxford-ink">
          Campus news and event alerts
        </span>
        <span className="block text-sm text-oxford-mute">Public alerts only. You can turn them off at any time.</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby="guest-alerts-label"
        onClick={async () => {
          services.notifications.setGuestAlerts(!on);
          setOn(!on);
          refreshNotifications();
          if (!on) await ensure("events");
        }}
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${on ? "bg-oxford-ink" : "bg-oxford-ink/20"}`}
      >
        <span aria-hidden="true" className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-7" : "left-1"}`} />
      </button>
    </div>
  );
};

const QuietHoursSetting = ({ accountId }: { accountId: string }) => {
  const { state } = useAsync(() => services.notifications.quietHours(accountId), [accountId]);
  const [q, setQ] = useState<QuietHours | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    if (state.status === "ready") setQ(state.data);
  }, [state]);
  if (!q) return null;

  const save = async (next: QuietHours) => {
    setQ(next);
    await services.notifications.setQuietHours(accountId, next);
    setNote(next.enabled ? `Quiet hours ${next.from} to ${next.to}.` : "Quiet hours off.");
  };

  return (
    <div className="mt-4 border-t border-oxford-rule/70 pt-4">
      <div className="flex items-center justify-between gap-4">
        <span>
          <span id="quiet-label" className="block font-semibold text-oxford-ink">
            Quiet hours
          </span>
          <span className="block text-sm text-oxford-mute">Nothing pops up during these hours. Notifications wait in your notification centre.</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={q.enabled}
          aria-labelledby="quiet-label"
          onClick={() => save({ ...q, enabled: !q.enabled })}
          className={`relative h-8 w-14 shrink-0 rounded-full transition ${q.enabled ? "bg-oxford-ink" : "bg-oxford-ink/20"}`}
        >
          <span aria-hidden="true" className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${q.enabled ? "left-7" : "left-1"}`} />
        </button>
      </div>
      {q.enabled && (
        <div className="mt-3 grid max-w-sm grid-cols-2 gap-3">
          <TextField id="quiet-from" type="time" label="From" value={q.from} onChange={(e) => e.target.value && save({ ...q, from: e.target.value })} />
          <TextField id="quiet-to" type="time" label="To" value={q.to} onChange={(e) => e.target.value && save({ ...q, to: e.target.value })} />
        </div>
      )}
      <p role="status" className="mt-2 min-h-[1.25rem] text-sm font-semibold text-oxford-success">
        {note}
      </p>
    </div>
  );
};

const NEEDS_PERMISSION: Partial<Record<NotificationCategory, PermissionReason>> = { lectures: "lectures", events: "events", goals: "goals" };

const NotificationSettings = ({ accountId, limited }: { accountId: string; limited: boolean }) => {
  const { state, reload } = useAsync(() => services.settings.notificationPrefs(accountId), [accountId]);
  const [prefs, setPrefs] = useState<Record<NotificationCategory, boolean> | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const { ensure } = useNotificationPermission();
  // Students who aren't verified yet only get public news and event alerts.
  const categories = limited ? CATEGORIES.filter((c) => c.id === "news" || c.id === "events") : CATEGORIES;

  useEffect(() => {
    if (state.status === "ready") setPrefs(state.data);
  }, [state]);

  const toggle = async (c: NotificationCategory) => {
    if (!prefs) return;
    const on = !prefs[c];
    setPrefs({ ...prefs, [c]: on });
    const label = CATEGORIES.find((x) => x.id === c)!.label;
    try {
      await services.settings.setNotificationPref(accountId, c, on);
      setStatus(`${label} notifications ${on ? "on" : "off"}.`);
      const reason = NEEDS_PERMISSION[c];
      if (on && reason) await ensure(reason);
    } catch {
      setPrefs(prefs);
      setStatus(`We couldn't change ${label.toLowerCase()} notifications. Try again.`);
    }
  };

  return (
    <Card id="notif-title" title="Notifications" icon={Bell}>
      <DevicePermission />
      {state.status === "loading" && <Skeleton lines={3} />}
      {state.status === "error" && <LoadError what="your notification settings" onRetry={reload} />}
      {prefs && (
        <>
          <ul className="-my-2 divide-y divide-oxford-rule/60">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                <span>
                  <span id={`notif-${c.id}`} className="block font-semibold text-oxford-ink">
                    {c.label}
                  </span>
                  <span className="block text-sm text-oxford-mute">{c.body}</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs[c.id]}
                  aria-labelledby={`notif-${c.id}`}
                  onClick={() => toggle(c.id)}
                  className={`relative h-8 w-14 shrink-0 rounded-full transition ${prefs[c.id] ? "bg-oxford-ink" : "bg-oxford-ink/20"}`}
                >
                  <span aria-hidden="true" className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${prefs[c.id] ? "left-7" : "left-1"}`} />
                </button>
              </li>
            ))}
          </ul>
          <p role="status" className="mt-2 min-h-[1.25rem] text-sm font-semibold text-oxford-success">
            {status}
          </p>
          <QuietHoursSetting accountId={accountId} />
        </>
      )}
    </Card>
  );
};

const PrivacySettings = ({ verified }: { verified: boolean }) => {
  const { connection } = useSync();
  return (
    <Card id="privacy-title" title="Privacy" icon={ShieldCheck}>
      <p className="text-sm font-semibold text-oxford-ink">What we use, and why</p>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-oxford-ink2">
        <li>Your name, email and student ID, to sign you in and check you're a UG student.</li>
        <li>Your courses and timetable, to show your lectures and send the reminders you choose.</li>
        <li>Your location, only while the campus map is open, to draw routes. It isn't stored.</li>
        <li>Your goals, tasks and recorded results, which only you can see.</li>
      </ul>
      {verified && (
        <div className="mt-4 border-t border-oxford-rule/70 pt-4">
          <p className="text-sm font-semibold text-oxford-ink">Student portal access</p>
          <p className="mt-1 text-sm text-oxford-ink2">
            {connection?.status === "connected"
              ? "Connected. We read your registered courses and official timetable, and nothing else."
              : connection?.status === "expired"
                ? "Access has expired. We can't read your registration until you reconnect."
                : "Not connected. We don't read anything from the student portal."}
          </p>
          <Link to="/more/self-service" className="mt-2 inline-flex min-h-[40px] items-center text-sm font-semibold text-oxford-ink underline underline-offset-4 hover:no-underline">
            Manage portal access
          </Link>
        </div>
      )}
    </Card>
  );
};

const SecuritySettings = ({ accountId }: { accountId: string }) => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [confirmOthers, setConfirmOthers] = useState(false);
  const [othersBusy, setOthersBusy] = useState(false);
  const [othersNote, setOthersNote] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (!current) found.current = "Enter your current password.";
    if (!isStrongPassword(next)) found.next = "Choose a password that meets every rule below.";
    else if (next === current) found.next = "Choose a password that's different from your current one.";
    if (confirm !== next) found.confirm = "The passwords don't match.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setNotice(null);
    try {
      await services.auth.changePassword(accountId, current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setNotice({ tone: "success", text: "Password changed. Use your new password next time you log in." });
    } catch (err) {
      if (errorCodeOf(err) === "invalid-credentials") setErrors({ current: "That isn't your current password." });
      else setNotice({ tone: "error", text: "Your password wasn't changed. Check your connection and try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card id="security-title" title="Security" icon={Lock}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <p className="text-sm font-semibold text-oxford-ink">Change password</p>
        <PasswordField id="pw-current" label="Current password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.current} />
        <div>
          <PasswordField id="pw-new" label="New password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.next} />
          <div className="mt-2">
            <PasswordRules password={next} />
          </div>
        </div>
        <PasswordField id="pw-confirm" label="Confirm new password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
        {notice && <FormAlert tone={notice.tone} title={notice.text} />}
        <LoadingButton loading={saving} loadingLabel="Changing…" className="sm:w-auto">
          Change password
        </LoadingButton>
      </form>

      <div className="mt-5 border-t border-oxford-rule/70 pt-4">
        <p className="text-sm font-semibold text-oxford-ink">Other devices</p>
        <p className="mt-1 text-sm text-oxford-mute">Log out everywhere else you're signed in. You'll stay signed in here.</p>
        <button type="button" onClick={() => setConfirmOthers(true)} disabled={othersBusy} className={btn("secondary", "mt-3")}>
          {othersBusy ? "Logging out…" : "Log out of other devices"}
        </button>
        <p role="status" className="mt-2 text-sm font-semibold text-oxford-success">
          {othersNote}
        </p>
      </div>

      <ConfirmDialog
        open={confirmOthers}
        title="Log out of other devices?"
        body="Anywhere else you're signed in will need your password again. This device stays signed in."
        confirmLabel="Log them out"
        onConfirm={async () => {
          setConfirmOthers(false);
          setOthersBusy(true);
          await services.auth.signOutOtherDevices(accountId);
          setOthersBusy(false);
          setOthersNote("You've been logged out on other devices. You're still signed in here.");
        }}
        onCancel={() => setConfirmOthers(false)}
      />
    </Card>
  );
};
