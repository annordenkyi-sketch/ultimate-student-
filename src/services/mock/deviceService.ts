import { storage } from "@/lib/storage";
import type { AlertPermission, DeviceService } from "../types";

// Notification permission. "browser" uses the real browser setting; the other
// modes simulate a device so every case can be shown from the Test
// notifications panel:
//   ask-allow   not asked yet; the system prompt will be accepted
//   ask-deny    not asked yet; the system prompt will be refused
//   granted     already allowed
//   denied      already blocked
// A native app would swap this for the platform permission API.

export type PermissionMode = "browser" | "ask-allow" | "ask-deny" | "granted" | "denied";

const MODE_KEY = "us.demo.notificationPermission";

export const permissionMode = (): PermissionMode => storage.get<PermissionMode>(MODE_KEY, "browser");
export const setPermissionMode = (mode: PermissionMode) => storage.set(MODE_KEY, mode);

const browserSupports = () => typeof window !== "undefined" && "Notification" in window;

export const browserDeviceService: DeviceService = {
  notificationPermission() {
    const mode = permissionMode();
    if (mode === "granted" || mode === "denied") return mode;
    if (mode === "ask-allow" || mode === "ask-deny") return "default";
    if (!browserSupports()) return "unsupported";
    return Notification.permission as AlertPermission;
  },

  async requestNotificationPermission() {
    const mode = permissionMode();
    if (mode === "ask-allow" || mode === "ask-deny") {
      // The simulated system prompt answers, and the answer sticks, as on a real device.
      const answer = mode === "ask-allow" ? "granted" : "denied";
      setPermissionMode(answer);
      return answer;
    }
    if (mode === "granted" || mode === "denied") return mode;
    if (!browserSupports()) return "unsupported";
    try {
      return (await Notification.requestPermission()) as AlertPermission;
    } catch {
      return "denied";
    }
  },
};

/** True only when the real browser will show system notifications. */
export const canShowSystemNotifications = () =>
  permissionMode() === "browser" && browserSupports() && Notification.permission === "granted";
