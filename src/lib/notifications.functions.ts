import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Real push sends triggered by the signed-in user (test notification / preview). */

export const sendTestNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendPushToUser, logNotification, finishNotificationLog } = await import(
      "@/lib/push.server"
    );

    const logId = await logNotification(supabaseAdmin, {
      userId: context.userId,
      notificationType: "test",
      scheduledFor: new Date().toISOString(),
    });

    const result = await sendPushToUser(supabaseAdmin, context.userId, {
      title: "MindShift",
      body: "Your reminders are working. We'll be here when you need a pause.",
      url: "/notifications?source=test",
      tag: "mindshift-test",
      notificationType: "test",
      logId,
    });

    if (logId) await finishNotificationLog(supabaseAdmin, logId, result);

    if (result.sent === 0) {
      throw new Error(
        result.errors[0] ?? "We couldn't deliver a notification to any registered device.",
      );
    }
    return { sent: result.sent, failed: result.failed };
  });

/** Sends the next scheduled reminder immediately, so users can preview real content. */
export const sendReminderNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { notificationType?: string }) => ({
    notificationType: input?.notificationType ?? "commitment",
  }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendPushToUser, logNotification, finishNotificationLog, buildReminderContent } =
      await import("@/lib/push.server");
    const { loadReminderContext } = await import("@/lib/reminders.server");

    const { data: settings } = await supabaseAdmin
      .from("notification_settings")
      .select("content_mode, timezone")
      .eq("user_id", context.userId)
      .maybeSingle();

    const reminderContext = await loadReminderContext(supabaseAdmin, context.userId);
    const content = buildReminderContent(
      data.notificationType,
      (settings?.content_mode as string) ?? "private",
      reminderContext,
    );

    const logId = await logNotification(supabaseAdmin, {
      userId: context.userId,
      notificationType: data.notificationType,
      contentMode: (settings?.content_mode as string) ?? "private",
      scheduledFor: new Date().toISOString(),
      timezone: (settings?.timezone as string) ?? "UTC",
    });

    const result = await sendPushToUser(supabaseAdmin, context.userId, {
      ...content,
      notificationType: data.notificationType,
      tag: `mindshift-${data.notificationType}`,
      logId,
    });
    if (logId) await finishNotificationLog(supabaseAdmin, logId, result);

    if (result.sent === 0) {
      throw new Error(result.errors[0] ?? "No device received this notification.");
    }
    return { sent: result.sent };
  });
