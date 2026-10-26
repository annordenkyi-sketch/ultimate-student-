import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, X } from "lucide-react";
import type { SectionItem } from "@/data/types";
import { useSaved } from "@/hooks/useSaved";
import { useToast } from "@/hooks/useToast";
import { dataService } from "@/data/service";
import { EmptyState } from "@/components/EmptyState";
import { sectionById } from "@/lib/sectionConfig";

export const SavedBlock = () => {
  const { saved, toggleSaved } = useSaved();
  const { showToast } = useToast();
  const [items, setItems] = useState<SectionItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    dataService
      .getItemsByIds(saved.map((s) => ({ section: s.section, itemId: s.itemId })))
      .then((data) => {
        if (!cancelled) setItems(data);
      });
    return () => {
      cancelled = true;
    };
  }, [saved]);

  const visible = items.slice(0, 4);

  return (
    <section
      aria-labelledby="saved-heading"
      className="rounded-xl border border-line bg-white"
    >
      <header className="border-b border-line/60 px-4 py-3">
        <h2
          id="saved-heading"
          className="text-sm font-semibold text-ink"
        >
          Saved for later
        </h2>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Tap the bookmark icon on anything to save it here."
        />
      ) : (
        <>
          <ul className="divide-y divide-line/60">
            {visible.map((i) => {
              const meta = sectionById(i.section);
              const Icon = meta.icon;
              const onRemove = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                toggleSaved(i.section, i.id);
                showToast("Removed from saved", "success");
              };
              return (
                <li key={i.id} className="relative">
                  <Link
                    to={`/section/${i.section}/${i.id}`}
                    className="flex items-start gap-3 p-3 pr-10 transition hover:bg-brand-50/60"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.accent}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {i.title}
                      </p>
                      <p className="line-clamp-1 text-xs text-muted">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                          {meta.shortLabel}
                        </span>{" "}
                        · {i.summary}
                      </p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Remove ${i.title} from saved`}
                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted transition hover:bg-paper hover:text-ink"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
          <footer className="border-t border-line/60 px-4 py-3 text-right">
            <Link
              to="/saved"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              See all
            </Link>
          </footer>
        </>
      )}
    </section>
  );
};
