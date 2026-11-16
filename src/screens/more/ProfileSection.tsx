import { useRef, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { imageErrorText, imageToDataUrl } from "@/lib/image";
import { useAcademicNames } from "@/lib/useAcademicNames";
import { useSession } from "@/session/SessionProvider";
import { Avatar } from "@/ui/Avatar";
import { btn } from "@/ui/button";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { TextField } from "@/ui/form/TextField";
import { PersonalSection, SectionHeader } from "./MoreLayout";

const PHONE = /^\+?[\d\s-]{9,16}$/;

/** Flow 07 "Profile": official details (locked) and the fields the student can edit. */
export const ProfileSection = () => (
  <PersonalSection title="Profile" includes={["Your name, student ID, programme and level", "A profile photo, preferred name and phone number"]}>
    <ProfileContent />
  </PersonalSection>
);

const ProfileContent = () => {
  const { account, updateAccount } = useSession();
  const names = useAcademicNames(account);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preferredName, setPreferredName] = useState(account?.preferredName ?? "");
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [errors, setErrors] = useState<{ phone?: string }>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [photoNote, setPhotoNote] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  if (!account) return null;

  const official: [string, string][] = [
    ["Full name", account.name],
    ["Student ID", account.studentId ?? "Not added"],
    ["Email", account.email],
    ["Programme", names?.programme ?? (account.academic ? "…" : "Not set")],
    ["Department", names?.department ?? (account.academic ? "…" : "Not set")],
    ["Level", account.academic?.level ?? "Not set"],
  ];

  const choosePhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoNote(null);
    try {
      const photo = await imageToDataUrl(file, 256);
      updateAccount({ photo });
      setPhotoNote({ tone: "success", text: "Photo updated." });
    } catch (e) {
      setPhotoNote({ tone: "error", text: imageErrorText(e) });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (phone.trim() && !PHONE.test(phone.trim())) {
      setErrors({ phone: "Enter a phone number with 9 to 15 digits, for example +233 24 123 4567." });
      document.getElementById("profile-phone")?.focus();
      return;
    }
    setErrors({});
    setSaving(true);
    setNotice(null);
    // Saves straight away on this device; the account service is updated in the background.
    updateAccount({ preferredName: preferredName.trim() || null, phone: phone.trim() || null });
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    setNotice({ tone: "success", text: "Profile saved." });
  };

  return (
    <div className="max-w-2xl">
      <SectionHeader title="Profile" />

      <section aria-labelledby="photo-title" className="rounded-2xl border border-oxford-rule bg-white/80 p-5">
        <h2 id="photo-title" className="sr-only">
          Profile photo
        </h2>
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={account.name} photo={account.photo} size="xl" />
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              id="photo-input"
              type="file"
              accept="image/*"
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
              onChange={(e) => choosePhoto(e.target.files?.[0])}
            />
            <button type="button" onClick={() => fileRef.current?.click()} className={btn("secondary")}>
              {account.photo ? "Change photo" : "Add a photo"}
            </button>
            {account.photo && (
              <button
                type="button"
                onClick={() => {
                  updateAccount({ photo: null });
                  setPhotoNote({ tone: "success", text: "Photo removed." });
                }}
                className="min-h-[40px] text-left text-sm font-semibold text-oxford-ink underline underline-offset-4 hover:no-underline"
              >
                Remove photo
              </button>
            )}
            <p role="status" className={`text-sm font-semibold ${photoNote?.tone === "error" ? "text-oxford-danger" : "text-oxford-success"}`}>
              {photoNote?.text}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="official-title" className="mt-5 rounded-2xl border border-oxford-rule bg-white/80 p-5">
        <h2 id="official-title" className="font-sans text-base font-semibold text-oxford-ink">
          University details
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-oxford-mute">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Managed by the university. Contact Academic Affairs if something is wrong.
        </p>
        <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {official.map(([label, value]) => (
            <div key={label}>
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-oxford-mute">
                {label}
                <Lock className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">(managed by the university)</span>
              </dt>
              <dd className="mt-1 break-words text-sm font-semibold text-oxford-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <form onSubmit={save} noValidate className="mt-5 rounded-2xl border border-oxford-rule bg-white/80 p-5">
        <h2 className="font-sans text-base font-semibold text-oxford-ink">Your details</h2>
        <p className="mt-1 text-sm text-oxford-mute">You can change these at any time.</p>
        <div className="mt-4 space-y-4">
          <TextField
            id="profile-preferred"
            label="Preferred name (optional)"
            maxLength={40}
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            hint="Used when we greet you in the app."
            autoComplete="nickname"
          />
          <TextField
            id="profile-phone"
            label="Phone number (optional)"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setErrors({});
            }}
            error={errors.phone}
          />
        </div>
        {notice && (
          <FormAlert tone={notice.tone} title={notice.text} className="mt-4" />
        )}
        <LoadingButton loading={saving} loadingLabel="Saving…" className="mt-5 sm:w-auto">
          Save changes
        </LoadingButton>
      </form>
    </div>
  );
};
