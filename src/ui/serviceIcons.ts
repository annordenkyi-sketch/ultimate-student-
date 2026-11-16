import { BookOpen, HeartPulse, Monitor, Wallet, Wifi, type LucideIcon } from "lucide-react";
import type { ServiceIcon } from "@/services";

export const SERVICE_ICONS: Record<ServiceIcon, LucideIcon> = {
  library: BookOpen,
  health: HeartPulse,
  ict: Wifi,
  fees: Wallet,
  portal: Monitor,
};
