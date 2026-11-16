import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { btn } from "./button";

interface Props {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({ open, title, body, confirmLabel, cancelLabel = "Cancel", onConfirm, onCancel }: Props) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancelRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      // Keep focus inside the dialog's two buttons.
      const buttons = [cancelRef.current, confirmRef.current].filter(
        (b): b is HTMLButtonElement => b !== null,
      );
      const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
      e.preventDefault();
      const next = e.shiftKey
        ? (idx <= 0 ? buttons.length - 1 : idx - 1)
        : (idx + 1) % buttons.length;
      buttons[next]?.focus();
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1100] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-oxford-ink/40"
            onClick={() => onCancelRef.current()}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-body"
            className="relative w-full max-w-sm rounded-2xl bg-oxford-paper p-6 shadow-xl"
            initial={{ y: 12 }}
            animate={{ y: 0 }}
            exit={{ y: 12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 id="confirm-title" className="text-xl font-medium">
              {title}
            </h2>
            <p id="confirm-body" className="mt-2 text-sm text-oxford-mute">
              {body}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button ref={cancelRef} type="button" className={btn("secondary")} onClick={onCancel}>
                {cancelLabel}
              </button>
              <button ref={confirmRef} type="button" className={btn("primary")} onClick={onConfirm}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
