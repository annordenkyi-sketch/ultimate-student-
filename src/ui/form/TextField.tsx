import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { FieldError } from "./FieldError";

export const inputClass = (invalid: boolean, extra = "") =>
  `block min-h-[48px] w-full rounded-lg border bg-white px-3.5 text-base text-oxford-ink placeholder:text-oxford-mute transition disabled:bg-oxford-cream disabled:text-oxford-mute ${
    invalid ? "border-oxford-danger" : "border-oxford-ink/25 hover:border-oxford-ink/40 focus:border-oxford-ink"
  } ${extra}`.trim();

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Control inside the right edge of the input, e.g. show/hide password. */
  trailing?: ReactNode;
  wrapperClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, Props>(
  ({ id, label, error, hint, trailing, wrapperClassName = "", ...input }, ref) => {
    const describedBy =
      [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") ||
      undefined;
    return (
      <div className={wrapperClassName}>
        <label htmlFor={id} className="block text-sm font-semibold text-oxford-ink">
          {label}
        </label>
        <div className="relative mt-1.5">
          <input
            ref={ref}
            id={id}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={inputClass(Boolean(error), trailing ? "pr-12" : "")}
            {...input}
          />
          {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
        </div>
        {hint && (
          <div id={`${id}-hint`} className="mt-1.5 text-xs text-oxford-mute">
            {hint}
          </div>
        )}
        {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
      </div>
    );
  },
);
TextField.displayName = "TextField";
