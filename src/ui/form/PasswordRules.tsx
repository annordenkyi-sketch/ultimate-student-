import { Check, Circle } from "lucide-react";
import { PASSWORD_RULES } from "./validation";

export const PasswordRules = ({ password }: { password: string }) => (
  <ul className="space-y-1">
    {PASSWORD_RULES.map((rule) => {
      const met = rule.test(password);
      return (
        <li
          key={rule.id}
          className={`flex items-center gap-1.5 ${met ? "text-oxford-success" : "text-oxford-mute"}`}
        >
          {met ? (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Circle className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {rule.label}
          <span className="sr-only">{met ? "(done)" : "(not yet)"}</span>
        </li>
      );
    })}
  </ul>
);
