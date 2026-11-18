import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ContentItem, ContentType } from "@/services";
import { displayStatus, itemTitle, TYPE_LABEL } from "@/lib/cms";
import { relativeTime, useNow } from "@/lib/dates";
import { useAdmin, canReview } from "./AdminAuth";
import { useItems, useNameOf, useUsers } from "./data";
import { abtn, Card, formatWhen, PageTitle, StatusBadge, Table, Td, Th, TypeBadge } from "./ui";

const TYPES = Object.keys(TYPE_LABEL) as ContentType[];
const WHEN = [
  { id: "", label: "Any time", days: Infinity },
  { id: "1", label: "Last 24 hours", days: 1 },
  { id: "7", label: "Last 7 days", days: 7 },
  { id: "30", label: "Last 30 days", days: 30 },
];
const select = "mt-1 block rounded-md border border-oxford-ink/25 bg-white px-2 py-1.5 text-sm";

/** Flow 10 "Review queue": submitted items, oldest first, with filters. */
export const ReviewQueue = () => {
  const { user } = useAdmin();
  const now = useNow(15_000);
  const items = useItems();
  const users = useUsers();
  const nameOf = useNameOf(users.state.status === "ready" ? users.state.data : null);
  const [type, setType] = useState<ContentType | "">("");
  const [submitter, setSubmitter] = useState("");
  const [when, setWhen] = useState("");

  const all = items.state.status === "ready" ? items.state.data : [];
  const queue = useMemo(() => all.filter((i) => i.working?.status === "in-review").sort((a, b) => (a.working!.submittedAt ?? "").localeCompare(b.working!.submittedAt ?? "")), [all]);
  const submitters = [...new Set(queue.map((i) => i.working!.createdBy))];
  const days = WHEN.find((x) => x.id === when)!.days;
  const rows = queue.filter(
    (i) => (!type || i.type === type) && (!submitter || i.working!.createdBy === submitter) && (days === Infinity || now.getTime() - new Date(i.working!.submittedAt ?? 0).getTime() <= days * 86_400_000),
  );
  const ready = all.filter((i) => ["approved", "scheduled"].includes(displayStatus(i, now)));

  if (!canReview(user)) return <PageTitle title="Review queue" description="Only reviewers and super admins review content." />;

  const row = (i: ContentItem, kind: "review" | "publish") => (
    <tr key={i.id} className="hover:bg-oxford-cream/50">
      <Td className="max-w-[320px]">
        <Link to={`/admin/content/${i.id}`} className="font-semibold underline-offset-2 hover:underline">
          {itemTitle(i)}
        </Link>
        <span className="block text-xs text-oxford-mute">{i.live ? `Correction: version ${i.working!.number} of a live item` : "New item"}</span>
      </Td>
      <Td>
        <TypeBadge type={i.type} />
      </Td>
      <Td>{nameOf(i.working!.createdBy)}</Td>
      <Td className="whitespace-nowrap">
        {kind === "review" ? (
          <>
            {i.working!.submittedAt ? relativeTime(i.working!.submittedAt, now) : "—"}
            <span className="block text-xs text-oxford-mute">{i.working!.submittedAt && formatWhen(i.working!.submittedAt)}</span>
          </>
        ) : (
          <StatusBadge status={displayStatus(i, now)} />
        )}
      </Td>
      <Td className="text-right">
        <Link to={`/admin/content/${i.id}`} className={abtn(kind === "review" ? "primary" : "secondary")}>
          {kind === "review" ? "Review" : "Open"}
          <span className="sr-only"> {itemTitle(i)}</span>
        </Link>
      </Td>
    </tr>
  );

  return (
    <>
      <PageTitle title="Review queue" description="Approve submitted content, or return it to the editor with a comment. Oldest first." />
      <div role="search" className="mb-3 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold">
          Type
          <select value={type} onChange={(e) => setType(e.target.value as ContentType | "")} className={select}>
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold">
          Submitted by
          <select value={submitter} onChange={(e) => setSubmitter(e.target.value)} className={select}>
            <option value="">Anyone</option>
            {submitters.map((id) => (
              <option key={id} value={id}>
                {nameOf(id)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold">
          Submitted
          <select value={when} onChange={(e) => setWhen(e.target.value)} className={select}>
            {WHEN.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
        </label>
        <p role="status" className="ml-auto text-sm text-oxford-mute">
          {items.state.status === "ready" && `${rows.length} of ${queue.length} waiting`}
        </p>
      </div>

      {items.state.status === "loading" ? (
        <p role="status" className="text-sm text-oxford-mute">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-oxford-rule bg-white p-6 text-center text-sm text-oxford-mute">{queue.length ? "Nothing matches these filters." : "Nothing is waiting for review."}</p>
      ) : (
        <Table
          caption="Waiting for review"
          head={
            <tr>
              <Th>Title</Th>
              <Th>Type</Th>
              <Th>Submitted by</Th>
              <Th>Submitted</Th>
              <Th>
                <span className="sr-only">Open</span>
              </Th>
            </tr>
          }
        >
          {rows.map((i) => row(i, "review"))}
        </Table>
      )}

      {ready.length > 0 && (
        <div className="mt-7">
          <Card title={`Approved, waiting to go live (${ready.length})`}>
            <Table
              caption="Approved content"
              head={
                <tr>
                  <Th>Title</Th>
                  <Th>Type</Th>
                  <Th>Written by</Th>
                  <Th>Status</Th>
                  <Th>
                    <span className="sr-only">Open</span>
                  </Th>
                </tr>
              }
            >
              {ready.map((i) => row(i, "publish"))}
            </Table>
          </Card>
        </div>
      )}
    </>
  );
};
