import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Camera,
  KeyRound,
  LogOut,
  Pencil,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/useToast";
import type {
  LivingSituation,
  NotificationPrefs,
  Profile,
  StudentType,
} from "@/data/types";
import { INTERESTS } from "@/features/onboarding/interests";

/* ───────────────────────────── Options ───────────────────────────── */

const TYPE_OPTIONS: Array<{ id: StudentType; label: string }> = [
  { id: "new", label: "First-year" },
  { id: "continuing", label: "Continuing" },
  { id: "postgraduate", label: "Postgraduate" },
  { id: "final-year", label: "Final year" },
  { id: "prospective", label: "Prospective" },
];

const LIVING_OPTIONS: Array<{ id: LivingSituation; label: string }> = [
  { id: "on-campus", label: "On campus" },
  { id: "off-campus", label: "Off campus" },
];

const ON_CAMPUS_HALLS = [
  "Legon Hall",
  "Volta Hall",
  "Jubilee Hall",
  "International Students' Hostel",
];

const LEVEL_OPTIONS = ["100", "200", "300", "400", "Masters", "PhD"];

const TYPE_LABEL: Record<StudentType, string> = {
  prospective: "Prospective",
  new: "First-year",
  continuing: "Continuing",
  postgraduate: "Postgraduate",
  "final-year": "Final year",
};

const LIVING_LABEL: Record<LivingSituation, string> = {
  "on-campus": "On campus",
  "off-campus": "Off campus",
};

const DEFAULT_PREFS: NotificationPrefs = {
  announcements: true,
  events: true,
  savedUpdates: true,
};

/* ───────────────────────────── Shared bits ───────────────────────────── */

type SectionId =
  | "personal"
  | "student"
  | "living"
  | "interests"
  | "notifications";

interface SectionShellProps {
  id: SectionId;
  title: string;
  canEdit?: boolean;
  isEditing: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const SectionShell = ({
  id,
  title,
  canEdit = true,
  isEditing,
  onToggle,
  children,
}: SectionShellProps) => (
  <section
    id={`section-${id}`}
    className="rounded-xl border border-line bg-white"
  >
    <header className="flex items-center justify-between border-b border-line/60 px-5 py-3">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {canEdit && (
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 hover:text-brand-800 hover:underline"
        >
          {isEditing ? (
            <>
              <X className="h-3 w-3" aria-hidden="true" /> Cancel
            </>
          ) : (
            <>
              <Pencil className="h-3 w-3" aria-hidden="true" /> Edit
            </>
          )}
        </button>
      )}
    </header>
    <div className="p-5">{children}</div>
  </section>
);

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
      {label}
    </p>
    <div className="mt-0.5 text-sm text-ink">{children ?? "—"}</div>
  </div>
);

const inputClass =
  "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-500";

const SaveBar = ({
  canSave,
  onSave,
  onCancel,
}: {
  canSave: boolean;
  onSave: () => void;
  onCancel: () => void;
}) => (
  <div className="mt-5 flex items-center justify-end gap-2">
    <button
      type="button"
      onClick={onCancel}
      className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-paper"
    >
      Cancel
    </button>
    <button
      type="submit"
      onClick={onSave}
      disabled={!canSave}
      className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-500 hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Save
    </button>
  </div>
);

/* ───────────────────────────── Header ───────────────────────────── */

const ProfileHeader = ({
  profile,
  updateProfile,
  onEditProfile,
}: {
  profile: Profile;
  updateProfile: (patch: Partial<Profile>) => void;
  onEditProfile: () => void;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const initial = (profile.name || "S").trim().charAt(0).toUpperCase();

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Picture is too large (max 2 MB)", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ avatar: reader.result as string });
      showToast("Picture updated", "success");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                initial
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Change profile picture"
              className="absolute -right-1 -bottom-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm transition hover:bg-paper"
            >
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFile}
              className="hidden"
            />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-ink">
              {profile.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {profile.avatar && (
            <button
              type="button"
              onClick={() => {
                updateProfile({ avatar: undefined });
                showToast("Picture removed", "success");
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-paper"
            >
              Remove photo
            </button>
          )}
          <button
            type="button"
            onClick={onEditProfile}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-accent-500 hover:text-brand-900"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit profile
          </button>
        </div>
      </div>
    </section>
  );
};

/* ───────────────────────────── Personal details ───────────────────────────── */

const PersonalDetails = ({
  profile,
  updateProfile,
  isEditing,
  onToggle,
}: {
  profile: Profile;
  updateProfile: (patch: Partial<Profile>) => void;
  isEditing: boolean;
  onToggle: () => void;
}) => {
  const { showToast } = useToast();
  const [draft, setDraft] = useState({
    name: profile.name,
    identifier: profile.identifier,
    phone: profile.phone ?? "",
  });

  useEffect(() => {
    if (isEditing) {
      setDraft({
        name: profile.name,
        identifier: profile.identifier,
        phone: profile.phone ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const errors = {
    name: draft.name.trim().length < 2 ? "Enter your full name" : "",
    identifier:
      draft.identifier.trim().length < 3
        ? "Enter your email or university ID"
        : "",
  };
  const dirty =
    draft.name !== profile.name ||
    draft.identifier !== profile.identifier ||
    (draft.phone || "") !== (profile.phone ?? "");
  const canSave = dirty && !errors.name && !errors.identifier;

  const onSave = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSave) return;
    updateProfile({
      name: draft.name.trim(),
      identifier: draft.identifier.trim(),
      phone: draft.phone.trim() || undefined,
    });
    showToast("Profile updated", "success");
    onToggle();
  };

  return (
    <SectionShell
      id="personal"
      title="Personal details"
      isEditing={isEditing}
      onToggle={onToggle}
    >
      {isEditing ? (
        <form onSubmit={onSave} noValidate className="space-y-4">
          <div>
            <label htmlFor="pd-name" className="text-sm font-medium text-ink">
              Full name
            </label>
            <input
              id="pd-name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={inputClass}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600">{errors.name}</p>
            )}
          </div>
          <div>
            <label htmlFor="pd-id" className="text-sm font-medium text-ink">
              Email or university ID
            </label>
            <input
              id="pd-id"
              value={draft.identifier}
              onChange={(e) =>
                setDraft({ ...draft, identifier: e.target.value })
              }
              className={inputClass}
            />
            {errors.identifier && (
              <p className="mt-1 text-xs text-rose-600">{errors.identifier}</p>
            )}
          </div>
          <div>
            <label htmlFor="pd-phone" className="text-sm font-medium text-ink">
              Phone number <span className="text-muted">(optional)</span>
            </label>
            <input
              id="pd-phone"
              type="tel"
              inputMode="tel"
              placeholder="+233 54 000 0000"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              className={inputClass}
            />
          </div>
          <SaveBar canSave={canSave} onSave={() => onSave()} onCancel={onToggle} />
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name">{profile.name}</Field>
          <Field label="Email or ID">{profile.identifier}</Field>
          <Field label="Phone">
            {profile.phone ? (
              <a
                href={`tel:${profile.phone.replace(/\s/g, "")}`}
                className="text-ink hover:text-brand-700"
              >
                {profile.phone}
              </a>
            ) : (
              <span className="text-muted">Not set</span>
            )}
          </Field>
        </div>
      )}
    </SectionShell>
  );
};

/* ───────────────────────────── Student details ───────────────────────────── */

const StudentDetails = ({
  profile,
  updateProfile,
  isEditing,
  onToggle,
}: {
  profile: Profile;
  updateProfile: (patch: Partial<Profile>) => void;
  isEditing: boolean;
  onToggle: () => void;
}) => {
  const { showToast } = useToast();
  const [draft, setDraft] = useState({
    studentType: profile.studentType,
    isInternational: profile.isInternational,
    programme: profile.programme ?? "",
    level: profile.level ?? "",
  });

  useEffect(() => {
    if (isEditing) {
      setDraft({
        studentType: profile.studentType,
        isInternational: profile.isInternational,
        programme: profile.programme ?? "",
        level: profile.level ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const dirty =
    draft.studentType !== profile.studentType ||
    draft.isInternational !== profile.isInternational ||
    (draft.programme || "") !== (profile.programme ?? "") ||
    (draft.level || "") !== (profile.level ?? "");

  const onSave = (e?: FormEvent) => {
    e?.preventDefault();
    if (!dirty) return;
    updateProfile({
      studentType: draft.studentType,
      isInternational: draft.isInternational,
      programme: draft.programme.trim() || undefined,
      level: draft.level || undefined,
    });
    showToast("Profile updated", "success");
    onToggle();
  };

  return (
    <SectionShell
      id="student"
      title="Student details"
      isEditing={isEditing}
      onToggle={onToggle}
    >
      {isEditing ? (
        <form onSubmit={onSave} noValidate className="space-y-4">
          <div>
            <p className="text-sm font-medium text-ink">Student type</p>
            <fieldset className="mt-2 flex flex-wrap gap-2">
              <legend className="sr-only">Student type</legend>
              {TYPE_OPTIONS.map((t) => {
                const active = draft.studentType === t.id;
                return (
                  <label
                    key={t.id}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                      active
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-line bg-white text-ink hover:border-line"
                    }`}
                  >
                    <input
                      type="radio"
                      name="student-type"
                      value={t.id}
                      checked={active}
                      onChange={() =>
                        setDraft({ ...draft, studentType: t.id })
                      }
                      className="sr-only"
                    />
                    {t.label}
                  </label>
                );
              })}
            </fieldset>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sd-programme" className="text-sm font-medium text-ink">
                Programme / department
              </label>
              <input
                id="sd-programme"
                value={draft.programme}
                onChange={(e) =>
                  setDraft({ ...draft, programme: e.target.value })
                }
                placeholder="e.g. Computer Science"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="sd-level" className="text-sm font-medium text-ink">
                Level / year
              </label>
              <select
                id="sd-level"
                value={draft.level}
                onChange={(e) => setDraft({ ...draft, level: e.target.value })}
                className={inputClass}
              >
                <option value="">Not set</option>
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={draft.isInternational}
              onChange={(e) =>
                setDraft({ ...draft, isInternational: e.target.checked })
              }
              className="mt-0.5 h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
            />
            <span>
              <span className="font-medium text-ink">
                I'm an international student
              </span>
              <span className="block text-xs text-muted">
                Studying from outside Ghana — unlocks visa and ISO content.
              </span>
            </span>
          </label>

          <SaveBar canSave={dirty} onSave={() => onSave()} onCancel={onToggle} />
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Student type">{TYPE_LABEL[profile.studentType]}</Field>
          <Field label="Programme">
            {profile.programme ?? <span className="text-muted">Not set</span>}
          </Field>
          <Field label="Level">
            {profile.level ?? <span className="text-muted">Not set</span>}
          </Field>
          <Field label="International">
            {profile.isInternational ? "Yes" : "No"}
          </Field>
        </div>
      )}
    </SectionShell>
  );
};

/* ───────────────────────────── Living ───────────────────────────── */

const LivingSection = ({
  profile,
  updateProfile,
  isEditing,
  onToggle,
}: {
  profile: Profile;
  updateProfile: (patch: Partial<Profile>) => void;
  isEditing: boolean;
  onToggle: () => void;
}) => {
  const { showToast } = useToast();
  const [draft, setDraft] = useState({
    living: profile.living,
    hostel: profile.hostel ?? "",
  });

  useEffect(() => {
    if (isEditing) {
      setDraft({ living: profile.living, hostel: profile.hostel ?? "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const dirty =
    draft.living !== profile.living ||
    (draft.hostel || "") !== (profile.hostel ?? "");

  const onSave = (e?: FormEvent) => {
    e?.preventDefault();
    if (!dirty) return;
    updateProfile({
      living: draft.living,
      hostel: draft.living === "on-campus" ? draft.hostel || undefined : undefined,
    });
    showToast("Profile updated", "success");
    onToggle();
  };

  return (
    <SectionShell
      id="living"
      title="Living"
      isEditing={isEditing}
      onToggle={onToggle}
    >
      {isEditing ? (
        <form onSubmit={onSave} noValidate className="space-y-4">
          <fieldset>
            <legend className="text-sm font-medium text-ink">
              Where do you live?
            </legend>
            <div className="mt-2 flex gap-2">
              {LIVING_OPTIONS.map((o) => {
                const active = draft.living === o.id;
                return (
                  <label
                    key={o.id}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                      active
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-line bg-white text-ink hover:border-line"
                    }`}
                  >
                    <input
                      type="radio"
                      name="living"
                      value={o.id}
                      checked={active}
                      onChange={() => setDraft({ ...draft, living: o.id })}
                      className="sr-only"
                    />
                    {o.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {draft.living === "on-campus" && (
            <div>
              <label htmlFor="lv-hostel" className="text-sm font-medium text-ink">
                Hall or hostel{" "}
                <span className="text-muted">(optional)</span>
              </label>
              <select
                id="lv-hostel"
                value={draft.hostel}
                onChange={(e) =>
                  setDraft({ ...draft, hostel: e.target.value })
                }
                className={inputClass}
              >
                <option value="">Not sure yet</option>
                {ON_CAMPUS_HALLS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          )}

          <SaveBar canSave={dirty} onSave={() => onSave()} onCancel={onToggle} />
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Living situation">
            {LIVING_LABEL[profile.living]}
          </Field>
          <Field label="Hall or hostel">
            {profile.hostel ?? <span className="text-muted">Not set</span>}
          </Field>
        </div>
      )}
    </SectionShell>
  );
};

/* ───────────────────────────── Interests ───────────────────────────── */

const InterestsSection = ({
  profile,
  updateProfile,
  isEditing,
  onToggle,
}: {
  profile: Profile;
  updateProfile: (patch: Partial<Profile>) => void;
  isEditing: boolean;
  onToggle: () => void;
}) => {
  const { showToast } = useToast();
  const [draft, setDraft] = useState<string[]>(profile.interests);

  useEffect(() => {
    if (isEditing) setDraft(profile.interests);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const dirty =
    JSON.stringify([...draft].sort()) !==
    JSON.stringify([...profile.interests].sort());

  const toggle = (label: string) => {
    setDraft((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
    );
  };

  const onSave = () => {
    if (!dirty) return;
    updateProfile({ interests: draft });
    showToast("Profile updated", "success");
    onToggle();
  };

  return (
    <SectionShell
      id="interests"
      title="Interests"
      isEditing={isEditing}
      onToggle={onToggle}
    >
      {isEditing ? (
        <>
          <p className="text-xs text-muted">
            Pick as many as you like. We'll use these to tailor events and
            opportunities on your Home.
          </p>
          <div
            role="group"
            aria-label="Interests"
            className="mt-3 flex flex-wrap gap-2"
          >
            {INTERESTS.map((opt) => {
              const Icon = opt.icon;
              const active = draft.includes(opt.label);
              return (
                <button
                  key={opt.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(opt.label)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-line bg-white text-ink hover:border-line"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs font-medium text-muted">
            {draft.length} selected
          </p>
          <SaveBar canSave={dirty} onSave={onSave} onCancel={onToggle} />
        </>
      ) : profile.interests.length === 0 ? (
        <p className="text-sm text-muted">
          No interests yet. Add some to personalise Home.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {profile.interests.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-full bg-paper px-2.5 py-1 text-xs font-medium text-ink"
            >
              <Sparkles className="h-3 w-3 text-brand-500" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      )}
    </SectionShell>
  );
};

/* ───────────────────────────── Notifications ───────────────────────────── */

const NotificationsSection = ({
  profile,
  updateProfile,
  isEditing,
  onToggle,
}: {
  profile: Profile;
  updateProfile: (patch: Partial<Profile>) => void;
  isEditing: boolean;
  onToggle: () => void;
}) => {
  const { showToast } = useToast();
  const current = profile.notificationPrefs ?? DEFAULT_PREFS;
  const [draft, setDraft] = useState<NotificationPrefs>(current);

  useEffect(() => {
    if (isEditing) setDraft(profile.notificationPrefs ?? DEFAULT_PREFS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const dirty =
    draft.announcements !== current.announcements ||
    draft.events !== current.events ||
    draft.savedUpdates !== current.savedUpdates;

  const onSave = () => {
    if (!dirty) return;
    updateProfile({ notificationPrefs: draft });
    showToast("Profile updated", "success");
    onToggle();
  };

  const Row = ({
    label,
    desc,
    value,
    onChange,
  }: {
    label: string;
    desc: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label className="flex cursor-pointer items-start gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        disabled={!isEditing}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          value ? "bg-brand-600" : "bg-line"
        } ${isEditing ? "" : "opacity-70"}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </label>
  );

  const shown = isEditing ? draft : current;

  return (
    <SectionShell
      id="notifications"
      title="Notifications"
      isEditing={isEditing}
      onToggle={onToggle}
    >
      <div className="divide-y divide-line/60">
        <Row
          label="Announcements"
          desc="Deadlines, hall notices and important updates"
          value={shown.announcements}
          onChange={(v) => setDraft({ ...draft, announcements: v })}
        />
        <Row
          label="Events"
          desc="Reminders for events happening on campus this week"
          value={shown.events}
          onChange={(v) => setDraft({ ...draft, events: v })}
        />
        <Row
          label="Saved item updates"
          desc="When something you saved changes or is about to close"
          value={shown.savedUpdates}
          onChange={(v) => setDraft({ ...draft, savedUpdates: v })}
        />
      </div>
      {isEditing && (
        <SaveBar canSave={dirty} onSave={onSave} onCancel={onToggle} />
      )}
    </SectionShell>
  );
};

/* ───────────────────────────── Account ───────────────────────────── */

const AccountSection = () => {
  const { clearProfile } = useProfile();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showPwForm, setShowPwForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  const pwValid =
    pw.current.length >= 4 && pw.next.length >= 8 && pw.next === pw.confirm;

  const onChangePassword = (e: FormEvent) => {
    e.preventDefault();
    if (!pwValid) return;
    // Mock: nothing is actually changed.
    setPw({ current: "", next: "", confirm: "" });
    setShowPwForm(false);
    showToast("Password changed", "success");
  };

  const onLogOut = () => {
    const ok = window.confirm("Sign out of this device?");
    if (!ok) return;
    clearProfile();
    navigate("/welcome", { replace: true });
  };

  const onDelete = () => {
    clearProfile();
    showToast("Account deleted", "success");
    navigate("/welcome", { replace: true });
  };

  return (
    <section
      id="section-account"
      className="rounded-xl border border-line bg-white"
    >
      <header className="border-b border-line/60 px-5 py-3">
        <h2 className="text-sm font-semibold text-ink">Account</h2>
      </header>
      <div className="divide-y divide-line/60">
        {/* Change password */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">
                Change password
              </p>
              <p className="text-xs text-muted">
                Pick a new password of at least 8 characters.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPwForm((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-paper"
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              {showPwForm ? "Close" : "Change"}
            </button>
          </div>

          {showPwForm && (
            <form onSubmit={onChangePassword} className="mt-4 space-y-3">
              <div>
                <label htmlFor="pw-current" className="text-xs font-medium text-ink">
                  Current password
                </label>
                <input
                  id="pw-current"
                  type="password"
                  value={pw.current}
                  onChange={(e) => setPw({ ...pw, current: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="pw-next" className="text-xs font-medium text-ink">
                  New password
                </label>
                <input
                  id="pw-next"
                  type="password"
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                  className={inputClass}
                />
                {pw.next.length > 0 && pw.next.length < 8 && (
                  <p className="mt-1 text-xs text-rose-600">
                    Use at least 8 characters.
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="pw-confirm" className="text-xs font-medium text-ink">
                  Confirm new password
                </label>
                <input
                  id="pw-confirm"
                  type="password"
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                  className={inputClass}
                />
                {pw.confirm.length > 0 && pw.confirm !== pw.next && (
                  <p className="mt-1 text-xs text-rose-600">
                    Passwords don't match.
                  </p>
                )}
              </div>
              <SaveBar
                canSave={pwValid}
                onSave={() =>
                  onChangePassword(
                    new Event("submit") as unknown as FormEvent,
                  )
                }
                onCancel={() => {
                  setShowPwForm(false);
                  setPw({ current: "", next: "", confirm: "" });
                }}
              />
            </form>
          )}
        </div>

        {/* Log out */}
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-ink">Log out</p>
            <p className="text-xs text-muted">
              Sign out and clear the profile from this device.
            </p>
          </div>
          <button
            type="button"
            onClick={onLogOut}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-paper"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Log out
          </button>
        </div>

        {/* Delete account */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-rose-700">Delete account</p>
              <p className="text-xs text-muted">
                Removes your profile from this device. This can't be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete
            </button>
          </div>

          {confirmDelete && (
            <div
              role="alertdialog"
              aria-labelledby="delete-confirm-title"
              className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4"
            >
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-rose-600"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p
                  id="delete-confirm-title"
                  className="text-sm font-semibold text-rose-900"
                >
                  Delete this account?
                </p>
                <p className="mt-1 text-xs text-rose-800/80">
                  Your profile, saved items and read-state will be removed
                  from this device.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                  >
                    Yes, delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/* ───────────────────────────── Page ───────────────────────────── */

export const ProfilePage = () => {
  const { profile, updateProfile } = useProfile();
  const [editing, setEditing] = useState<SectionId | null>(null);

  useEffect(() => {
    if (editing) {
      const el = document.getElementById(`section-${editing}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editing]);

  if (!profile) return null;

  const toggle = (id: SectionId) =>
    setEditing((prev) => (prev === id ? null : id));

  return (
    <div className="pb-4">
      <ProfileHeader
        profile={profile}
        updateProfile={updateProfile}
        onEditProfile={() => setEditing("personal")}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PersonalDetails
          profile={profile}
          updateProfile={updateProfile}
          isEditing={editing === "personal"}
          onToggle={() => toggle("personal")}
        />
        <StudentDetails
          profile={profile}
          updateProfile={updateProfile}
          isEditing={editing === "student"}
          onToggle={() => toggle("student")}
        />
        <LivingSection
          profile={profile}
          updateProfile={updateProfile}
          isEditing={editing === "living"}
          onToggle={() => toggle("living")}
        />
        <InterestsSection
          profile={profile}
          updateProfile={updateProfile}
          isEditing={editing === "interests"}
          onToggle={() => toggle("interests")}
        />
        <NotificationsSection
          profile={profile}
          updateProfile={updateProfile}
          isEditing={editing === "notifications"}
          onToggle={() => toggle("notifications")}
        />
        <AccountSection />
      </div>
    </div>
  );
};

