import { useState } from "react";
import { services, type AdminRole, type AdminUser } from "@/services";
import { ConfirmDialog } from "@/ui/ConfirmDialog";
import { useAdmin, canManage, ROLE_LABEL } from "./AdminAuth";
import { useUsers } from "./data";
import { Card, PageTitle, Table, Td, Th } from "./ui";

const ROLES: (AdminRole | "")[] = ["super-admin", "editor", "reviewer", ""];

const WHAT: Record<AdminRole, string> = {
  "super-admin": "Everything, plus managing roles",
  editor: "Creates content and submits it for review",
  reviewer: "Approves or returns content, and publishes it",
};

/** Super admins give staff a role, or take admin access away. */
export const UsersRoles = () => {
  const { user, setUser } = useAdmin();
  const users = useUsers();
  const [list, setList] = useState<AdminUser[] | null>(null);
  const [pending, setPending] = useState<{ user: AdminUser; role: AdminRole | null } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (!canManage(user)) return <PageTitle title="Users and roles" description="Only super admins manage roles." />;
  const shown = list ?? (users.state.status === "ready" ? users.state.data : []);

  const apply = async (target: AdminUser, role: AdminRole | null) => {
    setBusy(target.id);
    setMessage(null);
    try {
      const next = await services.admin.setRole(user!.id, target.id, role);
      setList(shown.map((u) => (u.id === next.id ? next : u)));
      if (next.id === user!.id) setUser(next);
      setMessage(role ? `${next.name}’s role is now ${ROLE_LABEL[role]}.` : `${next.name} no longer has admin access.`);
    } catch {
      setMessage("The role didn't change. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageTitle title="Users and roles" description="Who can do what in Admin. You can't change your own role." />
      <p role="status" className="mb-3 min-h-[1.25rem] text-sm font-semibold text-oxford-success">
        {message}
      </p>
      <Table
        caption="Staff accounts"
        head={
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
          </tr>
        }
      >
        {shown.map((u) => (
          <tr key={u.id}>
            <Td className="font-semibold">
              {u.name}
              {u.id === user!.id && <span className="ml-1 text-xs font-normal text-oxford-mute">(you)</span>}
            </Td>
            <Td className="text-oxford-ink2">{u.email}</Td>
            <Td>
              <label className="sr-only" htmlFor={`role-${u.id}`}>
                Role for {u.name}
              </label>
              <select
                id={`role-${u.id}`}
                value={u.role ?? ""}
                disabled={u.id === user!.id || busy === u.id}
                onChange={(e) => {
                  const role = (e.target.value || null) as AdminRole | null;
                  if (role === null) setPending({ user: u, role });
                  else apply(u, role);
                }}
                className="rounded-md border border-oxford-ink/25 bg-white px-2 py-1.5 text-sm disabled:bg-oxford-cream"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r ? ROLE_LABEL[r] : "No admin access"}
                  </option>
                ))}
              </select>
            </Td>
          </tr>
        ))}
      </Table>

      <div className="mt-6 max-w-xl">
        <Card title="What each role can do">
          <dl className="space-y-2 text-sm">
            {(Object.keys(WHAT) as AdminRole[]).map((r) => (
              <div key={r}>
                <dt className="font-semibold">{ROLE_LABEL[r]}</dt>
                <dd className="text-oxford-ink2">{WHAT[r]}</dd>
              </div>
            ))}
            <div>
              <dt className="font-semibold">No admin access</dt>
              <dd className="text-oxford-ink2">Can sign in, but sees “Access denied”</dd>
            </div>
          </dl>
        </Card>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title="Remove admin access?"
        body={`${pending?.user.name} won't be able to use Admin. Their past work and activity stay in the log.`}
        confirmLabel="Remove access"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const p = pending!;
          setPending(null);
          apply(p.user, p.role);
        }}
      />
    </>
  );
};
