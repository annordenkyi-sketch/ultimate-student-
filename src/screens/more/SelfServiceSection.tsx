import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ExternalLink, Link2Off, RefreshCw } from "lucide-react";
import { services } from "@/services";
import { relativeTime, useNow } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { useSession } from "@/session/SessionProvider";
import { useSync } from "@/session/SyncProvider";
import { btn } from "@/ui/button";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { FormAlert } from "@/ui/form/FormAlert";
import { ConnectPortalDialog } from "./ConnectPortalDialog";
import { PersonalSection, SectionHeader } from "./MoreLayout";

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Flow 07 "Self-service": approved UG portals and the student portal connection. */
export const SelfServiceSection = () => (
  <PersonalSection title="Self-service" includes={["Links to official university portals", "Your student portal connection and sync"]}>
    <SelfServiceContent />
  </PersonalSection>
);

const SelfServiceContent = () => {
  const { account } = useSession();
  const sync = useSync();
  const now = useNow();
  const portals = useAsync(() => services.support.portals(), []);
  const [connectOpen, setConnectOpen] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; title: string; body?: string } | null>(null);
  const c = sync.connection;

  const disconnect = async () => {
    setConfirmDisconnect(false);
    setBusy(true);
    try {
      await services.sync.disconnect(account!.id);
      await sync.refresh();
      setNotice({ tone: "success", title: "Student portal disconnected", body: "Your courses and timetable stay exactly as they are." });
    } catch {
      setNotice({ tone: "error", title: "We couldn't disconnect the portal", body: "Try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <SectionHeader title="Self-service" description="Official university portals, and the connection that keeps your courses in step." />

      {notice && (
        <FormAlert tone={notice.tone} title={notice.title} className="mb-5">
          {notice.body}
        </FormAlert>
      )}

      <section aria-labelledby="connection-title" className="rounded-2xl border border-oxford-rule bg-white/80 p-5">
        <h2 id="connection-title" className="font-sans text-base font-semibold text-oxford-ink">
          Student portal connection
        </h2>
        {!c ? (
          <div className="mt-3">
            <Skeleton lines={2} />
          </div>
        ) : (
          <>
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold">
              {c.status === "connected" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-oxford-success" aria-hidden="true" />
                  <span className="text-oxford-success">Connected</span>
                </>
              ) : (
                <>
                  <Link2Off className="h-4 w-4 text-oxford-mute" aria-hidden="true" />
                  <span className="text-oxford-ink">{c.status === "expired" ? "Needs reconnecting" : "Not connected"}</span>
                </>
              )}
            </p>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-oxford-mute">Last synced</dt>
                <dd className="mt-0.5 text-oxford-ink">{c.lastSyncedAt ? `${relativeTime(c.lastSyncedAt, now)} · ${formatWhen(c.lastSyncedAt)}` : "Never"}</dd>
              </div>
              {c.connectedAt && c.status === "connected" && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-oxford-mute">Connected since</dt>
                  <dd className="mt-0.5 text-oxford-ink">{formatWhen(c.connectedAt)}</dd>
                </div>
              )}
            </dl>
            {c.status === "expired" && (
              <p className="mt-3 text-sm text-oxford-ink2">The portal no longer lets us read your registration. Reconnect to sync again; your courses stay as they are.</p>
            )}
            {c.status === "not-connected" && (
              <p className="mt-3 text-sm text-oxford-ink2">Your courses won't update from the university until you connect.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              {c.status === "connected" && (
                <Link to="/more/academics/sync" className={btn("primary")}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Sync now
                </Link>
              )}
              <button type="button" onClick={() => setConnectOpen(true)} className={btn(c.status === "connected" ? "secondary" : "primary")} disabled={busy}>
                {c.status === "not-connected" && !c.connectedAt ? "Connect" : "Reconnect"}
              </button>
              {c.status === "connected" && (
                <button type="button" onClick={() => setConfirmDisconnect(true)} className={btn("secondary")} disabled={busy}>
                  {busy ? "Disconnecting…" : "Disconnect"}
                </button>
              )}
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="portals-title" className="mt-5">
        <h2 id="portals-title" className="mb-3 font-sans text-base font-semibold text-oxford-ink">
          University portals
        </h2>
        {portals.state.status === "loading" && <Skeleton lines={3} />}
        {portals.state.status === "error" && <LoadError what="the portal list" onRetry={portals.reload} />}
        {portals.state.status === "ready" && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {portals.state.data.map((p) => (
              <li key={p.id}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full items-start justify-between gap-3 rounded-2xl border border-oxford-rule bg-white/80 p-4 transition hover:border-oxford-ink/30"
                >
                  <span>
                    <span className="block font-semibold text-oxford-ink">{p.name}</span>
                    <span className="mt-0.5 block text-sm text-oxford-mute">{p.description}</span>
                  </span>
                  <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-oxford-mute" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConnectPortalDialog
        open={connectOpen}
        reconnect={c?.status !== "not-connected" || Boolean(c?.connectedAt)}
        onClose={() => setConnectOpen(false)}
        onConnected={async () => {
          setConnectOpen(false);
          await sync.refresh();
          setNotice({ tone: "success", title: "Student portal connected", body: "Choose Sync now to bring in any changes." });
        }}
      />
      <ConfirmDialog
        open={confirmDisconnect}
        title="Disconnect the student portal?"
        body="Your courses and timetable stay exactly as they are. They just won't update from the university until you connect again."
        confirmLabel="Disconnect"
        cancelLabel="Stay connected"
        onConfirm={disconnect}
        onCancel={() => setConfirmDisconnect(false)}
      />
    </div>
  );
};
