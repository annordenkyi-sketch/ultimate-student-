import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Compass, Sparkles } from "lucide-react";
import { services } from "@/services";
import { useAsync } from "@/lib/useAsync";
import { btn } from "@/ui/button";
import { Chip, ChipRow } from "@/ui/Chip";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { DetailHeader } from "../details/DetailHeader";
import { useAccountId } from "./useAccountId";

/** Flow 06 "Opportunities": events and resources matched to the student's goals and programme. */
export const OpportunitiesScreen = () => {
  const accountId = useAccountId();
  const [kind, setKind] = useState<string | null>(null);
  const { state, reload } = useAsync(() => services.opportunities.forStudent(accountId), [accountId]);

  const all = state.status === "ready" ? state.data : [];
  const kinds = [...new Set(all.map((o) => (o.type === "event" ? "Events" : o.kind)))];
  const shown = all.filter((o) => !kind || (o.type === "event" ? "Events" : o.kind) === kind);

  return (
    <>
      <DetailHeader back={{ to: "/for-you", label: "For You" }} title="Opportunities">
        Events and resources picked for your goals and programme.
      </DetailHeader>

      {state.status === "loading" && <Skeleton lines={4} />}
      {state.status === "error" && <LoadError what="opportunities" onRetry={reload} />}
      {state.status === "ready" &&
        (all.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-oxford-rule px-5 py-10 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-oxford-mute" aria-hidden="true" />
            <p className="mt-3 font-semibold text-oxford-ink">Nothing matched yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-oxford-mute">
              Set a goal, such as applying for internships or improving your grades, and we'll suggest events and resources that help.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link to="/for-you/goals/new" className={btn("primary")}>
                Set a goal
              </Link>
              <Link to="/explore" className={btn("secondary")}>
                <Compass className="h-4 w-4" aria-hidden="true" />
                Browse Explore
              </Link>
            </div>
          </div>
        ) : (
          <>
            {kinds.length > 1 && (
              <div className="mb-5">
                <ChipRow label="Type">
                  <Chip pressed={!kind} onClick={() => setKind(null)}>All</Chip>
                  {kinds.map((k) => (
                    <Chip key={k} pressed={kind === k} onClick={() => setKind(k)}>
                      {k}
                    </Chip>
                  ))}
                </ChipRow>
              </div>
            )}
            <ul className="grid gap-4 md:grid-cols-2">
              {shown.map((o) => (
                <li key={`${o.type}-${o.id}`}>
                  <Link
                    to={o.type === "event" ? `/events/${o.id}` : `/resources/${o.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-oxford-rule bg-white/80 p-5 transition hover:border-oxford-ink/30"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-oxford-mute">
                      {o.type === "event" ? `Event · ${o.kind}` : o.kind}
                    </span>
                    <span className="mt-1 font-semibold leading-snug text-oxford-ink">{o.title}</span>
                    <span className="mt-0.5 text-sm text-oxford-mute">{o.detail}</span>
                    <span className="mt-auto flex items-end justify-between gap-3 pt-4">
                      <span className="inline-flex items-start gap-1.5 rounded-lg bg-oxford-sandSoft px-2.5 py-1.5 text-xs font-semibold text-oxford-ink2">
                        <Sparkles className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {o.reason}
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-oxford-mute" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ))}
    </>
  );
};
