import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { services } from "@/services";
import { useAsync } from "@/lib/useAsync";
import { useActivity } from "@/session/ActivityProvider";
import { OfficialLink, SaveButton, ShareButton } from "@/ui/ContentActions";
import { Paperclip } from "lucide-react";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { DetailHeader, NotFound } from "./DetailHeader";

const BACK = { to: "/announcements", label: "Announcements" };

/** Flow 03 "Announcement details": full text, save and share. Opening it marks it read. */
export const AnnouncementDetailsScreen = () => {
  const { id = "" } = useParams();
  const { state, reload } = useAsync(() => services.content.announcement(id), [id]);
  const { markAnnouncementRead } = useActivity();

  const found = state.status === "ready" && state.data !== null;
  useEffect(() => {
    if (found) markAnnouncementRead(id);
  }, [found, id, markAnnouncementRead]);

  if (state.status === "loading") return <Skeleton lines={5} />;
  if (state.status === "error") return <LoadError what="this announcement" onRetry={reload} />;
  if (!state.data) return <NotFound what="Announcement" back={BACK} />;

  const a = state.data;
  const published = new Date(a.publishedAt);

  return (
    <article className="max-w-3xl">
      <DetailHeader back={BACK} eyebrow={a.category} title={a.title}>
        {a.source} ·{" "}
        <time dateTime={a.publishedAt}>
          {published.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </time>
      </DetailHeader>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SaveButton kind="announcement" id={a.id} title={a.title} />
        <ShareButton title={a.title} />
      </div>

      <div className="space-y-4 rounded-2xl border border-oxford-rule bg-white/80 p-5 leading-relaxed text-oxford-ink2 md:p-7">
        {a.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
        {(a.link || a.attachmentName) && (
          <div className="flex flex-wrap gap-3 border-t border-oxford-rule/70 pt-4">
            {a.link && <OfficialLink href={a.link} label="More information" />}
            {a.attachmentName && (
              <span className="inline-flex items-center gap-2 rounded-md border border-oxford-ink/20 bg-white px-4 py-2 text-sm font-semibold text-oxford-ink">
                <Paperclip className="h-4 w-4" aria-hidden="true" />
                {a.attachmentName}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
