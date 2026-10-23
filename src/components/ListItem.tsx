import { Link } from "react-router-dom";
import { Bookmark, ChevronRight } from "lucide-react";
import type { SectionItem } from "@/data/types";
import { sectionById } from "@/lib/sectionConfig";
import { Highlight } from "@/lib/highlight";
import { Chip } from "./Chip";
import { useSaved } from "@/hooks/useSaved";
import { useToast } from "@/hooks/useToast";

interface Props {
  item: SectionItem;
  showSection?: boolean;
  highlightQuery?: string;
}

export const ListItem = ({
  item,
  showSection = false,
  highlightQuery,
}: Props) => {
  const meta = sectionById(item.section);
  const Icon = meta.icon;
  const { isSaved, toggleSaved } = useSaved();
  const { showToast } = useToast();
  const saved = isSaved(item.section, item.id);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = toggleSaved(item.section, item.id);
    showToast(newState ? "Saved" : "Removed from saved", "success");
  };

  return (
    <Link
      to={`/section/${item.section}/${item.id}`}
      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-card transition hover:border-brand-200 hover:shadow-lift"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.accent}`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        {showSection && (
          <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {meta.shortLabel}
          </span>
        )}
        <span className="block text-[15px] font-semibold text-slate-900">
          <Highlight text={item.title} query={highlightQuery} />
        </span>
        <span className="line-clamp-2 text-xs leading-relaxed text-slate-500">
          <Highlight text={item.summary} query={highlightQuery} />
        </span>
        <span className="mt-1.5 flex flex-wrap gap-1">
          {item.tags.slice(0, 2).map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </span>
      </span>
      <span className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleSave}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save"}
          className={`rounded-lg p-1.5 transition ${
            saved
              ? "text-brand-600"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          }`}
        >
          <Bookmark
            className="h-4 w-4"
            fill={saved ? "currentColor" : "none"}
            aria-hidden="true"
          />
        </button>
        <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
      </span>
    </Link>
  );
};
