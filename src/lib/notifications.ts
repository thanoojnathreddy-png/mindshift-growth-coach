import { supabase } from "@/integrations/supabase/client";

/** Public VAPID key — safe to ship to the browser (the private half stays server-side). */
export const VAPID_PUBLIC_KEY =
  "BMZ1PkATBGnPdch6XKmsMjxIv_Wq3RSMcdrdXOK-kX9no1eJHFPskS3j-A05hMBbrkw_HWUiFslPvJBFHCsWMJQ";

export const NOTIFICATION_TYPES = [
  {
    key: "commitment",
    column: "type_commitment",
    label: "Commitment reminder",
    hint: "A nudge about the journey you're on.",
  },
  {
    key: "check_in",
    column: "type_check_in",
    label: "Check-in reminder",
    hint: "Reminds you to complete your daily check-in.",
  },
  {
    key: "intervention",
    column: "type_intervention",
    label: "Intervention reminder",
    hint: "Support around a time you've told us is difficult.",
  },
  {
    key: "weekly",
    column: "type_weekly",
    label: "Weekly reflection",
    hint: "Tells you when your weekly reflection is ready.",
  },
] as const;

export type NotificationTypeKey = (typeof NOTIFICATION_TYPES)[number]["key"];

export function notificationTypeLabel(key: string | null | undefined) {
  return NOTIFICATION_TYPES.find((type) => type.key === key)?.label ?? "Notification";
}

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const FREQUENCIES = [
  { key: "daily", label: "Every day" },
  { key: "weekly_days", label: "Chosen days" },
  { key: "weekdays", label: "Monday–Friday" },
] as const;

export const REMINDER_FEEDBACK = [
  { key: "right_time", label: "👍 Right time" },
  { key: "too_early", label: "⏰ Too early" },
  { key: "too_late", label: "⌛ Too late" },
  { key: "not_useful", label: "👎 Not useful" },
] as const;

export type NotificationSettings = {
  user_id: string;
  enabled: boolean;
  content_mode: "private" | "personalized";
  timezone: string;
  quiet_start: string | null;
  quiet_end: string | null;
  type_commitment: boolean;
  type_check_in: boolean;
  type_intervention: boolean;
  type_weekly: boolean;
};

export type ReminderSchedule = {
  id: string;
  notification_type: string;
  label: string | null;
  time_of_day: string;
  days_of_week: number[];
  frequency: string;
  enabled: boolean;
  last_sent_on: string | null;
};

export type NotificationLogRow = {
  id: string;
  notification_type: string;
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
  error_detail: string | null;
  feedback: string | null;
};

export type PushSupport =
  | "unsupported"
  | "granted"
  | "denied"
  | "default";

/** What the current browser/OS can actually do — never pretend push works when it doesn't. */
export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "default";
  const supported =
    "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) return "unsupported";
  return Notification.permission as PushSupport;
}

export function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

function arrayBufferToBase64Url(buffer: ArrayBuffer | null) {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

/**
 * Asks for permission (only when the user pressed the button), subscribes this
 * device to Web Push and stores the subscription against the signed-in user.
 */
export async function enablePushOnThisDevice(userId: string, timezone: string) {
  const support = pushSupport();
  if (support === "unsupported") {
    throw new Error("This browser or device doesn't support web push notifications.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notifications are blocked. Enable them for this site in your browser settings."
        : "Notification permission wasn't granted.",
    );
  }

  const registration = (await registerServiceWorker()) ?? (await navigator.serviceWorker.ready);
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const p256dh = arrayBufferToBase64Url(subscription.getKey("p256dh"));
  const auth = arrayBufferToBase64Url(subscription.getKey("auth"));

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh,
      auth,
      device_label: deviceLabel(),
      failure_count: 0,
    },
    { onConflict: "endpoint" },
  );
  if (error) throw error;

  await upsertNotificationSettings(userId, { enabled: true, timezone });
  return subscription.endpoint;
}

export async function disablePushOnThisDevice(userId: string) {
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
      await subscription.unsubscribe();
    }
  }
  await upsertNotificationSettings(userId, { enabled: false });
}

function deviceLabel() {
  const ua = navigator.userAgent;
  const platform = /iPhone|iPad|Android/.test(ua) ? "Mobile" : "Desktop";
  const browser = /Edg/.test(ua)
    ? "Edge"
    : /Chrome/.test(ua)
      ? "Chrome"
      : /Firefox/.test(ua)
        ? "Firefox"
        : /Safari/.test(ua)
          ? "Safari"
          : "Browser";
  return `${browser} · ${platform}`;
}

export async function fetchNotificationSettings(userId: string): Promise<NotificationSettings> {
  const { data, error } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as NotificationSettings;
  return {
    user_id: userId,
    enabled: false,
    content_mode: "private",
    timezone: browserTimezone(),
    quiet_start: "22:30",
    quiet_end: "07:00",
    type_commitment: true,
    type_check_in: true,
    type_intervention: true,
    type_weekly: true,
  };
}

export async function upsertNotificationSettings(
  userId: string,
  fields: Partial<NotificationSettings>,
) {
  const { error } = await supabase
    .from("notification_settings")
    .upsert({ user_id: userId, ...fields }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function fetchDevices(userId: string) {
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, device_label, endpoint, created_at, last_success_at, failure_count")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function removeDevice(id: string) {
  const { error } = await supabase.from("push_subscriptions").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchSchedules(userId: string): Promise<ReminderSchedule[]> {
  const { data, error } = await supabase
    .from("reminder_schedules")
    .select("id, notification_type, label, time_of_day, days_of_week, frequency, enabled, last_sent_on")
    .eq("user_id", userId)
    .order("time_of_day", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ReminderSchedule[];
}

export async function createSchedule(
  userId: string,
  schedule: {
    notification_type: string;
    label: string | null;
    time_of_day: string;
    days_of_week: number[];
    frequency: string;
  },
) {
  const { error } = await supabase
    .from("reminder_schedules")
    .insert({ user_id: userId, ...schedule });
  if (error) throw error;
}

export async function updateSchedule(id: string, fields: Partial<ReminderSchedule>) {
  const { error } = await supabase.from("reminder_schedules").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deleteSchedule(id: string) {
  const { error } = await supabase.from("reminder_schedules").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchNotificationHistory(userId: string): Promise<NotificationLogRow[]> {
  const { data, error } = await supabase
    .from("notification_log")
    .select("id, notification_type, status, scheduled_for, sent_at, created_at, error_detail, feedback")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw error;
  return (data ?? []) as NotificationLogRow[];
}

export async function saveReminderFeedback(logId: string, feedback: string) {
  const { error } = await supabase
    .from("notification_log")
    .update({ feedback, feedback_at: new Date().toISOString() })
    .eq("id", logId);
  if (error) throw error;
}

/** Most recent reminder that hasn't been rated yet — used for the feedback prompt. */
export async function fetchPendingFeedback(userId: string): Promise<NotificationLogRow | null> {
  const { data, error } = await supabase
    .from("notification_log")
    .select("id, notification_type, status, scheduled_for, sent_at, created_at, error_detail, feedback")
    .eq("user_id", userId)
    .eq("status", "sent")
    .is("feedback", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as NotificationLogRow | null;
}

export function describeQuietHours(settings: NotificationSettings) {
  if (!settings.quiet_start || !settings.quiet_end) return "No quiet hours set";
  return `${settings.quiet_start.slice(0, 5)} → ${settings.quiet_end.slice(0, 5)}`;
}
