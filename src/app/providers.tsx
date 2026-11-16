import type { ReactNode } from "react";
import { ActivityProvider } from "@/session/ActivityProvider";
import { SessionProvider } from "@/session/SessionProvider";
import { SyncProvider } from "@/session/SyncProvider";

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <SessionProvider>
    <ActivityProvider>
      <SyncProvider>{children}</SyncProvider>
    </ActivityProvider>
  </SessionProvider>
);
