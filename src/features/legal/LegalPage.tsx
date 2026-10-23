import { useParams } from "react-router-dom";
import { GraduationCap } from "lucide-react";

const COPY: Record<string, { title: string; body: string[] }> = {
  terms: {
    title: "Terms of Service",
    body: [
      "This is a placeholder for the Ultimate Student terms of service. The final text will be supplied by the university's legal team before launch.",
      "By using Ultimate Student you agree to abide by university policies, use the service in good faith, and treat other students respectfully. The university may update these terms with notice.",
      "This demo build stores a mock profile locally in your browser. No data leaves your device.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "This is a placeholder for the Ultimate Student privacy policy.",
      "In production, Ultimate Student will collect only the data needed to personalise your campus experience: identifier, student type, living situation and interests. Data will be stored securely and never sold.",
      "This demo stores all data in your browser's local storage. Clearing site data removes it.",
    ],
  },
};

export const LegalPage = () => {
  const { kind } = useParams<{ kind: string }>();
  const content = COPY[kind ?? ""] ?? COPY.terms;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-1.5 text-sm font-semibold text-slate-700">
          <GraduationCap className="h-4 w-4 text-brand-600" aria-hidden="true" />
          Ultimate Student
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900 display">
          {content.title}
        </h1>
        <div className="prose prose-slate mt-6 space-y-4 text-sm leading-relaxed text-slate-700">
          {content.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <p className="mt-10 text-xs text-slate-400">
          Last updated 2026-10-22 — placeholder content, not a legal document.
        </p>
      </main>
    </div>
  );
};
