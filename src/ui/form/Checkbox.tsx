import { forwardRef, type ReactNode } from "react";
import { FieldError } from "./FieldError";

interface Props {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, Props>(
  ({ id, checked, onChange, children, error }, ref) => (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm text-oxford-ink">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[rgb(var(--us-ink))]"
        />
        <span>{children}</span>
      </label>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  ),
);
Checkbox.displayName = "Checkbox";
