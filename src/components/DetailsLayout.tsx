import { Mail, MapPin, Phone, Globe, Bookmark } from "lucide-react";
import type { SectionItem } from "@/data/types";
import { sectionById, actionLabels } from "@/lib/sectionConfig";
import { ActionButton } from "./ActionButton";
import { Chip } from "./Chip";
import { useSaved } from "@/hooks/useSaved";
import { useToast } from "@/hooks/useToast";
import { formatDateTime } from "@/lib/format";

interface Props {
  item: SectionItem;
}

const mapsHref = (item: SectionItem): string | null => {
  const q = item.location?.mapsQuery ?? item.location?.label;
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
};

export const DetailsLayout = ({ item }: Props) => {
  const meta = sectionById(item.section);
  const Icon = meta.icon;
  const { isSaved, toggleSaved } = useSaved();
  const { showToast } = useToast();
  const saved = isSaved(item.section, item.id);

  const toggle = () => {
    const next = toggleSaved(item.section, item.id);
    showToast(next ? "Saved" : "Removed from saved");
  };

  const onPrimary = () => {
    const kind = item.nextAction;
    switch (kind) {
      case "get-directions": {
        const href = mapsHref(item);
        if (href) window.open(href, "_blank", "noopener,noreferrer");
        return;
      }
      case "call-office": {
        if (item.contact?.phone) {
          window.location.href = `tel:${item.contact.phone.replace(/\s/g, "")}`;
          return;
        }
        showToast("No phone number on file", "info");
        return;
      }
      case "contact-department":
      case "contact-hostel": {
        if (item.contact?.email) {
          window.location.href = `mailto:${item.contact.email}`;
          return;
        }
        showToast("No email on file", "info");
        return;
      }
      case "apply": {
        if (item.contact?.website) {
          window.open(item.contact.website, "_blank", "noopener,noreferrer");
          return;
        }
        showToast("Application opened", "success");
        return;
      }
      case "rsvp":
        showToast("You're going", "success");
        return;
      case "join-club":
        showToast("Request sent to the club", "success");
        return;
      case "visit-office":
        if (item.location) {
          const href = mapsHref(item);
          if (href) window.open(href, "_blank", "noopener,noreferrer");
          return;
        }
        showToast("Visit the office during open hours", "info");
        return;
      case "save-deadline":
      case "save-hostel":
      case "save-opportunity":
        toggle();
        return;
      default:
        toggle();
    }
  };

  return (
    <div className="pb-32">
      {/* Hero */}
      <section
        className={`${meta.accent} px-4 pb-6 pt-5`}
        aria-labelledby="details-title"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
          <Icon className="mr-1 inline h-3 w-3" aria-hidden="true" />
          {meta.label}
        </p>
        <h1
          id="details-title"
          className="mt-1 text-xl font-bold text-ink"
        >
          {item.title}
        </h1>
        {item.subtitle && (
          <p className="mt-1 text-sm text-ink">{item.subtitle}</p>
        )}
        {item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        )}
      </section>

      {/* Info */}
      <section className="px-4 py-4" aria-labelledby="info-heading">
        <h2
          id="info-heading"
          className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted"
        >
          About
        </h2>
        <p className="text-sm text-ink">{item.summary}</p>
        {item.details && (
          <p className="mt-2 text-sm text-muted">{item.details}</p>
        )}
        {item.deadline && (
          <p className="mt-3 rounded-lg bg-accent-50 px-3 py-2 text-xs text-accent-700">
            <strong>Deadline:</strong> {formatDateTime(item.deadline)}
          </p>
        )}
        {item.eventDate && (
          <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">
            <strong>When:</strong> {formatDateTime(item.eventDate)}
          </p>
        )}
      </section>

      {/* Location */}
      {item.location && (
        <section className="px-4 py-4" aria-labelledby="location-heading">
          <h2
            id="location-heading"
            className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted"
          >
            Location
          </h2>
          <div className="flex items-start gap-2 rounded-xl border border-line bg-white p-3">
            <MapPin
              className="mt-0.5 h-4 w-4 shrink-0 text-muted"
              aria-hidden="true"
            />
            <p className="text-sm text-ink">{item.location.label}</p>
          </div>
        </section>
      )}

      {/* Contact */}
      {item.contact && (
        <section className="px-4 py-4" aria-labelledby="contact-heading">
          <h2
            id="contact-heading"
            className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted"
          >
            Contact
          </h2>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
            {item.contact.phone && (
              <li>
                <a
                  href={`tel:${item.contact.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 p-3 text-sm text-ink hover:bg-paper"
                >
                  <Phone className="h-4 w-4 text-muted" aria-hidden="true" />
                  {item.contact.phone}
                </a>
              </li>
            )}
            {item.contact.email && (
              <li>
                <a
                  href={`mailto:${item.contact.email}`}
                  className="flex items-center gap-3 p-3 text-sm text-ink hover:bg-paper"
                >
                  <Mail className="h-4 w-4 text-muted" aria-hidden="true" />
                  {item.contact.email}
                </a>
              </li>
            )}
            {item.contact.website && (
              <li>
                <a
                  href={item.contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 text-sm text-ink hover:bg-paper"
                >
                  <Globe
                    className="h-4 w-4 text-muted"
                    aria-hidden="true"
                  />
                  {item.contact.website}
                </a>
              </li>
            )}
            {item.contact.office && (
              <li className="flex items-center gap-3 p-3 text-sm text-ink">
                <MapPin className="h-4 w-4 text-muted" aria-hidden="true" />
                {item.contact.office}
              </li>
            )}
          </ul>
        </section>
      )}

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-white">
        <div className="mx-auto flex max-w-[var(--app-max)] items-center gap-2 px-4 py-3">
          <ActionButton
            variant="secondary"
            onClick={toggle}
            aria-pressed={saved}
            leading={
              <Bookmark
                className="h-4 w-4"
                fill={saved ? "currentColor" : "none"}
                aria-hidden="true"
              />
            }
          >
            {saved ? "Saved" : "Save"}
          </ActionButton>
          <ActionButton fullWidth onClick={onPrimary}>
            {actionLabels[item.nextAction]}
          </ActionButton>
        </div>
      </div>
    </div>
  );
};
