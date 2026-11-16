import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, ChevronRight, LifeBuoy, Map as MapIcon, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { services, type Recommendation } from "@/services";
import { useAsync } from "@/lib/useAsync";
import { useSession } from "@/session/SessionProvider";
import { DashCard, EmptyNote, LoadError, Skeleton } from "@/ui/DashCard";
import { PageHeader } from "@/ui/PageHeader";
import { SearchField } from "@/ui/SearchField";

const ENTRIES: { to: string; icon: LucideIcon; title: string; body: string }[] = [
  { to: "/map", icon: MapIcon, title: "Campus map", body: "Find a building and get walking directions." },
  { to: "/explore/places", icon: UtensilsCrossed, title: "Food and places", body: "Places to eat, study and get things done." },
  { to: "/explore/events", icon: CalendarDays, title: "Events", body: "What's on today and this week." },
  { to: "/explore/services", icon: LifeBuoy, title: "Services", body: "Hours, contacts and where to find them." },
];

const KIND_LABEL: Record<Recommendation["kind"], string> = { place: "Place", event: "Event", service: "Service" };
const hrefFor = (r: Recommendation) =>
  r.kind === "place" ? `/places/${r.id}` : r.kind === "event" ? `/events/${r.id}` : `/services/${r.id}`;

/** Flow 04 "Explore landing": search, entry points and recommendations. */
export const ExploreScreen = () => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { account } = useSession();
  const [query, setQuery] = useState("");
  const recs = useAsync(() => services.content.recommendations(account?.id ?? null), [account?.id]);

  return (
    <>
      <PageHeader title="Explore" description="Find places, events and services across campus." />

      <div className="max-w-2xl">
        <SearchField
          id="explore-search"
          value={query}
          onChange={setQuery}
          label="Search places, events, services and news"
          onSubmit={() => navigate(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search")}
        />
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ENTRIES.map((e, i) => (
          <motion.li
            key={e.to}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              to={e.to}
              className="flex h-full flex-col gap-3 rounded-2xl border border-oxford-rule bg-white/80 p-4 transition hover:-translate-y-0.5 hover:border-oxford-ink/30 motion-reduce:hover:translate-y-0 sm:p-5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-oxford-sandSoft text-oxford-ink">
                <e.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold text-oxford-ink">{e.title}</span>
                <span className="mt-0.5 block text-sm leading-snug text-oxford-mute">{e.body}</span>
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>

      <DashCard id="recs-title" title={account ? "Suggested for you" : "Around campus"} className="mt-6" order={2}>
        {recs.state.status === "loading" && <Skeleton lines={2} />}
        {recs.state.status === "error" && <LoadError what="suggestions" onRetry={recs.reload} />}
        {recs.state.status === "ready" &&
          (recs.state.data.length === 0 ? (
            <EmptyNote>Nothing to suggest right now.</EmptyNote>
          ) : (
            <ul className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
              {recs.state.data.map((r) => (
                <li key={`${r.kind}-${r.id}`} className="w-[15rem] shrink-0 snap-start md:w-auto">
                  <Link
                    to={hrefFor(r)}
                    className="flex h-full flex-col rounded-xl border border-oxford-rule bg-white p-4 transition hover:border-oxford-ink/30"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-oxford-mute">
                      {KIND_LABEL[r.kind]}
                    </span>
                    <span className="mt-1 font-semibold leading-snug text-oxford-ink">{r.title}</span>
                    <span className="mt-0.5 text-sm text-oxford-mute">{r.subtitle}</span>
                    <span className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs font-semibold text-oxford-ink2">
                      <span className="rounded-full bg-oxford-sandSoft px-2.5 py-1">{r.reason}</span>
                      <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ))}
      </DashCard>
    </>
  );
};
