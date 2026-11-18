import { useState } from "react";
import { Link } from "react-router-dom";
import type { AuditAction } from "@/services";
import { useAudit } from "./data";
import { formatWhen, PageTitle, Table, Td, Th } from "./ui";

const ACTION_LABEL: Record<AuditAction, string> = {
  create: "Created",
  save: "Saved",
  submit: "Submitted",
  approve: "Approved",
  return: "Returned",
  publish: "Published",
  schedule: "Scheduled",
  unpublish: "Unpublished",
  expiry: "Expiry changed",
  role: "Role changed",
};
const select = "mt-1 block rounded-md border border-oxford-ink/25 bg-white px-2 py-1.5 text-sm";

/** Flow 10 audit log: who created, submitted, approved, returned, published or unpublished what, and when. */
export const ActivityLog = () => {
  const audit = useAudit();
  const [action, setAction] = useState<AuditAction | "">("");
  const [actor, setActor] = useState("");
  const entries = audit.state.status === "ready" ? audit.state.data : [];
  const actors = [...new Set(entries.map((e) => e.actor))].sort();
  const rows = entries.filter((e) => (!action || e.action === action) && (!actor || e.actor === actor));

  return (
    <>
      <PageTitle title="Activity log" description="Every change staff make to content and roles, newest first. Entries can't be edited." />
      <div role="search" className="mb-3 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold">
          Action
          <select value={action} onChange={(e) => setAction(e.target.value as AuditAction | "")} className={select}>
            <option value="">All actions</option>
            {(Object.keys(ACTION_LABEL) as AuditAction[]).map((a) => (
              <option key={a} value={a}>
                {ACTION_LABEL[a]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold">
          Person
          <select value={actor} onChange={(e) => setActor(e.target.value)} className={select}>
            <option value="">Everyone</option>
            {actors.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <p role="status" className="ml-auto text-sm text-oxford-mute">
          {audit.state.status === "ready" && `${rows.length} ${rows.length === 1 ? "entry" : "entries"}`}
        </p>
      </div>
      {audit.state.status === "loading" ? (
        <p role="status" className="text-sm text-oxford-mute">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-oxford-rule bg-white p-6 text-center text-sm text-oxford-mute">No activity matches these filters.</p>
      ) : (
        <Table
          caption="Activity log"
          head={
            <tr>
              <Th>When</Th>
              <Th>Who</Th>
              <Th>Action</Th>
              <Th>Item</Th>
              <Th>Detail</Th>
            </tr>
          }
        >
          {rows.map((e) => (
            <tr key={e.id}>
              <Td className="whitespace-nowrap text-oxford-ink2">{formatWhen(e.at)}</Td>
              <Td className="whitespace-nowrap font-semibold">{e.actor}</Td>
              <Td className="whitespace-nowrap">{ACTION_LABEL[e.action]}</Td>
              <Td className="max-w-[260px]">
                {e.itemId ? (
                  <Link to={`/admin/content/${e.itemId}`} className="underline underline-offset-2">
                    {e.itemTitle}
                  </Link>
                ) : (
                  "—"
                )}
              </Td>
              <Td className="max-w-[320px] text-oxford-ink2">{e.detail}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
};
