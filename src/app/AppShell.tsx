import { Outlet } from "react-router-dom";
import { BottomTabBar } from "@/components/BottomTabBar";
import { SkipLink } from "@/components/SkipLink";
import { ToastViewport } from "@/components/Toast";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export const AppShell = () => (
  <div className="min-h-screen bg-slate-50">
    <SkipLink />
    <Sidebar />

    <div className="lg:pl-64">
      <TopBar />
      <main
        id="main-content"
        className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-4 sm:px-6 lg:pb-10 lg:pt-6"
      >
        <Outlet />
      </main>
    </div>

    <BottomTabBar />
    <ToastViewport />
  </div>
);
