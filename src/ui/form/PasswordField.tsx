import { forwardRef, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TextField } from "./TextField";

type Props = Omit<ComponentProps<typeof TextField>, "type" | "trailing">;

export const PasswordField = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      ref={ref}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-oxford-mute transition hover:text-oxford-ink"
        >
          {visible ? (
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      }
      {...props}
    />
  );
});
PasswordField.displayName = "PasswordField";
