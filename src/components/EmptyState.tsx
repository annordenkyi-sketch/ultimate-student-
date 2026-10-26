import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: Props) => (
  <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
    <div className="rounded-full bg-paper p-3 text-muted">
      <Icon className="h-6 w-6" aria-hidden="true" />
    </div>
    <h2 className="text-sm font-semibold text-ink">{title}</h2>
    {description && (
      <p className="max-w-xs text-sm text-muted">{description}</p>
    )}
    {action}
  </div>
);
