import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { WelcomePage } from "@/features/welcome/WelcomePage";
import { AcademicProfileScreen } from "@/screens/auth/AcademicProfileScreen";
import { ChooseEntry } from "@/screens/auth/ChooseEntry";
import { ForgotCode } from "@/screens/auth/forgot/ForgotCode";
import { ForgotEmail } from "@/screens/auth/forgot/ForgotEmail";
import { ForgotNewPassword } from "@/screens/auth/forgot/ForgotNewPassword";
import { LimitedScreen } from "@/screens/auth/LimitedScreen";
import { LoginScreen } from "@/screens/auth/LoginScreen";
import { AcademicStep } from "@/screens/auth/signup/AcademicStep";
import { AccountStep } from "@/screens/auth/signup/AccountStep";
import { EligibilityStep } from "@/screens/auth/signup/EligibilityStep";
import { EmailCodeStep } from "@/screens/auth/signup/EmailCodeStep";
import { LevelStep } from "@/screens/auth/signup/LevelStep";
import { SignupLayout } from "@/screens/auth/signup/SignupLayout";
import { VerifyScreen } from "@/screens/auth/VerifyScreen";
import { EntryGate } from "@/screens/entry/EntryGate";
import { EventsDirectory } from "@/screens/explore/EventsDirectory";
import { ExploreScreen } from "@/screens/explore/ExploreScreen";
import { PlacesDirectory } from "@/screens/explore/PlacesDirectory";
import { SearchScreen } from "@/screens/explore/SearchScreen";
import { ServicesDirectory } from "@/screens/explore/ServicesDirectory";
import { EditGoalScreen } from "@/screens/foryou/EditGoalScreen";
import { ForYouGate } from "@/screens/foryou/ForYouGate";
import { ForYouOverview } from "@/screens/foryou/ForYouOverview";
import { GoalDetailsScreen } from "@/screens/foryou/GoalDetailsScreen";
import { GoalsScreen } from "@/screens/foryou/GoalsScreen";
import { NewGoalScreen } from "@/screens/foryou/NewGoalScreen";
import { OpportunitiesScreen } from "@/screens/foryou/OpportunitiesScreen";
import { PlanScreen } from "@/screens/foryou/PlanScreen";
import { ProgressScreen } from "@/screens/foryou/ProgressScreen";
import { ResourceDetailsScreen } from "@/screens/details/ResourceDetailsScreen";
import { AnnouncementDetailsScreen } from "@/screens/details/AnnouncementDetailsScreen";
import { AnnouncementsScreen } from "@/screens/details/AnnouncementsScreen";
import { EventDetailsScreen } from "@/screens/details/EventDetailsScreen";
import { LectureDetailsScreen } from "@/screens/details/LectureDetailsScreen";
import { PlaceDetailsScreen } from "@/screens/details/PlaceDetailsScreen";
import { ServiceDetailsScreen } from "@/screens/details/ServiceDetailsScreen";
import { HomeScreen } from "@/screens/home/HomeScreen";
import { AcademicsSection } from "@/screens/more/academics/AcademicsSection";
import { SyncFlowScreen } from "@/screens/more/academics/SyncFlowScreen";
import { MoreHome, MoreLayout } from "@/screens/more/MoreLayout";
import { ProfileSection } from "@/screens/more/ProfileSection";
import { ReportIssueScreen } from "@/screens/more/ReportIssueScreen";
import { SavedSection } from "@/screens/more/SavedSection";
import { SelfServiceSection } from "@/screens/more/SelfServiceSection";
import { SettingsSection } from "@/screens/more/SettingsSection";
import { SupportSection } from "@/screens/more/SupportSection";
import { NotificationsScreen } from "@/screens/tabs/NotificationsScreen";
import { AppShell } from "@/shell/AppShell";
import { LinkAlias } from "@/shell/LinkAliases";
import { MockStateSwitcher } from "@/shell/MockStateSwitcher";
import { NotificationBanner } from "@/shell/NotificationBanner";
import { RequireSignIn } from "@/session/RequireSignIn";
import { DoneScreen } from "@/screens/setup/DoneScreen";
import { GoalsStep } from "@/screens/setup/GoalsStep";
import { ManualStep } from "@/screens/setup/ManualStep";
import { MethodStep } from "@/screens/setup/MethodStep";
import { RemindersStep } from "@/screens/setup/RemindersStep";
import { ReviewStep } from "@/screens/setup/ReviewStep";
import { SemesterStep } from "@/screens/setup/SemesterStep";
import { SetupLayout } from "@/screens/setup/SetupLayout";
import { SyncAccessStep } from "@/screens/setup/SyncAccessStep";
import { SyncConnectStep } from "@/screens/setup/SyncConnectStep";
import { SyncReviewStep } from "@/screens/setup/SyncReviewStep";
import { TimetableStep } from "@/screens/setup/TimetableStep";

// Leaflet is only downloaded when the map opens.
const MapScreen = lazy(() => import("@/screens/map/MapScreen").then((m) => ({ default: m.MapScreen })));

// Admin (flow 10) is its own area, downloaded only by staff who open it.
const AdminApp = lazy(() => import("@/admin/AdminApp"));

const AdminLoading = () => (
  <div role="status" className="flex min-h-screen items-center justify-center bg-oxford-paper text-sm font-semibold text-oxford-mute">
    Loading Admin…
  </div>
);

/** Student-app overlays (notification banner, dev test panel) stay out of Admin. */
const StudentOverlays = () => {
  const { pathname } = useLocation();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return (
    <>
      <NotificationBanner />
      {import.meta.env.DEV && <MockStateSwitcher />}
    </>
  );
};

const MapLoading = () => (
  <div role="status" className="fixed inset-0 flex items-center justify-center bg-oxford-cream text-sm font-semibold text-oxford-mute">
    Loading the map…
  </div>
);

export const App = () => (
  <MotionConfig reducedMotion="user">
    <Routes>
      <Route path="/" element={<EntryGate />} />
      <Route path="/welcome" element={<WelcomePage />} />

      {/* Flow 01: authentication and identity */}
      <Route path="/start" element={<ChooseEntry />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/login/forgot" element={<ForgotEmail />} />
      <Route path="/login/forgot/code" element={<ForgotCode />} />
      <Route path="/login/forgot/new-password" element={<ForgotNewPassword />} />
      <Route path="/signup" element={<SignupLayout />}>
        <Route index element={<Navigate to="level" replace />} />
        <Route path="level" element={<LevelStep />} />
        <Route path="account" element={<AccountStep />} />
        <Route path="verify-email" element={<EmailCodeStep />} />
        <Route path="eligibility" element={<EligibilityStep />} />
        <Route path="academic" element={<AcademicStep />} />
      </Route>
      <Route path="/verify" element={<VerifyScreen />} />
      <Route path="/academic-profile" element={<AcademicProfileScreen />} />
      <Route path="/limited" element={<LimitedScreen />} />

      {/* Flow 02: semester and course setup. /onboarding resumes at the saved step. */}
      <Route path="/onboarding/done" element={<DoneScreen />} />
      <Route path="/onboarding" element={<SetupLayout />}>
        <Route index element={null} />
        <Route path="semester" element={<SemesterStep />} />
        <Route path="method" element={<MethodStep />} />
        <Route path="sync-access" element={<SyncAccessStep />} />
        <Route path="sync-connect" element={<SyncConnectStep />} />
        <Route path="sync-review" element={<SyncReviewStep />} />
        <Route path="manual" element={<ManualStep />} />
        <Route path="timetable" element={<TimetableStep />} />
        <Route path="review" element={<ReviewStep />} />
        <Route path="reminders" element={<RemindersStep />} />
        <Route path="goals" element={<GoalsStep />} />
      </Route>

      {/* Flow 05: full-screen campus map and walking navigation. */}
      <Route
        path="/map"
        element={
          <Suspense fallback={<MapLoading />}>
            <MapScreen />
          </Suspense>
        }
      />

      <Route element={<AppShell />}>
        <Route path="/home" element={<HomeScreen />} />
        <Route
          path="/lectures/:sessionId"
          element={
            <RequireSignIn>
              <LectureDetailsScreen />
            </RequireSignIn>
          }
        />
        <Route path="/announcements" element={<AnnouncementsScreen />} />
        <Route path="/announcements/:id" element={<AnnouncementDetailsScreen />} />
        <Route path="/services/:id" element={<ServiceDetailsScreen />} />
        <Route path="/events/:id" element={<EventDetailsScreen />} />
        <Route path="/places/:id" element={<PlaceDetailsScreen />} />
        <Route path="/explore" element={<ExploreScreen />} />
        <Route path="/explore/places" element={<PlacesDirectory />} />
        <Route path="/explore/events" element={<EventsDirectory />} />
        <Route path="/explore/services" element={<ServicesDirectory />} />
        <Route path="/search" element={<SearchScreen />} />
        {/* Flow 06: For You (personal; ForYouGate shows the sign-in or verify prompt). */}
        <Route path="/for-you" element={<ForYouGate />}>
          <Route index element={<ForYouOverview />} />
          <Route path="goals" element={<GoalsScreen />} />
          <Route path="goals/new" element={<NewGoalScreen />} />
          <Route path="goals/:id" element={<GoalDetailsScreen />} />
          <Route path="goals/:id/edit" element={<EditGoalScreen />} />
          <Route path="progress" element={<ProgressScreen />} />
          <Route path="plan" element={<PlanScreen />} />
          <Route path="opportunities" element={<OpportunitiesScreen />} />
        </Route>
        <Route path="/resources/:id" element={<ResourceDetailsScreen />} />
        {/* Flows 07 and 08: More, and returning student sync. */}
        <Route path="/more" element={<MoreLayout />}>
          <Route index element={<MoreHome />} />
          <Route path="profile" element={<ProfileSection />} />
          <Route path="academics" element={<AcademicsSection />} />
          <Route path="academics/sync" element={<SyncFlowScreen />} />
          <Route path="self-service" element={<SelfServiceSection />} />
          <Route path="saved" element={<SavedSection />} />
          <Route path="support" element={<SupportSection />} />
          <Route path="support/report" element={<ReportIssueScreen />} />
          <Route path="settings" element={<SettingsSection />} />
        </Route>
        <Route path="/notifications" element={<NotificationsScreen />} />
        <Route path="/profile" element={<Navigate to="/more/profile" replace />} />
      </Route>

      {/* Flow 09: short links that open the matching screen. */}
      <Route path="/lecture/:id" element={<LinkAlias kind="lecture" />} />
      <Route path="/news/:id" element={<LinkAlias kind="news" />} />
      <Route path="/event/:id" element={<LinkAlias kind="event" />} />
      <Route path="/goal/:id" element={<LinkAlias kind="goal" />} />
      <Route path="/deadline/:id" element={<LinkAlias kind="deadline" />} />

      {/* Flow 10: admin content publishing, for staff. */}
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<AdminLoading />}>
            <AdminApp />
          </Suspense>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <StudentOverlays />
  </MotionConfig>
);
