import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { ListItem } from "@/components/ListItem";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ChecklistItemRow } from "@/components/ChecklistItem";
import { Bookmark, ListChecks } from "lucide-react";
import { useSaved } from "@/hooks/useSaved";
import { useChecklist } from "@/hooks/useChecklist";
import { dataService } from "@/data/service";
import type { SectionId, SectionItem } from "@/data/types";

type Tab = "saved" | "checklist";

const SECTION_PREFIX_MAP: Record<string, SectionId> = {
  acad: "academic",
  nav: "navigation",
  acc: "accommodation",
  svc: "services",
  soc: "social",
  opp: "opportunities",
};

const resolveHelpLink = (helpItemId: string) => {
  const prefix = helpItemId.split("-")[0];
  const section = SECTION_PREFIX_MAP[prefix];
  if (!section) return null;
  return { section, itemId: helpItemId };
};

export const SavedPage = () => {
  const [params, setParams] = useSearchParams();
  const initialTab = (params.get("tab") as Tab) ?? "saved";
  const [tab, setTab] = useState<Tab>(initialTab);
  const { saved } = useSaved();
  const { tasks, toggleTask, progress } = useChecklist();
  const [items, setItems] = useState<SectionItem[] | null>(null);

  useEffect(() => {
    setParams({ tab }, { replace: true });
  }, [tab, setParams]);

  useEffect(() => {
    let cancelled = false;
    dataService
      .getItemsByIds(saved.map((s) => ({ section: s.section, itemId: s.itemId })))
      .then((data) => {
        if (!cancelled) setItems(data);
      });
    return () => {
      cancelled = true;
    };
  }, [saved]);

  const pct = useMemo(
    () => (progress.total ? Math.round((progress.done / progress.total) * 100) : 0),
    [progress],
  );

  return (
    <>
      <AppHeader title="Saved" showSearch={false} />
      <div
        role="tablist"
        aria-label="Saved views"
        className="mx-4 mb-2 flex overflow-hidden rounded-xl bg-slate-100 p-1 text-sm"
      >
        <button
          role="tab"
          aria-selected={tab === "saved"}
          onClick={() => setTab("saved")}
          className={`flex-1 rounded-lg px-3 py-1.5 font-medium transition ${
            tab === "saved" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
          }`}
        >
          Items
        </button>
        <button
          role="tab"
          aria-selected={tab === "checklist"}
          onClick={() => setTab("checklist")}
          className={`flex-1 rounded-lg px-3 py-1.5 font-medium transition ${
            tab === "checklist"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600"
          }`}
        >
          Checklist
        </button>
      </div>

      {tab === "saved" && (
        <div className="px-4 pb-6">
          {items == null && <LoadingState rows={3} />}
          {items && items.length === 0 && (
            <EmptyState
              icon={Bookmark}
              title="Nothing saved yet"
              description="Save items from any section to find them here."
            />
          )}
          {items && items.length > 0 && (
            <div className="space-y-2">
              {items.map((i) => (
                <ListItem key={i.id} item={i} showSection />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "checklist" && (
        <div className="px-4 pb-6">
          <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              {progress.done} of {progress.total} done
            </p>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Checklist progress"
            >
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          {tasks.length === 0 ? (
            <EmptyState icon={ListChecks} title="No tasks" />
          ) : (
            <ul className="space-y-2">
              {tasks.map((t) => (
                <ChecklistItemRow
                  key={t.id}
                  task={t}
                  onToggle={toggleTask}
                  resolveLink={resolveHelpLink}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
};
