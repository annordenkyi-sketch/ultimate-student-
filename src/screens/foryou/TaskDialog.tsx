import { useEffect, useState, type FormEvent } from "react";
import type { Goal, TaskInput } from "@/services";
import { addDays, fromISODate } from "@/lib/days";
import { FormAlert } from "@/ui/form/FormAlert";
import { LoadingButton } from "@/ui/form/LoadingButton";
import { TextField, inputClass } from "@/ui/form/TextField";
import { Modal } from "@/ui/Modal";

/** Add or edit a personal task in the week. */
export const TaskDialog = ({
  open,
  mode,
  initial,
  weekStart,
  goals,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: "add" | "edit";
  initial: TaskInput;
  weekStart: string;
  goals: Goal[];
  onClose: () => void;
  onSave: (input: TaskInput) => Promise<void>;
}) => {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial);
      setError(null);
      setFailed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Write what you need to do.");
      document.getElementById("task-title")?.focus();
      return;
    }
    setSaving(true);
    setFailed(false);
    try {
      await onSave({ ...form, title: form.title.trim(), time: form.time || null });
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={mode === "add" ? "Add a task" : "Edit task"}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField
          id="task-title"
          label="Task"
          maxLength={80}
          value={form.title}
          onChange={(e) => {
            setForm({ ...form, title: e.target.value });
            setError(null);
          }}
          error={error ?? undefined}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-day" className="block text-sm font-semibold text-oxford-ink">
              Day
            </label>
            <select id="task-day" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass(false, "mt-1.5")}>
              {days.map((d) => (
                <option key={d} value={d}>
                  {fromISODate(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
                </option>
              ))}
            </select>
          </div>
          <TextField
            id="task-time"
            type="time"
            label="Time (optional)"
            value={form.time ?? ""}
            onChange={(e) => setForm({ ...form, time: e.target.value || null })}
          />
        </div>
        <div>
          <label htmlFor="task-goal" className="block text-sm font-semibold text-oxford-ink">
            Linked goal <span className="font-normal text-oxford-mute">(optional)</span>
          </label>
          <select
            id="task-goal"
            value={form.goalId ?? ""}
            onChange={(e) => setForm({ ...form, goalId: e.target.value || null })}
            className={inputClass(false, "mt-1.5")}
          >
            <option value="">No goal</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
        {failed && (
          <FormAlert tone="error" title="We couldn't save the task">
            Check your connection and try again.
          </FormAlert>
        )}
        <LoadingButton loading={saving} loadingLabel="Saving…">
          {mode === "add" ? "Add task" : "Save task"}
        </LoadingButton>
      </form>
    </Modal>
  );
};
