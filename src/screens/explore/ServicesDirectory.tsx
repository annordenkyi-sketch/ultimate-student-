import { Link } from "react-router-dom";
import { Clock, Mail, Phone } from "lucide-react";
import { services, type ServiceCategory, type UniversityService } from "@/services";
import { useNow } from "@/lib/dates";
import { useAsync } from "@/lib/useAsync";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { OpenBadge } from "@/ui/OpenBadge";
import { SERVICE_ICONS } from "@/ui/serviceIcons";
import { DetailHeader } from "../details/DetailHeader";

const CATEGORIES = services.search.categories("service") as ServiceCategory[];

const contactClass =
  "inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-oxford-ink/20 bg-white px-3 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream";

/** Flow 04 "Services directory": by category, with hours and contacts. */
export const ServicesDirectory = () => {
  const now = useNow();
  const { state, reload } = useAsync(() => services.content.universityServices(), []);

  return (
    <>
      <DetailHeader back={{ to: "/explore", label: "Explore" }} title="Services">
        University services, when they're open and how to reach them.
      </DetailHeader>

      {state.status === "loading" && <Skeleton lines={5} />}
      {state.status === "error" && <LoadError what="university services" onRetry={reload} />}
      {state.status === "ready" && (
        <div className="space-y-7">
          {CATEGORIES.map((c) => {
            const items = state.data.filter((s) => s.category === c);
            if (!items.length) return null;
            const id = `svc-${c.replace(/\W+/g, "-").toLowerCase()}`;
            return (
              <section key={c} aria-labelledby={id}>
                <h2 id={id} className="mb-3 font-sans text-base font-semibold text-oxford-ink">
                  {c}
                </h2>
                <ul className="grid gap-3 md:grid-cols-2">
                  {items.map((s) => (
                    <ServiceCard key={s.id} s={s} now={now} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
};

const ServiceCard = ({ s, now }: { s: UniversityService; now: Date }) => {
  const Icon = SERVICE_ICONS[s.icon];
  const firstHours = s.hours[0];
  return (
    <li className="flex flex-col rounded-2xl border border-oxford-rule bg-white/80 p-4">
      <Link to={`/services/${s.id}`} className="-m-1 flex items-start gap-3 rounded-xl p-1 transition hover:bg-oxford-cream">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-oxford-sandSoft text-oxford-ink">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold text-oxford-ink underline-offset-4">{s.name}</span>
          <span className="mt-0.5 block text-sm text-oxford-mute">{s.summary}</span>
        </span>
      </Link>
      <div className="mt-3 space-y-1 text-sm">
        {s.periods ? <OpenBadge periods={s.periods} now={now} /> : null}
        {firstHours && (
          <p className="flex items-center gap-1.5 text-oxford-ink2">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {firstHours.days}: {firstHours.time}
          </p>
        )}
      </div>
      {(s.phone || s.email) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {s.phone && (
            <a href={`tel:${s.phone.replace(/\s+/g, "")}`} className={contactClass} aria-label={`Call ${s.name}, ${s.phone}`}>
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call
            </a>
          )}
          {s.email && (
            <a href={`mailto:${s.email}`} className={contactClass} aria-label={`Email ${s.name}`}>
              <Mail className="h-4 w-4" aria-hidden="true" />
              Email
            </a>
          )}
        </div>
      )}
    </li>
  );
};
