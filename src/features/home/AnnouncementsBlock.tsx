import { useEffect, useState } from "react";
import type { Announcement } from "@/data/types";
import { dataService } from "@/data/service";
import { useProfile } from "@/hooks/useProfile";
import { AnnouncementCard } from "@/components/Announcement";
import { LoadingState } from "@/components/LoadingState";
import { Stagger, StaggerChild } from "@/components/Motion";

export const AnnouncementsBlock = () => {
  const { profile } = useProfile();
  const [items, setItems] = useState<Announcement[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    dataService.getAnnouncements(profile).then((data) => {
      if (!cancelled) setItems(data);
    });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  if (items == null) return <LoadingState rows={2} label="Loading announcements" />;
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="announcements-heading" className="px-5 py-4">
      <h2
        id="announcements-heading"
        className="mb-3 text-sm font-semibold text-slate-900 display"
      >
        Announcements for you
      </h2>
      <Stagger className="space-y-2.5">
        {items.slice(0, 3).map((a) => (
          <StaggerChild key={a.id}>
            <AnnouncementCard announcement={a} />
          </StaggerChild>
        ))}
      </Stagger>
    </section>
  );
};
