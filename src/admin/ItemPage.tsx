import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CalendarClock, CheckCircle2, ExternalLink, Info } from "lucide-react";
import { services, type ContentItem, type ContentVersion, type VersionStatus } from "@/services";
import { audienceLabel, checklist, diffVersions, displayStatus, expiresLabel, isExpired, isLive, itemTitle } from "@/lib/cms";
import { useNow } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { Modal } from "@/ui/Modal";
import { useAdmin, canReview, canWrite } from "./AdminAuth";
import { ACTION_VERB, studentPath, useNameOf, useReference, useUsers } from "./data";
import { StudentPreview } from "./editor/Preview";
import { abtn, Card, formatWhen, PageTitle, StatusBadge, Table, Td, Th, TypeBadge } from "./ui";

const VERSION_LABEL: Record<VersionStatus, string> = {
  draft: "Draft",
  "in-review": "In review",
  returned: "Returned",
  approved: "Approved",
  published: "Live",
  superseded: "Replaced",
};

const pad = (n: number) => String(n).padStart(2, "0");
const localInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const longWhen = (iso: string) => new Date(iso).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

type Confirm = "unpublish" | "discard" | null;

/** Flow 10 item page: status, review and publishing actions, changes, versions and activity. */
export const ItemPage = () => {
  const { id = "" } = useParams();
  const { state, reload } = useAsync(() => services.admin.get(id), [id]);
  if (state.status === "loading") return <p role="status" className="text-sm text-oxford-mute">Loading…</p>;
  if (state.status === "error") return <p role="alert" className="text-sm text-oxford-danger">This item didn't load. <button type="button" onClick={reload} className="font-semibold underline">Try again</button></p>;
  if (!state.data) return <PageTitle title="Content not found" description={<Link to="/admin/content" className="underline">Back to content</Link>} />;
  return <Item key={id} initial={state.data} />;
};

const Item = ({ initial }: { initial: ContentItem }) => {
  const { user } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const now = useNow(10_000);
  const ref = useReference();
  const users = useUsers();
  const nameOf = useNameOf(users.state.status === "ready" ? users.state.data : null);
  const audit = useAsync(() => services.admin.audit(), []);
  const [item, setItem] = useState(initial);
  const [flash, setFlash] = useState<string | null>((location.state as { flash?: string } | null)?.flash ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [returning, setReturning] = useState(false);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState(false);
  const [published, setPublished] = useState<{ notified: number } | null>(null);
  const [scheduleAt, setScheduleAt] = useState(() => {
    const asked = initial.working?.meta.publishOn;
    if (asked && new Date(asked) > now) return asked;
    const d = new Date(now.getTime() + 86_400_000);
    d.setHours(9, 0, 0, 0);
    return localInput(d);
  });
  const [expiry, setExpiry] = useState(item.expiresAt ? item.expiresAt.slice(0, 10) : "");
  const [shown, setShown] = useState<number | null>(null);

  // Clear the one-off message from the address so Back doesn't show it again.
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (label: string, action: () => Promise<ContentItem | null>, message?: string): Promise<ContentItem | null | undefined> => {
    setBusy(label);
    setFailure(null);
    setFlash(null);
    try {
      const next = await action();
      if (next) {
        setItem(next);
        setExpiry(next.expiresAt ? next.expiresAt.slice(0, 10) : "");
      }
      if (message) setFlash(message);
      audit.reload();
      return next;
    } catch {
      setFailure("That didn't work. Try again.");
      return undefined;
    } finally {
      setBusy(null);
    }
  };

  const w = item.working;
  const status = displayStatus(item, now);
  const live = isLive(item, now);
  const expired = Boolean(item.live) && isExpired(item, now);
  const r = user!;
  const title = itemTitle(item);
  const latest = w ?? item.live ?? item.versions[item.versions.length - 1]!;
  const shownVersion: ContentVersion = (shown !== null ? item.versions.find((v) => v.number === shown) : null) ?? latest;
  const complete = w ? checklist(item.type, w.payload, w.meta).every((c) => c.ok) : true;
  const before = w ? (item.live ?? null) : null;
  const changes = w ? diffVersions(before ?? [...item.versions].reverse().find((v) => v.number < w.number) ?? null, w) : [];
  const history = [...item.versions].reverse();
  const activity = audit.state.status === "ready" ? audit.state.data.filter((a) => a.itemId === item.id) : [];
  const programmeName = (pid: string) => (ref.state.status === "ready" ? (ref.state.data.programmes.find((p) => p.id === pid)?.name ?? pid) : pid);

  const publishNow = async () => {
    setBusy("publish");
    setFailure(null);
    setFlash(null);
    try {
      const res = await services.admin.publish(r.id, item.id, null);
      setItem(res.item);
      setExpiry(res.item.expiresAt ? res.item.expiresAt.slice(0, 10) : "");
      setPublished({ notified: res.notified });
      audit.reload();
    } catch {
      setFailure("It didn't publish. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const schedule = async () => {
    if (!scheduleAt || new Date(scheduleAt) <= now) {
      setFailure("Choose a time in the future, or publish now.");
      return;
    }
    await run("schedule", async () => (await services.admin.publish(r.id, item.id, new Date(scheduleAt).toISOString())).item);
  };

  const sendBack = async () => {
    if (!comment.trim()) {
      setCommentError(true);
      return;
    }
    setReturning(false);
    await run("return", () => services.admin.returnForCorrection(r.id, item.id, comment), "Returned to the editor with your comment.");
    setComment("");
  };

  return (
    <>
      <PageTitle
        title={title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <TypeBadge type={item.type} />
            <StatusBadge status={status} />
            {expiresLabel(item, now) && status !== "expired" && <span className="text-xs font-semibold text-oxford-ink2">{expiresLabel(item, now)}</span>}
            {nameOf(item.createdBy) && <span>Created by {nameOf(item.createdBy)}</span>}
          </span>
        }
        actions={
          live && (
            <a href={studentPath(item)} target="_blank" rel="noopener noreferrer" className={abtn("secondary")}>
              View as student
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )
        }
      />

      <div className="mb-4 space-y-2">
        {flash && (
          <p role="status" className="flex items-center gap-2 rounded-lg border border-oxford-success/30 bg-oxford-success/10 p-3 text-sm font-semibold text-oxford-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {flash}
          </p>
        )}
        {failure && (
          <p role="alert" className="rounded-lg border border-oxford-danger/30 bg-oxford-danger/5 p-3 text-sm font-semibold text-oxford-danger">
            {failure}
          </p>
        )}
        {w?.status === "returned" && w.comment && (
          <div role="note" className="flex gap-2 rounded-lg border border-oxford-danger/30 bg-oxford-danger/5 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-oxford-danger" aria-hidden="true" />
            <p className="flex-1">
              <span className="font-semibold text-oxford-danger">Returned for correction by {nameOf(w.reviewedBy)}</span>
              {w.reviewedAt && <span className="text-oxford-mute"> · {formatWhen(w.reviewedAt)}</span>}
              <span className="mt-0.5 block text-oxford-ink">“{w.comment}”</span>
            </p>
            {canWrite(r) && (
              <Link to={`/admin/content/${item.id}/edit`} className={abtn("primary", "self-center")}>
                Correct it
              </Link>
            )}
          </div>
        )}
        {item.publishAt && w?.status === "approved" && (
          <p role="status" className="flex items-center gap-2 rounded-lg border border-oxford-gold/60 bg-oxford-sandSoft p-3 text-sm">
            <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-semibold">Scheduled to go live on {longWhen(item.publishAt)}.</span>
              {item.live && ` Version ${w.number} replaces version ${item.live.number} then.`}
            </span>
          </p>
        )}
        {item.live && w && !item.unpublished && !expired && (
          <p className="flex items-center gap-2 rounded-lg border border-oxford-rule bg-white p-3 text-sm text-oxford-ink2">
            <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
            Version {item.live.number} is live. Students keep seeing it until version {w.number} is approved and published.
          </p>
        )}
        {item.unpublished && <p className="rounded-lg border border-oxford-rule bg-white p-3 text-sm text-oxford-ink2">Removed from the student app. {canReview(r) ? "Publish it again to bring it back." : "A reviewer can publish it again."}</p>}
        {expired && !item.unpublished && <p className="rounded-lg border border-oxford-rule bg-white p-3 text-sm text-oxford-ink2">Expired on {formatWhen(item.expiresAt!)}. Students no longer see it. Change the expiry to bring it back.</p>}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          {changes.length > 0 && (
            <Card title={`What changed in version ${w!.number}${before ? ` (compared with live version ${before.number})` : ""}`}>
              <Table
                caption="Changes"
                head={
                  <tr>
                    <Th>Field</Th>
                    <Th>Before</Th>
                    <Th>After</Th>
                  </tr>
                }
              >
                {changes.map((c) => (
                  <tr key={c.field}>
                    <Td className="font-semibold">{c.field}</Td>
                    <Td className="text-oxford-mute line-through decoration-oxford-danger/40">{c.before}</Td>
                    <Td className="bg-oxford-success/5">{c.after}</Td>
                  </tr>
                ))}
              </Table>
            </Card>
          )}
          {w && changes.length === 0 && w.number > 1 && <p className="text-sm text-oxford-mute">Version {w.number} has no changes from the previous version yet.</p>}

          <div className="grid items-start gap-5 lg:grid-cols-[400px_minmax(0,1fr)]">
            <div>
              {ref.state.status === "ready" && (
                <StudentPreview
                  type={item.type}
                  payload={shownVersion.payload}
                  meta={shownVersion.meta}
                  reference={ref.state.data}
                  label={shownVersion === latest ? (w ? `Version ${w.number}, as students will see it` : live ? "As students see it" : "As students saw it") : `Version ${shownVersion.number} (${VERSION_LABEL[shownVersion.status].toLowerCase()})`}
                />
              )}
            </div>
            <Card title="Details">
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-oxford-mute">Source</dt>
                  <dd className="font-semibold">{shownVersion.meta.source || "Not given"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-oxford-mute">Audience</dt>
                  <dd className="font-semibold">{audienceLabel(shownVersion.meta.audience, programmeName)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-oxford-mute">Notify students</dt>
                  <dd className="font-semibold">{shownVersion.meta.notify ? "Yes, when published" : "No"}</dd>
                </div>
                {shownVersion.meta.publishOn && (
                  <div>
                    <dt className="text-xs text-oxford-mute">Editor asked to publish on</dt>
                    <dd className="font-semibold">{formatWhen(new Date(shownVersion.meta.publishOn).toISOString())}</dd>
                  </div>
                )}
                {shownVersion.meta.expiresOn && (
                  <div>
                    <dt className="text-xs text-oxford-mute">Editor asked to expire after</dt>
                    <dd className="font-semibold">{new Date(`${shownVersion.meta.expiresOn}T12:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</dd>
                  </div>
                )}
              </dl>
            </Card>
          </div>

          <Card title="Version history">
            <Table
              caption="Versions, newest first"
              head={
                <tr>
                  <Th>Version</Th>
                  <Th>Status</Th>
                  <Th>Written by</Th>
                  <Th>Reviewed</Th>
                  <Th>Published</Th>
                  <Th>
                    <span className="sr-only">Show</span>
                  </Th>
                </tr>
              }
            >
              {history.map((v) => (
                <tr key={v.number} className={v.number === shownVersion.number ? "bg-oxford-cream/60" : ""}>
                  <Td className="font-semibold">{v.number}</Td>
                  <Td>{v.status === "published" && !live ? (item.unpublished ? "Unpublished" : "Expired") : VERSION_LABEL[v.status]}</Td>
                  <Td>
                    {nameOf(v.createdBy)}
                    <span className="block text-xs text-oxford-mute">{formatWhen(v.createdAt)}</span>
                  </Td>
                  <Td>
                    {v.reviewedBy ? nameOf(v.reviewedBy) : "—"}
                    {v.comment && <span className="block max-w-[220px] text-xs text-oxford-danger">“{v.comment}”</span>}
                  </Td>
                  <Td>{v.publishedAt ? formatWhen(v.publishedAt) : "—"}</Td>
                  <Td>
                    {v.number !== shownVersion.number && (
                      <button type="button" onClick={() => setShown(v.number)} className="text-sm font-semibold underline underline-offset-2">
                        Show<span className="sr-only"> version {v.number}</span>
                      </button>
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card title="Activity on this item">
            {activity.length === 0 ? (
              <p className="text-sm text-oxford-mute">No staff activity yet. This item shipped with the app.</p>
            ) : (
              <ul className="-my-1 divide-y divide-oxford-rule/70">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-baseline gap-3 py-2 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="font-semibold">{a.actor}</span> {ACTION_VERB[a.action]} it
                      <span className="block text-xs text-oxford-mute">{a.detail}</span>
                    </span>
                    <span className="shrink-0 text-xs text-oxford-mute">{formatWhen(a.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="order-first grid items-start gap-4 md:grid-cols-2 xl:order-none xl:sticky xl:top-20 xl:grid-cols-1 xl:self-start">
          <Card title="Actions">
            <div className="flex flex-col gap-2">
              {canWrite(r) && (
                <Link to={`/admin/content/${item.id}/edit`} className={abtn(w ? "secondary" : "primary")}>
                  {w ? `Edit version ${w.number}` : item.live ? `Make a correction (version ${Math.max(...item.versions.map((v) => v.number)) + 1})` : "Edit"}
                </Link>
              )}
              {canWrite(r) && w && (w.status === "draft" || w.status === "returned") && (
                <>
                  <button type="button" disabled={!complete || busy !== null} onClick={() => run("submit", () => services.admin.submit(r.id, item.id), "Submitted for review.")} className={abtn("primary")}>
                    {busy === "submit" ? "Submitting…" : "Submit for review"}
                  </button>
                  {!complete && <p className="text-xs text-oxford-mute">Some required fields are missing. Edit it to see the checklist.</p>}
                  <button type="button" disabled={busy !== null} onClick={() => setConfirm("discard")} className={abtn("danger")}>
                    {item.live ? `Discard version ${w.number}` : "Discard draft"}
                  </button>
                </>
              )}

              {w?.status === "in-review" &&
                (canReview(r) ? (
                  <>
                    <button type="button" disabled={busy !== null} onClick={() => run("approve", () => services.admin.approve(r.id, item.id), "Approved. Publish it now or schedule it.")} className={abtn("primary")}>
                      {busy === "approve" ? "Approving…" : "Approve"}
                    </button>
                    <button type="button" disabled={busy !== null} onClick={() => setReturning(true)} className={abtn("secondary")}>
                      Return for correction
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-oxford-ink2">Waiting for a reviewer. You can still edit it, which takes it out of review.</p>
                ))}

              {w?.status === "approved" &&
                (canReview(r) ? (
                  <>
                    <button type="button" disabled={busy !== null} onClick={publishNow} className={abtn("primary")}>
                      {busy === "publish" ? "Publishing…" : item.publishAt ? "Publish now instead" : "Publish now"}
                    </button>
                    <div className="rounded-lg border border-oxford-rule p-2.5">
                      <label htmlFor="schedule-at" className="text-xs font-semibold">
                        {item.publishAt ? "Change the scheduled time" : "Or schedule it"}
                      </label>
                      <input id="schedule-at" type="datetime-local" value={scheduleAt} min={localInput(now)} onChange={(e) => setScheduleAt(e.target.value)} className="mt-1 block w-full rounded-md border border-oxford-ink/25 bg-white px-2 py-1.5 text-sm" />
                      <button type="button" disabled={busy !== null} onClick={schedule} className={abtn("secondary", "mt-2 w-full")}>
                        {busy === "schedule" ? "Scheduling…" : item.publishAt ? "Reschedule" : "Schedule"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-oxford-ink2">{item.publishAt ? `Approved and scheduled for ${formatWhen(item.publishAt)}.` : "Approved. Waiting for a reviewer to publish it."}</p>
                ))}

              {canReview(r) && !w && item.live && item.unpublished && (
                <button type="button" disabled={busy !== null} onClick={() => run("republish", async () => (await services.admin.publish(r.id, item.id, null)).item, "Published again. Students can see it.")} className={abtn("primary")}>
                  Publish again
                </button>
              )}
              {canReview(r) && item.live && !item.unpublished && (
                <button type="button" disabled={busy !== null} onClick={() => setConfirm("unpublish")} className={abtn("danger")}>
                  Unpublish
                </button>
              )}
              {!canWrite(r) && !canReview(r) && <p className="text-sm text-oxford-mute">No actions for your role.</p>}
            </div>
          </Card>

          {(canWrite(r) || canReview(r)) && (
            <Card title="Expiry">
              <p className="text-sm text-oxford-ink2">{item.expiresAt ? `${expiresLabel(item, now)} (${formatWhen(item.expiresAt)})` : "No expiry. It stays up until it's unpublished."}</p>
              <label htmlFor="expiry" className="mt-2 block text-xs font-semibold">
                Expires after
              </label>
              <input id="expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="mt-1 block w-full rounded-md border border-oxford-ink/25 bg-white px-2 py-1.5 text-sm" />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={!expiry || busy !== null}
                  onClick={() => run("expiry", () => services.admin.setExpiry(r.id, item.id, new Date(`${expiry}T23:59:59`).toISOString()), "Expiry saved.")}
                  className={abtn("secondary", "flex-1")}
                >
                  Save expiry
                </button>
                {item.expiresAt && (
                  <button type="button" disabled={busy !== null} onClick={() => run("expiry", () => services.admin.setExpiry(r.id, item.id, null), "Expiry removed.")} className={abtn("ghost")}>
                    Remove
                  </button>
                )}
              </div>
            </Card>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirm === "unpublish"}
        title="Unpublish this?"
        body={`Students will no longer see “${title}” in the app or in search. You can publish it again later.`}
        confirmLabel="Unpublish"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          run("unpublish", () => services.admin.unpublish(r.id, item.id), "Unpublished. Students no longer see it.");
        }}
      />
      <ConfirmDialog
        open={confirm === "discard"}
        title={item.live ? `Discard version ${w?.number}?` : "Discard this draft?"}
        body={item.live ? "Your changes in this version will be deleted. The live version stays as it is." : "The draft will be deleted. This can't be undone."}
        confirmLabel="Discard"
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          setConfirm(null);
          const next = await run("discard", () => services.admin.discardDraft(r.id, item.id), "Version discarded.");
          if (next === null && !item.live) navigate("/admin/content", { replace: true });
        }}
      />

      <Modal open={returning} title="Return for correction" description="The editor sees your comment on the item and on their dashboard." onClose={() => setReturning(false)}>
        <label htmlFor="return-comment" className="text-sm font-semibold">
          What needs correcting?<span aria-hidden="true" className="text-oxford-danger"> *</span>
        </label>
        <textarea
          id="return-comment"
          rows={4}
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            setCommentError(false);
          }}
          aria-invalid={commentError || undefined}
          aria-describedby={commentError ? "return-comment-error" : undefined}
          className={`mt-1 block w-full rounded-md border bg-white px-2.5 py-2 text-sm ${commentError ? "border-oxford-danger" : "border-oxford-ink/25"}`}
        />
        {commentError && (
          <p id="return-comment-error" className="mt-1 text-xs font-semibold text-oxford-danger">
            Write a comment so the editor knows what to fix.
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setReturning(false)} className={abtn("secondary")}>
            Cancel
          </button>
          <button type="button" onClick={sendBack} className={abtn("primary")}>
            Return to editor
          </button>
        </div>
      </Modal>

      <Modal open={published !== null} title="Published" description="It's live in the student app and in search now." onClose={() => setPublished(null)}>
        <p className="text-sm text-oxford-ink2">
          {published?.notified ? `${published.notified} ${published.notified === 1 ? "student was" : "students were"} sent a notification that opens it.` : item.live?.meta.notify ? "No students in the audience could be notified." : "No notifications were sent (the editor didn't ask for them)."}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => setPublished(null)} className={abtn("secondary")}>
            Stay here
          </button>
          <a href={studentPath(item)} target="_blank" rel="noopener noreferrer" className={abtn("primary")}>
            View as student
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </Modal>
    </>
  );
};
