import { useEffect, useState } from "react";

/** Counts down once per second to zero; `restart` begins again. */
export const useCountdown = (initialSeconds: number) => {
  const [left, setLeft] = useState(initialSeconds);

  useEffect(() => {
    if (left <= 0) return;
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);

  return { left, restart: setLeft };
};
