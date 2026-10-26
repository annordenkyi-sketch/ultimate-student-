import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SECTIONS } from "@/lib/sectionConfig";

export const SectionsPage = () => (
  <div className="pb-4">
    <header className="mb-5">
      <h1 className="text-2xl font-bold text-ink">Sections</h1>
      <p className="mt-1 text-sm text-muted">
        Everything on campus, by category.
      </p>
    </header>

    <ul className="space-y-2.5 md:grid md:grid-cols-2 md:gap-2.5 md:space-y-0">
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        return (
          <li key={s.id}>
            <Link
              to={`/section/${s.id}`}
              className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 transition hover:border-line hover:bg-paper"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.accent}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">
                  {s.label}
                </span>
                <span className="block text-xs text-muted">
                  {s.description}
                </span>
              </span>
              <ChevronRight
                className="h-4 w-4 text-muted"
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  </div>
);
