import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { btn } from "../button";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  /** Label while loading, e.g. "Signing in…". */
  loadingLabel?: string;
  variant?: "primary" | "secondary";
}

export const LoadingButton = ({
  loading = false,
  loadingLabel,
  variant = "primary",
  type = "submit",
  className = "",
  disabled,
  children,
  ...rest
}: Props) => (
  <button
    {...rest}
    type={type}
    disabled={loading || disabled}
    aria-busy={loading || undefined}
    className={btn(variant, `w-full ${className}`)}
  >
    {loading ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {loadingLabel ?? children}
      </>
    ) : (
      children
    )}
  </button>
);
