import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import type { ContentItem, DisplayStatus } from "@/services";
import { displayStatus, expiresLabel, isLive, itemTitle } from "@/lib/cms";
import { relativeTime, relativeTimeInline, useNow } from "@/lib/dates";
import { useAdmin, canManage, canReview, canWrite } from "./AdminAuth";
import { ACTION_VERB, authorOf, useAudit, useItems, useNameOf, useUsers } from "./data";
import { abtn, Card, PageTitle, StatusBadge, TypeBadge } from "./ui";

const COUNTED: DisplayStatus[] = ["draft", "in-review", "returned", "scheduled", "published", "expired"];

const Attention = ({ title, items, empty, note }: { title: string; items: ContentItem[]; empty: string; note: (i: ContentItem) => string }) => (
  <Card title={`${title} (${items.length})`}>
    {items.length === 0 ? (
      <p className="text-sm text-oxford-mute">{empty}</p>
    ) : (
      <ul className="-my-1 divide-y divide-oxford-rule/70">
        {items.slice(0, 6).map((i) => (
          <li key={i.id}>
            <Link to={`/admin/content/${i.id}`} className="flex items-center gap-3 rounded px-1 py-2 hover:bg-oxford-cream">
              <TypeBadge type={i.type} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-oxford-ink">{itemTitle(i)}</span>
                <span className="block truncate text-xs text-oxford-mute">{note(i)}</span>
              </span>
            </Link>
          </li>
        ))}
        {items.length > 6 && <li className="px-1 pt-2 text-xs text-oxford-mute">And {items.length - 6} more</li>}
      </ul>
    )}
  </Card>
);

/** Flow 10 "Admin dashboard": counts by status, what needs you, recent activity. */
export const Dashboard = () => {
  const { user } = useAdmin();
  const now = useNow(15_000);
  const items = useItems();
  const audit = useAudit();
  const users = useUsers();
  const nameOf = useNameOf(users.state.status === "ready" ? users.state.data : null);

  if (items.state.status === "loading") return <p role="status" className="text-sm text-oxford-mute">Loading content…</p>;
  if (items.state.status === "error")
    return (
      <p role="alert" className="text-sm text-oxford-danger">
        Content didn't load.{" "}
        <button type="button" onClick={items.reload} className="font-semibold underline">
          Try again
        </button>
      </p>
    );

  const all = items.state.data;
  const status = (i: ContentItem) => displayStatus(i, now);
  const counts = Object.fromEntries(COUNTED.map((s) => [s, all.filter((i) => status(i) === s).length])) as Record<DisplayStatus, number>;
  const mine = (i: ContentItem) => authorOf(i) === user!.id || canManage(user);

  const returned = all.filter((i) => status(i) === "returned" && mine(i));
  const drafts = all.filter((i) => status(i) === "draft" && mine(i));
  const toReview = all.filter((i) => status(i) === "in-review");
  const toPublish = all.filter((i) => status(i) === "approved");
  const week = now.getTime() + 7 * 86_400_000;
  const expiring = all.filter((i) => isLive(i, now) && i.expiresAt && new Date(i.expiresAt).getTime() <= week);

  return (
    <>
      <PageTitle
        title="Dashboard"
        description={`What's happening with student app content, ${now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}.`}
        actions={
          canWrite(user) && (
            <Link to="/admin/content/new" className={abtn("primary")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create content
            </Link>
          )
        }
      />

      <section aria-label="Content by status" className="grid grid-cols-3 gap-3 xl:grid-cols-6">
        {COUNTED.map((s) => (
          <Link key={s} to={`/admin/content?status=${s}`} className="rounded-xl border border-oxford-rule bg-white p-3 transition hover:border-oxford-ink/30 hover:shadow-sm">
            <StatusBadge status={s} />
            <span className="mt-2 block font-serif text-3xl text-oxford-ink">{counts[s]}</span>
          </Link>
        ))}
      </section>

      <h2 className="mb-3 mt-7 font-sans text-base font-semibold">Needs your attention</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {canWrite(user) && (
          <>
            <Attention title="Returned for correction" items={returned} empty="Nothing has been returned to you." note={(i) => i.working?.comment ?? ""} />
            <Attention title="Drafts not yet submitted" items={drafts} empty="No drafts waiting." note={(i) => `Saved ${relativeTimeInline(i.updatedAt, now)}`} />
          </>
        )}
        {canReview(user) && (
          <>
            <Attention title="Waiting for review" items={toReview} empty="The review queue is empty." note={(i) => `Submitted by ${nameOf(i.working?.createdBy ?? null)}${i.working?.submittedAt ? `, ${relativeTimeInline(i.working.submittedAt, now)}` : ""}`} />
            <Attention title="Approved, ready to publish" items={toPublish} empty="Nothing waiting to be published." note={(i) => `Approved by ${nameOf(i.working?.reviewedBy ?? null)}`} />
          </>
        )}
        <Attention title="Expiring this week" items={expiring} empty="Nothing expires in the next 7 days." note={(i) => expiresLabel(i, now) ?? ""} />
      </div>

      <h2 className="mb-3 mt-7 font-sans text-base font-semibold">Recent activity</h2>
      <Card>
        {audit.state.status !== "ready" ? (
          <p className="text-sm text-oxford-mute">{audit.state.status === "loading" ? "Loading…" : "Activity didn't load."}</p>
        ) : audit.state.data.length === 0 ? (
          <p className="text-sm text-oxford-mute">No activity yet.</p>
        ) : (
          <ul className="-my-1 divide-y divide-oxford-rule/70">
            {audit.state.data.slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-baseline gap-3 py-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-semibold">{a.actor}</span> {ACTION_VERB[a.action]}{" "}
                  {a.itemId ? (
                    <Link to={`/admin/content/${a.itemId}`} className="font-semibold underline underline-offset-2">
                      {a.itemTitle}
                    </Link>
                  ) : null}
                  <span className="block truncate text-xs text-oxford-mute">{a.detail}</span>
                </span>
                <span className="shrink-0 text-xs text-oxford-mute">{relativeTime(a.at, now)}</span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/admin/activity" className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">
          See the full activity log
        </Link>
      </Card>
    </>
  );
};
