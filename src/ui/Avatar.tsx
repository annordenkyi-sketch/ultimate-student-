const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

const SIZES = { md: "h-9 w-9 text-xs", lg: "h-14 w-14 text-base", xl: "h-24 w-24 text-2xl" } as const;

/** Profile photo, or initials when there isn't one. Decorative: the name is always shown beside it. */
export const Avatar = ({ name, photo, size = "md" }: { name: string; photo?: string | null; size?: keyof typeof SIZES }) =>
  photo ? (
    <img src={photo} alt="" className={`shrink-0 rounded-full object-cover ${SIZES[size]}`} />
  ) : (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-oxford-ink font-semibold text-white ${SIZES[size]}`}
    >
      {initialsOf(name)}
    </span>
  );
