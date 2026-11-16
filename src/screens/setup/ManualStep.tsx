import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, Plus, Search, X } from "lucide-react";
import { services, type Course } from "@/services";
import { FieldError } from "@/ui/form/FieldError";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { inputClass } from "@/ui/form/TextField";
import { AuthHeading, BackLink } from "../auth/parts";
import { useSetup } from "./SetupLayout";

type SearchState =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "done"; results: Course[] }
  | { status: "failed" };

/** Flow 02 "Add courses manually": search, add, remove, with a running count. */
export const ManualStep = () => {
  const { progress, update } = useSetup();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const added = progress.courses;
  const credits = added.reduce((sum, c) => sum + c.credits, 0);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearch({ status: "idle" });
      return;
    }
    const id = ++requestId.current;
    setSearch({ status: "searching" });
    const t = window.setTimeout(() => {
      services.courses.search(progress.semesterId ?? "", q).then(
        (results) => id === requestId.current && setSearch({ status: "done", results }),
        () => id === requestId.current && setSearch({ status: "failed" }),
      );
    }, 250);
    return () => window.clearTimeout(t);
  }, [query, progress.semesterId]);

  const add = (course: Course) => {
    if (added.some((c) => c.code === course.code)) return;
    update({ courses: [...added, course] });
    setError(null);
  };

  const remove = (code: string) => update({ courses: added.filter((c) => c.code !== code) });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (added.length === 0) {
      setError("Add at least one course to continue.");
      document.getElementById("course-search")?.focus();
      return;
    }
    navigate("/onboarding/timetable");
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <BackLink to="/onboarding/method" />
      <AuthHeading title="Add your courses">Search by course code or title.</AuthHeading>

      <label htmlFor="course-search" className="block text-sm font-semibold text-oxford-ink">
        Search courses
      </label>
      <div className="relative mt-1.5">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-oxford-mute"
          aria-hidden="true"
        />
        <input
          id="course-search"
          type="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          placeholder="e.g. CSCD 301 or Networks"
          aria-describedby="search-status"
          className={inputClass(Boolean(error), "pl-11")}
        />
      </div>

      <div id="search-status" aria-live="polite" className="mt-3">
        {search.status === "idle" && (
          <p className="text-sm text-oxford-mute">Try a course code like CSCD 301, or part of a title.</p>
        )}
        {search.status === "searching" && (
          <p className="flex items-center gap-2 text-sm text-oxford-mute">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Searching…
          </p>
        )}
        {search.status === "failed" && (
          <FormAlert tone="error" title="Search isn't working right now">
            Check your connection, then search again.
          </FormAlert>
        )}
        {search.status === "done" && search.results.length === 0 && (
          <p className="text-sm text-oxford-mute">
            No courses match "{query.trim()}". Check the code, or try part of the title.
          </p>
        )}
        {search.status === "done" && search.results.length > 0 && (
          <ul aria-label="Search results" className="divide-y divide-oxford-rule overflow-hidden rounded-xl border border-oxford-rule bg-white">
            {search.results.map((c) => {
              const isAdded = added.some((a) => a.code === c.code);
              return (
                <li key={c.code} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-oxford-ink">{c.code}</span>
                    <span className="block truncate text-sm text-oxford-mute">
                      {c.title} · {c.credits} credits
                    </span>
                  </span>
                  {isAdded ? (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-oxford-success">
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Added
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => add(c)}
                      aria-label={`Add ${c.code} ${c.title}`}
                      className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-oxford-ink/20 px-3 text-sm font-semibold text-oxford-ink transition hover:bg-oxford-cream"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Add
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <section aria-labelledby="added-heading" className="mt-7">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="added-heading" className="font-sans text-sm font-semibold text-oxford-ink">
            Your courses
          </h2>
          <p className="text-sm text-oxford-mute" aria-live="polite">
            {added.length} {added.length === 1 ? "course" : "courses"} · {credits} credits
          </p>
        </div>
        {added.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-oxford-rule px-4 py-6 text-center text-sm text-oxford-mute">
            No courses added yet. Search above to add your first course.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-oxford-rule overflow-hidden rounded-xl border border-oxford-rule bg-white">
            {added.map((c) => (
              <li key={c.code} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-oxford-ink">{c.code}</span>
                  <span className="block truncate text-sm text-oxford-mute">{c.title}</span>
                </span>
                <button
                  type="button"
                  onClick={() => remove(c.code)}
                  aria-label={`Remove ${c.code} ${c.title}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-oxford-mute transition hover:bg-oxford-cream hover:text-oxford-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {error && <FieldError id="manual-error">{error}</FieldError>}

      <LoadingButton className="mt-6">Continue</LoadingButton>
    </form>
  );
};
