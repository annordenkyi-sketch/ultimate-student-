import { useParams } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { services } from "@/services";
import { useNow } from "@/lib/dates";
import { daysBetween, longDay, toISODate } from "@/lib/days";
import { useAsync } from "@/lib/useAsync";
import { useWalkTimes } from "@/lib/useWalkTimes";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { ContactSection, ContentDetail, DetailSection, LocationSection, Paragraphs } from "./ContentDetail";
import { NotFound } from "./DetailHeader";

const BACK = { to: "/for-you/opportunities", label: "Opportunities" };

/** Flow 06 resource details (internships, workshops, competitions, study resources) on the shared layout. */
export const ResourceDetailsScreen = () => {
  const { id = "" } = useParams();
  const now = useNow();
  const { state, reload } = useAsync(() => services.opportunities.resource(id), [id]);
  const placeId = state.status === "ready" ? (state.data?.placeId ?? null) : null;
  const walk = useWalkTimes(placeId ? [placeId] : []);

  if (state.status === "loading") return <Skeleton lines={5} />;
  if (state.status === "error") return <LoadError what="this resource" onRetry={reload} />;
  if (!state.data) return <NotFound what="Resource" back={BACK} />;

  const r = state.data;
  const left = r.deadline ? daysBetween(toISODate(now), r.deadline) : null;

  return (
    <ContentDetail
      back={BACK}
      eyebrow={r.kind}
      title={r.title}
      intro={r.summary}
      status={
        r.deadline ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-oxford-ink">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            Closes {longDay(r.deadline)}
            {left !== null && left >= 0 && <span className="font-normal text-oxford-mute">· {left === 0 ? "today" : `${left} days left`}</span>}
          </span>
        ) : undefined
      }
      save={{ kind: "resource", id: r.id }}
      directionsTo={r.placeId}
      website={r.website}
    >
      <DetailSection id="about-resource" title="About" wide>
        <Paragraphs items={r.description} />
        <p className="mt-3 text-sm text-oxford-mute">Provided by {r.provider}</p>
      </DetailSection>
      <ContactSection phone={null} email={r.email} />
      {r.location && <LocationSection label={r.location} onMap={Boolean(r.placeId)} walkMinutes={r.placeId ? walk?.[r.placeId] : null} />}
    </ContentDetail>
  );
};
