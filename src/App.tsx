import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/app/AppShell";
import { ProtectedRoute } from "@/app/ProtectedRoute";
import { WelcomePage } from "@/features/welcome/WelcomePage";
import { LoginPage } from "@/features/login/LoginPage";
import { ForgotPasswordPage } from "@/features/login/ForgotPasswordPage";
import { LegalPage } from "@/features/legal/LegalPage";
import { OnboardingLayout } from "@/features/onboarding/OnboardingLayout";
import { AccountStep } from "@/features/onboarding/AccountStep";
import { TypeStep } from "@/features/onboarding/TypeStep";
import { LivingStep } from "@/features/onboarding/LivingStep";
import { DoneStep } from "@/features/onboarding/DoneStep";
import { HomePage } from "@/features/home/HomePage";
import { AnnouncementsPage } from "@/features/announcements/AnnouncementsPage";
import { SearchPage } from "@/features/search/SearchPage";
import { SectionsPage } from "@/features/sections/SectionsPage";
import { AcademicPage } from "@/features/academic/AcademicPage";
import { AccommodationPage } from "@/features/accommodation/AccommodationPage";
import { NavigationPage } from "@/features/navigation/NavigationPage";
import { ServicesPage } from "@/features/services/ServicesPage";
import { SectionListPage } from "@/features/section/SectionListPage";
import { DetailsPage } from "@/features/details/DetailsPage";
import { SavedPage } from "@/features/saved/SavedPage";
import { NotificationsPage } from "@/features/notifications/NotificationsPage";
import { ProfilePage } from "@/features/profile/ProfilePage";

export const App = () => (
  <Routes>
    <Route path="/welcome" element={<WelcomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/login/forgot" element={<ForgotPasswordPage />} />
    <Route path="/legal/:kind" element={<LegalPage />} />
    <Route path="/onboarding/account" element={<AccountStep />} />
    <Route path="/onboarding" element={<OnboardingLayout />}>
      <Route index element={<Navigate to="type" replace />} />
      <Route path="type" element={<TypeStep />} />
      <Route path="living" element={<LivingStep />} />
      <Route path="done" element={<DoneStep />} />
    </Route>

    <Route
      element={
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<HomePage />} />
      <Route path="/announcements" element={<AnnouncementsPage />} />
      <Route path="/announcements/:id" element={<AnnouncementsPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/sections" element={<SectionsPage />} />
      <Route path="/section/academic" element={<AcademicPage />} />
      <Route path="/section/navigation" element={<NavigationPage />} />
      <Route path="/section/accommodation" element={<AccommodationPage />} />
      <Route path="/section/services" element={<ServicesPage />} />
      <Route path="/section/:sectionId" element={<SectionListPage />} />
      <Route path="/section/:sectionId/:itemId" element={<DetailsPage />} />
      <Route path="/saved" element={<SavedPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
