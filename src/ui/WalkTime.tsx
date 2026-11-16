import { Footprints } from "lucide-react";

/** "· 6 min walk". Only shown when the student's location is known and reliable. */
export const WalkTime = ({ minutes }: { minutes: number }) => (
  <span className="inline-flex items-center gap-1 text-oxford-ink2">
    <span aria-hidden="true">·</span>
    <Footprints className="h-3.5 w-3.5" aria-hidden="true" />
    {minutes} min walk
  </span>
);
