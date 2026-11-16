import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

export const OTP_LENGTH = 6;
export const emptyOtp = (): string[] => Array.from({ length: OTP_LENGTH }, () => "");

export interface OtpHandle {
  focus: () => void;
}

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  labelledBy: string;
  describedBy?: string;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

/** Six single-digit boxes: auto-advance, backspace to previous, arrow keys, paste and SMS/email autofill. */
export const OtpInput = forwardRef<OtpHandle, Props>(
  ({ value, onChange, labelledBy, describedBy, invalid, disabled, autoFocus }, ref) => {
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    useImperativeHandle(ref, () => ({
      focus: () => {
        const firstEmpty = value.findIndex((d) => !d);
        inputs.current[firstEmpty === -1 ? 0 : firstEmpty]?.focus();
      },
    }));

    const focusAt = (i: number) => {
      const el = inputs.current[Math.max(0, Math.min(OTP_LENGTH - 1, i))];
      el?.focus();
      el?.select();
    };

    const fillFrom = (start: number, digits: string) => {
      const next = [...value];
      let i = start;
      for (const d of digits) {
        if (i >= OTP_LENGTH) break;
        next[i] = d;
        i += 1;
      }
      onChange(next);
      focusAt(i);
    };

    const handleChange = (i: number, raw: string) => {
      const digits = raw.replace(/\D/g, "");
      if (!digits) {
        const next = [...value];
        next[i] = "";
        onChange(next);
        return;
      }
      // One typed digit, or a whole code from paste/autofill landing in one box.
      fillFrom(i, digits.length > 1 ? digits : digits.slice(-1));
    };

    const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !value[i] && i > 0) {
        e.preventDefault();
        const next = [...value];
        next[i - 1] = "";
        onChange(next);
        focusAt(i - 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        focusAt(i - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        focusAt(i + 1);
      }
    };

    const handlePaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
      const digits = e.clipboardData.getData("text").replace(/\D/g, "");
      if (!digits) return;
      e.preventDefault();
      fillFrom(digits.length >= OTP_LENGTH ? 0 : i, digits);
    };

    return (
      <div
        role="group"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className="flex justify-between gap-2"
      >
        {value.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            autoFocus={autoFocus && i === 0}
            aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
            aria-invalid={invalid || undefined}
            disabled={disabled}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => handlePaste(i, e)}
            onFocus={(e) => e.target.select()}
            className={`h-14 w-full min-w-0 max-w-[3.25rem] rounded-lg border bg-white text-center font-serif text-2xl font-semibold text-oxford-ink transition disabled:bg-oxford-cream ${
              invalid ? "border-oxford-danger" : "border-oxford-ink/25 focus:border-oxford-ink"
            }`}
          />
        ))}
      </div>
    );
  },
);
OtpInput.displayName = "OtpInput";
