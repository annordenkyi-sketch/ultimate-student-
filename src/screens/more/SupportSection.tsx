import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, MessageSquareWarning } from "lucide-react";
import { services } from "@/services";
import { Highlight } from "@/lib/highlight";
import { useAsync } from "@/lib/useAsync";
import { btn } from "@/ui/button";
import { LoadError, Skeleton } from "@/ui/DashCard";
import { SearchField } from "@/ui/SearchField";
import { SectionHeader } from "./MoreLayout";

/** Flow 07 "Support": searchable FAQ with expandable answers, and a way to report an issue. */
export const SupportSection = () => {
  const { state, reload } = useAsync(() => services.support.faqs(), []);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const faqs = state.status === "ready" ? state.data : [];
  const shown = faqs.filter((f) => words.every((w) => `${f.question} ${f.answer.join(" ")} ${f.topic}`.toLowerCase().includes(w)));
  const topics = [...new Set(shown.map((f) => f.topic))];

  return (
    <div className="max-w-3xl">
      <SectionHeader title="Support" description="Answers to common questions. If you can't find yours, report an issue." />

      <SearchField id="faq-search" value={q} onChange={setQ} label="Search help" placeholder="Search questions, e.g. reminders" />

      <div className="mt-5" aria-live="polite">
        {state.status === "loading" && <Skeleton lines={4} />}
        {state.status === "error" && <LoadError what="help topics" onRetry={reload} />}
        {state.status === "ready" &&
          (shown.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-oxford-rule px-5 py-8 text-center">
              <p className="font-semibold text-oxford-ink">No answers match "{q.trim()}"</p>
              <p className="mt-1 text-sm text-oxford-mute">Try a shorter word, or tell us what's wrong.</p>
              <Link to="/more/support/report" className={btn("primary", "mt-4")}>
                Report an issue
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {topics.map((topic) => (
                <section key={topic} aria-labelledby={`topic-${topic}`}>
                  <h2 id={`topic-${topic}`} className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-oxford-mute">
                    {topic}
                  </h2>
                  <ul className="divide-y divide-oxford-rule/70 rounded-2xl border border-oxford-rule bg-white/80">
                    {shown
                      .filter((f) => f.topic === topic)
                      .map((f) => {
                        const expanded = open === f.id || words.length > 0;
                        return (
                          <li key={f.id}>
                            <h3>
                              <button
                                type="button"
                                aria-expanded={expanded}
                                aria-controls={`faq-${f.id}`}
                                onClick={() => setOpen(open === f.id ? null : f.id)}
                                className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3 text-left font-sans text-base font-semibold text-oxford-ink transition hover:bg-oxford-cream"
                              >
                                <span>
                                  <Highlight text={f.question} query={q} />
                                </span>
                                <ChevronDown className={`h-5 w-5 shrink-0 text-oxford-mute transition ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
                              </button>
                            </h3>
                            <div id={`faq-${f.id}`} hidden={!expanded} className="space-y-2 px-4 pb-4 text-sm leading-relaxed text-oxford-ink2">
                              {f.answer.map((p) => (
                                <p key={p}>
                                  <Highlight text={p} query={q} />
                                </p>
                              ))}
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                </section>
              ))}
            </div>
          ))}
      </div>

      <section aria-labelledby="report-cta" className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-oxford-rule bg-white/80 p-5">
        <div className="flex items-start gap-3">
          <MessageSquareWarning className="mt-0.5 h-5 w-5 shrink-0 text-oxford-ink2" aria-hidden="true" />
          <div>
            <h2 id="report-cta" className="font-sans text-base font-semibold text-oxford-ink">
              Something not right?
            </h2>
            <p className="text-sm text-oxford-mute">Tell us about a problem or wrong information in the app.</p>
          </div>
        </div>
        <Link to="/more/support/report" className={btn("secondary")}>
          Report an issue
        </Link>
      </section>
    </div>
  );
};
