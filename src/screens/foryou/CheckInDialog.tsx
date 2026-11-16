import { useEffect, useState, type FormEvent } from "react";
import type { Goal } from "@/services";
import { progressText } from "@/lib/goals";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { TextField } from "@/ui/form/TextField";
import { Modal } from "@/ui/Modal";

/** Flow 06 "Record progress": a value and an optional note, saved to Progress history. */
export const CheckInDialog = ({
  goal,
  open,
  onClose,
  onSave,
}: {
  goal: Goal;
  open: boolean;
  onClose: () => void;
  onSave: (value: number, note: string | null) => Promise<void>;
}) => {
  const isNumber = goal.target.kind === "number";
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(String(goal.progress));
      setNote("");
      setError(null);
      setFailed(false);
    }
  }, [open, goal.progress]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const n = Number(value);
    if (!value.trim() || !Number.isFinite(n) || n < 0) {
      setError("Enter a number of 0 or more.");
      return;
    }
    if (!isNumber && n > 100) {
      setError("Enter a percentage from 0 to 100.");
      return;
    }
    setSaving(true);
    setFailed(false);
    try {
      await onSave(n, note.trim() || null);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Record progress" description={`${goal.title}. Last recorded: ${progressText(goal)}.`}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField
          id="checkin-value"
          inputMode="decimal"
          label={isNumber && goal.target.kind === "number" ? `Where are you now? (${goal.target.unit})` : "How far along are you? (%)"}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          error={error ?? undefined}
          hint={goal.target.kind === "number" ? `Target: ${goal.target.value} ${goal.target.unit}` : "0 means not started, 100 means done."}
        />
        <div>
          <label htmlFor="checkin-note" className="block text-sm font-semibold text-oxford-ink">
            Note <span className="font-normal text-oxford-mute">(optional)</span>
          </label>
          <textarea
            id="checkin-note"
            rows={3}
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What happened, or what's next"
            className="mt-1.5 w-full rounded-lg border border-oxford-ink/25 bg-white p-3 text-base text-oxford-ink placeholder:text-oxford-mute hover:border-oxford-ink/40 focus:border-oxford-ink"
          />
        </div>
        {failed && (
          <FormAlert tone="error" title="We couldn't save your check-in">
            Check your connection and try again.
          </FormAlert>
        )}
        <LoadingButton loading={saving} loadingLabel="Saving…">
          Save check-in
        </LoadingButton>
      </form>
    </Modal>
  );
};
