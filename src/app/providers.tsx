import type { ReactNode } from "react";
import { ProfileProvider } from "@/hooks/useProfile";
import { SavedProvider } from "@/hooks/useSaved";
import { ChecklistProvider } from "@/hooks/useChecklist";
import { NotificationsProvider } from "@/hooks/useNotifications";
import { ToastProvider } from "@/hooks/useToast";

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <ProfileProvider>
    <SavedProvider>
      <ChecklistProvider>
        <NotificationsProvider>
          <ToastProvider>{children}</ToastProvider>
        </NotificationsProvider>
      </ChecklistProvider>
    </SavedProvider>
  </ProfileProvider>
);
