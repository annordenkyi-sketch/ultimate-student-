import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ListItem } from "@/components/ListItem";
import { dataService } from "@/data/service";
import type { SearchResultGroup } from "@/data/types";
import { sectionById } from "@/lib/sectionConfig";

export const SearchPage = () => {
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const [groups, setGroups] = useState<SearchResultGroup[] | null>(null);

  useEffect(() => {
    if (!q) {
      setGroups([]);
      return;
    }
    setGroups(null);
    let cancelled = false;
    dataService.search(q).then((data) => {
      if (!cancelled) setGroups(data);
    });
    return () => {
      cancelled = true;
    };
  }, [q]);

  const total = groups?.reduce((n, g) => n + g.items.length, 0) ?? 0;

  return (
    <>
      <AppHeader title="Search" showSearch showBack />
      <div className="pb-6">
        {!q && (
          <EmptyState
            icon={SearchIcon}
            title="What are you looking for?"
            description='Try "library", "scholarship" or "clinic".'
          />
        )}
        {q && groups == null && <LoadingState rows={4} />}
        {q && groups && total === 0 && (
          <EmptyState
            icon={SearchIcon}
            title="No results"
            description={`We couldn't find anything for "${q}". Try a different word.`}
          />
        )}
        {q && groups && total > 0 && (
          <div className="space-y-6 px-4 py-4">
            <p className="text-xs text-muted">
              {total} result{total === 1 ? "" : "s"} for{" "}
              <strong className="text-ink">"{q}"</strong>
            </p>
            {groups.map((g) => {
              const meta = sectionById(g.section);
              return (
                <section
                  key={g.section}
                  aria-labelledby={`sg-${g.section}`}
                >
                  <h2
                    id={`sg-${g.section}`}
                    className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted"
                  >
                    {meta.label}
                  </h2>
                  <div className="space-y-2">
                    {g.items.map((i) => (
                      <ListItem key={i.id} item={i} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
