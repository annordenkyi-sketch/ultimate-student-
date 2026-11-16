import { useEffect, useState, type FormEvent } from "react";
import { errorCodeOf, services, type PortalConnection } from "@/services";
import { useSession } from "@/session/SessionProvider";
import { Checkbox } from "@/ui/form/Checkbox";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { PasswordField } from "@/ui/form/PasswordField";
import { TextField } from "@/ui/form/TextField";
import { Modal } from "@/ui/Modal";

/** Connect or reconnect the university student portal (sign in and consent). */
export const ConnectPortalDialog = ({
  open,
  reconnect,
  onClose,
  onConnected,
}: {
  open: boolean;
  reconnect: boolean;
  onClose: () => void;
  onConnected: (c: PortalConnection) => void;
}) => {
  const { account } = useSession();
  const [studentId, setStudentId] = useState(account?.studentId ?? "");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ studentId?: string; password?: string; consent?: string }>({});
  const [failed, setFailed] = useState<"auth" | "network" | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword("");
      setConsent(false);
      setErrors({});
      setFailed(null);
    }
  }, [open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (!studentId.trim()) found.studentId = "Enter your student ID.";
    if (!password) found.password = "Enter your portal password.";
    if (!consent) found.consent = "Tick the box to let Ultimate Student read your registration.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setFailed(null);
    try {
      const c = await services.sync.connect(account!.id, studentId.trim(), password);
      onConnected(c);
    } catch (err) {
      setFailed(errorCodeOf(err) === "portal-auth-failed" ? "auth" : "network");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={reconnect ? "Reconnect the student portal" : "Connect the student portal"}
      description="Sign in with your university portal details. We only read your registered courses and timetable."
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {failed && (
          <FormAlert tone="error" title={failed === "auth" ? "Those portal details didn't work" : "We couldn't reach the portal"}>
            {failed === "auth" ? "Check your student ID and portal password, then try again." : "Check your connection and try again."}
          </FormAlert>
        )}
        <TextField id="portal-id" label="Student ID" inputMode="numeric" autoComplete="username" value={studentId} onChange={(e) => setStudentId(e.target.value)} error={errors.studentId} />
        <PasswordField id="portal-password" label="Portal password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <Checkbox id="portal-consent" checked={consent} onChange={setConsent} error={errors.consent}>
          Allow Ultimate Student to read my registered courses and official timetable.
        </Checkbox>
        <LoadingButton loading={busy} loadingLabel="Connecting…">
          {reconnect ? "Reconnect" : "Connect"}
        </LoadingButton>
      </form>
    </Modal>
  );
};
