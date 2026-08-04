import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildReminderContent,
  finishNotificationLog,
  inQuietHours,
  localNow,
  logNotification,
  scheduleIsDueToday,
  sendPushToUser,
  toMinutes,
  type ReminderContext,
} from "./push.server";

/** Server-only reminder scheduler. Never import from client code. */

type AnyClient = SupabaseClient<any, any, any>;

/** How late a due reminder may still fire (the cron tick interval + slack). */
const WINDOW_MINUTES = 15;

export async function loadReminderContext(
  admin: AnyClient,
  userId: string,
  triggerKey?: string | null,
): Promise<ReminderContext> {
  const [{ data: profile }, { data: plans }, { data: checkIns }] = await Promise.all([
    admin
      .from("profiles")
      .select("display_name, habit, motivation, future_self, future_self_message, onboarding_completed")
      .eq("id", userId)
      .maybeSingle(),
    admin.from("if_then_plans").select("trigger_key, alternative").eq("user_id", userId),
    admin
      .from("check_ins")
      .select("check_in_date, repeated")
      .eq("user_id", userId)
      .order("check_in_date", { ascending: false })
      .limit(60),
  ]);

  const planRows = (plans ?? []) as { trigger_key: string; alternative: string }[];
  const plan =
    planRows.find((row) => row.trigger_key === triggerKey)?.alternative ??
    planRows[0]?.alternative ??
    null;

  return {
    displayName: (profile?.display_name as string | null) ?? null,
    habit: (profile?.habit as string | null) ?? null,
    motivation: (profile?.motivation as string | null) ?? null,
    futureSelf:
      (profile?.future_self_message as string | null) ?? (profile?.future_self as string | null) ?? null,
    streak: currentStreak((checkIns ?? []) as { check_in_date: string; repeated: boolean }[]),
    plan,
  };
}

function currentStreak(rows: { check_in_date: string; repeated: boolean }[]) {
  let streak = 0;
  for (const row of rows) {
    if (row.repeated) break;
    streak += 1;
  }
  return streak;
}

/** True when the user still has an active journey worth reminding them about. */
async function hasActiveCommitment(admin: AnyClient, userId: string) {
  const { data } = await admin
    .from("profiles")
    .select("habit, onboarding_completed")
    .eq("id", userId)
    .maybeSingle();
  return Boolean(data?.onboarding_completed && data?.habit);
}

type SettingsRow = {
  user_id: string;
  enabled: boolean;
  content_mode: string;
  timezone: string;
  quiet_start: string | null;
  quiet_end: string | null;
  type_commitment: boolean;
  type_check_in: boolean;
  type_intervention: boolean;
  type_weekly: boolean;
};

type ScheduleRow = {
  id: string;
  user_id: string;
  notification_type: string;
  time_of_day: string;
  days_of_week: number[];
  frequency: string;
  enabled: boolean;
  last_sent_on: string | null;
};

function typeEnabled(settings: SettingsRow, notificationType: string) {
  switch (notificationType) {
    case "check_in":
      return settings.type_check_in;
    case "intervention":
      return settings.type_intervention;
    case "weekly":
      return settings.type_weekly;
    default:
      return settings.type_commitment;
  }
}

/**
 * Finds reminders that are due right now (per user timezone), skips anything
 * muted by quiet hours / disabled categories, then sends and logs each one.
 */
export async function runDueReminders(admin: AnyClient, now = new Date()) {
  const { data: settingsRows } = await admin
    .from("notification_settings")
    .select("*")
    .eq("enabled", true);

  const settingsList = (settingsRows ?? []) as SettingsRow[];
  if (settingsList.length === 0) return { checked: 0, sent: 0, skipped: 0, failed: 0 };

  const userIds = settingsList.map((row) => row.user_id);
  const { data: scheduleRows } = await admin
    .from("reminder_schedules")
    .select("id, user_id, notification_type, time_of_day, days_of_week, frequency, enabled, last_sent_on")
    .eq("enabled", true)
    .in("user_id", userIds);

  const schedules = (scheduleRows ?? []) as ScheduleRow[];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const settings of settingsList) {
    const mine = schedules.filter((schedule) => schedule.user_id === settings.user_id);
    if (mine.length === 0) continue;

    const timezone = settings.timezone || "UTC";
    const local = localNow(timezone, now);

    for (const schedule of mine) {
      if (!typeEnabled(settings, schedule.notification_type)) {
        skipped += 1;
        continue;
      }
      if (!scheduleIsDueToday(schedule, local.weekday)) {
        skipped += 1;
        continue;
      }
      const target = toMinutes(schedule.time_of_day);
      if (target === null) continue;
      const delta = local.minutes - target;
      if (delta < 0 || delta > WINDOW_MINUTES) {
        skipped += 1;
        continue;
      }
      if (schedule.last_sent_on === local.date) {
        skipped += 1;
        continue;
      }
      if (inQuietHours(local.minutes, settings.quiet_start, settings.quiet_end)) {
        skipped += 1;
        continue;
      }
      if (!(await hasActiveCommitment(admin, settings.user_id))) {
        skipped += 1;
        continue;
      }

      // Claim the slot first so a concurrent tick can't double-send.
      const logId = await logNotification(admin, {
        userId: settings.user_id,
        scheduleId: schedule.id,
        notificationType: schedule.notification_type,
        contentMode: settings.content_mode,
        scheduledFor: now.toISOString(),
        timezone,
        dedupeKey: `${schedule.id}:${local.date}`,
      });
      if (!logId) {
        skipped += 1;
        continue;
      }
      await admin
        .from("reminder_schedules")
        .update({ last_sent_on: local.date })
        .eq("id", schedule.id);

      const context = await loadReminderContext(admin, settings.user_id);
      const content = buildReminderContent(
        schedule.notification_type,
        settings.content_mode,
        context,
        Math.floor(now.getTime() / 60000),
      );

      const result = await sendPushToUser(admin, settings.user_id, {
        ...content,
        notificationType: schedule.notification_type,
        tag: `mindshift-${schedule.notification_type}`,
        logId,
      });
      await finishNotificationLog(admin, logId, result);
      if (result.sent > 0) sent += 1;
      else failed += 1;
    }
  }

  return { checked: settingsList.length, sent, skipped, failed };
}
