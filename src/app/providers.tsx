import type { ReactNode } from "react";
import { ProfileProvider } from "@/hooks/useProfile";
import { SavedProvider } from "@/hooks/useSaved";
import { ChecklistProvider } from "@/hooks/useChecklist";
import { NotificationsProvider } from "@/hooks/useNotifications";
import { AnnouncementReadsProvider } from "@/hooks/useAnnouncementReads";
import { ToastProvider } from "@/hooks/useToast";

export const AppProviders = ({ children }: { children: ReactNode }) => (
  <ProfileProvider>
    <SavedProvider>
      <ChecklistProvider>
        <NotificationsProvider>
          <AnnouncementReadsProvider>
            <ToastProvider>{children}</ToastProvider>
          </AnnouncementReadsProvider>
        </NotificationsProvider>
      </ChecklistProvider>
    </SavedProvider>
  </ProfileProvider>
);
