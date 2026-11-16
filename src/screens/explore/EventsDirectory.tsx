import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { services, type CampusEvent, type EventCategory } from "@/services";
import { dayLabel, isSameDay, longDate, time24, useNow } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { useActivity } from "@/session/ActivityProvider";
import { Chip, ChipRow } from "@/ui/Chip";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { DetailHeader } from "../details/DetailHeader";

type When = "all" | "today" | "week";
const CATEGORIES = services.search.categories("event") as EventCategory[];
const WHEN_LABEL: Record<When, string> = { all: "All upcoming", today: "Today", week: "This week" };

/** Flow 04 "Events directory": date blocks; filters for today, this week and category. */
export const EventsDirectory = () => {
  const now = useNow();
  const { isRegistered } = useActivity();
  const [when, setWhen] = useState<When>("all");
  const [category, setCategory] = useState<EventCategory | null>(null);
  const { state, reload } = useAsync(() => services.content.events(), []);

  const shown =
    state.status === "ready"
      ? state.data.filter((e) => {
          const start = new Date(e.startsAt);
          if (new Date(e.endsAt) < now) return false;
          if (when === "today" && !isSameDay(start, now)) return false;
          if (when === "week" && start.getTime() - now.getTime() > 7 * 86_400_000) return false;
          return !category || e.category === category;
        })
      : [];

  // Group by day for the date blocks.
  const days: { key: string; date: Date; events: CampusEvent[] }[] = [];
  for (const e of shown) {
    const d = new Date(e.startsAt);
    const key = d.toDateString();
    const group = days.find((g) => g.key === key);
    if (group) group.events.push(e);
    else days.push({ key, date: d, events: [e] });
  }

  return (
    <>
      <DetailHeader back={{ to: "/explore", label: "Explore" }} title="Events">
        What's happening on campus.
      </DetailHeader>

      <div className="mb-5 space-y-3">
        <ChipRow label="When">
          {(Object.keys(WHEN_LABEL) as When[]).map((w) => (
            <Chip key={w} pressed={when === w} onClick={() => setWhen(w)}>
              {WHEN_LABEL[w]}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow label="Category">
          <Chip pressed={!category} onClick={() => setCategory(null)}>All categories</Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} pressed={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </ChipRow>
      </div>

      {state.status === "loading" && <Skeleton lines={5} />}
      {state.status === "error" && <LoadError what="events" onRetry={reload} />}
      {state.status === "ready" &&
        (days.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-oxford-rule px-5 py-8 text-center">
            <p className="font-semibold text-oxford-ink">
              {when === "today" ? "No events today" : when === "week" ? "No events this week" : "No upcoming events"}
              {category ? ` in ${category}` : ""}
            </p>
            {(when !== "all" || category) && (
              <button
                type="button"
                onClick={() => {
                  setWhen("all");
                  setCategory(null);
                }}
                className="mt-3 min-h-[44px] text-sm font-semibold text-oxford-ink underline underline-offset-4 hover:no-underline"
              >
                Show all upcoming events
              </button>
            )}
          </div>
        ) : (
          <ol className="space-y-5">
            {days.map((g) => (
              <li key={g.key} className="flex gap-4">
                <div className="flex w-14 shrink-0 flex-col items-center self-start rounded-xl bg-oxford-sandSoft py-2 text-oxford-ink sm:w-16" aria-hidden="true">
                  <span className="text-[11px] font-semibold uppercase">{g.date.toLocaleDateString("en-GB", { month: "short" })}</span>
                  <span className="font-serif text-2xl font-semibold leading-none">{g.date.getDate()}</span>
                  <span className="mt-1 text-[11px] font-semibold uppercase text-oxford-mute">
                    {g.date.toLocaleDateString("en-GB", { weekday: "short" })}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="mb-2 font-sans text-sm font-semibold text-oxford-mute">
                    {dayLabel(g.date, now)}
                    <span className="sr-only">, {longDate(g.date)}</span>
                  </h2>
                  <ul className="space-y-2">
                    {g.events.map((e) => (
                      <li key={e.id}>
                        <Link to={`/events/${e.id}`} className="block rounded-xl border border-oxford-rule bg-white p-4 transition hover:border-oxford-ink/30">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-oxford-mute">{e.category}</span>
                          <span className="mt-0.5 block font-semibold leading-snug text-oxford-ink">{e.title}</span>
                          <span className="mt-0.5 block text-sm text-oxford-mute">
                            {time24(new Date(e.startsAt))}–{time24(new Date(e.endsAt))} · {e.venue}
                          </span>
                          {isRegistered(e.id) && (
                            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-oxford-success">
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Registered
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        ))}
    </>
  );
};
