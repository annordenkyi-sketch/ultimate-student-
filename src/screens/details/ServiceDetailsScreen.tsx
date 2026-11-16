import { useParams } from "react-router-dom";
import { services } from "@/services";
import { useNow } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { useWalkTimes } from "@/lib/useWalkTimes";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { OpenBadge } from "@/ui/OpenBadge";
import { ContactSection, ContentDetail, DetailSection, HoursSection, LocationSection, Paragraphs } from "./ContentDetail";
import { NotFound } from "./DetailHeader";

const BACK = { to: "/explore/services", label: "Services" };

/** Flows 03 and 04 "University service details". */
export const ServiceDetailsScreen = () => {
  const { id = "" } = useParams();
  const now = useNow();
  const { state, reload } = useAsync(() => services.content.universityService(id), [id]);
  const placeId = state.status === "ready" ? (state.data?.placeId ?? null) : null;
  const walk = useWalkTimes(placeId ? [placeId] : []);

  if (state.status === "loading") return <Skeleton lines={5} />;
  if (state.status === "error") return <LoadError what="this service" onRetry={reload} />;
  if (!state.data) return <NotFound what="Service" back={BACK} />;

  const s = state.data;
  const online = s.location === "Online";

  return (
    <ContentDetail
      back={BACK}
      eyebrow={s.category}
      title={s.name}
      intro={s.summary}
      status={s.periods ? <OpenBadge periods={s.periods} now={now} /> : undefined}
      save={{ kind: "service", id: s.id }}
      directionsTo={s.placeId}
      website={s.website}
    >
      <DetailSection id="about-service" title="What it does" wide>
        <Paragraphs items={s.description} />
      </DetailSection>
      <HoursSection hours={s.hours} />
      <ContactSection phone={s.phone} email={s.email} />
      {!online && (
        <LocationSection label={s.location} onMap={Boolean(s.placeId)} walkMinutes={s.placeId ? walk?.[s.placeId] : null} />
      )}
    </ContentDetail>
  );
};
