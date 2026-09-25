import { buildPushPayload } from "@block65/webcrypto-web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Server-only Web Push delivery. Never import from client code. */

type AnyClient = SupabaseClient<any, any, any>;

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
  notificationType: string;
  logId?: string | null;
};

function vapid() {
  const publicKey = process.env["VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  const subject = process.env["VAPID_SUBJECT"] ?? "mailto:notifications@mindshift.app";
  if (!publicKey || !privateKey) {
    throw new Error("Push notifications are not configured on the server yet.");
  }
  return { publicKey, privateKey, subject };
}

type SubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  failure_count: number;
};

/**
 * Sends one payload to every device the user has registered.
 * Expired/invalid subscriptions (404/410) are removed so they stop being retried.
 */
export async function sendPushToUser(
  admin: AnyClient,
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const keys = vapid();
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, failure_count")
    .eq("user_id", userId);

  const rows = (subscriptions ?? []) as SubscriptionRow[];
  if (rows.length === 0) {
    return { sent: 0, failed: 0, errors: ["No registered devices for this account."] };
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const request = await buildPushPayload(
        { data: payload, options: { ttl: 60 * 60, urgency: "normal" } },
        {
          endpoint: row.endpoint,
          expirationTime: null,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        keys,
      );

      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (typeof value === "string") headers.set(key, value);
      }

      const response = await fetch(row.endpoint, {
        method: request.method,
        headers,
        body: request.body as unknown as BodyInit,
      });

      if (response.ok) {
        sent += 1;
        await admin
          .from("push_subscriptions")
          .update({ last_success_at: new Date().toISOString(), failure_count: 0 })
          .eq("id", row.id);
        continue;
      }

      failed += 1;
      const detail = `${response.status} ${await response.text().catch(() => "")}`.slice(0, 200);
      errors.push(detail);

      if (response.status === 404 || response.status === 410) {
        await admin.from("push_subscriptions").delete().eq("id", row.id);
      } else {
        await admin
          .from("push_subscriptions")
          .update({ failure_count: row.failure_count + 1 })
          .eq("id", row.id);
      }
    } catch (error) {
      failed += 1;
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return { sent, failed, errors };
}

/** Writes the delivery attempt to history (deduped by dedupe_key when supplied). */
export async function logNotification(
  admin: AnyClient,
  input: {
    userId: string;
    scheduleId?: string | null;
    notificationType: string;
    contentMode?: string | null;
    scheduledFor?: string | null;
    timezone?: string | null;
    dedupeKey?: string | null;
  },
): Promise<string | null> {
  const { data, error } = await admin
    .from("notification_log")
    .insert({
      user_id: input.userId,
      schedule_id: input.scheduleId ?? null,
      notification_type: input.notificationType,
      content_mode: input.contentMode ?? null,
      scheduled_for: input.scheduledFor ?? null,
      timezone: input.timezone ?? null,
      dedupe_key: input.dedupeKey ?? null,
      status: "pending",
    })
    .select("id")
    .maybeSingle();

  // Unique violation on dedupe_key => this reminder was already handled.
  if (error) return null;
  return (data?.id as string | undefined) ?? null;
}

export async function finishNotificationLog(
  admin: AnyClient,
  logId: string,
  result: { sent: number; failed: number; errors: string[] },
) {
  await admin
    .from("notification_log")
    .update({
      status: result.sent > 0 ? "sent" : "failed",
      sent_at: result.sent > 0 ? new Date().toISOString() : null,
      error_detail: result.sent > 0 ? null : (result.errors[0] ?? "Delivery failed").slice(0, 300),
    })
    .eq("id", logId);
}

/* ---------------------------------- timing --------------------------------- */

export type LocalNow = { date: string; minutes: number; weekday: number };

/** Current wall-clock time in an arbitrary IANA timezone. */
export function localNow(timezone: string, now = new Date()): LocalNow {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hour12: false,
    }).formatToParts(now);
  } catch {
    return localNow("UTC", now);
  }
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = Number(get("hour")) % 24;
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: hour * 60 + Number(get("minute")),
    weekday: weekdayMap[get("weekday")] ?? 0,
  };
}

export function toMinutes(time: string | null | undefined) {
  if (!time) return null;
  const [hour, minute] = time.split(":");
  return Number(hour) * 60 + Number(minute ?? 0);
}

/** Handles quiet-hour windows that cross midnight (e.g. 22:30 → 07:00). */
export function inQuietHours(nowMinutes: number, start: string | null, end: string | null) {
  const from = toMinutes(start);
  const to = toMinutes(end);
  if (from === null || to === null) return false;
  if (from === to) return false;
  return from < to ? nowMinutes >= from && nowMinutes < to : nowMinutes >= from || nowMinutes < to;
}

export function scheduleIsDueToday(
  schedule: { days_of_week: number[]; frequency: string },
  weekday: number,
) {
  if (schedule.frequency === "daily") return true;
  if (schedule.frequency === "weekdays") return weekday >= 1 && weekday <= 5;
  return (schedule.days_of_week ?? []).includes(weekday);
}

/* --------------------------------- content -------------------------------- */

const PRIVATE_BODIES = [
  "Take a moment to check in with yourself.",
  "A short pause is available whenever you need it.",
  "One minute of awareness — that's all this is.",
  "Here if you want to think before deciding.",
];

export type ReminderContext = {
  displayName: string | null;
  habit: string | null;
  motivation: string | null;
  futureSelf: string | null;
  streak: number;
  plan: string | null;
};

/**
 * Private mode never names the commitment. Personalized mode may reference it.
 * Everything stays short — this is read on a lock screen.
 */
export function buildReminderContent(
  notificationType: string,
  contentMode: string,
  context: ReminderContext,
  seed = Date.now(),
): { title: string; body: string; url: string } {
  const url =
    notificationType === "intervention"
      ? "/intervention?source=reminder"
      : notificationType === "check_in"
        ? "/check-in?source=reminder"
        : notificationType === "weekly"
          ? "/progress?source=reminder"
          : "/dashboard?source=reminder";

  if (contentMode !== "personalized") {
    const body =
      notificationType === "check_in"
        ? "Your daily check-in is waiting when you're ready."
        : notificationType === "weekly"
          ? "Your weekly reflection is ready."
          : PRIVATE_BODIES[seed % PRIVATE_BODIES.length]!;
    return { title: "MindShift", body, url };
  }

  const habit = context.habit?.trim();
  const streakLine = context.streak > 0 ? `${context.streak}-day streak.` : null;

  if (notificationType === "check_in") {
    return {
      title: "MindShift",
      body: streakLine
        ? `${streakLine} Log today's check-in in under a minute.`
        : "Log today's check-in in under a minute.",
      url,
    };
  }
  if (notificationType === "weekly") {
    return { title: "MindShift", body: "Your weekly reflection is ready to read.", url };
  }
  if (notificationType === "intervention") {
    const plan = context.plan?.trim();
    return {
      title: "MindShift",
      body: plan
        ? `A difficult window. Your plan: ${plan}`.slice(0, 140)
        : "A difficult window. Want to pause for 10 seconds first?",
      url,
    };
  }

  const reason = context.motivation?.trim() || context.futureSelf?.trim();
  const body = habit
    ? `Still choosing to change: ${habit}.${streakLine ? ` ${streakLine}` : ""}`.slice(0, 140)
    : reason
      ? reason.slice(0, 140)
      : "Still on your journey. One conscious choice at a time.";
  return { title: "MindShift", body, url };
}
