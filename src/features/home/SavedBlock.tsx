import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { SectionItem } from "@/data/types";
import { useSaved } from "@/hooks/useSaved";
import { dataService } from "@/data/service";
import { ListItem } from "@/components/ListItem";
import { EmptyState } from "@/components/EmptyState";
import { Bookmark } from "lucide-react";
import { Stagger, StaggerChild } from "@/components/Motion";

export const SavedBlock = () => {
  const { saved } = useSaved();
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

  return (
    <section aria-labelledby="saved-heading" className="px-5 py-4">
      <div className="mb-3 flex items-end justify-between">
        <h2
          id="saved-heading"
          className="text-sm font-semibold text-slate-900 display"
        >
          Saved for later
        </h2>
        {items.length > 0 && (
          <Link
            to="/saved"
            className="text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            See all
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Tap the bookmark icon on anything to save it here."
        />
      ) : (
        <Stagger className="space-y-2.5">
          {items.slice(0, 3).map((i) => (
            <StaggerChild key={i.id}>
              <ListItem item={i} showSection />
            </StaggerChild>
          ))}
        </Stagger>
      )}
    </section>
  );
};
