import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { DetailsLayout } from "@/components/DetailsLayout";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { dataService } from "@/data/service";
import type { SectionId, SectionItem } from "@/data/types";
import { SECTIONS } from "@/lib/sectionConfig";

export const DetailsPage = () => {
  const { sectionId, itemId } = useParams<{
    sectionId: SectionId;
    itemId: string;
  }>();
  const [item, setItem] = useState<SectionItem | null | undefined>(undefined);
  const validSection = SECTIONS.find((s) => s.id === sectionId);

  useEffect(() => {
    if (!sectionId || !itemId || !validSection) return;
    setItem(undefined);
    let cancelled = false;
    dataService.getItem(sectionId, itemId).then((data) => {
      if (!cancelled) setItem(data ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [sectionId, itemId, validSection]);

  if (!sectionId || !itemId || !validSection) return <Navigate to="/" replace />;

  return (
    <>
      <AppHeader showSearch={false} showBack />
      {item === undefined && <LoadingState rows={6} />}
      {item === null && (
        <EmptyState
          title="Item not found"
          description="This item may have been removed."
        />
      )}
      {item && <DetailsLayout item={item} />}
    </>
  );
};
