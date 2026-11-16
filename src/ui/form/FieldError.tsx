import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

export const FieldError = ({ id, children }: { id: string; children: ReactNode }) => (
  <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm text-oxford-danger">
    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <span>{children}</span>
  </p>
);
