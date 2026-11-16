type Variant = "primary" | "secondary" | "onDark";

const base =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-oxford-ink text-white hover:bg-oxford-ink2",
  secondary: "border border-oxford-ink/20 bg-white text-oxford-ink hover:bg-oxford-cream",
  onDark: "bg-oxford-sand text-oxford-ink hover:bg-oxford-sandSoft",
};

export const btn = (variant: Variant = "primary", extra = ""): string =>
  `${base} ${variants[variant]} ${extra}`.trim();
