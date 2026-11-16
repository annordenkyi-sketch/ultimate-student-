import { useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, BookOpen, CalendarDays, ChevronRight, LifeBuoy, MapPin, Megaphone, Trash2, type LucideIcon } from "lucide-react";
import type { SavedItem, SavedKind } from "@/services";
import { relativeTimeInline, useNow } from "@/lib/dates";
import { useActivity } from "@/session/ActivityProvider";
import { btn } from "@/ui/button";
import { Chip, ChipRow } from "@/ui/Chip";
import { PersonalSection, SectionHeader } from "./MoreLayout";

const KINDS: { id: SavedKind; label: string; one: string; icon: LucideIcon; href: (id: string) => string }[] = [
  { id: "announcement", label: "Announcements", one: "announcement", icon: Megaphone, href: (id) => `/announcements/${id}` },
  { id: "event", label: "Events", one: "event", icon: CalendarDays, href: (id) => `/events/${id}` },
  { id: "place", label: "Places", one: "place", icon: MapPin, href: (id) => `/places/${id}` },
  { id: "service", label: "Services", one: "service", icon: LifeBuoy, href: (id) => `/services/${id}` },
  { id: "resource", label: "Resources", one: "resource", icon: BookOpen, href: (id) => `/resources/${id}` },
];

/** Flow 07 "Saved items": everything the student saved, by type, to open or remove. */
export const SavedSection = () => (
  <PersonalSection title="Saved items" includes={["Announcements, places, events and services you save, in one place"]}>
    <SavedContent />
  </PersonalSection>
);

const SavedContent = () => {
  const { saved, setSaved } = useActivity();
  const now = useNow();
  const [kind, setKind] = useState<SavedKind | null>(null);
  const [status, setStatus] = useState<{ text: string; failed?: boolean } | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const sorted = [...saved].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  const shown = sorted.filter((s) => !kind || s.kind === kind);
  const present = KINDS.filter((k) => saved.some((s) => s.kind === k.id));
  const current = KINDS.find((k) => k.id === kind);

  const remove = async (item: SavedItem) => {
    setRemoving(`${item.kind}-${item.id}`);
    try {
      await setSaved({ kind: item.kind, id: item.id, title: item.title }, false);
      setStatus({ text: `Removed "${item.title}".` });
    } catch {
      setStatus({ text: "That didn't work. Try again.", failed: true });
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="max-w-3xl">
      <SectionHeader title="Saved items" />

      {saved.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-oxford-rule px-5 py-10 text-center">
          <Bookmark className="mx-auto h-8 w-8 text-oxford-mute" aria-hidden="true" />
          <p className="mt-3 font-semibold text-oxford-ink">Nothing saved yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-oxford-mute">Choose Save on an announcement, event, place or service and it will appear here.</p>
          <Link to="/explore" className={btn("primary", "mt-5")}>
            Browse Explore
          </Link>
        </div>
      ) : (
        <>
          {present.length > 1 && (
            <div className="mb-4">
              <ChipRow label="Type">
                <Chip pressed={!kind} onClick={() => setKind(null)}>
                  All {saved.length}
                </Chip>
                {present.map((k) => (
                  <Chip key={k.id} pressed={kind === k.id} onClick={() => setKind(k.id)}>
                    {k.label} {saved.filter((s) => s.kind === k.id).length}
                  </Chip>
                ))}
              </ChipRow>
            </div>
          )}
          <p role="status" className={`mb-2 min-h-[1.25rem] text-sm font-semibold ${status?.failed ? "text-oxford-danger" : "text-oxford-success"}`}>
            {status?.text}
          </p>
          {shown.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-oxford-rule px-5 py-8 text-center text-sm text-oxford-mute">
              No saved {current?.label.toLowerCase() ?? "items"}.
            </p>
          ) : (
            <ul className="divide-y divide-oxford-rule/70 rounded-2xl border border-oxford-rule bg-white/80">
              {shown.map((item) => {
                const k = KINDS.find((x) => x.id === item.kind)!;
                const key = `${item.kind}-${item.id}`;
                return (
                  <li key={key} className="flex items-center gap-2 pr-2">
                    <Link to={k.href(item.id)} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 transition hover:bg-oxford-cream">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-oxford-sandSoft text-oxford-ink">
                        <k.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold leading-snug text-oxford-ink">{item.title}</span>
                        <span className="mt-0.5 block text-sm text-oxford-mute">
                          {k.one.charAt(0).toUpperCase() + k.one.slice(1)} · saved {relativeTimeInline(item.savedAt, now)}
                        </span>
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-oxford-mute" aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      disabled={removing === key}
                      aria-label={`Remove ${item.title} from saved items`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-oxford-mute transition hover:bg-oxford-cream hover:text-oxford-danger disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
};
