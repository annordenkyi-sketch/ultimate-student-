import { useCallback } from "react";
import { services, type AdminUser, type AuditAction, type ContentItem } from "@/services";
import { useAsync } from "@/lib/useAsync";

// Data hooks shared by the admin screens.

export const useItems = () => useAsync(() => services.admin.list(), []);
export const useUsers = () => useAsync(() => services.admin.users(), []);
export const useReference = () => useAsync(() => services.admin.reference(), []);
export const useAudit = () => useAsync(() => services.admin.audit(), []);

export const SYSTEM_NAME = "University content team";

/** Display name for a staff id. Shipped content belongs to the content team. */
export const useNameOf = (users: AdminUser[] | null) =>
  useCallback((id: string | null) => (!id ? "" : id === "system" ? SYSTEM_NAME : !users ? "" : (users.find((u) => u.id === id)?.name ?? "Staff")), [users]);

/** Where students find this item. */
export const studentPath = (item: Pick<ContentItem, "id" | "type">) => {
  switch (item.type) {
    case "news":
      return `/announcements/${item.id}`;
    case "event":
      return `/events/${item.id}`;
    case "service":
      return `/services/${item.id}`;
    case "place":
      return `/places/${item.id}`;
    case "timetable":
      return "/more/academics";
  }
};

/** Who last worked on the current version. */
export const authorOf = (item: ContentItem) => (item.working ?? item.live)?.createdBy ?? item.createdBy;

export const ACTION_VERB: Record<AuditAction, string> = {
  create: "created",
  save: "saved",
  submit: "submitted",
  approve: "approved",
  return: "returned",
  publish: "published",
  schedule: "scheduled",
  unpublish: "unpublished",
  expiry: "changed the expiry of",
  role: "changed a role",
};
