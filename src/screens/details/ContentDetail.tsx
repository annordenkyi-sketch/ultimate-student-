import type { ReactNode } from "react";
import { Clock, Footprints, Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import type { SavedKind } from "@/services";
import { unsplash, unsplashSrcSet } from "@/lib/images";
import { actionButtonClass, DirectionsButton, OfficialLink, SaveButton, ShareButton } from "@/ui/ContentActions";
import { DetailHeader } from "./DetailHeader";

interface Props {
  back: { to: string; label: string };
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  /** Open/closed, date, etc. Shown under the title. */
  status?: ReactNode;
  /** Unsplash photo id, or a full image URL uploaded by staff. */
  photo?: { id: string; alt: string; url?: string } | null;
  save: { kind: SavedKind; id: string };
  /** Campus place for Directions. Null hides the button. */
  directionsTo: string | null;
  website?: string | null;
  /** Extra actions after the standard ones (e.g. Add to calendar). */
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Shared layout for place, event and service details (flow 04):
 * description, photo, hours, contacts and location, with Directions,
 * Official link, Save and Share.
 */
export const ContentDetail = ({
  back,
  eyebrow,
  title,
  intro,
  status,
  photo,
  save,
  directionsTo,
  website,
  actions,
  children,
}: Props) => (
  <div className="max-w-3xl">
    <DetailHeader back={back} eyebrow={eyebrow} title={title}>
      {intro}
    </DetailHeader>
    {status && <div className="-mt-3 mb-5">{status}</div>}

    {photo && (
      <figure className="mb-5 overflow-hidden rounded-2xl border border-oxford-rule bg-oxford-cream">
        <img
          src={photo.url ?? unsplash(photo.id, 1200)}
          srcSet={photo.url ? undefined : unsplashSrcSet(photo.id)}
          sizes="(min-width: 1024px) 768px, 100vw"
          alt={photo.alt}
          loading="lazy"
          className="aspect-[16/7] w-full object-cover"
        />
        {!photo.url && <figcaption className="px-4 py-2 text-xs text-oxford-mute">Sample photo</figcaption>}
      </figure>
    )}

    <div className="mb-6 flex flex-wrap items-center gap-3">
      {directionsTo && <DirectionsButton placeId={directionsTo} />}
      <SaveButton kind={save.kind} id={save.id} title={title} />
      <ShareButton title={title} />
      {website && <OfficialLink href={website} />}
      {actions}
    </div>

    <div className="grid gap-5 md:grid-cols-2">{children}</div>
  </div>
);

export const DetailSection = ({
  id,
  title,
  icon: Icon,
  wide = false,
  children,
}: {
  id: string;
  title: string;
  icon?: LucideIcon;
  wide?: boolean;
  children: ReactNode;
}) => (
  <section aria-labelledby={id} className={`rounded-2xl border border-oxford-rule bg-white/80 p-5 ${wide ? "md:col-span-2" : ""}`}>
    <h2 id={id} className="flex items-center gap-2 font-sans text-base font-semibold text-oxford-ink">
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {title}
    </h2>
    <div className="mt-3">{children}</div>
  </section>
);

export const Paragraphs = ({ items }: { items: string[] }) => (
  <div className="space-y-2 text-sm leading-relaxed text-oxford-ink2">
    {items.map((p) => (
      <p key={p}>{p}</p>
    ))}
  </div>
);

export const HoursSection = ({ hours }: { hours: { days: string; time: string }[] }) => (
  <DetailSection id="hours" title="Opening hours" icon={Clock}>
    <dl className="space-y-2 text-sm">
      {hours.map((h) => (
        <div key={h.days} className="flex justify-between gap-4">
          <dt className="text-oxford-mute">{h.days}</dt>
          <dd className="text-right font-semibold text-oxford-ink">{h.time}</dd>
        </div>
      ))}
    </dl>
  </DetailSection>
);

export const ContactSection = ({ phone, email }: { phone: string | null; email: string | null }) => (
  <DetailSection id="contact" title="Contact">
    {phone || email ? (
      <div className="flex flex-wrap gap-2">
        {phone && (
          <a href={`tel:${phone.replace(/\s+/g, "")}`} className={actionButtonClass}>
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call {phone}
          </a>
        )}
        {email && (
          <a href={`mailto:${email}`} className={actionButtonClass}>
            <Mail className="h-4 w-4" aria-hidden="true" />
            Email
          </a>
        )}
      </div>
    ) : (
      <p className="text-sm text-oxford-mute">No contact details listed.</p>
    )}
  </DetailSection>
);

/** Where it is, the walk from the student's position (when known), and whether it's on the map. */
export const LocationSection = ({
  label,
  detail,
  onMap,
  walkMinutes,
}: {
  label: string;
  detail?: string;
  onMap: boolean;
  walkMinutes?: number | null;
}) => (
  <DetailSection id="location" title="Location" icon={MapPin}>
    <p className="text-sm font-semibold text-oxford-ink">{label}</p>
    {detail && <p className="mt-0.5 text-sm text-oxford-mute">{detail}</p>}
    {walkMinutes != null && (
      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-oxford-ink2">
        <Footprints className="h-4 w-4" aria-hidden="true" />
        About {walkMinutes} min walk from you
      </p>
    )}
    {!onMap && <p className="mt-2 text-sm text-oxford-mute">Location not confirmed on the campus map yet.</p>}
  </DetailSection>
);
