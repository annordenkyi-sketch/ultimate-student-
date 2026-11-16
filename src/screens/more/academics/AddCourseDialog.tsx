import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { services, type Course } from "@/services";
import { Modal } from "@/ui/Modal";
import { SearchField } from "@/ui/SearchField";

/** Find a course in the catalogue and add it as a manual entry. */
export const AddCourseDialog = ({
  open,
  semesterId,
  existing,
  onClose,
  onAdd,
}: {
  open: boolean;
  semesterId: string;
  existing: Set<string>;
  onClose: () => void;
  onAdd: (course: Course) => Promise<void>;
}) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Course[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setResults(null);
      setFailed(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || q.trim().length < 2) {
      setResults(null);
      return;
    }
    let live = true;
    const t = window.setTimeout(() => {
      services.courses.search(semesterId, q.trim()).then(
        (r) => live && (setResults(r), setFailed(false)),
        () => live && setFailed(true),
      );
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
  }, [q, open, semesterId]);

  return (
    <Modal open={open} onClose={onClose} title="Add a course" description="Search by course code or title. Courses you add are labelled as added by you.">
      <SearchField id="course-search" value={q} onChange={setQ} label="Search courses" placeholder="e.g. CSCD 307 or Databases" />
      <div className="mt-3 min-h-[6rem]" aria-live="polite">
        {failed && <p className="text-sm font-semibold text-oxford-danger">We couldn't search the catalogue. Try again.</p>}
        {!failed && q.trim().length < 2 && <p className="text-sm text-oxford-mute">Type at least 2 characters.</p>}
        {!failed && q.trim().length >= 2 && results === null && (
          <p className="flex items-center gap-2 text-sm text-oxford-mute">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Searching…
          </p>
        )}
        {results && results.length === 0 && <p className="text-sm text-oxford-mute">No courses match "{q.trim()}".</p>}
        {results && results.length > 0 && (
          <ul className="divide-y divide-oxford-rule/70">
            {results.map((c) => {
              const have = existing.has(c.code);
              return (
                <li key={c.code} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0 text-sm">
                    <span className="block font-semibold text-oxford-ink">{c.code}</span>
                    <span className="block text-oxford-mute">
                      {c.title} · {c.credits} credits
                    </span>
                  </span>
                  {have ? (
                    <span className="shrink-0 text-xs font-semibold text-oxford-mute">Already added</span>
                  ) : (
                    <button
                      type="button"
                      disabled={adding !== null}
                      onClick={async () => {
                        setAdding(c.code);
                        try {
                          await onAdd(c);
                        } finally {
                          setAdding(null);
                        }
                      }}
                      aria-label={`Add ${c.code} ${c.title}`}
                      className="inline-flex min-h-[40px] shrink-0 items-center gap-1 rounded-full border border-oxford-ink/20 bg-white px-3 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream disabled:opacity-50"
                    >
                      {adding === c.code ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                      Add
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
};
