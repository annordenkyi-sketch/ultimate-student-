import { Compass, Home, Menu, Target, type LucideIcon } from "lucide-react";

export interface TabDef {
  id: "home" | "explore" | "for-you" | "more";
  label: string;
  to: string;
  icon: LucideIcon;
  /** Routes that keep this tab highlighted. */
  paths: string[];
  /** Personal tab: locked for guests and unverified students. */
  personal: boolean;
}

export const TABS: TabDef[] = [
  { id: "home", label: "Home", to: "/home", icon: Home, paths: ["/home", "/lectures", "/announcements"], personal: false },
  { id: "explore", label: "Explore", to: "/explore", icon: Compass, paths: ["/explore", "/search", "/map", "/places", "/events", "/services"], personal: false },
  { id: "for-you", label: "For You", to: "/for-you", icon: Target, paths: ["/for-you", "/resources"], personal: true },
  { id: "more", label: "More", to: "/more", icon: Menu, paths: ["/more", "/profile"], personal: false },
];

export const activeTabFor = (pathname: string): TabDef | undefined =>
  TABS.find((t) => t.paths.some((p) => pathname === p || pathname.startsWith(`${p}/`)));
