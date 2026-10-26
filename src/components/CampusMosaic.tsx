import { motion, useReducedMotion } from "framer-motion";
import { MOSAIC_IMAGES, unsplash, type UnsplashImage } from "@/lib/images";

interface ColumnConfig {
  photos: UnsplashImage[];
  heights: number[];
  direction: "up" | "down";
  duration: number;
  className?: string;
}

// Vary heights so columns feel organic rather than grid-locked.
const H1 = [220, 160, 240, 180, 200, 170, 230, 190];
const H2 = [180, 220, 190, 240, 160, 210, 180, 220];
const H3 = [200, 180, 230, 170, 210, 240, 190, 160];
const H4 = [170, 210, 180, 230, 200, 160, 220, 190];

const shuffle = <T,>(arr: T[], offset: number): T[] =>
  arr.slice(offset).concat(arr.slice(0, offset));

const COLUMNS: ColumnConfig[] = [
  {
    photos: shuffle(MOSAIC_IMAGES, 0),
    heights: H1,
    direction: "up",
    duration: 48,
  },
  {
    photos: shuffle(MOSAIC_IMAGES, 3),
    heights: H2,
    direction: "down",
    duration: 56,
  },
  {
    photos: shuffle(MOSAIC_IMAGES, 6),
    heights: H3,
    direction: "up",
    duration: 44,
  },
  {
    photos: shuffle(MOSAIC_IMAGES, 2),
    heights: H4,
    direction: "down",
    duration: 60,
    className: "hidden md:block",
  },
];

const MosaicColumn = ({ photos, heights, direction, duration, className }: ColumnConfig) => {
  const reduce = useReducedMotion();
  // Double the content so we can loop seamlessly: half a full track = one set.
  const doubled = [...photos, ...photos];
  const yFrom = direction === "up" ? "0%" : "-50%";
  const yTo = direction === "up" ? "-50%" : "0%";

  return (
    <div
      className={`relative h-full overflow-hidden ${className ?? ""}`}
      aria-hidden="true"
    >
      <motion.div
        className="flex flex-col gap-3 will-change-transform"
        initial={{ y: yFrom }}
        animate={reduce ? undefined : { y: yTo }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        {doubled.map((img, i) => {
          const h = heights[i % heights.length];
          return (
            <img
              key={`${img.id}-${i}`}
              src={unsplash(img.photoId, 500, 55)}
              alt=""
              loading={i < 3 ? "eager" : "lazy"}
              decoding="async"
              className="w-full shrink-0 rounded-2xl bg-ink object-cover"
              style={{ height: h }}
            />
          );
        })}
      </motion.div>
    </div>
  );
};

export const CampusMosaic = () => (
  <div
    className="absolute inset-0 grid grid-cols-3 gap-3 p-3 md:grid-cols-4"
    aria-hidden="true"
  >
    {COLUMNS.map((col, i) => (
      <MosaicColumn key={i} {...col} />
    ))}
  </div>
);
