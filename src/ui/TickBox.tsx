import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

/** Round checkbox with a 44px tap target. The tick settles in with a small spring. */
export const TickBox = ({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name, e.g. the task title. */
  label: string;
  disabled?: boolean;
}) => {
  const reduce = useReducedMotion();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
          checked ? "border-oxford-success bg-oxford-success text-white" : "border-oxford-ink/35 bg-white hover:border-oxford-ink"
        }`}
      >
        {checked && (
          <motion.span
            initial={reduce ? false : { scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
          </motion.span>
        )}
      </span>
    </button>
  );
};
