import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bookmark, BookmarkCheck, ExternalLink, Loader2, Navigation, Share2 } from "lucide-react";
import type { SavedKind } from "@/services";
import { useActivity } from "@/session/ActivityProvider";
import { useSession } from "@/session/SessionProvider";

export const actionButtonClass =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-oxford-ink/20 bg-white px-4 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream disabled:opacity-60";

export const primaryActionClass =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-oxford-ink px-4 text-sm font-semibold text-white transition hover:bg-oxford-ink2";

/** Campus map with this place as the destination. */
export const directionsTo = (placeId: string) => `/map?to=${encodeURIComponent(placeId)}`;

/**
 * Save / Saved toggle with a confirmation. Guests sign in first, come back to
 * this page, and the item is saved for them.
 */
export const SaveButton = ({ kind, id, title }: { kind: SavedKind; id: string; title: string }) => {
  const { account } = useSession();
  const { isSaved, setSaved, saveAfterSignIn, savedAfterSignIn } = useActivity();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; failed?: boolean } | null>(null);
  const saved = isSaved(kind, id);
  const justSavedAfterSignIn = savedAfterSignIn?.kind === kind && savedAfterSignIn.id === id;

  const toggle = async () => {
    if (!account) {
      saveAfterSignIn({ kind, id, title });
      navigate(`/start?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      await setSaved({ kind, id, title }, !saved);
      setNote({ text: saved ? "Removed from your Saved items" : "Saved to your Saved items" });
    } catch {
      setNote({ text: "That didn't work. Try again.", failed: true });
    } finally {
      setBusy(false);
    }
  };

  const message = note ?? (justSavedAfterSignIn && saved ? { text: "Signed in and saved to your Saved items" } : null);

  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <button type="button" onClick={toggle} disabled={busy} aria-pressed={saved} className={actionButtonClass}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : saved ? (
          <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Bookmark className="h-4 w-4" aria-hidden="true" />
        )}
        {saved ? "Saved" : "Save"}
      </button>
      <span
        role="status"
        className={`text-sm font-semibold ${message?.failed ? "text-oxford-danger" : "text-oxford-success"}`}
      >
        {message?.text}
      </span>
    </span>
  );
};

/** System share sheet where available; otherwise copies the link. */
export const ShareButton = ({ title }: { title: string }) => {
  const [status, setStatus] = useState<{ text: string; failed?: boolean } | null>(null);

  const share = async () => {
    const url = window.location.href;
    setStatus(null);
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        // Fall through to copying the link.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus({ text: "Link copied" });
    } catch {
      setStatus({ text: "Couldn't copy the link", failed: true });
    }
  };

  return (
    <span className="inline-flex items-center gap-3">
      <button type="button" onClick={share} className={actionButtonClass}>
        <Share2 className="h-4 w-4" aria-hidden="true" />
        Share
      </button>
      <span role="status" className={`text-sm font-semibold ${status?.failed ? "text-oxford-danger" : "text-oxford-success"}`}>
        {status?.text}
      </span>
    </span>
  );
};

export const DirectionsButton = ({ placeId, primary = true }: { placeId: string; primary?: boolean }) => (
  <Link to={directionsTo(placeId)} className={primary ? primaryActionClass : actionButtonClass}>
    <Navigation className="h-4 w-4" aria-hidden="true" />
    Directions
  </Link>
);

/** Official website: opens in a new tab and says so. */
export const OfficialLink = ({ href, label = "Official website" }: { href: string; label?: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={actionButtonClass}>
    {label}
    <ExternalLink className="h-4 w-4" aria-hidden="true" />
    <span className="sr-only">(opens in a new tab)</span>
  </a>
);

/** Venue line: Directions when the venue is on the campus map, a note when it isn't. */
export const VenueLine = ({ venue, placeId }: { venue: string | null; placeId: string | null | undefined }) => {
  if (!venue) return <span className="font-medium text-oxford-danger">Venue not confirmed</span>;
  if (!placeId) {
    return (
      <>
        {venue}
        <span className="mt-0.5 block text-sm text-oxford-mute">Location not confirmed on the map yet</span>
      </>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {venue}
      <Link
        to={directionsTo(placeId)}
        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-oxford-ink/20 bg-white px-3 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream"
      >
        <Navigation className="h-4 w-4" aria-hidden="true" />
        Directions
      </Link>
    </span>
  );
};
