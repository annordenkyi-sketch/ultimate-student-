import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export interface MobileBackButtonProps {
  /**
   * Called before any navigation. Return `true` to cancel the navigation —
   * e.g. the page closed an open card or cleared a drawn route.
   */
  onBeforeNavigate?: () => boolean;
  /** Where to go when there's no previous history entry (default `/`). */
  fallback?: string;
  /** Extra classes applied to the button. */
  className?: string;
  /** Override the accessible label. */
  ariaLabel?: string;
  /**
   * When true (default), the button is hidden at `lg` and above because the
   * desktop shell has a sidebar. Set to false to keep it visible everywhere
   * (used inside the mobile-styled `AppHeader`).
   */
  onlyMobile?: boolean;
}

/**
 * Round white back button, visible on mobile only. Always at least 44 × 44
 * CSS px so it stays comfortable to tap, with a soft shadow so it reads on
 * photos or maps.
 */
export const MobileBackButton = ({
  onBeforeNavigate,
  fallback = "/",
  className = "",
  ariaLabel = "Go back",
  onlyMobile = true,
}: MobileBackButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (onBeforeNavigate && onBeforeNavigate()) return;
    if (location.key && location.key !== "default") {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-md shadow-brand-900/20 ring-1 ring-black/5 transition hover:bg-paper motion-safe:active:scale-[0.96] ${
        onlyMobile ? "lg:hidden" : ""
      } ${className}`}
    >
      <ArrowLeft className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
    </button>
  );
};
