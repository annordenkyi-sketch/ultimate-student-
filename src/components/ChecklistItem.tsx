import { Link } from "react-router-dom";
import type { ChecklistTask, SectionId } from "@/data/types";

interface Props {
  task: ChecklistTask;
  onToggle: (id: string) => void;
  // helpItemId references a SectionItem; we need the section to link to it.
  resolveLink?: (helpItemId: string) => { section: SectionId; itemId: string } | null;
}

export const ChecklistItemRow = ({ task, onToggle, resolveLink }: Props) => {
  const link = task.helpItemId && resolveLink ? resolveLink(task.helpItemId) : null;
  return (
    <li className="flex items-start gap-3 rounded-xl border border-line bg-white p-3 shadow-sm">
      <input
        id={`chk-${task.id}`}
        type="checkbox"
        checked={task.done}
        onChange={() => onToggle(task.id)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-brand-600 focus:ring-brand-500"
      />
      <label
        htmlFor={`chk-${task.id}`}
        className={`min-w-0 flex-1 text-sm ${
          task.done ? "text-muted line-through" : "text-ink"
        }`}
      >
        {task.title}
      </label>
      {link && (
        <Link
          to={`/section/${link.section}/${link.itemId}`}
          className="text-xs font-medium text-brand-700 hover:underline"
        >
          Open
        </Link>
      )}
    </li>
  );
};
