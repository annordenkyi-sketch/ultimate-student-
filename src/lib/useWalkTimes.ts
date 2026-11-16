import { useEffect, useState } from "react";
import { services } from "@/services";
import { isReliable } from "./geo";

/**
 * Walking minutes from the student's current position to each place.
 * Null when location isn't shared, isn't accurate, or is off campus: walking
 * times are then hidden rather than guessed. Never prompts for permission.
 */
export const useWalkTimes = (placeIds: string[]): Record<string, number> | null => {
  const key = placeIds.join(",");
  const [times, setTimes] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let live = true;
    const ids = key ? key.split(",") : [];
    (async () => {
      const fix = await services.location.peek();
      if (!fix || !isReliable(fix, services.campus.area) || ids.length === 0) return null;
      return services.campus.walkingMinutes(fix, ids);
    })().then(
      (t) => live && setTimes(t),
      () => live && setTimes(null),
    );
    return () => {
      live = false;
    };
  }, [key]);

  return times;
};
