import { useEffect, useState } from "react";

const QUERY = "(min-width: 1024px)";

/** True at the desktop breakpoint (Tailwind `lg`), where layouts switch to side-by-side. */
export const useIsDesktop = () => {
  const [desktop, setDesktop] = useState(() => window.matchMedia(QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const on = () => setDesktop(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return desktop;
};
