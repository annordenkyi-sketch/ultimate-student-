import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ImagePlus, X } from "lucide-react";
import { services, type IssueCategory } from "@/services";
import { imageErrorText, imageToDataUrl } from "@/lib/image";
import { useSession } from "@/session/SessionProvider";
import { btn } from "@/ui/button";
import { FieldError } from "@/ui/form/FieldError";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { TextField, inputClass } from "@/ui/form/TextField";
import { isEmail } from "@/ui/form/validation";
import { SectionHeader } from "./MoreLayout";

const CATEGORIES: IssueCategory[] = ["Something isn't working", "Wrong information", "Map or directions", "Account and sign-in", "Other"];

type Errors = Partial<Record<"category" | "description" | "email" | "screenshot", string>>;

/** Flow 07 "Report an issue": category, description, optional screenshot, then a confirmation. */
export const ReportIssueScreen = () => {
  const { account } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<IssueCategory | "">("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState(account?.email ?? "");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sent, setSent] = useState<{ reference: string; email: string } | null>(null);
  const back = { to: "/more/support", label: "Support" };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      setScreenshot(await imageToDataUrl(file, 1280));
      setErrors((e) => ({ ...e, screenshot: undefined }));
    } catch (e) {
      setErrors((x) => ({ ...x, screenshot: imageErrorText(e) }));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found: Errors = {};
    if (!category) found.category = "Choose what the problem is about.";
    if (description.trim().length < 10) found.description = "Describe the problem in a few words (at least 10 characters).";
    if (!isEmail(email)) found.email = "Enter an email address so we can reply.";
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById({ category: "issue-category", description: "issue-description", email: "issue-email" }[first as "category"] ?? "")?.focus();
      return;
    }
    setSending(true);
    setFailed(false);
    try {
      const { reference } = await services.support.report({ category: category as IssueCategory, description: description.trim(), screenshot, email: email.trim() });
      setSent({ reference, email: email.trim() });
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-xl">
        <SectionHeader title="Report an issue" back={back} />
        <div role="status" className="rounded-2xl border border-oxford-success/30 bg-oxford-success/5 p-5">
          <p className="flex items-center gap-2 font-semibold text-oxford-ink">
            <CheckCircle2 className="h-5 w-5 text-oxford-success" aria-hidden="true" />
            Thanks, your report has been sent
          </p>
          <p className="mt-2 text-sm text-oxford-ink2">
            Your reference is <strong>{sent.reference}</strong>. We'll email {sent.email} if we need more details.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to={back.to} className={btn("primary")}>
              Back to Support
            </Link>
            <button
              type="button"
              className={btn("secondary")}
              onClick={() => {
                setSent(null);
                setCategory("");
                setDescription("");
                setScreenshot(null);
              }}
            >
              Report another issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <SectionHeader title="Report an issue" description="Tell us what went wrong. A screenshot helps, but it's optional." back={back} />
      <form onSubmit={submit} noValidate className="space-y-5">
        <div>
          <label htmlFor="issue-category" className="block text-sm font-semibold text-oxford-ink">
            What is it about?
          </label>
          <select
            id="issue-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as IssueCategory)}
            aria-invalid={errors.category ? true : undefined}
            aria-describedby={errors.category ? "issue-category-error" : undefined}
            className={inputClass(Boolean(errors.category), "mt-1.5")}
          >
            <option value="">Choose a category</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          {errors.category && <FieldError id="issue-category-error">{errors.category}</FieldError>}
        </div>

        <div>
          <label htmlFor="issue-description" className="block text-sm font-semibold text-oxford-ink">
            What happened?
          </label>
          <textarea
            id="issue-description"
            rows={5}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={`issue-description-hint${errors.description ? " issue-description-error" : ""}`}
            className={`mt-1.5 w-full rounded-lg border bg-white p-3 text-base text-oxford-ink ${errors.description ? "border-oxford-danger" : "border-oxford-ink/25 focus:border-oxford-ink"}`}
          />
          <p id="issue-description-hint" className="mt-1 text-xs text-oxford-mute">
            Include the screen you were on and what you expected. {description.length}/1000
          </p>
          {errors.description && <FieldError id="issue-description-error">{errors.description}</FieldError>}
        </div>

        <div>
          <p className="text-sm font-semibold text-oxford-ink">
            Screenshot <span className="font-normal text-oxford-mute">(optional)</span>
          </p>
          <input ref={fileRef} type="file" accept="image/*" tabIndex={-1} aria-hidden="true" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          {screenshot ? (
            <div className="mt-2 flex items-start gap-3">
              <img src={screenshot} alt="Your screenshot" className="max-h-40 rounded-lg border border-oxford-rule" />
              <button
                type="button"
                onClick={() => setScreenshot(null)}
                className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-oxford-ink/20 bg-white px-3 text-sm font-semibold text-oxford-ink hover:bg-oxford-cream"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Remove
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} className={btn("secondary", "mt-2")}>
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              Add a screenshot
            </button>
          )}
          {errors.screenshot && <FieldError id="issue-screenshot-error">{errors.screenshot}</FieldError>}
        </div>

        <TextField
          id="issue-email"
          type="email"
          label="Email for a reply"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        {failed && (
          <FormAlert tone="error" title="Your report didn't send">
            Check your connection and try again.
          </FormAlert>
        )}
        <LoadingButton loading={sending} loadingLabel="Sending…" className="sm:w-auto">
          Send report
        </LoadingButton>
      </form>
    </div>
  );
};
