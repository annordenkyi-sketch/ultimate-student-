import { useParams } from "react-router-dom";
import { services } from "@/services";
import { useNow } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { useWalkTimes } from "@/lib/useWalkTimes";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { OpenBadge } from "@/ui/OpenBadge";
import { ContactSection, ContentDetail, DetailSection, HoursSection, LocationSection, Paragraphs } from "./ContentDetail";
import { NotFound } from "./DetailHeader";

const BACK = { to: "/explore/places", label: "Food and places" };

/** Flow 04 "Place details". */
export const PlaceDetailsScreen = () => {
  const { id = "" } = useParams();
  const now = useNow();
  const { state, reload } = useAsync(() => services.campus.place(id), [id]);
  const walk = useWalkTimes(state.status === "ready" && state.data ? [state.data.id] : []);

  if (state.status === "loading") return <Skeleton lines={5} />;
  if (state.status === "error") return <LoadError what="this place" onRetry={reload} />;
  if (!state.data) return <NotFound what="Place" back={BACK} />;

  const p = state.data;

  return (
    <ContentDetail
      back={BACK}
      eyebrow={p.category}
      title={p.name}
      intro={p.summary}
      status={<OpenBadge periods={p.periods} now={now} />}
      photo={p.photoId ? { id: p.photoId, alt: p.name } : null}
      save={{ kind: "place", id: p.id }}
      directionsTo={p.id}
      website={p.website}
    >
      <DetailSection id="about-place" title="About" wide>
        <Paragraphs items={p.description} />
      </DetailSection>
      <HoursSection hours={p.hours} />
      <ContactSection phone={p.phone} email={p.email} />
      <LocationSection label={p.name} detail={`Entrance: ${p.entrance.label}`} onMap walkMinutes={walk?.[p.id]} />
    </ContentDetail>
  );
};
