"use client";

export type NativeNotificationPermission = "granted" | "denied" | "default" | "unsupported";

export function getNotificationPermission(): NativeNotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NativeNotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return Notification.permission;
  }
}

export interface NativeNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
}

export async function sendNativeNotification({
  title,
  body,
  icon = "/icon.svg",
  badge = "/icon.svg",
  tag,
  url = "/khatm",
}: NativeNotificationPayload): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission !== "granted") {
    const permission = await requestNotificationPermission();
    if (permission !== "granted") return false;
  }

  try {
    // Prefer Service Worker showNotification for native mobile PWA support (Android / iOS 16.4+)
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && "showNotification" in registration) {
          await registration.showNotification(title, {
            body,
            icon,
            badge,
            tag: tag || `qf-${Date.now()}`,
            data: { url },
          });
          return true;
        }
      } catch {
        // Fallback to standard window Notification
      }
    }

    new Notification(title, {
      body,
      icon,
      badge,
      tag: tag || `qf-${Date.now()}`,
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendTestNotification(
  roomName?: string,
): Promise<{ success: boolean; message: string }> {
  const permission = await requestNotificationPermission();
  if (permission === "unsupported") {
    return {
      success: false,
      message: "Browser notifications are not supported on this browser or platform.",
    };
  }
  if (permission === "denied") {
    return {
      success: false,
      message: "Notifications are blocked in your browser settings. Please enable them to receive room updates.",
    };
  }

  const title = roomName ? `Quran Feham · ${roomName}` : "Quran Feham (قرآن فہم)";
  const sent = await sendNativeNotification({
    title,
    body: "Notifications are active! You will receive Daurah milestones, deadlines, and reminders.",
    icon: "/icon.svg",
    tag: "test-notification",
    url: "/khatm",
  });

  if (sent) {
    return {
      success: true,
      message: "Test notification sent! Check your device notification tray.",
    };
  }
  return {
    success: false,
    message: "Failed to trigger notification. Please check system permissions.",
  };
}
