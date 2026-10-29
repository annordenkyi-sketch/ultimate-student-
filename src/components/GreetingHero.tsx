import { Link } from "react-router-dom";
import { Bell, Sparkles } from "lucide-react";
import { FEATURE_IMAGES, unsplash, unsplashSrcSet } from "@/lib/images";
import { useNotifications } from "@/hooks/useNotifications";
import { SearchBar } from "./SearchBar";
import { FadeIn } from "./Motion";

interface Props {
  firstName: string;
}

const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export const GreetingHero = ({ firstName }: Props) => {
  const img = FEATURE_IMAGES.campusGreeting;
  const { unreadCount } = useNotifications();

  return (
    <section
      aria-labelledby="greeting-heading"
      className="relative overflow-hidden rounded-b-3xl shadow-hero"
    >
      {/* Image */}
      <img
        src={unsplash(img.photoId, 1200, 65)}
        srcSet={unsplashSrcSet(img.photoId)}
        sizes="100vw"
        alt={img.alt}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Overlay for contrast */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-brand-900/60 via-brand-900/60 to-brand-900/80"
      />

      <div className="relative px-5 pb-5 pt-5 text-white">
        <div className="flex items-start justify-between">
          <FadeIn>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {greeting()}
            </span>
          </FadeIn>
          <Link
            to="/notifications"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
            className="relative rounded-full bg-white/15 p-2 text-white backdrop-blur-sm transition hover:bg-white/25"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold text-white"
              >
                {unreadCount}
              </span>
            )}
          </Link>
        </div>

        <FadeIn delay={0.05} y={16}>
          <h1
            id="greeting-heading"
            className="mt-4 text-3xl font-bold leading-tight display"
          >
            Hi {firstName},<br />
            <span className="text-brand-100">what do you need today?</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.15} className="mt-5">
          <SearchBar placeholder="Try: library, scholarship, clinic…" />
        </FadeIn>
      </div>
    </section>
  );
};
