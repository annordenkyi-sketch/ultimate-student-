import { checklist, itemTitle, titleOf } from "@/lib/cms";
import { storage } from "@/lib/storage";
import { ServiceError, type AdminRole, type AdminService, type AdminUser, type ContentItem } from "../types";
import {
  ADMIN_PASSWORD,
  allItems,
  audit,
  findItem,
  newVersion,
  notifyPublished,
  promote,
  readAudit,
  readUsers,
  removeItem,
  saveItem,
  withVersion,
  writeUsers,
} from "./cmsStore";
import { CAMPUS_AREA } from "./campusData";
import { PROGRAMMES } from "./catalogService";
import { mockClockService } from "./clockService";
import { SEMESTERS, VENUE_PLACES, clone } from "./courseData";
import { livePlaces } from "./liveContent";
import { wait } from "./db";

// Admin content publishing (flow 10). Roles:
//   editor       creates content and submits it for review
//   reviewer     approves or returns it, and publishes
//   super-admin  everything, plus managing roles

const SESSION_KEY = "us.v9.adminSession";

const now = () => mockClockService.now();
const at = () => now().toISOString();

const can = {
  write: (r: AdminRole | null) => r === "editor" || r === "super-admin",
  review: (r: AdminRole | null) => r === "reviewer" || r === "super-admin",
  manage: (r: AdminRole | null) => r === "super-admin",
};

const actor = (id: string, allowed: (r: AdminRole | null) => boolean): AdminUser => {
  const user = readUsers().find((u) => u.id === id);
  if (!user || !allowed(user.role)) throw new ServiceError("forbidden");
  return user;
};

const mustGet = (id: string): ContentItem => {
  const item = findItem(id);
  if (!item) throw new Error(`Unknown content ${id}`);
  return item;
};

const ref = (item: ContentItem) => ({ id: item.id, title: itemTitle(item) });

/** The editor's requested expiry date, as the end of that day. */
const requestedExpiry = (item: ContentItem) => {
  const day = item.working?.meta.expiresOn;
  return day ? new Date(`${day}T23:59:59`).toISOString() : item.expiresAt;
};

export const mockAdminService: AdminService = {
  async logIn(email, password) {
    await wait(700);
    const user = readUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || password !== ADMIN_PASSWORD) throw new ServiceError("invalid-credentials");
    storage.set(SESSION_KEY, user.id);
    return user;
  },

  current() {
    const id = storage.get<string | null>(SESSION_KEY, null);
    return id ? (readUsers().find((u) => u.id === id) ?? null) : null;
  },

  logOut() {
    storage.remove(SESSION_KEY);
  },

  async users() {
    await wait(250);
    return readUsers();
  },

  async setRole(actorId, userId, role) {
    await wait(400);
    actor(actorId, can.manage);
    if (actorId === userId) throw new ServiceError("forbidden");
    const users = readUsers().map((u) => (u.id === userId ? { ...u, role } : u));
    writeUsers(users);
    const target = users.find((u) => u.id === userId)!;
    const ROLE_NAME = { "super-admin": "Super admin", editor: "Editor", reviewer: "Reviewer" } as const;
    audit(actorId, "role", null, `${target.name}: ${role ? ROLE_NAME[role] : "No admin access"}`);
    return target;
  },

  async list() {
    await wait(300);
    return allItems().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async get(id) {
    await wait(200);
    return findItem(id);
  },

  async create(actorId, type, payload, meta) {
    await wait(500);
    actor(actorId, can.write);
    const v = newVersion(1, payload, meta, actorId, "draft");
    const id = `${type}-${Date.now().toString(36)}`;
    const item = saveItem({ id, type, live: null, working: v, publishAt: null, expiresAt: null, unpublished: false, versions: [v], createdBy: actorId, updatedAt: at() });
    audit(actorId, "create", { id, title: titleOf(type, payload) }, "Created draft");
    return item;
  },

  async saveDraft(actorId, id, payload, meta) {
    await wait(400);
    actor(actorId, can.write);
    const item = mustGet(id);
    // Editing something published starts a new version; the live one stays up until it's approved.
    const number = item.working?.number ?? Math.max(...item.versions.map((v) => v.number)) + 1;
    const base = item.working ?? newVersion(number, payload, meta, actorId, "draft");
    const v = { ...base, payload, meta, status: "draft" as const, createdBy: item.working ? base.createdBy : actorId, comment: base.comment };
    const next = saveItem(withVersion({ ...item, working: v, publishAt: null }, v));
    audit(actorId, "save", ref(next), item.working ? `Saved draft (version ${number})` : `Started version ${number}`);
    return next;
  },

  async submit(actorId, id) {
    await wait(400);
    actor(actorId, can.write);
    const item = mustGet(id);
    if (!item.working) throw new Error("Nothing to submit");
    if (checklist(item.type, item.working.payload, item.working.meta).some((c) => !c.ok)) throw new ServiceError("forbidden");
    // A fresh submission starts a fresh review; the earlier return stays in the audit log.
    const v = { ...item.working, status: "in-review" as const, submittedAt: at(), comment: null, reviewedBy: null, reviewedAt: null };
    const next = saveItem(withVersion({ ...item, working: v }, v));
    audit(actorId, "submit", ref(next), item.live ? `Submitted correction (version ${v.number})` : "Submitted for review");
    return next;
  },

  async approve(actorId, id) {
    await wait(400);
    actor(actorId, can.review);
    const item = mustGet(id);
    if (item.working?.status !== "in-review") throw new Error("Not in review");
    const v = { ...item.working, status: "approved" as const, reviewedBy: actorId, reviewedAt: at(), comment: null };
    const next = saveItem(withVersion({ ...item, working: v }, v));
    audit(actorId, "approve", ref(next), `Approved version ${v.number}`);
    return next;
  },

  async returnForCorrection(actorId, id, comment) {
    await wait(400);
    actor(actorId, can.review);
    if (!comment.trim()) throw new Error("A comment is required");
    const item = mustGet(id);
    if (!item.working) throw new Error("Nothing to return");
    const v = { ...item.working, status: "returned" as const, reviewedBy: actorId, reviewedAt: at(), comment: comment.trim() };
    const next = saveItem(withVersion({ ...item, working: v }, v));
    audit(actorId, "return", ref(next), `Returned: ${comment.trim()}`);
    return next;
  },

  async publish(actorId, id, when) {
    await wait(600);
    actor(actorId, can.review);
    const item = mustGet(id);
    if (item.working && item.working.status !== "approved") throw new Error("Approve it first");
    // Republishing something unpublished, with no new version.
    if (!item.working) {
      if (!item.live) throw new Error("Nothing to publish");
      const next = saveItem({ ...item, unpublished: false });
      audit(actorId, "publish", ref(next), "Published again");
      return { item: next, notified: 0 };
    }
    if (when && new Date(when) > now()) {
      const next = saveItem({ ...item, publishAt: when, expiresAt: requestedExpiry(item) });
      audit(actorId, "schedule", ref(next), `Scheduled for ${new Date(when).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`);
      return { item: next, notified: 0 };
    }
    const next = saveItem(promote({ ...item, expiresAt: requestedExpiry(item) }, at()));
    const notified = await notifyPublished(next);
    audit(actorId, "publish", ref(next), `Published version ${next.live!.number}${notified ? `, ${notified} students notified` : ""}`);
    return { item: next, notified };
  },

  async unpublish(actorId, id) {
    await wait(400);
    actor(actorId, can.review);
    const item = mustGet(id);
    const next = saveItem({ ...item, unpublished: true });
    audit(actorId, "unpublish", ref(next), "Removed from the student app");
    return next;
  },

  async setExpiry(actorId, id, expiresAt) {
    await wait(300);
    actor(actorId, (r) => can.write(r) || can.review(r));
    const item = mustGet(id);
    const next = saveItem({ ...item, expiresAt });
    audit(actorId, "expiry", ref(next), expiresAt ? `Expiry set to ${new Date(expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : "Expiry removed");
    return next;
  },

  async discardDraft(actorId, id) {
    await wait(300);
    actor(actorId, can.write);
    const item = mustGet(id);
    if (!item.working) return item;
    if (!item.live) {
      removeItem(id);
      audit(actorId, "save", ref(item), "Discarded draft");
      return null;
    }
    const next = saveItem({ ...item, working: null, publishAt: null, versions: item.versions.filter((v) => v.number !== item.working!.number) });
    audit(actorId, "save", ref(next), `Discarded version ${item.working.number}`);
    return next;
  },

  async audit() {
    await wait(250);
    allItems();
    return readAudit();
  },

  async reference() {
    await wait(250);
    return {
      programmes: PROGRAMMES.map((p) => ({ id: p.id, name: p.name })),
      levels: ["Level 100", "Level 200", "Level 300", "Level 400", "Year 1", "Year 2", "Year 3", "Year 4"],
      semesters: clone(SEMESTERS),
      places: livePlaces(now())
        .map((p) => ({ id: p.id, name: p.name, category: p.category, lat: p.lat, lng: p.lng }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      venues: { ...VENUE_PLACES },
      campus: CAMPUS_AREA,
    };
  },
};
