export const isEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "letter", label: "At least one letter", test: (p: string) => /[A-Za-z]/.test(p) },
  { id: "number", label: "At least one number", test: (p: string) => /\d/.test(p) },
] as const;

export const isStrongPassword = (p: string): boolean => PASSWORD_RULES.every((r) => r.test(p));

export const formatCountdown = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
