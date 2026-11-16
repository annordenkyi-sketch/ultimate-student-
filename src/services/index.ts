// Single switch point for backend services. To connect a real backend,
// replace the mock implementations below; the UI imports only `services`
// and the types in ./types.

import { mockAccountService } from "./mock/accountService";
import { mockActivityService } from "./mock/activityService";
import { mockAuthService } from "./mock/authService";
import { mockCampusService } from "./mock/campusService";
import { mockCatalogService } from "./mock/catalogService";
import { mockClockService } from "./mock/clockService";
import { mockContentService } from "./mock/contentService";
import { mockCourseService } from "./mock/courseService";
import { browserDeviceService } from "./mock/deviceService";
import { mockEligibilityService } from "./mock/eligibilityService";
import { mockGoalsService, mockOpportunitiesService, mockPlanService } from "./mock/forYouService";
import { mockLocationService } from "./mock/locationService";
import { mockPortalService } from "./mock/portalService";
import { mockSearchService } from "./mock/searchService";
import { mockSettingsService, mockSupportService } from "./mock/supportService";
import { mockSyncService } from "./mock/syncService";
import { mockSessionService } from "./mock/sessionService";
import { mockSetupService } from "./mock/setupService";
import { mockTimetableService } from "./mock/timetableService";
import type {
  AccountService,
  ActivityService,
  CampusService,
  ClockService,
  GoalsService,
  OpportunitiesService,
  PlanService,
  SettingsService,
  SupportService,
  SyncService,
  LocationService,
  SearchService,
  ContentService,
  TimetableService,
  AuthService,
  CatalogService,
  CourseService,
  DeviceService,
  EligibilityService,
  PortalService,
  SessionService,
  SetupService,
} from "./types";

export const services: {
  session: SessionService;
  auth: AuthService;
  eligibility: EligibilityService;
  accounts: AccountService;
  catalog: CatalogService;
  courses: CourseService;
  portal: PortalService;
  setup: SetupService;
  device: DeviceService;
  timetable: TimetableService;
  content: ContentService;
  activity: ActivityService;
  clock: ClockService;
  campus: CampusService;
  location: LocationService;
  search: SearchService;
  goals: GoalsService;
  plan: PlanService;
  opportunities: OpportunitiesService;
  sync: SyncService;
  support: SupportService;
  settings: SettingsService;
} = {
  session: mockSessionService,
  auth: mockAuthService,
  eligibility: mockEligibilityService,
  accounts: mockAccountService,
  catalog: mockCatalogService,
  courses: mockCourseService,
  portal: mockPortalService,
  setup: mockSetupService,
  device: browserDeviceService,
  timetable: mockTimetableService,
  content: mockContentService,
  activity: mockActivityService,
  clock: mockClockService,
  campus: mockCampusService,
  location: mockLocationService,
  search: mockSearchService,
  goals: mockGoalsService,
  plan: mockPlanService,
  opportunities: mockOpportunitiesService,
  sync: mockSyncService,
  support: mockSupportService,
  settings: mockSettingsService,
};

export { ServiceError, errorCodeOf } from "./types";
export type {
  AcademicCatalog,
  AcademicProfile,
  AlertPermission,
  Announcement,
  AnnouncementCategory,
  AppNotification,
  CampusEvent,
  CampusPlace,
  CheckIn,
  CourseResult,
  Faq,
  IssueCategory,
  IssueReport,
  NotificationCategory,
  PortalConnection,
  SessionChange,
  SessionSnapshot,
  SyncChanges,
  SyncCheck,
  SyncSummary,
  UgPortal,
  CourseResultInput,
  EventCategory,
  Goal,
  GoalInput,
  GoalReminder,
  GoalStatus,
  GoalStep,
  GoalTarget,
  Opportunity,
  PlanTask,
  Resource,
  ResourceKind,
  SuggestedGoal,
  TaskInput,
  GeoFix,
  LatLng,
  LocationRequest,
  LocationUpdate,
  OpeningPeriod,
  PlaceCategory,
  Recommendation,
  RouteStep,
  SearchQuery,
  SearchResults,
  SearchType,
  ServiceCategory,
  WalkRoute,
  LectureReminder,
  NotificationTarget,
  SavedItem,
  SavedKind,
  ServiceIcon,
  Timetable,
  UniversityService,
  CodeTicket,
  Course,
  CourseSession,
  Department,
  EligibilityResult,
  Programme,
  ReminderLead,
  ReminderPrefs,
  Semester,
  ServiceErrorCode,
  Session,
  SetupProgress,
  SetupStep,
  StudentAccount,
  StudyLevel,
  VerificationStatus,
  Weekday,
} from "./types";
