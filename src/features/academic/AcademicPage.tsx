import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlarmClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Search,
  User,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Highlight } from "@/lib/highlight";

/* ───────────────────────────── Mock data ───────────────────────────── */

const TODAY = new Date();

type EventType = "deadline" | "exam" | "calendar";

interface CalEvent {
  id: string;
  dateIso: string;
  title: string;
  type: EventType;
}

const CAL_EVENTS: CalEvent[] = [
  { id: "e1", dateIso: "2026-10-25", title: "Tutorial sign-up closes", type: "deadline" },
  { id: "e2", dateIso: "2026-11-03", title: "Mid-semester exams begin", type: "exam" },
  { id: "e3", dateIso: "2026-11-07", title: "Add/Drop deadline", type: "deadline" },
  { id: "e4", dateIso: "2026-11-14", title: "Course registration closes", type: "deadline" },
  { id: "e5", dateIso: "2026-11-24", title: "Reading week", type: "calendar" },
  { id: "e6", dateIso: "2026-11-30", title: "Tuition instalment 2 due", type: "deadline" },
  { id: "e7", dateIso: "2026-12-05", title: "Exam · CPEN 312 Software Engineering", type: "exam" },
  { id: "e8", dateIso: "2026-12-07", title: "Exam · CPEN 403 Database Systems", type: "exam" },
  { id: "e9", dateIso: "2026-12-10", title: "Exam · MATH 300 Discrete Mathematics", type: "exam" },
  { id: "e10", dateIso: "2026-12-14", title: "Exam · ENGL 250 Academic Writing", type: "exam" },
  { id: "e11", dateIso: "2026-12-20", title: "Semester ends", type: "calendar" },
];

interface Course {
  code: string;
  name: string;
  lecturer: string;
  venue: string;
  schedule: string;
}

const COURSES: Course[] = [
  {
    code: "CPEN 312",
    name: "Software Engineering",
    lecturer: "Dr. Ama Boateng",
    venue: "Science Block R401",
    schedule: "Tue & Thu · 10:00",
  },
  {
    code: "CPEN 403",
    name: "Database Systems",
    lecturer: "Prof. Kofi Mensah",
    venue: "ICT Lab 2",
    schedule: "Mon & Wed · 14:00",
  },
  {
    code: "MATH 300",
    name: "Discrete Mathematics",
    lecturer: "Prof. Yaa Addo",
    venue: "Math Block R210",
    schedule: "Mon · 11:00",
  },
  {
    code: "ENGL 250",
    name: "Academic Writing",
    lecturer: "Dr. Nana Owusu",
    venue: "Humanities Hall",
    schedule: "Fri · 09:00",
  },
];

interface Exam {
  course: string;
  dateIso: string;
  duration: string;
  venue: string;
}

const EXAMS: Exam[] = [
  { course: "CPEN 312 · Software Engineering", dateIso: "2026-12-05T09:00", duration: "3 hours", venue: "Science Block Hall" },
  { course: "CPEN 403 · Database Systems", dateIso: "2026-12-07T14:00", duration: "2 hours", venue: "ICT Lab 2" },
  { course: "MATH 300 · Discrete Mathematics", dateIso: "2026-12-10T09:00", duration: "2 hours", venue: "Main Hall" },
  { course: "ENGL 250 · Academic Writing", dateIso: "2026-12-14T14:00", duration: "2 hours", venue: "Great Hall" },
];

interface Step {
  label: string;
  done: boolean;
}

const STEPS: Step[] = [
  { label: "Review your programme requirements", done: true },
  { label: "Choose your major and electives", done: true },
  { label: "Submit for departmental approval", done: false },
  { label: "Pay the Semester 1 fees", done: false },
  { label: "Print your course sheet", done: false },
];

interface Contact {
  department: string;
  office: string;
  phone: string;
  email: string;
}

const CONTACTS: Contact[] = [
  {
    department: "Department of Computer Science",
    office: "Science Block R410",
    phone: "+233 30 221 4000",
    email: "cs@uni.edu.gh",
  },
  {
    department: "Department of Mathematics",
    office: "Math Block R200",
    phone: "+233 30 221 4120",
    email: "math@uni.edu.gh",
  },
  {
    department: "Office of the Registrar",
    office: "Admin Block, 2nd Floor",
    phone: "+233 30 221 3850",
    email: "registrar@uni.edu.gh",
  },
];

/* ───────────────────────────── Helpers ───────────────────────────── */

const daysUntil = (iso: string): number => {
  const d = new Date(iso);
  return Math.ceil((d.getTime() - TODAY.getTime()) / (24 * 60 * 60 * 1000));
};

const formatFullDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

const toIsoDate = (year: number, month: number, day: number): string => {
  const yyyy = String(year).padStart(4, "0");
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/* ───────────────────────────── Collapsible section ───────────────────────────── */

interface CollapsibleProps {
  id: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const Collapsible = ({
  id,
  title,
  defaultOpen = true,
  children,
}: CollapsibleProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  const contentId = `${id}-content`;

  return (
    <section aria-labelledby={`${id}-title`}>
      <div className="flex items-center justify-between">
        <h2
          id={`${id}-title`}
          className="text-base font-semibold text-ink"
        >
          {title}
        </h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={contentId}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-paper hover:text-ink lg:hidden"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              open ? "" : "-rotate-90"
            }`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Desktop: always visible */}
      <div id={contentId} className="mt-3 hidden lg:block">
        {children}
      </div>

      {/* Mobile: collapsible with height animation */}
      <div className="lg:hidden">
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="content"
              initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

/* ───────────────────────────── Coming up ───────────────────────────── */

const ComingUp = () => {
  const items = useMemo(
    () =>
      [...CAL_EVENTS]
        .filter((e) => daysUntil(e.dateIso) >= 0)
        .sort(
          (a, b) =>
            new Date(a.dateIso).getTime() - new Date(b.dateIso).getTime(),
        )
        .slice(0, 3),
    [],
  );

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="coming-up-title">
      <h2
        id="coming-up-title"
        className="mb-3 text-sm font-semibold text-muted"
      >
        Coming up
      </h2>
      <ul className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 sm:gap-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:px-0">
        {items.map((item) => {
          const d = daysUntil(item.dateIso);
          const urgent = d <= 7;
          return (
            <li
              key={item.id}
              className="min-w-[220px] shrink-0 snap-start rounded-xl border border-line bg-white p-4 shadow-sm lg:min-w-0"
            >
              <div className="flex items-start justify-between gap-2">
                <AlarmClock
                  className={`h-4 w-4 shrink-0 ${
                    urgent ? "text-rose-600" : "text-muted"
                  }`}
                  aria-hidden="true"
                />
                {urgent ? (
                  <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-700">
                    Due soon
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-muted">
                    {formatFullDate(item.dateIso)}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-semibold text-ink">
                {item.title}
              </p>
              <p className="mt-1 text-xs text-muted">
                {d === 0
                  ? "Today"
                  : d === 1
                    ? "1 day left"
                    : `${d} days left`}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

/* ───────────────────────────── Calendar ───────────────────────────── */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Calendar = () => {
  // Default to the first month that has events (or today's month).
  const defaultMonth = useMemo(() => {
    const next = CAL_EVENTS.map((e) => new Date(e.dateIso))
      .filter((d) => d >= TODAY)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    const d = next ?? TODAY;
    return { year: d.getFullYear(), month: d.getMonth() };
  }, []);

  const [view, setView] = useState(defaultMonth);
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  const cells = useMemo(() => {
    const firstDay = new Date(view.year, view.month, 1).getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const prevMonthLastDay = new Date(view.year, view.month, 0).getDate();
    const arr: Array<{ date: number; current: boolean; iso: string }> = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonthIndex = view.month === 0 ? 11 : view.month - 1;
      const prevYear = view.month === 0 ? view.year - 1 : view.year;
      arr.push({ date: d, current: false, iso: toIsoDate(prevYear, prevMonthIndex, d) });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push({ date: d, current: true, iso: toIsoDate(view.year, view.month, d) });
    }
    let d = 1;
    while (arr.length < 42) {
      const nextMonthIndex = view.month === 11 ? 0 : view.month + 1;
      const nextYear = view.month === 11 ? view.year + 1 : view.year;
      arr.push({ date: d, current: false, iso: toIsoDate(nextYear, nextMonthIndex, d) });
      d++;
    }
    return arr;
  }, [view]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of CAL_EVENTS) {
      const key = e.dateIso.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, []);

  const dayEvents = selectedIso ? (eventsByDate.get(selectedIso) ?? []) : [];
  const monthName = new Date(view.year, view.month, 1).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" },
  );
  const todayIso = toIsoDate(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());

  const shift = (delta: number) => {
    setView((v) => {
      const next = new Date(v.year, v.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
    setSelectedIso(null);
  };

  const dotTint = (events: CalEvent[]): string => {
    if (events.some((e) => e.type === "deadline")) return "bg-rose-500";
    if (events.some((e) => e.type === "exam")) return "bg-brand-600";
    return "bg-emerald-500";
  };

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">{monthName}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-paper hover:text-ink"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Next month"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-paper hover:text-ink"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Weekday row */}
      <div className="grid grid-cols-7 text-center text-[11px] font-medium uppercase tracking-wider text-muted">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1.5">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const events = eventsByDate.get(cell.iso) ?? [];
          const isSelected = selectedIso === cell.iso;
          const isToday = cell.iso === todayIso;
          return (
            <button
              key={cell.iso + (cell.current ? "" : "-o")}
              type="button"
              onClick={() => {
                if (events.length === 0) return;
                setSelectedIso(isSelected ? null : cell.iso);
              }}
              aria-label={formatFullDate(cell.iso)}
              aria-pressed={isSelected}
              className={`relative flex aspect-square items-center justify-center rounded-md text-sm transition ${
                !cell.current
                  ? "text-muted"
                  : isSelected
                    ? "bg-brand-50 text-brand-800"
                    : isToday
                      ? "font-semibold text-brand-700"
                      : "text-ink hover:bg-paper"
              } ${events.length === 0 ? "cursor-default" : "cursor-pointer"}`}
            >
              {cell.date}
              {events.length > 0 && cell.current && (
                <span
                  aria-hidden="true"
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${dotTint(events)}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Day events */}
      <div className="mt-3 border-t border-line/60 pt-3">
        {selectedIso === null ? (
          <p className="text-xs text-muted">
            Click a highlighted date to see what's on.
          </p>
        ) : dayEvents.length === 0 ? (
          <p className="text-xs text-muted">Nothing on this day.</p>
        ) : (
          <>
            <p className="text-xs font-medium text-muted">
              {formatFullDate(selectedIso)}
            </p>
            <ul className="mt-2 space-y-1.5">
              {dayEvents.map((e) => (
                <li
                  key={e.id}
                  className="flex items-start gap-2 text-sm text-ink"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      e.type === "deadline"
                        ? "bg-rose-500"
                        : e.type === "exam"
                          ? "bg-brand-600"
                          : "bg-emerald-500"
                    }`}
                  />
                  {e.title}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

/* ───────────────────────────── Courses ───────────────────────────── */

const CoursesList = () => (
  <ul className="divide-y divide-line/60 overflow-hidden rounded-xl border border-line bg-white">
    {COURSES.map((c) => (
      <li key={c.code} className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-ink">
            <span className="mr-1 inline-block rounded bg-paper px-1.5 py-0.5 font-mono text-xs text-ink">
              {c.code}
            </span>
            {c.name}
          </p>
          <p className="shrink-0 text-xs text-muted">{c.schedule}</p>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" aria-hidden="true" />
            {c.lecturer}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {c.venue}
          </span>
        </p>
      </li>
    ))}
  </ul>
);

/* ───────────────────────────── Registration ───────────────────────────── */

const RegistrationGuide = () => {
  const nextIndex = STEPS.findIndex((s) => !s.done);
  return (
    <ol className="rounded-xl border border-line bg-white">
      {STEPS.map((step, i) => {
        const isNext = i === nextIndex;
        return (
          <li
            key={step.label}
            className={`flex items-start gap-3 px-4 py-3 ${
              i < STEPS.length - 1 ? "border-b border-line/60" : ""
            }`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                step.done
                  ? "bg-emerald-100 text-emerald-700"
                  : isNext
                    ? "bg-brand-600 text-white"
                    : "bg-paper text-muted"
              }`}
            >
              {step.done ? "✓" : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm ${
                  step.done
                    ? "text-muted line-through"
                    : "text-ink"
                }`}
              >
                {step.label}
              </p>
            </div>
            {isNext && (
              <button
                type="button"
                className="text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline"
              >
                Start
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
};

/* ───────────────────────────── Exams ───────────────────────────── */

const ExamList = () => (
  <ul className="divide-y divide-line/60 overflow-hidden rounded-xl border border-line bg-white">
    {EXAMS.map((e) => (
      <li key={e.course} className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-ink">{e.course}</p>
          <p className="shrink-0 text-xs font-medium text-ink">
            {new Date(e.dateIso).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {formatTime(e.dateIso)} · {e.duration}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {e.venue}
          </span>
        </p>
      </li>
    ))}
  </ul>
);

/* ───────────────────────────── Contacts ───────────────────────────── */

const Contacts = () => (
  <ul className="space-y-2">
    {CONTACTS.map((c) => (
      <li
        key={c.department}
        className="rounded-xl border border-line bg-white p-4"
      >
        <p className="text-sm font-semibold text-ink">{c.department}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          {c.office}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`tel:${c.phone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-paper"
          >
            <Phone className="h-3 w-3" aria-hidden="true" />
            Call
          </a>
          <a
            href={`mailto:${c.email}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-paper"
          >
            <Mail className="h-3 w-3" aria-hidden="true" />
            Email
          </a>
        </div>
      </li>
    ))}
  </ul>
);

/* ───────────────────────────── Search ───────────────────────────── */

interface Hit {
  type: "Deadline" | "Exam" | "Course" | "Step" | "Contact";
  key: string;
  title: string;
  detail?: string;
}

const runSearch = (q: string): Hit[] => {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const hits: Hit[] = [];
  for (const e of CAL_EVENTS) {
    if (
      e.title.toLowerCase().includes(needle) ||
      e.type.includes(needle as EventType)
    ) {
      hits.push({
        type: e.type === "exam" ? "Exam" : "Deadline",
        key: `cal-${e.id}`,
        title: e.title,
        detail: formatFullDate(e.dateIso),
      });
    }
  }
  for (const c of COURSES) {
    const hay = `${c.code} ${c.name} ${c.lecturer} ${c.venue}`.toLowerCase();
    if (hay.includes(needle)) {
      hits.push({
        type: "Course",
        key: `course-${c.code}`,
        title: `${c.code} · ${c.name}`,
        detail: `${c.lecturer} · ${c.venue}`,
      });
    }
  }
  for (const x of EXAMS) {
    const hay = `${x.course} ${x.venue}`.toLowerCase();
    if (hay.includes(needle)) {
      hits.push({
        type: "Exam",
        key: `exam-${x.course}`,
        title: x.course,
        detail: `${formatFullDate(x.dateIso)} · ${formatTime(x.dateIso)} · ${x.venue}`,
      });
    }
  }
  for (const s of STEPS) {
    if (s.label.toLowerCase().includes(needle)) {
      hits.push({
        type: "Step",
        key: `step-${s.label}`,
        title: s.label,
        detail: s.done ? "Completed" : "Up next in registration",
      });
    }
  }
  for (const c of CONTACTS) {
    const hay = `${c.department} ${c.office} ${c.email} ${c.phone}`.toLowerCase();
    if (hay.includes(needle)) {
      hits.push({
        type: "Contact",
        key: `contact-${c.department}`,
        title: c.department,
        detail: `${c.office} · ${c.email}`,
      });
    }
  }
  return hits;
};

const typeTint: Record<Hit["type"], string> = {
  Deadline: "bg-rose-100 text-rose-700",
  Exam: "bg-brand-100 text-brand-700",
  Course: "bg-paper text-ink",
  Step: "bg-accent-100 text-accent-700",
  Contact: "bg-emerald-100 text-emerald-700",
};

const SearchResults = ({ query }: { query: string }) => {
  const hits = useMemo(() => runSearch(query), [query]);

  if (hits.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-white p-5 text-sm text-muted">
        <p>
          No results for{" "}
          <strong className="text-ink">"{query}"</strong> in Academic.
        </p>
        <Link
          to={`/search?q=${encodeURIComponent(query)}`}
          className="mt-2 inline-block text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline"
        >
          Search all of Ultimate Student →
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line/60 overflow-hidden rounded-xl border border-line bg-white">
      {hits.map((h) => (
        <li key={h.key} className="flex items-start gap-3 p-3">
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeTint[h.type]}`}
          >
            {h.type}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">
              <Highlight text={h.title} query={query} />
            </p>
            {h.detail && (
              <p className="text-xs text-muted">
                <Highlight text={h.detail} query={query} />
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

/* ───────────────────────────── Page ───────────────────────────── */

const FadeInSection = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

export const AcademicPage = () => {
  const [query, setQuery] = useState("");
  const isSearching = query.trim().length > 0;

  return (
    <div className="pb-4">
      {/* Header */}
      <header className="mb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted">
          <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
          Academic
        </div>
        <h1 className="mt-1 text-2xl font-bold text-ink">Academic</h1>
        <p className="mt-1 text-sm text-muted">
          Your deadlines, courses, registration and exams.
        </p>
      </header>

      {/* Search */}
      <div className="mb-6">
        <label htmlFor="academic-search" className="sr-only">
          Search Academic
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            id="academic-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search deadlines, courses, exams…"
            className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-brand-500"
          />
        </div>
      </div>

      {isSearching ? (
        <SearchResults query={query} />
      ) : (
        <>
          {/* Coming up */}
          <FadeInSection>
            <ComingUp />
          </FadeInSection>

          {/* Main grid */}
          <div className="mt-8 space-y-6 lg:grid lg:grid-cols-[1.6fr_1fr] lg:gap-6 lg:space-y-0">
            <div className="space-y-6">
              <FadeInSection delay={0.05}>
                <Collapsible id="calendar" title="Academic calendar" defaultOpen>
                  <Calendar />
                </Collapsible>
              </FadeInSection>

              <FadeInSection delay={0.1}>
                <Collapsible id="courses" title="My courses" defaultOpen>
                  <CoursesList />
                </Collapsible>
              </FadeInSection>
            </div>

            <div className="space-y-6">
              <FadeInSection delay={0.1}>
                <Collapsible id="registration" title="Registration guide" defaultOpen={false}>
                  <RegistrationGuide />
                </Collapsible>
              </FadeInSection>

              <FadeInSection delay={0.15}>
                <Collapsible id="exams" title="Exam timetable" defaultOpen={false}>
                  <ExamList />
                </Collapsible>
              </FadeInSection>

              <FadeInSection delay={0.2}>
                <Collapsible id="contacts" title="Department contacts" defaultOpen={false}>
                  <Contacts />
                </Collapsible>
              </FadeInSection>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
