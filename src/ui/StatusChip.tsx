import type { VerificationStatus } from "@/services";

const STYLES: Record<VerificationStatus, { label: string; className: string }> = {
  verified: { label: "Verified", className: "bg-oxford-success/10 text-oxford-success" },
  pending: { label: "Pending review", className: "bg-oxford-sand text-oxford-ink" },
  unverified: { label: "Not verified", className: "bg-oxford-danger/10 text-oxford-danger" },
};

export const VerificationChip = ({ status }: { status: VerificationStatus }) => {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.className}`}
    >
      {s.label}
    </span>
  );
};
