import type { ReactNode } from "react";
import { CalendarClock, Clock, ExternalLink, Footprints, Mail, MapPin, Paperclip, Phone, Users } from "lucide-react";
import type { AdminReference, ContentMeta, ContentPayload, ContentType, EventPayload, NewsPayload, PlacePayload, ServicePayload, TimetablePayload } from "@/services";
import { audienceLabel, toAnnouncement, toCourse, toEvent, toPlace, toService } from "@/lib/cms";
import { longDate, time24 } from "@/lib/dates";

// What students will see (flow 10 "live student preview"), built with the
// same mappings the student app uses when the item is published.

const DAY_NAME = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday" } as const;

const Missing = ({ children }: { children: ReactNode }) => <span className="italic text-oxford-mute">{children}</span>;

const Section = ({ title, icon: Icon, children }: { title: string; icon?: typeof Clock; children: ReactNode }) => (
  <section className="rounded-2xl border border-oxford-rule bg-white/80 p-4">
    <h3 className="flex items-center gap-2 font-sans text-sm font-semibold text-oxford-ink">
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {title}
    </h3>
    <div className="mt-2 text-sm text-oxford-ink2">{children}</div>
  </section>
);

const Header = ({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) => (
  <header>
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-oxford-mute">{eyebrow}</p>
    <h2 className="mt-1 font-serif text-2xl font-medium leading-tight text-oxford-ink">{title || <Missing>Title</Missing>}</h2>
    {children && <div className="mt-1.5 text-sm text-oxford-mute">{children}</div>}
  </header>
);

const Paras = ({ items, empty }: { items: string[]; empty: string }) =>
  items.length ? (
    <div className="space-y-2 leading-relaxed">
      {items.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  ) : (
    <Missing>{empty}</Missing>
  );

const Hours = ({ hours }: { hours: { days: string; time: string }[] }) => (
  <dl className="space-y-1">
    {hours.map((h) => (
      <div key={h.days} className="flex justify-between gap-3">
        <dt className="text-oxford-mute">{h.days}</dt>
        <dd className="text-right font-semibold text-oxford-ink">{h.time}</dd>
      </div>
    ))}
  </dl>
);

const Pill = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 rounded-md border border-oxford-ink/20 bg-white px-3 py-1.5 text-xs font-semibold text-oxford-ink">{children}</span>
);

const publishDate = (meta: ContentMeta) => (meta.publishOn ? new Date(meta.publishOn) : new Date());

const body = (type: ContentType, p: ContentPayload, meta: ContentMeta, ref: AdminReference) => {
  const placeName = (id: string) => ref.places.find((x) => x.id === id)?.name ?? null;

  if (type === "news") {
    const a = toAnnouncement("preview", p as NewsPayload, meta, publishDate(meta).toISOString());
    return (
      <>
        <div className="rounded-xl border border-oxford-rule bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-oxford-mute">In the news list</p>
          <p className="mt-1 font-semibold text-oxford-ink">{a.title || <Missing>Title</Missing>}</p>
          <p className="text-sm text-oxford-mute">{a.summary || <Missing>Short summary</Missing>}</p>
        </div>
        <Header eyebrow={a.category} title={a.title}>
          {a.source || <Missing>Source</Missing>} · {longDate(new Date(a.publishedAt))}
        </Header>
        <div className="space-y-3 rounded-2xl border border-oxford-rule bg-white/80 p-4 text-sm leading-relaxed text-oxford-ink2">
          <Paras items={a.body} empty="Body text" />
          {(a.link || a.attachmentName) && (
            <div className="flex flex-wrap gap-2 border-t border-oxford-rule/70 pt-3">
              {a.link && (
                <Pill>
                  More information <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </Pill>
              )}
              {a.attachmentName && (
                <Pill>
                  <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                  {a.attachmentName}
                </Pill>
              )}
            </div>
          )}
        </div>
      </>
    );
  }

  if (type === "event") {
    const raw = p as EventPayload;
    const e = toEvent("preview", raw, placeName);
    const timed = raw.date && raw.start && raw.end;
    return (
      <>
        <Header eyebrow={`Event · ${e.category}`} title={e.title} />
        <Section title="When and who" icon={CalendarClock}>
          <p>{timed ? `${longDate(new Date(e.startsAt))}, ${time24(new Date(e.startsAt))}–${time24(new Date(e.endsAt))}` : <Missing>Date and time</Missing>}</p>
          <p className="mt-1 flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden="true" />
            {e.organiser || <Missing>Organiser</Missing>}
          </p>
        </Section>
        <Section title="About this event">
          <Paras items={e.description} empty="Description" />
        </Section>
        <Section title="Location" icon={MapPin}>
          <p className="font-semibold text-oxford-ink">{e.venue || <Missing>Venue</Missing>}</p>
          {e.placeId ? (
            <p className="mt-1 flex items-center gap-1.5">
              <Footprints className="h-4 w-4" aria-hidden="true" />
              Directions available
            </p>
          ) : (
            <p className="mt-1 text-oxford-mute">Location not confirmed on the campus map yet.</p>
          )}
        </Section>
        <Section title="Attending">
          {e.registration === "none" ? "No registration needed. Just turn up." : `Registration is required to attend.${e.capacity ? ` ${e.capacity} places.` : ""}`}
        </Section>
      </>
    );
  }

  if (type === "service") {
    const s = toService("preview", p as ServicePayload, placeName);
    return (
      <>
        <Header eyebrow={s.category} title={s.name}>
          {s.summary || <Missing>Short summary</Missing>}
        </Header>
        <Section title="What it does">
          <Paras items={s.description} empty="Description" />
        </Section>
        <Section title="Opening hours" icon={Clock}>
          <Hours hours={s.hours} />
        </Section>
        <Section title="Contact">
          {s.phone || s.email ? (
            <div className="flex flex-wrap gap-2">
              {s.phone && (
                <Pill>
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  Call {s.phone}
                </Pill>
              )}
              {s.email && (
                <Pill>
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  Email
                </Pill>
              )}
            </div>
          ) : (
            <Missing>Phone or email</Missing>
          )}
        </Section>
        <Section title="Location" icon={MapPin}>
          <p className="font-semibold text-oxford-ink">{s.location}</p>
          {s.website && (
            <p className="mt-2">
              <Pill>
                Official website <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Pill>
            </p>
          )}
        </Section>
      </>
    );
  }

  if (type === "place") {
    const raw = p as PlacePayload;
    const pl = toPlace("preview", raw);
    return (
      <>
        {pl.photoUrl && <img src={pl.photoUrl} alt="" className="aspect-[16/8] w-full rounded-2xl border border-oxford-rule object-cover" />}
        <Header eyebrow={pl.category} title={pl.name}>
          {pl.summary || <Missing>Short summary</Missing>}
        </Header>
        {pl.description.length > 0 && (
          <Section title="About">
            <Paras items={pl.description} empty="" />
          </Section>
        )}
        {pl.hours.length > 0 && (
          <Section title="Opening hours" icon={Clock}>
            <Hours hours={pl.hours} />
          </Section>
        )}
        <Section title="Getting there" icon={Footprints}>
          {raw.lat === null ? (
            <Missing>Not on the map yet</Missing>
          ) : raw.pathChecked && raw.entrances.length ? (
            <p>Walking directions to the {raw.entrances[0]!.label.toLowerCase()}.</p>
          ) : (
            <p className="text-oxford-mute">Shown on the map. Walking directions appear once the path is checked.</p>
          )}
        </Section>
      </>
    );
  }

  const t = p as TimetablePayload;
  const c = toCourse(t, (venue) => ref.venues[venue] ?? null);
  const semester = ref.semesters.find((s) => s.id === t.semesterId);
  const order = (d: string | null) => (d ? Object.keys(DAY_NAME).indexOf(d) : 99);
  const sessions = [...c.sessions].sort((a, b) => order(a.day) - order(b.day) || (a.start ?? "").localeCompare(b.start ?? ""));
  return (
    <>
      <Header eyebrow={semester ? `${semester.term}, ${semester.academicYear}` : "Semester"} title={[c.code, c.title].filter(Boolean).join(" · ")}>
        {c.credits ? `${c.credits} credits` : <Missing>Credits</Missing>}
        {c.lecturer ? ` · ${c.lecturer}` : ""}
      </Header>
      <Section title="Weekly sessions" icon={CalendarClock}>
        {sessions.length ? (
          <ul className="divide-y divide-oxford-rule/70">
            {sessions.map((s) => (
              <li key={s.id} className="py-1.5">
                <span className="font-semibold text-oxford-ink">
                  {s.day ? DAY_NAME[s.day] : <Missing>Day</Missing>} {s.start && s.end ? `${s.start}–${s.end}` : ""}
                </span>
                <span className="block text-xs text-oxford-mute">
                  {s.kind}
                  {s.venue ? ` · ${s.venue}` : ""}
                  {s.venue && !s.placeId ? " (not on the map)" : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Missing>No sessions yet</Missing>
        )}
      </Section>
      <p className="text-xs text-oxford-mute">Students taking this course see these sessions in their timetable and lecture reminders, marked as official.</p>
    </>
  );
};

/** A phone-sized frame showing the item as students will see it. */
export const StudentPreview = ({ type, payload, meta, reference, label = "Student preview" }: { type: ContentType; payload: ContentPayload; meta: ContentMeta; reference: AdminReference; label?: string }) => (
  <section aria-label={label} className="mx-auto w-full max-w-[400px]">
    <div className="mb-2 flex items-center justify-between gap-2">
      <h2 className="font-sans text-sm font-semibold">{label}</h2>
      <span className="truncate text-xs text-oxford-mute">For: {audienceLabel(meta.audience, (id) => reference.programmes.find((p) => p.id === id)?.name ?? id)}</span>
    </div>
    <div className="overflow-hidden rounded-[26px] border-[6px] border-oxford-ink bg-oxford-cream shadow-sm">
      <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4">{body(type, payload, meta, reference)}</div>
    </div>
  </section>
);
