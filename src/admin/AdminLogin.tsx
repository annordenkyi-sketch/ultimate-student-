import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck, ShieldX } from "lucide-react";
import { errorCodeOf, services } from "@/services";
import { useAdmin } from "./AdminAuth";
import { abtn } from "./ui";

/** Flow 10 "Admin login": staff email and password, separate from student log in. */
export const AdminLogin = () => {
  const { user, setUser } = useAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role ? "/admin" : "/admin/denied"} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your staff email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const u = await services.admin.logIn(email, password);
      setUser(u);
      // Role check: only staff with an admin role get in.
      navigate(u.role ? "/admin" : "/admin/denied", { replace: true });
    } catch (err) {
      setError(errorCodeOf(err) === "invalid-credentials" ? "That email and password don't match a staff account." : "We couldn't sign you in. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-oxford-paper p-4">
      <div className="w-full max-w-sm rounded-2xl border border-oxford-rule bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-oxford-ink">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">Ultimate Student · Admin</span>
        </div>
        <h1 className="mt-3 font-serif text-2xl font-medium text-oxford-ink">Staff sign in</h1>
        <p className="mt-1 text-sm text-oxford-mute">For staff who publish content to the student app.</p>
        <form onSubmit={submit} noValidate className="mt-5 space-y-3">
          {error && (
            <p role="alert" className="rounded-md border border-oxford-danger/30 bg-oxford-danger/5 p-2.5 text-sm font-semibold text-oxford-danger">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="admin-email" className="block text-xs font-semibold text-oxford-ink">
              Staff email
            </label>
            <input id="admin-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border border-oxford-ink/25 px-2.5 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-xs font-semibold text-oxford-ink">
              Password
            </label>
            <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border border-oxford-ink/25 px-2.5 py-2 text-sm" />
          </div>
          <button type="submit" disabled={busy} className={abtn("primary", "w-full min-h-[40px]")}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-5 text-sm text-oxford-mute">
          Looking for the student app?{" "}
          <Link to="/" className="font-semibold text-oxford-ink underline underline-offset-4">
            Go to Ultimate Student
          </Link>
        </p>
      </div>
    </div>
  );
};

/** Signed in, but this staff account has no admin role. */
export const AccessDenied = () => {
  const { user, logOut } = useAdmin();
  if (!user) return <Navigate to="/admin/login" replace />;
  return (
    <div className="flex min-h-screen items-center justify-center bg-oxford-paper p-4">
      <div className="w-full max-w-md rounded-2xl border border-oxford-rule bg-white p-6 text-center shadow-sm">
        <ShieldX className="mx-auto h-8 w-8 text-oxford-danger" aria-hidden="true" />
        <h1 className="mt-3 font-serif text-2xl font-medium text-oxford-ink">Access denied</h1>
        <p className="mt-2 text-sm text-oxford-ink2">
          {user.name}, your account ({user.email}) doesn't have access to Admin. Ask a super admin to give you a role if you need it.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link to="/" className={abtn("primary", "min-h-[40px]")}>
            Go to the student app
          </Link>
          <button type="button" onClick={logOut} className={abtn("secondary", "min-h-[40px]")}>
            Sign in with another account
          </button>
        </div>
      </div>
    </div>
  );
};
