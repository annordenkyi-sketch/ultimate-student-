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

export type NotificationTarget = { kind: "lecture" | "announcement" | "event"; id: string };

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
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
  notifications(accountId: string): Promise<AppNotification[]>;
  readNotifications(accountId: string): Promise<string[]>;
  markNotificationsRead(accountId: string, ids: string[]): Promise<void>;
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

export interface ClockService {
  now(): Date;
}

export type AlertPermission = "granted" | "denied" | "default" | "unsupported";

export interface DeviceService {
  notificationPermission(): AlertPermission;
  requestNotificationPermission(): Promise<AlertPermission>;
}
