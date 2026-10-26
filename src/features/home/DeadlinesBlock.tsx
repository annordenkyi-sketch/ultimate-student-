import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Deadline, SectionId } from "@/data/types";
import { dataService } from "@/data/service";
import { DeadlineCard } from "@/components/DeadlineCard";
import { LoadingState } from "@/components/LoadingState";
import { Stagger, StaggerChild } from "@/components/Motion";

const sectionForDeadline = (sectionItemId?: string): SectionId => {
  if (!sectionItemId) return "academic";
  if (sectionItemId.startsWith("opp-")) return "opportunities";
  if (sectionItemId.startsWith("svc-")) return "services";
  return "academic";
};

export const DeadlinesBlock = () => {
  const [items, setItems] = useState<Deadline[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    dataService.getDeadlines().then((data) => {
      if (!cancelled) setItems(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (items == null)
    return <LoadingState rows={2} label="Loading deadlines" />;
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="deadlines-heading" className="px-5 py-4">
      <div className="mb-3 flex items-end justify-between">
        <h2
          id="deadlines-heading"
          className="text-sm font-semibold text-ink display"
        >
          Upcoming deadlines
        </h2>
        <Link
          to="/section/academic"
          className="text-xs font-semibold text-brand-700 hover:text-brand-800"
        >
          See all
        </Link>
      </div>
      <Stagger className="space-y-2.5">
        {items.slice(0, 3).map((d) => (
          <StaggerChild key={d.id}>
            <DeadlineCard
              deadline={d}
              linkTo={
                d.sectionItemId
                  ? `/section/${sectionForDeadline(d.sectionItemId)}/${d.sectionItemId}`
                  : undefined
              }
            />
          </StaggerChild>
        ))}
      </Stagger>
    </section>
  );
};
