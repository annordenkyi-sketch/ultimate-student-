import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CalendarClock, CalendarPlus, CheckCircle2, Users } from "lucide-react";
import { services, type CampusEvent } from "@/services";
import { longDate, time24 } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { useWalkTimes } from "@/lib/useWalkTimes";
import { useActivity } from "@/session/ActivityProvider";
import { useSession } from "@/session/SessionProvider";
import { actionButtonClass } from "@/ui/ContentActions";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { DetailRow } from "@/ui/DetailRow";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { ContentDetail, DetailSection, LocationSection, Paragraphs } from "./ContentDetail";
import { NotFound } from "./DetailHeader";

const BACK = { to: "/explore/events", label: "Events" };

const icsDate = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");

/** Downloads an .ics file that any calendar app can import. */
const downloadCalendarFile = (e: CampusEvent) => {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ultimate Student//EN",
    "BEGIN:VEVENT",
    `UID:${e.id}@ultimate-student`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(e.startsAt)}`,
    `DTEND:${icsDate(e.endsAt)}`,
    `SUMMARY:${icsText(e.title)}`,
    `LOCATION:${icsText(e.venue)}`,
    `DESCRIPTION:${icsText(e.description.join("\n"))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${e.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
};

/** Flows 03 and 04 "Event details": directions, save, share, add to calendar, register. */
export const EventDetailsScreen = () => {
  const { id = "" } = useParams();
  const { account } = useSession();
  const { isRegistered, register } = useActivity();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, reload } = useAsync(() => services.content.event(id), [id]);
  const placeId = state.status === "ready" ? (state.data?.placeId ?? null) : null;
  const walk = useWalkTimes(placeId ? [placeId] : []);
  const [registering, setRegistering] = useState(false);
  const [registerFailed, setRegisterFailed] = useState(false);
  const [calendarNote, setCalendarNote] = useState<string | null>(null);

  if (state.status === "loading") return <Skeleton lines={5} />;
  if (state.status === "error") return <LoadError what="this event" onRetry={reload} />;
  if (!state.data) return <NotFound what="Event" back={BACK} />;

  const e = state.data;
  const start = new Date(e.startsAt);
  const registered = isRegistered(e.id);

  const onRegister = async () => {
    if (!account) {
      navigate(`/start?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    setRegistering(true);
    setRegisterFailed(false);
    try {
      await register(e.id);
    } catch {
      setRegisterFailed(true);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <ContentDetail
      back={BACK}
      eyebrow={`Event · ${e.category}`}
      title={e.title}
      save={{ kind: "event", id: e.id }}
      directionsTo={e.placeId}
      actions={
        <span className="inline-flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              downloadCalendarFile(e);
              setCalendarNote("Calendar file downloaded. Open it to add the event.");
            }}
            className={actionButtonClass}
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            Add to calendar
          </button>
          <span role="status" className="text-sm font-semibold text-oxford-success">
            {calendarNote}
          </span>
        </span>
      }
    >
      <DetailSection id="when" title="When and who" icon={CalendarClock} wide>
        <dl className="-my-2 divide-y divide-oxford-rule/70">
          <DetailRow icon={CalendarClock} label="Date and time">
            {longDate(start)}, {time24(start)}–{time24(new Date(e.endsAt))}
          </DetailRow>
          <DetailRow icon={Users} label="Organiser">
            {e.organiser}
          </DetailRow>
        </dl>
      </DetailSection>

      <DetailSection id="about-event" title="About this event" wide={false}>
        <Paragraphs items={e.description} />
      </DetailSection>

      <LocationSection label={e.venue} onMap={Boolean(e.placeId)} walkMinutes={e.placeId ? walk?.[e.placeId] : null} />

      <DetailSection id="register-title" title="Attending" wide>
        {e.registration === "none" ? (
          <p className="text-sm text-oxford-mute">No registration needed. Just turn up.</p>
        ) : registered ? (
          <p role="status" className="flex items-center gap-2 font-semibold text-oxford-success">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            You're registered
          </p>
        ) : (
          <>
            <p className="text-sm text-oxford-mute">
              Registration is required to attend.{e.capacity ? ` ${e.capacity} places.` : ""}
            </p>
            {registerFailed && (
              <p role="alert" className="mt-2 text-sm font-semibold text-oxford-danger">
                Registration didn't go through. Try again.
              </p>
            )}
            <LoadingButton type="button" onClick={onRegister} loading={registering} loadingLabel="Registering…" className="mt-4 sm:w-auto">
              {account ? "Register" : "Sign in to register"}
            </LoadingButton>
          </>
        )}
      </DetailSection>
    </ContentDetail>
  );
};
