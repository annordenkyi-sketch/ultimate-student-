import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { services as ALL } from "@/data/mocks/services";
import type { SectionItem } from "@/data/types";
import { Highlight } from "@/lib/highlight";

/** Mock opening hours (not in the shared mock yet). */
const HOURS: Record<string, string> = {
  "svc-1": "Mon–Sun · 24 hours · Emergency triage overnight",
  "svc-2": "Mon–Fri · 09:00–17:00",
  "svc-3": "Mon–Fri · 08:30–18:00",
  "svc-4": "Mon–Fri · 09:00–16:00",
  "svc-5": "24/7 · Call for immediate help",
  "svc-6": "Mon–Fri · 09:00–17:00",
  "svc-7": "Mon–Fri · 10:00–16:00",
};

const matches = (item: SectionItem, q: string): boolean => {
  if (!q) return true;
  const needle = q.toLowerCase();
  const hay = [
    item.title,
    item.summary,
    item.contact?.office ?? "",
    item.contact?.email ?? "",
    item.contact?.phone ?? "",
    item.tags.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
};

interface CardProps {
  item: SectionItem;
  query: string;
  dense?: boolean;
}

const ServiceCard = ({ item, query, dense }: CardProps) => {
  const hours = HOURS[item.id];
  return (
    <article
      className={`rounded-xl border border-slate-200 bg-white ${
        dense ? "p-4" : "p-5"
      }`}
    >
      <h3 className="text-base font-semibold text-slate-900">
        <Highlight text={item.title} query={query} />
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        <Highlight text={item.summary} query={query} />
      </p>

      <dl className="mt-3 space-y-1 text-xs text-slate-600">
        {hours && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 font-semibold uppercase tracking-wider text-slate-400">
              Hours
            </dt>
            <dd className="flex-1">{hours}</dd>
          </div>
        )}
        {item.contact?.office && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 font-semibold uppercase tracking-wider text-slate-400">
              Office
            </dt>
            <dd className="flex-1">
              <Highlight text={item.contact.office} query={query} />
            </dd>
          </div>
        )}
        {item.contact?.phone && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 font-semibold uppercase tracking-wider text-slate-400">
              Phone
            </dt>
            <dd className="flex-1">
              <a
                href={`tel:${item.contact.phone.replace(/\s/g, "")}`}
                className="font-medium text-slate-700 hover:text-brand-700"
              >
                <Highlight text={item.contact.phone} query={query} />
              </a>
            </dd>
          </div>
        )}
        {item.contact?.email && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 font-semibold uppercase tracking-wider text-slate-400">
              Email
            </dt>
            <dd className="flex-1">
              <a
                href={`mailto:${item.contact.email}`}
                className="font-medium text-slate-700 hover:text-brand-700"
              >
                <Highlight text={item.contact.email} query={query} />
              </a>
            </dd>
          </div>
        )}
      </dl>

      {(item.contact?.phone || item.contact?.email) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {item.contact.phone && (
            <a
              href={`tel:${item.contact.phone.replace(/\s/g, "")}`}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
            >
              Call
            </a>
          )}
          {item.contact.email && (
            <a
              href={`mailto:${item.contact.email}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Email
            </a>
          )}
        </div>
      )}
    </article>
  );
};

const EmergencyCard = ({ item, query }: CardProps) => (
  <article className="rounded-xl border border-rose-200 bg-rose-50 p-4">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
      Emergency
    </p>
    <h3 className="mt-1 text-base font-semibold text-slate-900">
      <Highlight text={item.title} query={query} />
    </h3>
    <p className="mt-1 text-sm text-slate-700">
      <Highlight text={item.summary} query={query} />
    </p>
    {item.contact?.phone && (
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <a
          href={`tel:${item.contact.phone.replace(/\s/g, "")}`}
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          Call now
        </a>
        <span className="text-sm font-medium text-slate-700">
          <Highlight text={item.contact.phone} query={query} />
        </span>
      </div>
    )}
  </article>
);

export const ServicesPage = () => {
  const [query, setQuery] = useState("");

  const { emergency, others } = useMemo(() => {
    const q = query.trim();
    const matching = ALL.filter((s) => matches(s, q));
    return {
      emergency: matching.filter((s) => s.tags.includes("emergency")),
      others: matching.filter((s) => !s.tags.includes("emergency")),
    };
  }, [query]);

  const hasAny = emergency.length + others.length > 0;

  return (
    <div className="pb-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Student services</h1>
        <p className="mt-1 text-sm text-slate-500">
          Health, counselling, ICT, finance and emergency support.
        </p>
      </header>

      <div className="mb-6">
        <label htmlFor="services-search" className="sr-only">
          Search services
        </label>
        <input
          id="services-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search services…"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500"
        />
      </div>

      {!hasAny ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <p>
            No results for{" "}
            <strong className="text-slate-900">"{query}"</strong> in Services.
          </p>
          <Link
            to={`/search?q=${encodeURIComponent(query)}`}
            className="mt-2 inline-block text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            Search all of Ultimate Student →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {emergency.length > 0 && (
            <section aria-labelledby="emergency-heading">
              <h2
                id="emergency-heading"
                className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Emergency contacts
              </h2>
              <div className="space-y-2">
                {emergency.map((item) => (
                  <EmergencyCard key={item.id} item={item} query={query} />
                ))}
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section aria-labelledby="services-heading">
              <h2
                id="services-heading"
                className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Services
              </h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {others.map((item) => (
                  <ServiceCard
                    key={item.id}
                    item={item}
                    query={query}
                    dense
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
