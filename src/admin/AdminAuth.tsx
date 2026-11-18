import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, type LinkProps } from "react-router-dom";
import { services, type AdminRole, type AdminUser } from "@/services";
import { ConfirmDialog } from "@/ui/ConfirmDialog";

// Staff sign-in for Admin (flow 10), separate from the student session.

interface AdminCtx {
  user: AdminUser | null;
  setUser: (u: AdminUser | null) => void;
  logOut: () => void;
}

const Ctx = createContext<AdminCtx | null>(null);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(() => services.admin.current());
  const logOut = useCallback(() => {
    services.admin.logOut();
    setUser(null);
  }, []);
  const value = useMemo(() => ({ user, setUser, logOut }), [user, logOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAdmin = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdmin must be used inside AdminAuthProvider");
  return ctx;
};

export const ROLE_LABEL: Record<AdminRole, string> = { "super-admin": "Super admin", editor: "Editor", reviewer: "Reviewer" };

export const canWrite = (u: AdminUser | null) => u?.role === "editor" || u?.role === "super-admin";
export const canReview = (u: AdminUser | null) => u?.role === "reviewer" || u?.role === "super-admin";
export const canManage = (u: AdminUser | null) => u?.role === "super-admin";

// ── Unsaved changes ───────────────────────────────────────────────────

interface GuardCtx {
  setDirty: (dirty: boolean) => void;
  /** Runs `go` now, or after the person confirms leaving unsaved changes. */
  confirmLeave: (go: () => void) => void;
}

const Guard = createContext<GuardCtx | null>(null);

export const UnsavedChangesProvider = ({ children }: { children: ReactNode }) => {
  const dirty = useRef(false);
  const [pending, setPending] = useState<(() => void) | null>(null);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const value = useMemo<GuardCtx>(
    () => ({
      setDirty: (d) => {
        dirty.current = d;
      },
      confirmLeave: (go) => {
        if (!dirty.current) go();
        else setPending(() => go);
      },
    }),
    [],
  );

  return (
    <Guard.Provider value={value}>
      {children}
      <ConfirmDialog
        open={pending !== null}
        title="Leave without saving?"
        body="You have changes that haven't been saved. If you leave now, they'll be lost."
        confirmLabel="Leave without saving"
        cancelLabel="Keep editing"
        onConfirm={() => {
          dirty.current = false;
          const go = pending;
          setPending(null);
          go?.();
        }}
        onCancel={() => setPending(null)}
      />
    </Guard.Provider>
  );
};

export const useUnsavedGuard = () => {
  const ctx = useContext(Guard);
  if (!ctx) throw new Error("useUnsavedGuard must be used inside UnsavedChangesProvider");
  return ctx;
};

/** An in-app link that checks for unsaved changes before leaving. */
export const GuardedLink = ({ to, onClick, ...rest }: LinkProps) => {
  const { confirmLeave } = useUnsavedGuard();
  const navigate = useNavigate();
  return (
    <Link
      to={to}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || rest.target === "_blank") return;
        e.preventDefault();
        confirmLeave(() => navigate(to));
      }}
    />
  );
};
