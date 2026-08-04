import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { BellRing, Clock, Plus, Send, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  DAY_LABELS,
  FREQUENCIES,
  NOTIFICATION_TYPES,
  browserTimezone,
  createSchedule,
  deleteSchedule,
  disablePushOnThisDevice,
  enablePushOnThisDevice,
  fetchDevices,
  fetchNotificationHistory,
  fetchNotificationSettings,
  fetchSchedules,
  notificationTypeLabel,
  pushSupport,
  removeDevice,
  updateSchedule,
  upsertNotificationSettings,
  type NotificationSettings,
  type PushSupport,
} from "@/lib/notifications";
import { sendReminderNow, sendTestNotification } from "@/lib/notifications.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — MindShift" },
      {
        name: "description",
        content:
          "Choose when MindShift reaches you, keep reminders private, and set quiet hours.",
      },
      { property: "og:title", content: "Notifications — MindShift" },
      {
        property: "og:description",
        content: "Choose when MindShift reaches you, keep reminders private, and set quiet hours.",
      },
    ],
  }),
  component: NotificationsPage,
});

const STATUS_COPY: Record<PushSupport, { dot: string; label: string; tone: string }> = {
  granted: { dot: "🟢", label: "Notifications enabled", tone: "text-primary" },
  denied: { dot: "🔴", label: "Notifications blocked", tone: "text-destructive" },
  default: { dot: "⚪", label: "Notifications not enabled", tone: "text-muted-foreground" },
  unsupported: { dot: "⚠️", label: "Notifications unsupported", tone: "text-muted-foreground" },
};

function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const runTest = useServerFn(sendTestNotification);
  const runPreview = useServerFn(sendReminderNow);

  const [support, setSupport] = useState<PushSupport>("default");
  useEffect(() => {
    setSupport(pushSupport());
  }, []);

  const settingsQuery = useQuery({
    queryKey: ["notification-settings", user?.id],
    queryFn: () => fetchNotificationSettings(user!.id),
    enabled: Boolean(user?.id),
  });
  const schedulesQuery = useQuery({
    queryKey: ["reminder-schedules", user?.id],
    queryFn: () => fetchSchedules(user!.id),
    enabled: Boolean(user?.id),
  });
  const devicesQuery = useQuery({
    queryKey: ["push-devices", user?.id],
    queryFn: () => fetchDevices(user!.id),
    enabled: Boolean(user?.id),
  });
  const historyQuery = useQuery({
    queryKey: ["notification-history", user?.id],
    queryFn: () => fetchNotificationHistory(user!.id),
    enabled: Boolean(user?.id),
  });

  const settings = settingsQuery.data;

  const saveSettings = useMutation({
    mutationFn: (fields: Partial<NotificationSettings>) =>
      upsertNotificationSettings(user!.id, fields),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notification-settings", user?.id] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const enable = useMutation({
    mutationFn: () => enablePushOnThisDevice(user!.id, settings?.timezone || browserTimezone()),
    onSuccess: async () => {
      setSupport(pushSupport());
      await queryClient.invalidateQueries({ queryKey: ["notification-settings", user?.id] });
      await queryClient.invalidateQueries({ queryKey: ["push-devices", user?.id] });
      toast.success("This device is registered for notifications.");
    },
    onError: (error: Error) => {
      setSupport(pushSupport());
      toast.error(error.message);
    },
  });

  const disable = useMutation({
    mutationFn: () => disablePushOnThisDevice(user!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notification-settings", user?.id] });
      await queryClient.invalidateQueries({ queryKey: ["push-devices", user?.id] });
      toast.success("Reminders paused. No notifications will be sent.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const test = useMutation({
    mutationFn: () => runTest({ data: undefined }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notification-history", user?.id] });
      toast.success("Sent — check your notification tray, not this page.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const preview = useMutation({
    mutationFn: (type: string) => runPreview({ data: { notificationType: type } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notification-history", user?.id] });
      toast.success("Reminder sent to your devices.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const status = STATUS_COPY[support];
  const registered = (devicesQuery.data ?? []).length > 0;

  if (settingsQuery.isLoading || !settings) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-5 py-10">
        <Skeleton className="h-10 w-56 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="hero-glow min-h-screen px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Notifications
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Stay ahead of the moment</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            MindShift can check in with you around the times you choose or times you've identified as
            difficult. You decide when, how often, and how much a notification reveals.
          </p>
        </header>

        {/* Permission + master switch */}
        <section className="surface-card mt-8 space-y-5 rounded-3xl p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Browser notifications</h2>
              <p className={cn("mt-1 text-sm", status.tone)}>
                {status.dot} {status.label}
              </p>
            </div>
            <BellRing className="h-5 w-5 text-primary" />
          </div>

          {support === "unsupported" ? (
            <p className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              This browser or device can't receive web push notifications. On iPhone/iPad you must
              first add MindShift to your Home Screen (Share → Add to Home Screen) and open it from
              there; on desktop, use Chrome, Edge, Firefox or Safari 16+.
            </p>
          ) : support === "denied" ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground">
              Notifications are blocked for this site. Open your browser's site settings (the icon
              next to the address bar) and allow notifications, then reload this page.
            </p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="rounded-xl"
                disabled={enable.isPending}
                onClick={() => enable.mutate()}
              >
                {enable.isPending
                  ? "Enabling…"
                  : registered && settings.enabled
                    ? "Re-register this device"
                    : "Enable notifications"}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={test.isPending || !registered}
                onClick={() => test.mutate()}
              >
                <Send className="mr-2 h-4 w-4" />
                {test.isPending ? "Sending…" : "Send test notification"}
              </Button>
              {settings.enabled && (
                <Button
                  variant="ghost"
                  className="rounded-xl"
                  disabled={disable.isPending}
                  onClick={() => disable.mutate()}
                >
                  Turn off
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
            <div>
              <p className="text-sm font-medium">Reminders {settings.enabled ? "on" : "off"}</p>
              <p className="text-xs text-muted-foreground">
                Master switch. When off, the scheduler skips your account entirely.
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => saveSettings.mutate({ enabled: checked })}
            />
          </div>
        </section>

        {/* Devices */}
        <section className="surface-card mt-6 space-y-4 rounded-3xl p-7">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">Your devices</h2>
          </div>
          {(devicesQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No device registered yet. Press “Enable notifications” on each browser or phone you
              want reminders on.
            </p>
          ) : (
            <ul className="space-y-2">
              {(devicesQuery.data ?? []).map((device) => (
                <li
                  key={device.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {device.device_label ?? "Unknown device"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(device.created_at as string).toLocaleDateString()}
                      {device.last_success_at
                        ? ` · last delivery ${new Date(device.last_success_at as string).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove device"
                    onClick={async () => {
                      await removeDevice(device.id as string);
                      await queryClient.invalidateQueries({ queryKey: ["push-devices", user?.id] });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Reminder schedules */}
        <ScheduleSection
          userId={user!.id}
          schedules={schedulesQuery.data ?? []}
          onChanged={() => queryClient.invalidateQueries({ queryKey: ["reminder-schedules", user?.id] })}
          onPreview={(type) => preview.mutate(type)}
          previewPending={preview.isPending}
        />

        {/* Categories */}
        <section className="surface-card mt-6 space-y-4 rounded-3xl p-7">
          <h2 className="text-lg font-semibold">Notification types</h2>
          {NOTIFICATION_TYPES.map((type) => (
            <div
              key={type.key}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4"
            >
              <div>
                <p className="text-sm font-medium">{type.label}</p>
                <p className="text-xs text-muted-foreground">{type.hint}</p>
              </div>
              <Switch
                checked={Boolean(settings[type.column as keyof NotificationSettings])}
                onCheckedChange={(checked) => saveSettings.mutate({ [type.column]: checked })}
              />
            </div>
          ))}
        </section>

        {/* Privacy mode */}
        <section className="surface-card mt-6 space-y-4 rounded-3xl p-7">
          <h2 className="text-lg font-semibold">What a notification shows</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <ModeCard
              active={settings.content_mode !== "personalized"}
              title="Private (default)"
              example="“Take a moment to check in with yourself.”"
              description="Never names your commitment, reasons or plan — safe on a shared lock screen."
              onSelect={() => saveSettings.mutate({ content_mode: "private" })}
            />
            <ModeCard
              active={settings.content_mode === "personalized"}
              title="Personalized"
              example="“Still choosing to change: late-night scrolling. 4-day streak.”"
              description="May reference your commitment, reason, plan or streak. Anyone who sees your screen can read it."
              onSelect={() => saveSettings.mutate({ content_mode: "personalized" })}
            />
          </div>
        </section>

        {/* Quiet hours + timezone */}
        <section className="surface-card mt-6 space-y-5 rounded-3xl p-7">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">Quiet hours & timezone</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quiet_start">Do not disturb from</Label>
              <Input
                id="quiet_start"
                type="time"
                className="rounded-2xl"
                value={(settings.quiet_start ?? "").slice(0, 5)}
                onChange={(event) =>
                  saveSettings.mutate({ quiet_start: event.target.value || null })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiet_end">Until</Label>
              <Input
                id="quiet_end"
                type="time"
                className="rounded-2xl"
                value={(settings.quiet_end ?? "").slice(0, 5)}
                onChange={(event) => saveSettings.mutate({ quiet_end: event.target.value || null })}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Ranges that cross midnight work (for example 22:30 → 07:00). Non-essential reminders are
            skipped in this window.
          </p>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="timezone"
                className="rounded-2xl"
                value={settings.timezone}
                onChange={(event) => saveSettings.mutate({ timezone: event.target.value })}
              />
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => saveSettings.mutate({ timezone: browserTimezone() })}
              >
                Use this device ({browserTimezone()})
              </Button>
            </div>
          </div>
        </section>

        {/* History */}
        <section className="surface-card mt-6 space-y-4 rounded-3xl p-7">
          <h2 className="text-lg font-semibold">History</h2>
          {(historyQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing sent yet. Delivery attempts show up here with their status.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {(historyQuery.data ?? []).map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{notificationTypeLabel(row.notification_type)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(row.sent_at ?? row.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                      row.status === "sent"
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {row.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            History records the category and delivery status only — never the personal content of a
            reminder.
          </p>
        </section>
      </div>
    </div>
  );
}

function ModeCard({
  active,
  title,
  example,
  description,
  onSelect,
}: {
  active: boolean;
  title: string;
  example: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "rounded-2xl border p-4 text-left transition-colors",
        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{example}</p>
      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    </button>
  );
}

function ScheduleSection({
  userId,
  schedules,
  onChanged,
  onPreview,
  previewPending,
}: {
  userId: string;
  schedules: ReturnType<typeof Object> extends never ? never : any[];
  onChanged: () => void;
  onPreview: (type: string) => void;
  previewPending: boolean;
}) {
  const [type, setType] = useState("commitment");
  const [time, setTime] = useState("21:00");
  const [frequency, setFrequency] = useState("daily");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: number) =>
    setDays((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort(),
    );

  const add = async () => {
    setSaving(true);
    try {
      await createSchedule(userId, {
        notification_type: type,
        label: null,
        time_of_day: time,
        days_of_week: frequency === "weekly_days" ? days : [0, 1, 2, 3, 4, 5, 6],
        frequency,
      });
      onChanged();
      toast.success("Reminder scheduled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save that reminder.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="surface-card mt-6 space-y-5 rounded-3xl p-7">
      <h2 className="text-lg font-semibold">Reminder schedule</h2>

      {schedules.length > 0 && (
        <ul className="space-y-2">
          {schedules.map((schedule) => (
            <li
              key={schedule.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {notificationTypeLabel(schedule.notification_type)} ·{" "}
                  {String(schedule.time_of_day).slice(0, 5)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {schedule.frequency === "daily"
                    ? "Every day"
                    : schedule.frequency === "weekdays"
                      ? "Monday–Friday"
                      : (schedule.days_of_week ?? [])
                          .map((day: number) => DAY_LABELS[day])
                          .join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl"
                  disabled={previewPending}
                  onClick={() => onPreview(schedule.notification_type)}
                >
                  Send now
                </Button>
                <Switch
                  checked={schedule.enabled}
                  onCheckedChange={async (checked) => {
                    await updateSchedule(schedule.id, { enabled: checked });
                    onChanged();
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete reminder"
                  onClick={async () => {
                    await deleteSchedule(schedule.id);
                    onChanged();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-4 rounded-2xl border border-dashed border-border p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminder_time">Time</Label>
            <Input
              id="reminder_time"
              type="time"
              className="rounded-2xl"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {frequency === "weekly_days" && (
          <div className="flex flex-wrap gap-2">
            {DAY_LABELS.map((label, index) => (
              <button
                key={label}
                type="button"
                aria-pressed={days.includes(index)}
                onClick={() => toggleDay(index)}
                className={cn(
                  "min-h-11 min-w-11 rounded-xl border px-3 text-sm transition-colors",
                  days.includes(index)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted/40",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <Button className="rounded-xl" disabled={saving} onClick={add}>
          <Plus className="mr-2 h-4 w-4" />
          {saving ? "Saving…" : "Add reminder"}
        </Button>
      </div>
    </section>
  );
}
