import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { EventItem } from "@/data/types";
import { dataService } from "@/data/service";
import { EventCard } from "@/components/EventCard";
import { LoadingState } from "@/components/LoadingState";
import { Stagger, StaggerChild } from "@/components/Motion";

export const EventsBlock = () => {
  const [items, setItems] = useState<EventItem[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    dataService.getEventsThisWeek().then((data) => {
      if (!cancelled) setItems(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (items == null) return <LoadingState rows={2} label="Loading events" />;
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="events-heading" className="px-5 py-4">
      <div className="mb-3 flex items-end justify-between">
        <h2
          id="events-heading"
          className="text-sm font-semibold text-slate-900 display"
        >
          This week on campus
        </h2>
        <Link
          to="/section/social"
          className="text-xs font-semibold text-brand-700 hover:text-brand-800"
        >
          See all
        </Link>
      </div>
      <Stagger
        className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:gap-2.5 lg:overflow-visible lg:px-0 lg:pb-0"
      >
        {items.slice(0, 5).map((e) => (
          <StaggerChild
            key={e.id}
            className="w-[85%] shrink-0 snap-start first:ml-0 lg:w-full lg:shrink"
          >
            <EventCard
              event={e}
              linkTo={e.sectionItemId ? `/section/social/${e.sectionItemId}` : undefined}
            />
          </StaggerChild>
        ))}
      </Stagger>
    </section>
  );
};
