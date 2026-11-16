import type { AlertPermission, DeviceService } from "../types";

/** Browser notifications. A native app would swap this for the platform permission API. */
export const browserDeviceService: DeviceService = {
  notificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission as AlertPermission;
  },
  async requestNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    try {
      return (await Notification.requestPermission()) as AlertPermission;
    } catch {
      return "denied";
    }
  },
};
