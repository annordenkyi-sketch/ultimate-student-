// Contracts between the UI and the backend. The UI only talks to these
// interfaces; src/services/index.ts decides which implementation is used.

export type VerificationStatus = "unverified" | "pending" | "verified";
export type StudyLevel = "undergraduate" | "postgraduate";
export type EligibilityResult = "verified" | "pending" | "not-verified";

export interface AcademicProfile {
  departmentId: string;
  programmeId: string;
  /** e.g. "Level 200" or "Year 1". */
  level: string;
}

export interface VerificationAttempt {
  /** Student ID or UG email the student entered. */
  identifier: string;
  result: EligibilityResult;
  checkedAt: string;
}

export interface StudentAccount {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  studyLevel: StudyLevel;
  verification: VerificationStatus;
  /** Semester onboarding finished or skipped. */
  setupComplete: boolean;
  /** Courses and timetable saved. False after "Skip for now". */
  coursesSetUp: boolean;
  academic: AcademicProfile | null;
  lastVerification: VerificationAttempt | null;
  /** Fields the student can edit in their profile. Official fields come from the university. */
  preferredName?: string | null;
  phone?: string | null;
  /** Profile photo as a small data URL. */
  photo?: string | null;
}

export type Session =
  | { status: "signedOut" }
  | { status: "signedIn"; account: StudentAccount };

export type ServiceErrorCode =
  | "invalid-credentials"
  | "email-taken"
  | "invalid-code"
  | "expired-code"
  | "invalid-reset"
  | "portal-auth-failed"
  | "sync-failed"
  | "forbidden"
  | "network";

export class ServiceError extends Error {
  constructor(public readonly code: ServiceErrorCode, message = code) {
    super(message);
    this.name = "ServiceError";
  }
}

export const errorCodeOf = (e: unknown): ServiceErrorCode =>
  e instanceof ServiceError ? e.code : "network";

export interface CodeTicket {
  /** Seconds before another code can be requested. */
  resendAfterSeconds: number;
}

export interface SessionService {
  /** Session restored when the app opens. */
  restore(): Session;
  /** Persist the session. `remember: false` keeps it for this browser session only. */
  persist(session: Session, remember?: boolean): void;
  signOut(): void;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  studyLevel: StudyLevel;
}

export interface AuthService {
  /** Email or student ID plus password. Throws "invalid-credentials". */
  logIn(identifier: string, password: string): Promise<StudentAccount>;
  /** Registers the details and emails a 6-digit code. Throws "email-taken". */
  startSignUp(input: SignUpInput): Promise<CodeTicket>;
  resendSignUpCode(email: string): Promise<CodeTicket>;
  /** Creates the account once the email code is confirmed. */
  confirmSignUp(email: string, code: string): Promise<StudentAccount>;
  /** Always succeeds, so it never reveals whether an email has an account. */
  requestPasswordReset(email: string): Promise<CodeTicket>;
  confirmPasswordReset(email: string, code: string): Promise<{ resetToken: string }>;
  setNewPassword(resetToken: string, password: string): Promise<void>;
  /** Signed-in change of password. Throws "invalid-credentials" when the current one is wrong. */
  changePassword(accountId: string, current: string, next: string): Promise<void>;
  /** Ends every other session for this account; this device stays signed in. */
  signOutOtherDevices(accountId: string): Promise<void>;
}

export interface EligibilityService {
  /** Checks a student ID or UG email against university records. */
  check(accountId: string, identifier: string): Promise<StudentAccount>;
}

export type AccountPatch = Partial<
  Pick<StudentAccount, "academic" | "setupComplete" | "coursesSetUp" | "studyLevel" | "preferredName" | "phone" | "photo">
>;

export interface AccountService {
  update(accountId: string, patch: AccountPatch): Promise<StudentAccount>;
}

export interface Department {
  id: string;
  name: string;
}

export interface Programme {
  id: string;
  name: string;
  departmentId: string;
  studyLevel: StudyLevel;
}

export interface AcademicCatalog {
  departments: Department[];
  programmes: Programme[];
  levels: string[];
}

export interface CatalogService {
  forStudyLevel(level: StudyLevel): Promise<AcademicCatalog>;
}

// ── Flow 02: semester and course setup ─────────────────────────────────

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
export type SessionKind = "Lecture" | "Tutorial" | "Practical";

export interface CourseSession {
  id: string;
  kind: SessionKind;
  /** Null when the university hasn't published a time yet. */
  day: Weekday | null;
  /** 24-hour "HH:MM". */
  start: string | null;
  end: string | null;
  venue: string | null;
  /** Campus-map place for the venue. Null when the venue isn't verified on the map. */
  placeId?: string | null;
  /** Lecturer's note for this session. */
  notes?: string | null;
  /** "personal" once the student has entered or changed it. */
  source: "official" | "personal";
}

export interface Course {
  code: string;
  title: string;
  credits: number;
  /** "synced" from the university portal, or "manual" when the student added it. */
  origin?: "synced" | "manual";
  lecturer?: string;
  sessions: CourseSession[];
}

export interface Semester {
  id: string;
  academicYear: string;
  term: "First semester" | "Second semester";
  current: boolean;
  /** "YYYY-MM-DD". Goal deadlines default to the end of the semester. */
  startsOn: string;
  endsOn: string;
}

export type ReminderLead = 10 | 15 | 30 | 60;

export interface ReminderPrefs {
  enabled: boolean;
  minutesBefore: ReminderLead;
  days: Weekday[];
  courseCodes: string[];
}

export type SetupStep =
  | "semester"
  | "method"
  | "sync-access"
  | "sync-connect"
  | "sync-review"
  | "manual"
  | "timetable"
  | "review"
  | "reminders"
  | "goals";

/** Saved after every change so onboarding resumes where the student left. */
export interface SetupProgress {
  step: SetupStep;
  semesterId: string | null;
  method: "sync" | "manual" | null;
  imported: Course[];
  excludedCodes: string[];
  /** Working list of courses, including the student's own schedule edits. */
  courses: Course[];
  acknowledgedClashes: string[];
  reminders: ReminderPrefs | null;
  goal: string | null;
}

export interface SetupResult {
  semesterId: string;
  /** How the courses were set up, so they can be labelled synced or manual. */
  method?: "sync" | "manual" | null;
  /** The official registration from the portal, before any personal edits. */
  imported?: Course[];
  courses: Course[];
  reminders: ReminderPrefs | null;
  goal: string | null;
}

export interface CourseService {
  semesters(): Promise<Semester[]>;
  /** Search the course catalogue by code or title. */
  search(semesterId: string, query: string): Promise<Course[]>;
}

export interface PortalService {
  /** University portal sign-in and consent. Throws "portal-auth-failed". */
  authorize(studentId: string, password: string): Promise<{ token: string }>;
  /** Registered courses and official timetable. Throws "sync-failed". */
  importRegistration(token: string, semesterId: string): Promise<Course[]>;
}

export interface SetupService {
  load(accountId: string): Promise<SetupProgress | null>;
  save(accountId: string, progress: SetupProgress): Promise<void>;
  saveTimetable(accountId: string, semesterId: string, courses: Course[]): Promise<void>;
  /** Completes onboarding. `null` means the student skipped course setup. */
  finish(accountId: string, result: SetupResult | null): Promise<StudentAccount>;
}

// ── Flow 03: home and daily actions ────────────────────────────────────

export interface Timetable {
  semesterId: string;
  courses: Course[];
  /** Overlaps the student chose to keep. */
  acknowledgedClashes?: string[];
}

export interface LectureReminder {
  enabled: boolean;
  minutesBefore: ReminderLead;
}

export interface TimetableService {
  get(accountId: string): Promise<Timetable | null>;
  reminder(accountId: string, sessionId: string): Promise<LectureReminder>;
  setReminder(accountId: string, sessionId: string, reminder: LectureReminder): Promise<void>;
  /** Saves the student's own changes to the current semester's courses. */
  saveCourses(accountId: string, courses: Course[], acknowledgedClashes?: string[]): Promise<Timetable>;
  /** Semester-wide lecture reminder preferences. */
  reminderPrefs(accountId: string): Promise<ReminderPrefs | null>;
  setReminderPrefs(accountId: string, prefs: ReminderPrefs): Promise<void>;
  /** Makes another semester the current one. Each semester's courses are kept. */
  switchSemester(accountId: string, semesterId: string): Promise<Timetable>;
}

export type AnnouncementCategory = "Academic" | "Campus life" | "Finance" | "Services";

export interface Announcement {
  id: string;
  title: string;
  source: string;
  category: AnnouncementCategory;
  publishedAt: string;
  summary: string;
  body: string[];
  /** Optional link or attachment added by staff. */
  link?: string | null;
  attachmentName?: string | null;
}

export type EventCategory = "Careers" | "Tech" | "Sports" | "Wellbeing" | "Culture";

export interface CampusEvent {
  id: string;
  title: string;
  category: EventCategory;
  startsAt: string;
  endsAt: string;
  venue: string;
  placeId: string | null;
  organiser: string;
  description: string[];
  /** "required": students register to attend. "none": just turn up. */
  registration: "required" | "none";
  /** Places available, when registration is required. */
  capacity?: number | null;
}

export type ServiceIcon = "library" | "health" | "ict" | "fees" | "portal";
export type ServiceCategory = "Study and IT" | "Health" | "Money";

/** One block of opening time. Days: 0 = Sunday … 6 = Saturday. Close may be "24:00". */
export interface OpeningPeriod {
  days: number[];
  open: string;
  close: string;
}

export interface UniversityService {
  id: string;
  name: string;
  category: ServiceCategory;
  /** Short label for the quick-action tile. */
  shortName: string;
  icon: ServiceIcon;
  summary: string;
  description: string[];
  hours: { days: string; time: string }[];
  /** For "open now". Null when hours don't apply (e.g. online). */
  periods: OpeningPeriod[] | null;
  phone: string | null;
  email: string | null;
  location: string;
  placeId: string | null;
  website: string | null;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export type PlaceCategory =
  | "Food"
  | "Lecture halls"
  | "Libraries"
  | "Offices"
  | "ATMs"
  | "Health"
  | "Hostels"
  | "Sports";

export interface CampusPlace extends LatLng {
  id: string;
  name: string;
  category: PlaceCategory;
  summary: string;
  description: string[];
  /** Where walking directions end. */
  entrance: LatLng & { label: string };
  hours: { days: string; time: string }[];
  /** For "open now". Null when hours aren't listed. */
  periods: OpeningPeriod[] | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  photoId: string | null;
  /** Photo uploaded by staff (data URL), shown instead of photoId. */
  photoUrl?: string | null;
  /** Further entrances besides the main one. */
  otherEntrances?: (LatLng & { label: string })[];
}

export type Recommendation = {
  kind: "place" | "event" | "service";
  id: string;
  title: string;
  subtitle: string;
  /** Why it's shown, from real data (e.g. "Venue of CSCD 301"). */
  reason: string;
};

export interface ContentService {
  announcements(): Promise<Announcement[]>;
  announcement(id: string): Promise<Announcement | null>;
  events(): Promise<CampusEvent[]>;
  event(id: string): Promise<CampusEvent | null>;
  universityServices(): Promise<UniversityService[]>;
  universityService(id: string): Promise<UniversityService | null>;
  /** Content relevant to the student; general public content for guests (null). */
  recommendations(accountId: string | null): Promise<Recommendation[]>;
}

/** Where a notification leads. Each kind opens its own screen (deep link). */
export type NotificationTarget =
  | { kind: "lecture"; id: string }
  | { kind: "announcement"; id: string }
  | { kind: "event"; id: string }
  /** A deadline opens that day in the weekly plan; `id` is the plan task, if there is one. */
  | { kind: "deadline"; date: string; id: string | null }
  | { kind: "goal"; id: string };

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  /** Settings category, so it respects the student's on/off choice and filters. */
  category: NotificationCategory;
  /** "reminder" for something coming up; "update" for something that changed or is new. */
  type: "reminder" | "update";
  target: NotificationTarget;
}

export type SavedKind = "announcement" | "event" | "place" | "service" | "resource";

export interface SavedItem {
  kind: SavedKind;
  id: string;
  title: string;
  savedAt: string;
}

/** Per-student activity: notifications, what's been read, saved and registered. */
export interface ActivityService {
  /** `userKey` is the account id, or "guest". */
  readNotifications(userKey: string): Promise<string[]>;
  markNotificationsRead(userKey: string, ids: string[]): Promise<void>;
  /** `userKey` is the account id, or "guest". */
  readAnnouncements(userKey: string): Promise<string[]>;
  markAnnouncementRead(userKey: string, id: string): Promise<void>;
  saved(accountId: string): Promise<SavedItem[]>;
  setSaved(accountId: string, item: Omit<SavedItem, "savedAt">, saved: boolean): Promise<SavedItem[]>;
  registrations(accountId: string): Promise<string[]>;
  register(accountId: string, eventId: string): Promise<string[]>;
}

// ── Flows 04 and 05: explore, search and walking navigation ────────────

export type SearchType = "place" | "event" | "service" | "announcement";

export interface SearchQuery {
  text: string;
  type: SearchType | "all";
  category: string | null;
  openNow: boolean;
  date: "any" | "today" | "week";
}

export interface SearchResults {
  places: CampusPlace[];
  events: CampusEvent[];
  services: UniversityService[];
  announcements: Announcement[];
}

export interface SearchService {
  query(q: SearchQuery): Promise<SearchResults>;
  categories(type: SearchType): string[];
}

export interface RouteStep {
  at: LatLng;
  instruction: string;
  /** Metres from the start of the route. */
  distanceFromStart: number;
}

export interface WalkRoute {
  points: LatLng[];
  /** Metres. */
  distance: number;
  minutes: number;
  steps: RouteStep[];
  destination: { placeId: string; name: string; entrance: LatLng & { label: string } };
}

export interface CampusService {
  readonly area: { center: LatLng; radiusM: number };
  places(): Promise<CampusPlace[]>;
  place(id: string): Promise<CampusPlace | null>;
  /** Walking route along verified campus paths. Null when there's no route. */
  route(from: LatLng, placeId: string): Promise<WalkRoute | null>;
  /** Walking minutes from a position. Places with no route are left out. */
  walkingMinutes(from: LatLng, placeIds: string[]): Promise<Record<string, number>>;
  reportIssue(placeId: string, note: string): Promise<void>;
  /** Nearest verified walking path to a point, for staff checking a new entrance. */
  nearestPath(p: LatLng): Promise<{ metres: number; name: string | null }>;
}

export interface GeoFix extends LatLng {
  /** Metres. */
  accuracy: number;
}

export type LocationRequest =
  | { status: "ok"; fix: GeoFix }
  | { status: "denied" }
  | { status: "unavailable" };

export type LocationUpdate = { status: "ok"; fix: GeoFix } | { status: "lost" };

export interface LocationService {
  /** Asks for permission if needed, then reads the current position. */
  request(): Promise<LocationRequest>;
  /** Current position without prompting. Null if permission isn't already granted. */
  peek(): Promise<GeoFix | null>;
  watch(onUpdate: (u: LocationUpdate) => void): () => void;
}

// ── Flow 06: For You ───────────────────────────────────────────────────

export type GoalStatus = "active" | "completed" | "archived";

/**
 * What success looks like: a number to reach, a description tracked in %,
 * or a GPA on the 4.0 scale worked out from the student's course results.
 */
export type GoalTarget =
  | { kind: "number"; value: number; unit: string }
  | { kind: "description"; text: string }
  | { kind: "gpa"; value: number };

export interface GoalStep {
  id: string;
  text: string;
  done: boolean;
}

export interface GoalReminder {
  frequency: "daily" | "weekly";
  /** "HH:MM". */
  time: string;
  /** Weekly only. 0 = Sunday … 6 = Saturday. */
  day: number | null;
}

export interface Goal {
  id: string;
  title: string;
  target: GoalTarget;
  /** "YYYY-MM-DD". */
  deadline: string;
  steps: GoalStep[];
  /** Null when reminders are off. */
  reminder: GoalReminder | null;
  status: GoalStatus;
  /** Latest recorded value: towards target.value, 0–100 % for a description, or the estimated GPA. */
  progress: number;
  createdAt: string;
  completedAt: string | null;
  archivedAt: string | null;
}

export interface GoalInput {
  title: string;
  target: GoalTarget;
  deadline: string;
  steps: { id?: string; text: string; done?: boolean }[];
  reminder: GoalReminder | null;
}

export interface CheckIn {
  id: string;
  goalId: string;
  at: string;
  value: number;
  note: string | null;
}

/** A result the student records for one of their courses (for GPA goals). */
export interface CourseResult {
  id: string;
  courseCode: string;
  assessment: "assignment" | "midsem" | "final";
  /** Score in %, or null when entered as a letter grade. */
  score: number | null;
  /** Letter grade, e.g. "B+", or null when entered as a score. */
  grade: string | null;
  recordedAt: string;
}

export type CourseResultInput = Pick<CourseResult, "courseCode" | "assessment" | "score" | "grade">;

export interface SuggestedGoal {
  id: string;
  title: string;
  target: GoalTarget;
  steps: string[];
}

export interface GoalsService {
  suggestions(): SuggestedGoal[];
  list(accountId: string): Promise<Goal[]>;
  get(accountId: string, goalId: string): Promise<{ goal: Goal; checkIns: CheckIn[] } | null>;
  create(accountId: string, input: GoalInput): Promise<Goal>;
  update(accountId: string, goalId: string, input: GoalInput): Promise<Goal>;
  setStepDone(accountId: string, goalId: string, stepId: string, done: boolean): Promise<Goal>;
  checkIn(accountId: string, goalId: string, entry: { value: number; note: string | null }): Promise<CheckIn>;
  /** Marks it completed and stops its reminders. */
  complete(accountId: string, goalId: string): Promise<Goal>;
  /** Moves it to Archived and stops its reminders. */
  archive(accountId: string, goalId: string): Promise<Goal>;
  /** Archived or completed back to active. Reminders stay off until set again. */
  reopen(accountId: string, goalId: string): Promise<Goal>;
  /** Every check-in across all goals, newest first. */
  history(accountId: string): Promise<CheckIn[]>;
  /** Course results recorded for GPA goals. */
  results(accountId: string): Promise<CourseResult[]>;
  /**
   * Records a course result for a GPA goal, works out the new estimated GPA
   * and saves it as a check-in. A new mid-semester or final result replaces
   * the previous one for that course; assignments add up.
   */
  recordResult(accountId: string, goalId: string, input: CourseResultInput, note: string | null): Promise<{ result: CourseResult; checkIn: CheckIn | null }>;
}

export interface PlanTask {
  id: string;
  title: string;
  /** "YYYY-MM-DD". */
  date: string;
  /** "HH:MM", optional. */
  time: string | null;
  goalId: string | null;
  done: boolean;
}

export type TaskInput = Pick<PlanTask, "title" | "date" | "time" | "goalId">;

export interface PlanService {
  /** Tasks in the week starting on `weekStart` (a Monday, "YYYY-MM-DD"). */
  week(accountId: string, weekStart: string): Promise<PlanTask[]>;
  add(accountId: string, input: TaskInput): Promise<PlanTask>;
  update(accountId: string, taskId: string, patch: Partial<TaskInput> & { done?: boolean }): Promise<PlanTask>;
  remove(accountId: string, taskId: string): Promise<void>;
}

export type ResourceKind = "Internships" | "Workshops" | "Competitions" | "Study resources";

export interface Resource {
  id: string;
  title: string;
  kind: ResourceKind;
  provider: string;
  summary: string;
  description: string[];
  /** "YYYY-MM-DD", when there's a closing date. */
  deadline: string | null;
  location: string | null;
  placeId: string | null;
  email: string | null;
  website: string | null;
}

export interface Opportunity {
  type: "event" | "resource";
  id: string;
  title: string;
  /** Event category or resource kind. */
  kind: string;
  /** When and where, or who provides it. */
  detail: string;
  /** Why it's suggested, e.g. "Matches your goal: Apply for two internships". */
  reason: string;
}

export interface OpportunitiesService {
  /** Events and resources matched to the student's active goals and programme. */
  forStudent(accountId: string): Promise<Opportunity[]>;
  resource(id: string): Promise<Resource | null>;
}

// ── Flow 08: returning student sync ────────────────────────────────────

export interface PortalConnection {
  /** "expired": the portal no longer authorises access, so the student must reconnect. */
  status: "connected" | "expired" | "not-connected";
  connectedAt: string | null;
  /** Last time a sync finished successfully. */
  lastSyncedAt: string | null;
}

export interface SessionSnapshot {
  day: Weekday | null;
  start: string | null;
  end: string | null;
  venue: string | null;
}

export interface SessionChange {
  courseCode: string;
  courseTitle: string;
  sessionId: string;
  kind: SessionKind;
  what: "time" | "venue" | "time and venue";
  from: SessionSnapshot;
  to: SessionSnapshot;
  /** The student set their own time or venue for this session; it's kept. */
  personal: boolean;
}

export interface SyncChanges {
  checkedAt: string;
  added: Course[];
  removed: Course[];
  changed: SessionChange[];
}

export type SyncCheck =
  | { status: "not-authorised"; connection: PortalConnection }
  | { status: "failed"; lastSyncedAt: string | null }
  | { status: "up-to-date"; lastSyncedAt: string }
  | { status: "changes"; changes: SyncChanges };

export interface SyncSummary {
  added: number;
  removed: number;
  venuesChanged: number;
  timesChanged: number;
  /** Changes not applied because the student's own time or venue was kept. */
  keptPersonal: number;
}

export interface SyncService {
  connection(accountId: string): Promise<PortalConnection>;
  /** University portal sign-in. Throws "portal-auth-failed". */
  connect(accountId: string, studentId: string, password: string): Promise<PortalConnection>;
  /** Stops syncing. Courses stay exactly as they are. */
  disconnect(accountId: string): Promise<PortalConnection>;
  /** Fetches the official registration and compares it with the last sync. */
  check(accountId: string): Promise<SyncCheck>;
  /** Changes the student hasn't reviewed yet (declined, or found by an automatic sync). */
  pending(accountId: string): Promise<SyncChanges | null>;
  /** Keeps the changes as "Pending review" without applying them. */
  keepPending(accountId: string, changes: SyncChanges): Promise<void>;
  /**
   * Applies the official changes, keeping the student's own times, venues and
   * manually added courses, and updates lecture reminders to match.
   */
  apply(accountId: string, changes: SyncChanges): Promise<{ timetable: Timetable; summary: SyncSummary }>;
}

// ── Flow 07: support and settings ──────────────────────────────────────

export interface Faq {
  id: string;
  question: string;
  answer: string[];
  topic: string;
}

export type IssueCategory = "Something isn't working" | "Wrong information" | "Map or directions" | "Account and sign-in" | "Other";

export interface IssueReport {
  category: IssueCategory;
  description: string;
  /** Optional screenshot as a data URL. */
  screenshot: string | null;
  email: string;
}

export interface UgPortal {
  id: string;
  name: string;
  description: string;
  url: string;
}

export interface SupportService {
  faqs(): Promise<Faq[]>;
  /** Approved official UG portals for self-service. */
  portals(): Promise<UgPortal[]>;
  report(report: IssueReport): Promise<{ reference: string }>;
}

export type NotificationCategory = "lectures" | "news" | "events" | "deadlines" | "goals";

export interface SettingsService {
  notificationPrefs(accountId: string): Promise<Record<NotificationCategory, boolean>>;
  setNotificationPref(accountId: string, category: NotificationCategory, on: boolean): Promise<void>;
}

// ── Flow 09: notifications ─────────────────────────────────────────────

export type NotificationDraft = Omit<AppNotification, "id" | "createdAt">;

/** What happened when a notification was created. */
export type DeliveryOutcome =
  /** Notifications allowed: shown as an in-app banner, or by the system when the app is in the background. */
  | { status: "shown"; via: "banner" | "system" }
  /** Not shown, but saved to the notification centre. */
  | { status: "centre-only"; reason: "permission" | "quiet-hours" }
  /** Not created at all. */
  | { status: "skipped"; reason: "category-off" | "not-for-guests" | "guest-not-opted-in" | "needs-verification" };

export interface DeliveryEvent {
  userKey: string;
  notification: AppNotification;
  outcome: DeliveryOutcome;
}

export interface QuietHours {
  enabled: boolean;
  /** "HH:MM". Quiet hours can run past midnight, e.g. 22:00 to 07:00. */
  from: string;
  to: string;
}

export interface NotificationService {
  /** The notification centre, newest first. `userKey` is the account id, or "guest". */
  list(userKey: string): Promise<AppNotification[]>;
  dismiss(userKey: string, id: string): Promise<void>;
  /**
   * Creates a notification: checks the student's settings and permission,
   * delivers it if allowed, and stores it in the notification centre.
   */
  deliver(userKey: string, draft: NotificationDraft): Promise<{ notification: AppNotification | null; outcome: DeliveryOutcome }>;
  /** Called for every notification created while the app is open (for in-app banners). */
  subscribe(listener: (e: DeliveryEvent) => void): () => void;
  quietHours(accountId: string): Promise<QuietHours>;
  setQuietHours(accountId: string, q: QuietHours): Promise<void>;
  /** Guests can opt in to public news and event alerts. */
  guestAlerts(): boolean;
  setGuestAlerts(on: boolean): void;
}

// ── Flow 10: admin content publishing ──────────────────────────────────

export type AdminRole = "super-admin" | "editor" | "reviewer";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  /** Null: a staff account with no admin access. */
  role: AdminRole | null;
}

export type ContentType = "news" | "event" | "service" | "place" | "timetable";

/** Who an item is for. */
export type Audience =
  | { kind: "all" }
  | { kind: "levels"; levels: string[] }
  | { kind: "programmes"; programmeIds: string[] };

export interface ContentMeta {
  /** Where the content comes from, e.g. "Registrar's Office". */
  source: string;
  audience: Audience;
  /** Create notifications for students when published. */
  notify: boolean;
  /** Editor's requested go-live, local "YYYY-MM-DDTHH:MM". Empty: as soon as it's approved. */
  publishOn?: string;
  /** Editor's requested expiry, "YYYY-MM-DD" (end of that day). Empty: no expiry. */
  expiresOn?: string;
}

/** Opening hours as entered by staff; the student app derives "open now" from them. */
export interface HoursRow {
  days: "weekdays" | "mon-sat" | "every-day" | "sat" | "sun";
  open: string;
  close: string;
  closed: boolean;
}

export interface NewsPayload {
  title: string;
  summary: string;
  body: string;
  category: AnnouncementCategory;
  link: string;
  attachmentName: string;
}

export interface EventPayload {
  title: string;
  description: string;
  category: EventCategory;
  /** "YYYY-MM-DD" and "HH:MM". */
  date: string;
  start: string;
  end: string;
  placeId: string;
  venue: string;
  organiser: string;
  registration: boolean;
  capacity: string;
}

export interface ServicePayload {
  name: string;
  shortName: string;
  category: ServiceCategory;
  summary: string;
  description: string;
  hours: HoursRow[];
  phone: string;
  email: string;
  placeId: string;
  website: string;
}

export interface PlacePayload {
  name: string;
  category: PlaceCategory;
  summary: string;
  description: string;
  photo: string;
  hours: HoursRow[];
  lat: number | null;
  lng: number | null;
  entrances: (LatLng & { label: string })[];
  /** Staff confirmed the entrance connects to a campus walking path. */
  pathChecked: boolean;
}

export interface TimetableSessionRow {
  id: string;
  kind: SessionKind;
  day: Weekday | "";
  start: string;
  end: string;
  venue: string;
  lecturer: string;
}

export interface TimetablePayload {
  semesterId: string;
  programmeId: string;
  courseCode: string;
  courseTitle: string;
  credits: string;
  sessions: TimetableSessionRow[];
  /** Official schedule source: a document name or link. */
  sourceDocument: string;
  sourceChecked: boolean;
}

export type ContentPayload = NewsPayload | EventPayload | ServicePayload | PlacePayload | TimetablePayload;

export type VersionStatus = "draft" | "in-review" | "returned" | "approved" | "published" | "superseded";

export interface ContentVersion {
  number: number;
  payload: ContentPayload;
  meta: ContentMeta;
  status: VersionStatus;
  createdBy: string;
  createdAt: string;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  /** Reviewer's comment when returned for correction. */
  comment: string | null;
  publishedAt: string | null;
}

export interface ContentItem {
  id: string;
  type: ContentType;
  /** The version students see. Null until first published. */
  live: ContentVersion | null;
  /** A new version being written or reviewed. The live one stays up meanwhile. */
  working: ContentVersion | null;
  /** When an approved working version goes live. Null: not scheduled. */
  publishAt: string | null;
  /** After this, students no longer see it. */
  expiresAt: string | null;
  unpublished: boolean;
  /** Every version, oldest first. */
  versions: ContentVersion[];
  createdBy: string;
  updatedAt: string;
}

export type DisplayStatus = "draft" | "in-review" | "returned" | "approved" | "scheduled" | "published" | "expired" | "unpublished";

export type AuditAction = "create" | "save" | "submit" | "approve" | "return" | "publish" | "schedule" | "unpublish" | "expiry" | "role";

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: AuditAction;
  itemId: string | null;
  itemTitle: string;
  detail: string;
}

export interface AdminService {
  /** Staff email and password. Throws "invalid-credentials". */
  logIn(email: string, password: string): Promise<AdminUser>;
  current(): AdminUser | null;
  logOut(): void;
  users(): Promise<AdminUser[]>;
  setRole(actorId: string, userId: string, role: AdminRole | null): Promise<AdminUser>;

  list(): Promise<ContentItem[]>;
  get(id: string): Promise<ContentItem | null>;
  create(actorId: string, type: ContentType, payload: ContentPayload, meta: ContentMeta): Promise<ContentItem>;
  /** Saves the working version as a draft (starting a new version if the item is published). */
  saveDraft(actorId: string, id: string, payload: ContentPayload, meta: ContentMeta): Promise<ContentItem>;
  submit(actorId: string, id: string): Promise<ContentItem>;
  approve(actorId: string, id: string): Promise<ContentItem>;
  returnForCorrection(actorId: string, id: string, comment: string): Promise<ContentItem>;
  /** `at` null publishes now; otherwise schedules. */
  publish(actorId: string, id: string, at: string | null): Promise<{ item: ContentItem; notified: number }>;
  unpublish(actorId: string, id: string): Promise<ContentItem>;
  setExpiry(actorId: string, id: string, expiresAt: string | null): Promise<ContentItem>;
  discardDraft(actorId: string, id: string): Promise<ContentItem | null>;
  audit(): Promise<AuditEntry[]>;
  /** Lists the editors pick from: programmes, levels, semesters, places, venues. */
  reference(): Promise<AdminReference>;
}

export interface AdminReference {
  programmes: { id: string; name: string }[];
  levels: string[];
  semesters: Semester[];
  places: { id: string; name: string; category: PlaceCategory; lat: number; lng: number }[];
  /** Venue names the timetable knows, and the place each one is in. */
  venues: Record<string, string>;
  campus: { center: LatLng; radiusM: number };
}

export interface ClockService {
  now(): Date;
}

export type AlertPermission = "granted" | "denied" | "default" | "unsupported";

export interface DeviceService {
  notificationPermission(): AlertPermission;
  requestNotificationPermission(): Promise<AlertPermission>;
}
