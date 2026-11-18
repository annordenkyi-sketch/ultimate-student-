import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import type { ContentType, DisplayStatus } from "@/services";
import { audienceLabel, displayStatus, expiresLabel, itemTitle, STATUS_LABEL, TYPE_LABEL } from "@/lib/cms";
import { relativeTime, useNow } from "@/lib/dates";
import { useAdmin, canWrite } from "./AdminAuth";
import { authorOf, useItems, useNameOf, useReference, useUsers } from "./data";
import { abtn, PageTitle, StatusBadge, Table, Td, Th, TypeBadge } from "./ui";

const TYPES = Object.keys(TYPE_LABEL) as ContentType[];
const STATUSES = Object.keys(STATUS_LABEL) as DisplayStatus[];

const select = "rounded-md border border-oxford-ink/25 bg-white px-2 py-1.5 text-sm";

/** Every content item, with filters. Filters live in the address so links and Back keep them. */
export const ContentList = () => {
  const { user } = useAdmin();
  const now = useNow(15_000);
  const [params, setParams] = useSearchParams();
  const type = (params.get("type") ?? "") as ContentType | "";
  const status = (params.get("status") ?? "") as DisplayStatus | "";
  const q = params.get("q") ?? "";
  const items = useItems();
  const users = useUsers();
  const ref = useReference();
  const nameOf = useNameOf(users.state.status === "ready" ? users.state.data : null);
  const programmeName = (id: string) => (ref.state.status === "ready" ? (ref.state.data.programmes.find((p) => p.id === id)?.name ?? id) : id);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const rows = useMemo(() => {
    if (items.state.status !== "ready") return [];
    const needle = q.trim().toLowerCase();
    return items.state.data.filter(
      (i) => (!type || i.type === type) && (!status || displayStatus(i, now) === status) && (!needle || itemTitle(i).toLowerCase().includes(needle)),
    );
  }, [items.state, type, status, q, now]);

  return (
    <>
      <PageTitle
        title="Content"
        description="Everything in the student app, and everything on its way there."
        actions={
          canWrite(user) && (
            <Link to="/admin/content/new" className={abtn("primary")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create content
            </Link>
          )
        }
      />

      <div role="search" className="mb-3 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold">
          Search titles
          <input type="search" value={q} onChange={(e) => set("q", e.target.value)} className={`${select} mt-1 block w-60`} />
        </label>
        <label className="text-xs font-semibold">
          Type
          <select value={type} onChange={(e) => set("type", e.target.value)} className={`${select} mt-1 block`}>
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold">
          Status
          <select value={status} onChange={(e) => set("status", e.target.value)} className={`${select} mt-1 block`}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        {(type || status || q) && (
          <button type="button" onClick={() => setParams({}, { replace: true })} className={abtn("ghost")}>
            Clear filters
          </button>
        )}
        <p role="status" className="ml-auto text-sm text-oxford-mute">
          {items.state.status === "ready" && `${rows.length} ${rows.length === 1 ? "item" : "items"}`}
        </p>
      </div>

      {items.state.status === "loading" ? (
        <p role="status" className="text-sm text-oxford-mute">Loading content…</p>
      ) : items.state.status === "error" ? (
        <p role="alert" className="text-sm text-oxford-danger">
          Content didn't load.{" "}
          <button type="button" onClick={items.reload} className="font-semibold underline">
            Try again
          </button>
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-oxford-rule bg-white p-6 text-center text-sm text-oxford-mute">No content matches these filters.</p>
      ) : (
        <Table
          caption="Content items"
          head={
            <tr>
              <Th>Title</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Audience</Th>
              <Th>Last change</Th>
              <Th>Expiry</Th>
            </tr>
          }
        >
          {rows.map((i) => {
            const s = displayStatus(i, now);
            const meta = (i.working ?? i.live)!.meta;
            return (
              <tr key={i.id} className="hover:bg-oxford-cream/50">
                <Td className="max-w-[340px]">
                  <Link to={`/admin/content/${i.id}`} className="font-semibold text-oxford-ink underline-offset-2 hover:underline">
                    {itemTitle(i)}
                  </Link>
                  {i.live && i.working && !i.unpublished && <span className="block text-xs text-oxford-mute">Version {i.live.number} is live while version {i.working.number} is worked on</span>}
                </Td>
                <Td>
                  <TypeBadge type={i.type} />
                </Td>
                <Td>
                  <StatusBadge status={s} />
                </Td>
                <Td className="max-w-[200px] truncate text-oxford-ink2">{audienceLabel(meta.audience, programmeName)}</Td>
                <Td className="whitespace-nowrap text-oxford-ink2">
                  {relativeTime(i.updatedAt, now)}
                  <span className="block text-xs text-oxford-mute">{nameOf(authorOf(i))}</span>
                </Td>
                <Td className="whitespace-nowrap text-oxford-ink2">{expiresLabel(i, now) ?? "—"}</Td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
};
