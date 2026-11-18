import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { ContentType, DisplayStatus } from "@/services";
import { STATUS_LABEL, TYPE_LABEL } from "@/lib/cms";

// Compact, table-friendly building blocks for Admin. Same palette and fonts as the student app.

type Variant = "primary" | "secondary" | "danger" | "ghost";

const BTN: Record<Variant, string> = {
  primary: "bg-oxford-ink text-white hover:bg-oxford-ink2",
  secondary: "border border-oxford-ink/20 bg-white text-oxford-ink hover:bg-oxford-cream",
  danger: "border border-oxford-danger/40 bg-white text-oxford-danger hover:bg-oxford-danger/5",
  ghost: "text-oxford-ink hover:bg-oxford-cream",
};

export const abtn = (variant: Variant = "secondary", extra = "") =>
  `inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-md px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${BTN[variant]} ${extra}`.trim();

const STATUS_TONE: Record<DisplayStatus, string> = {
  draft: "bg-oxford-ink/5 text-oxford-ink2 ring-oxford-ink/15",
  "in-review": "bg-oxford-gold/15 text-oxford-ink ring-oxford-gold/50",
  returned: "bg-oxford-danger/10 text-oxford-danger ring-oxford-danger/30",
  approved: "bg-oxford-success/10 text-oxford-success ring-oxford-success/30",
  scheduled: "bg-oxford-sandSoft text-oxford-ink ring-oxford-gold/50",
  published: "bg-oxford-success/10 text-oxford-success ring-oxford-success/30",
  expired: "bg-oxford-ink/5 text-oxford-mute ring-oxford-ink/15",
  unpublished: "bg-oxford-ink/5 text-oxford-mute ring-oxford-ink/15",
};

export const StatusBadge = ({ status }: { status: DisplayStatus }) => (
  <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${STATUS_TONE[status]}`}>
    {STATUS_LABEL[status]}
  </span>
);

export const TypeBadge = ({ type }: { type: ContentType }) => (
  <span className="inline-flex items-center rounded bg-oxford-sandSoft px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-oxford-ink2">
    {TYPE_LABEL[type]}
  </span>
);

export const PageTitle = ({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="font-serif text-2xl font-medium text-oxford-ink">{title}</h1>
      {description && <div className="mt-0.5 text-sm text-oxford-mute">{description}</div>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const Card = ({ title, children, actions, className = "" }: { title?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-oxford-rule bg-white p-4 ${className}`}>
    {(title || actions) && (
      <div className="mb-3 flex items-center justify-between gap-2">
        {title && <h2 className="font-sans text-sm font-semibold text-oxford-ink">{title}</h2>}
        {actions}
      </div>
    )}
    {children}
  </section>
);

const control = (invalid?: boolean) =>
  `block w-full rounded-md border bg-white px-2.5 py-1.5 text-sm text-oxford-ink placeholder:text-oxford-mute focus:border-oxford-ink ${invalid ? "border-oxford-danger" : "border-oxford-ink/25"}`;

interface FieldProps {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children?: ReactNode;
}

export const Field = ({ id, label, hint, error, required, children }: FieldProps) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold text-oxford-ink">
      {label}
      {required && <span aria-hidden="true" className="text-oxford-danger"> *</span>}
      {required && <span className="sr-only"> (required)</span>}
    </label>
    <div className="mt-1">{children}</div>
    {hint && !error && (
      <p id={`${id}-hint`} className="mt-1 text-xs text-oxford-mute">
        {hint}
      </p>
    )}
    {error && (
      <p id={`${id}-error`} className="mt-1 text-xs font-semibold text-oxford-danger">
        {error}
      </p>
    )}
  </div>
);

const describedBy = (id: string, hint?: ReactNode, error?: string) => [hint && !error ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;

export const TextInput = ({ id, label, hint, error, required, ...rest }: FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, "id">) => (
  <Field id={id} label={label} hint={hint} error={error} required={required}>
    <input id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} className={control(Boolean(error))} {...rest} />
  </Field>
);

export const TextArea = ({ id, label, hint, error, required, ...rest }: FieldProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">) => (
  <Field id={id} label={label} hint={hint} error={error} required={required}>
    <textarea id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} className={control(Boolean(error))} {...rest} />
  </Field>
);

export const SelectInput = ({ id, label, hint, error, required, children, ...rest }: FieldProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id">) => (
  <Field id={id} label={label} hint={hint} error={error} required={required}>
    <select id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} className={control(Boolean(error))} {...rest}>
      {children}
    </select>
  </Field>
);

/** Table shell: sticky header, compact rows, scrolls sideways on small screens. */
export const Table = ({ caption, head, children }: { caption: string; head: ReactNode; children: ReactNode }) => (
  <div className="overflow-x-auto rounded-xl border border-oxford-rule bg-white">
    <table className="w-full min-w-[640px] text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="sticky top-0 bg-oxford-cream/80 text-xs uppercase tracking-wide text-oxford-mute">{head}</thead>
      <tbody className="divide-y divide-oxford-rule/70">{children}</tbody>
    </table>
  </div>
);

export const Th = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <th scope="col" className={`px-3 py-2 font-semibold ${className}`}>
    {children}
  </th>
);

export const Td = ({ children, className = "" }: { children?: ReactNode; className?: string }) => <td className={`px-3 py-2 align-top ${className}`}>{children}</td>;

export const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
