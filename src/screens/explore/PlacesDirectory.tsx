import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Map as MapIcon } from "lucide-react";
import { services, type PlaceCategory } from "@/services";
import { useNow } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { useWalkTimes } from "@/lib/useWalkTimes";
import { Chip, ChipRow } from "@/ui/Chip";
import { actionButtonClass } from "@/ui/ContentActions";
import { EmptyNote, LoadError, Skeleton } from "@/ui/DashCard";
import { OpenBadge } from "@/ui/OpenBadge";
import { PLACE_ICONS } from "@/ui/placeIcons";
import { WalkTime } from "@/ui/WalkTime";
import { DetailHeader } from "../details/DetailHeader";

const CATEGORIES = services.search.categories("place") as PlaceCategory[];

/** Flow 04 "Places directory": category chips; each row shows name, category and open/closed. */
export const PlacesDirectory = () => {
  const now = useNow();
  const [category, setCategory] = useState<PlaceCategory | null>(null);
  const { state, reload } = useAsync(() => services.campus.places(), []);
  const all = state.status === "ready" ? state.data : null;
  const walk = useWalkTimes(useMemo(() => all?.map((p) => p.id) ?? [], [all]));
  const shown = all?.filter((p) => !category || p.category === category) ?? [];

  return (
    <>
      <DetailHeader back={{ to: "/explore", label: "Explore" }} title="Food and places">
        Places to eat, study and get things done on campus.
      </DetailHeader>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <ChipRow label="Category">
          <Chip pressed={!category} onClick={() => setCategory(null)}>All</Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} pressed={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </ChipRow>
        <Link to="/map" className={`${actionButtonClass} shrink-0`}>
          <MapIcon className="h-4 w-4" aria-hidden="true" />
          View on map
        </Link>
      </div>

      {state.status === "loading" && <Skeleton lines={6} />}
      {state.status === "error" && <LoadError what="campus places" onRetry={reload} />}
      {all &&
        (shown.length === 0 ? (
          <EmptyNote>No places in this category yet.</EmptyNote>
        ) : (
          <ul className="divide-y divide-oxford-rule/70 rounded-2xl border border-oxford-rule bg-white/80" aria-label={category ?? "All places"}>
            {shown.map((p) => {
              const Icon = PLACE_ICONS[p.category];
              return (
                <li key={p.id}>
                  <Link to={`/places/${p.id}`} className="flex items-center gap-3 px-4 py-3.5 transition first:rounded-t-2xl last:rounded-b-2xl hover:bg-oxford-cream">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-oxford-sandSoft text-oxford-ink">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-snug text-oxford-ink">{p.name}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-1 text-sm text-oxford-mute">
                        {p.category} · <OpenBadge periods={p.periods} now={now} size="xs" />
                        {walk?.[p.id] != null && <WalkTime minutes={walk[p.id]!} />}
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-oxford-mute" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
    </>
  );
};
