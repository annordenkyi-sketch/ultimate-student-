import { Link } from "react-router-dom";
import { SECTIONS } from "@/lib/sectionConfig";
import { Stagger, StaggerChild } from "@/components/Motion";

export const ShortcutsBlock = () => (
  <section aria-labelledby="shortcuts-heading">
    <div className="mb-3 flex items-baseline justify-between">
      <h2
        id="shortcuts-heading"
        className="text-sm font-semibold text-ink"
      >
        Sections
      </h2>
      <Link
        to="/sections"
        className="text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline lg:hidden"
      >
        See all
      </Link>
    </div>

    <Stagger
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      staggerChildren={0.04}
      delayChildren={0.05}
    >
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        return (
          <StaggerChild key={s.id}>
            <Link
              to={`/section/${s.id}`}
              className="flex h-full flex-col items-start gap-2 rounded-xl border border-line bg-white p-3 transition hover:border-line hover:bg-paper"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.accent}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-ink">
                {s.shortLabel}
              </span>
            </Link>
          </StaggerChild>
        );
      })}
    </Stagger>
  </section>
);
