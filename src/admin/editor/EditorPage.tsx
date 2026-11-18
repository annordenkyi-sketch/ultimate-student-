import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Circle, Info } from "lucide-react";
import { errorCodeOf, services, type AdminReference, type ContentItem, type ContentMeta, type ContentPayload, type ContentType, type EventPayload, type NewsPayload, type PlacePayload, type ServicePayload, type TimetablePayload } from "@/services";
import { checklist, emptyMeta, emptyPayload, TYPE_LABEL } from "@/lib/cms";
import { useAdmin, useUnsavedGuard, GuardedLink, canWrite } from "../AdminAuth";
import { useReference } from "../data";
import { abtn, formatWhen, PageTitle } from "../ui";
import { ERROR_TEXT, fid, MetaFields, type Errors } from "./fields";
import { EventForm, NewsForm, ServiceForm } from "./forms";
import { StudentPreview } from "./Preview";
import { TimetableForm } from "./TimetableForm";

// Leaflet only loads when a place is being edited.
const PlaceForm = lazy(() => import("./PlaceForm").then((m) => ({ default: m.PlaceForm })));

const TYPES = Object.keys(TYPE_LABEL) as ContentType[];

interface Draft {
  payload: ContentPayload;
  meta: ContentMeta;
}

/** Flow 10 editors: form on the left, live student preview on the right. */
export const EditorPage = () => {
  const { id, type: typeParam } = useParams();
  const { user } = useAdmin();
  const ref = useReference();
  const [item, setItem] = useState<ContentItem | null | "loading">(id ? "loading" : null);

  useEffect(() => {
    if (!id) return;
    let live = true;
    services.admin.get(id).then((i) => live && setItem(i));
    return () => {
      live = false;
    };
  }, [id]);

  if (!canWrite(user))
    return (
      <>
        <PageTitle title="Editing isn't available" />
        <p className="text-sm text-oxford-ink2">Your role can review and publish content, but not edit it.</p>
      </>
    );
  if (!id && !TYPES.includes(typeParam as ContentType)) return <PageTitle title="Unknown content type" description={<Link to="/admin/content/new" className="underline">Choose a type</Link>} />;
  if (item === "loading" || ref.state.status === "loading") return <p role="status" className="text-sm text-oxford-mute">Loading the editor…</p>;
  if (ref.state.status === "error") return <p role="alert" className="text-sm text-oxford-danger">The editor didn't load. Refresh to try again.</p>;
  if (id && !item) return <PageTitle title="Content not found" description="It may have been discarded." />;

  return <Editor key={id ?? typeParam} item={item} type={item ? item.type : (typeParam as ContentType)} reference={ref.state.data} />;
};

const Editor = ({ item: initial, type, reference }: { item: ContentItem | null; type: ContentType; reference: AdminReference }) => {
  const { user } = useAdmin();
  const [item, setItem] = useState(initial);
  const { setDirty } = useUnsavedGuard();
  const navigate = useNavigate();
  const location = useLocation();
  const current = reference.semesters.find((s) => s.current)?.id;
  const start = (): Draft => {
    const v = item?.working ?? item?.live;
    return v ? { payload: v.payload, meta: { ...emptyMeta(), ...v.meta } } : { payload: emptyPayload(type, { semesterId: current }), meta: emptyMeta() };
  };
  const [draft, setDraft] = useState<Draft>(start);
  const [saved, setSaved] = useState(() => JSON.stringify(start()));
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState<"save" | "submit" | null>(null);
  const [flash, setFlash] = useState<string | null>((location.state as { flash?: string } | null)?.flash ?? null);
  const [failure, setFailure] = useState<string | null>(null);
  const [view, setView] = useState<"form" | "preview">("form");
  const summaryRef = useRef<HTMLDivElement>(null);

  const dirty = JSON.stringify(draft) !== saved;
  useEffect(() => setDirty(dirty), [dirty, setDirty]);
  useEffect(() => () => setDirty(false), [setDirty]);

  const checks = useMemo(() => checklist(type, draft.payload, draft.meta), [type, draft]);
  const missing = checks.filter((c) => !c.ok);
  const errors: Errors = showErrors ? Object.fromEntries(missing.map((c) => [c.field, ERROR_TEXT[c.field] ?? `Complete: ${c.label}`])) : {};

  const setPayload = (patch: Partial<ContentPayload>) => {
    setFlash(null);
    setDraft((d) => ({ ...d, payload: { ...d.payload, ...patch } as ContentPayload }));
  };
  const setMeta = (meta: ContentMeta) => {
    setFlash(null);
    setDraft((d) => ({ ...d, meta }));
  };

  const persist = async (): Promise<ContentItem> => {
    const next = item ? await services.admin.saveDraft(user!.id, item.id, draft.payload, draft.meta) : await services.admin.create(user!.id, type, draft.payload, draft.meta);
    setSaved(JSON.stringify(draft));
    setItem(next);
    return next;
  };

  const saveDraft = async () => {
    setBusy("save");
    setFailure(null);
    try {
      const next = await persist();
      setDirty(false);
      const msg = `Draft saved at ${formatWhen(next.updatedAt).split(", ").pop()}.`;
      if (!item) navigate(`/admin/content/${next.id}/edit`, { replace: true, state: { flash: msg } });
      else setFlash(msg);
    } catch {
      setFailure("The draft didn't save. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const submit = async () => {
    if (missing.length) {
      setShowErrors(true);
      setView("form");
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setBusy("submit");
    setFailure(null);
    try {
      const unchanged = item?.working && !dirty && (item.working.status === "draft" || item.working.status === "returned");
      const target = unchanged ? item! : await persist();
      const next = await services.admin.submit(user!.id, target.id);
      setDirty(false);
      navigate(`/admin/content/${next.id}`, { replace: true, state: { flash: "Submitted for review. A reviewer will approve it or send it back with comments." } });
    } catch (e) {
      setFailure(errorCodeOf(e) === "forbidden" ? "Some required fields are missing." : "It didn't submit. Try again.");
      setBusy(null);
    }
  };

  const focusField = (field: string) => {
    setView("form");
    requestAnimationFrame(() => {
      const el = document.getElementById(fid(field));
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      el?.focus({ preventScroll: true });
    });
  };

  const w = item?.working;
  const editingLive = Boolean(item?.live);
  const nextNumber = w?.number ?? (item ? Math.max(...item.versions.map((v) => v.number)) + 1 : 1);
  const noun = type === "news" ? "news item" : TYPE_LABEL[type].toLowerCase();
  const title = item ? `Edit ${noun}` : `New ${noun}`;
  const formProps = { errors, reference, onChange: setPayload };

  const form = (() => {
    switch (type) {
      case "news":
        return <NewsForm value={draft.payload as NewsPayload} {...formProps} />;
      case "event":
        return <EventForm value={draft.payload as EventPayload} {...formProps} />;
      case "service":
        return <ServiceForm value={draft.payload as ServicePayload} {...formProps} />;
      case "timetable":
        return <TimetableForm value={draft.payload as TimetablePayload} {...formProps} />;
      case "place":
        return (
          <Suspense fallback={<p className="text-sm text-oxford-mute">Loading the map…</p>}>
            <PlaceForm value={draft.payload as PlacePayload} {...formProps} />
          </Suspense>
        );
    }
  })();

  return (
    <>
      <PageTitle
        title={title}
        description={
          <>
            <GuardedLink to={item ? `/admin/content/${item.id}` : "/admin/content/new"} className="underline underline-offset-2">
              {item ? "Back to the item" : "Choose a different type"}
            </GuardedLink>
            {item && <span> · Version {nextNumber}</span>}
          </>
        }
      />

      <div className="space-y-2">
        {w?.status === "returned" && w.comment && (
          <div role="note" className="flex gap-2 rounded-lg border border-oxford-danger/30 bg-oxford-danger/5 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-oxford-danger" aria-hidden="true" />
            <p>
              <span className="font-semibold text-oxford-danger">Returned for correction</span>
              {w.reviewedAt && <span className="text-oxford-mute"> · {formatWhen(w.reviewedAt)}</span>}
              <span className="mt-0.5 block text-oxford-ink">“{w.comment}”</span>
            </p>
          </div>
        )}
        {editingLive && (
          <p className="flex gap-2 rounded-lg border border-oxford-rule bg-white p-3 text-sm text-oxford-ink2">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            You're editing version {nextNumber}. Version {item!.live!.number} stays live for students until this one is approved and published.
          </p>
        )}
        {w?.status === "in-review" && <p className="rounded-lg border border-oxford-gold/50 bg-oxford-gold/10 p-3 text-sm">This version is in review. Saving changes takes it out of review until you submit it again.</p>}
        {w?.status === "approved" && <p className="rounded-lg border border-oxford-gold/50 bg-oxford-gold/10 p-3 text-sm">This version is approved{item?.publishAt ? " and scheduled" : ""}. Saving changes cancels the approval{item?.publishAt ? " and the scheduled publish" : ""}.</p>}
        {flash && (
          <p role="status" className="flex items-center gap-2 rounded-lg border border-oxford-success/30 bg-oxford-success/10 p-3 text-sm font-semibold text-oxford-success">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {flash}
          </p>
        )}
        {failure && (
          <p role="alert" className="rounded-lg border border-oxford-danger/30 bg-oxford-danger/5 p-3 text-sm font-semibold text-oxford-danger">
            {failure}
          </p>
        )}
        {showErrors && missing.length > 0 && (
          <div ref={summaryRef} tabIndex={-1} role="alert" className="scroll-mt-20 rounded-lg border border-oxford-danger/40 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-oxford-danger/40">
            <p className="font-semibold text-oxford-danger">
              {missing.length === 1 ? "1 thing needs fixing" : `${missing.length} things need fixing`} before you can submit:
            </p>
            <ul className="mt-1 list-disc pl-5">
              {missing.map((c) => (
                <li key={c.field}>
                  <button type="button" onClick={() => focusField(c.field)} className="text-left underline underline-offset-2">
                    {ERROR_TEXT[c.field] ?? c.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div role="tablist" aria-label="Editor view" className="mt-4 inline-flex rounded-lg border border-oxford-rule bg-white p-1 xl:hidden">
        {(["form", "preview"] as const).map((v) => (
          <button key={v} role="tab" type="button" aria-selected={view === v} onClick={() => setView(v)} className={`rounded-md px-3 py-1.5 text-sm font-semibold ${view === v ? "bg-oxford-ink text-white" : "text-oxford-ink2"}`}>
            {v === "form" ? "Form" : "Student preview"}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className={`min-w-0 space-y-4 ${view === "form" ? "" : "hidden xl:block"}`}>
          {form}
          <MetaFields type={type} meta={draft.meta} onChange={setMeta} errors={errors} reference={reference} />
        </div>

        <aside className={`space-y-4 xl:sticky xl:top-20 xl:self-start ${view === "preview" ? "" : "hidden xl:block"}`}>
          <StudentPreview type={type} payload={draft.payload} meta={draft.meta} reference={reference} />
        </aside>
      </div>

      {/* Checklist and actions stay in reach while scrolling a long form. */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-5 border-t border-oxford-rule bg-oxford-paper/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <details className="group min-w-0 flex-1">
            <summary className="cursor-pointer list-none text-sm">
              <span className="font-semibold">Required fields: {checks.length - missing.length} of {checks.length} done</span>
              <span className="ml-2 text-oxford-mute underline underline-offset-2 group-open:hidden">Show checklist</span>
              <span className="ml-2 hidden text-oxford-mute underline underline-offset-2 group-open:inline">Hide checklist</span>
            </summary>
            <ul className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
              {checks.map((c) => (
                <li key={c.field}>
                  <button type="button" onClick={() => focusField(c.field)} className="flex items-center gap-1.5 text-left text-sm hover:underline">
                    {c.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-oxford-success" aria-hidden="true" /> : <Circle className="h-4 w-4 shrink-0 text-oxford-mute" aria-hidden="true" />}
                    <span className={c.ok ? "text-oxford-ink2" : "font-semibold text-oxford-ink"}>{c.label}</span>
                    <span className="sr-only">{c.ok ? "(done)" : "(to do)"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </details>
          {dirty && <span className="text-xs font-semibold text-oxford-mute">Unsaved changes</span>}
          <GuardedLink to={item ? `/admin/content/${item.id}` : "/admin/content"} className={abtn("ghost")}>
            Cancel
          </GuardedLink>
          <button type="button" onClick={saveDraft} disabled={busy !== null || (!dirty && Boolean(item))} className={abtn("secondary")}>
            {busy === "save" ? "Saving…" : "Save draft"}
          </button>
          <button type="button" onClick={submit} disabled={busy !== null} className={abtn("primary")}>
            {busy === "submit" ? "Submitting…" : "Submit for review"}
          </button>
        </div>
      </div>
    </>
  );
};
