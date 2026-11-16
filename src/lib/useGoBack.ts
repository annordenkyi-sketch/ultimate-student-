import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/** True when there's an earlier page in this app's history to go back to. */
export const canGoBack = () => ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0;

/** Back to the screen the student came from, or to `fallback` if they arrived directly. */
export const useGoBack = (fallback: string) => {
  const navigate = useNavigate();
  return useCallback(() => {
    if (canGoBack()) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, fallback]);
};
