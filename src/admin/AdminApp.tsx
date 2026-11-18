import { Component, useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AdminAuthProvider, UnsavedChangesProvider } from "./AdminAuth";
import { AdminLayout } from "./AdminLayout";
import { AccessDenied, AdminLogin } from "./AdminLogin";
import { ActivityLog } from "./ActivityLog";
import { ContentList } from "./ContentList";
import { Dashboard } from "./Dashboard";
import { EditorPage } from "./editor/EditorPage";
import { ItemPage } from "./ItemPage";
import { ReviewQueue } from "./ReviewQueue";
import { TypeChooser } from "./TypeChooser";
import { UsersRoles } from "./UsersRoles";

/** A screen that crashes shows a way out instead of a blank page. Saved work is kept in the store. */
class AdminErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        role="alert"
        className="flex min-h-screen items-center justify-center bg-oxford-paper p-4"
      >
        <div className="max-w-md rounded-2xl border border-oxford-rule bg-white p-6 text-center">
          <h1 className="font-serif text-2xl text-oxford-ink">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-oxford-ink2">
            This screen couldn't be shown. Anything you saved is safe.
          </p>
          <a
            href="/admin"
            className="mt-4 inline-flex min-h-[40px] items-center rounded-md bg-oxford-ink px-4 text-sm font-semibold text-white"
          >
            Back to the dashboard
          </a>
        </div>
      </div>
    );
  }
}

/** Flow 10: Admin content publishing. Its own area under /admin, loaded only when opened. */
const AdminApp = () => {
  useEffect(() => {
    const previous = document.title;
    document.title = "Admin · Ultimate Student";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <AdminErrorBoundary>
      <AdminAuthProvider>
        <UnsavedChangesProvider>
          <Routes>
            <Route path="login" element={<AdminLogin />} />
            <Route path="denied" element={<AccessDenied />} />
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="content" element={<ContentList />} />
              <Route path="content/new" element={<TypeChooser />} />
              <Route path="content/new/:type" element={<EditorPage />} />
              <Route path="content/:id" element={<ItemPage />} />
              <Route path="content/:id/edit" element={<EditorPage />} />
              <Route path="review" element={<ReviewQueue />} />
              <Route path="activity" element={<ActivityLog />} />
              <Route path="users" element={<UsersRoles />} />
            </Route>
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </UnsavedChangesProvider>
      </AdminAuthProvider>
    </AdminErrorBoundary>
  );
};

export default AdminApp;
