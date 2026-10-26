import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { SectionMeta } from "@/lib/sectionConfig";

interface Props {
  meta: SectionMeta;
}

export const SectionCard = ({ meta }: Props) => {
  const Icon = meta.icon;
  return (
    <Link
      to={`/section/${meta.id}`}
      className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-sm hover:border-brand-300 hover:bg-brand-50"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.accent}`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">
          {meta.shortLabel}
        </span>
        <span className="line-clamp-1 text-xs text-muted">
          {meta.description}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
    </Link>
  );
};
