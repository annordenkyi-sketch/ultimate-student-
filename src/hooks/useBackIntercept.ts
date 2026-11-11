import { useEffect, useRef } from "react";

/**
 * While `active` is true, intercepts the next browser-back navigation
 * (phone back button, swipe gesture, or `navigate(-1)`) and runs `onBack()`
 * instead of leaving the page.
 *
 * Works by pushing a dummy history entry while `active` is true. When the
 * entry is popped — by a real back action — we fire `onBack` and let the
 * caller close whatever is open. If `active` turns false some other way
 * (e.g. the user tapped Close), we quietly pop the dummy entry so later
 * navigations aren't one step off.
 */
export const useBackIntercept = (
  active: boolean,
  onBack: () => void,
): void => {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!active) return;

    window.history.pushState({ __usBackIntercept: true }, "");

    let popped = false;
    const handler = () => {
      popped = true;
      onBackRef.current();
    };
    window.addEventListener("popstate", handler);

    return () => {
      window.removeEventListener("popstate", handler);
      if (!popped) {
        // Our dummy entry is still on top — quietly pop it so the real
        // history ends where it started before the intercept.
        try {
          window.history.back();
        } catch {
          /* no-op */
        }
      }
    };
  }, [active]);
};
