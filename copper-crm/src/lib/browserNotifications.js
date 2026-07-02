// Thin wrapper around the browser's native Notification API. Used by the
// client portal's "Browser Notifications" preference (Settings) to actually
// request permission and fire notifications — the toggle used to only save
// a flag with nothing behind it.

export function isNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission() {
  return isNotificationSupported() ? Notification.permission : "unsupported";
}

// Must be called from a user gesture (e.g. the toggle's own onChange) —
// browsers silently ignore permission requests made outside of one.
export async function requestBrowserNotificationPermission() {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

export function canSendBrowserNotifications() {
  return isNotificationSupported() && Notification.permission === "granted";
}

export function sendBrowserNotification(title, options = {}) {
  if (!canSendBrowserNotifications()) return;
  try {
    const notification = new Notification(title, { icon: "/copper-studio-wordmark.png", ...options });
    if (options.onClick) notification.onclick = options.onClick;
  } catch {
    // Some browsers (mobile Safari, etc.) throw on `new Notification()` even
    // when permission looks granted — fail silently rather than crash.
  }
}
