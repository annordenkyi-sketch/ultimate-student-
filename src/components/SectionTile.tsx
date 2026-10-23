import { Link } from "react-router-dom";
import type { SectionMeta } from "@/lib/sectionConfig";
import { SECTION_IMAGES, unsplash, unsplashSrcSet } from "@/lib/images";
import { PressableDiv } from "./Motion";

interface Props {
  meta: SectionMeta;
}

/** Image-backed section shortcut: used in Home's 2-col grid. */
export const SectionTile = ({ meta }: Props) => {
  const Icon = meta.icon;
  const img = SECTION_IMAGES[meta.id];

  return (
    <PressableDiv className="h-full">
      <Link
        to={`/section/${meta.id}`}
        aria-label={`${meta.label} — ${meta.description}`}
        className="relative block h-32 overflow-hidden rounded-2xl shadow-card ring-1 ring-slate-200 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {/* Gradient fallback behind the image */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 ${meta.accent}`}
        />
        <img
          src={unsplash(img.photoId, 600)}
          srcSet={unsplashSrcSet(img.photoId)}
          sizes="(min-width: 480px) 220px, 44vw"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Dark overlay for text contrast */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent"
        />
        <div className="relative flex h-full flex-col justify-end p-3 text-white">
          <span className="flex items-center gap-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-white/80">
              Section
            </span>
          </span>
          <span className="mt-1 text-base font-semibold leading-tight display">
            {meta.shortLabel}
          </span>
        </div>
      </Link>
    </PressableDiv>
  );
};
