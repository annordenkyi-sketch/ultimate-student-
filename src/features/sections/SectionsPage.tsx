import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SECTIONS } from "@/lib/sectionConfig";

export const SectionsPage = () => (
  <div className="pb-4">
    <header className="mb-5">
      <h1 className="text-2xl font-bold text-slate-900">Sections</h1>
      <p className="mt-1 text-sm text-slate-500">
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
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.accent}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900">
                  {s.label}
                </span>
                <span className="block text-xs text-slate-500">
                  {s.description}
                </span>
              </span>
              <ChevronRight
                className="h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  </div>
);
