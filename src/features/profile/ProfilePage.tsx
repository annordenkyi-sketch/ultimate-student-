import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { ActionButton } from "@/components/ActionButton";
import { useProfile } from "@/hooks/useProfile";

const typeLabel: Record<string, string> = {
  prospective: "Prospective",
  new: "New student",
  continuing: "Continuing",
  postgraduate: "Postgraduate",
  "final-year": "Final year",
};

const livingLabel: Record<string, string> = {
  "on-campus": "On campus",
  "off-campus": "Off campus",
};

export const ProfilePage = () => {
  const { profile, clearProfile } = useProfile();
  const navigate = useNavigate();

  const signOut = () => {
    if (confirm("Sign out and clear this profile?")) {
      clearProfile();
      navigate("/welcome", { replace: true });
    }
  };

  if (!profile) return null;

  return (
    <>
      <AppHeader title="Profile" showSearch={false} />
      <div className="px-4 pb-6 pt-2">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <User className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-900">
              {profile.name}
            </p>
            <p className="truncate text-xs text-slate-500">
              {profile.identifier}
            </p>
          </div>
        </div>

        <dl className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white text-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <dt className="text-slate-500">Student type</dt>
            <dd className="font-medium text-slate-900">
              {typeLabel[profile.studentType]}
            </dd>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <dt className="text-slate-500">Living</dt>
            <dd className="font-medium text-slate-900">
              {livingLabel[profile.living]}
            </dd>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <dt className="text-slate-500">International</dt>
            <dd className="font-medium text-slate-900">
              {profile.isInternational ? "Yes" : "No"}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <dt className="text-slate-500">Interests</dt>
            <dd className="text-right text-slate-900">
              {profile.interests.length > 0
                ? profile.interests.join(", ")
                : <span className="text-slate-400">None</span>}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <ActionButton
            variant="secondary"
            fullWidth
            onClick={signOut}
            leading={<LogOut className="h-4 w-4" aria-hidden="true" />}
          >
            Sign out
          </ActionButton>
        </div>
      </div>
    </>
  );
};
