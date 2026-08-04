CREATE TABLE public.notification_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  content_mode text NOT NULL DEFAULT 'private',
  timezone text NOT NULL DEFAULT 'UTC',
  quiet_start time,
  quiet_end time,
  type_commitment boolean NOT NULL DEFAULT true,
  type_check_in boolean NOT NULL DEFAULT true,
  type_intervention boolean NOT NULL DEFAULT true,
  type_weekly boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_settings TO authenticated;
GRANT ALL ON public.notification_settings TO service_role;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notification settings" ON public.notification_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  device_label text,
  failure_count integer NOT NULL DEFAULT 0,
  last_success_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push subscriptions" ON public.push_subscriptions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX push_subscriptions_user_idx ON public.push_subscriptions(user_id);
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.reminder_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL DEFAULT 'commitment',
  label text,
  time_of_day time NOT NULL DEFAULT '21:00',
  days_of_week integer[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6],
  frequency text NOT NULL DEFAULT 'weekly_days',
  enabled boolean NOT NULL DEFAULT true,
  last_sent_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminder_schedules TO authenticated;
GRANT ALL ON public.reminder_schedules TO service_role;
ALTER TABLE public.reminder_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reminder schedules" ON public.reminder_schedules
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX reminder_schedules_user_idx ON public.reminder_schedules(user_id);
CREATE TRIGGER update_reminder_schedules_updated_at BEFORE UPDATE ON public.reminder_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id uuid REFERENCES public.reminder_schedules(id) ON DELETE SET NULL,
  notification_type text NOT NULL,
  content_mode text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  error_detail text,
  dedupe_key text,
  timezone text,
  feedback text,
  feedback_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_log TO authenticated;
GRANT ALL ON public.notification_log TO service_role;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notification log" ON public.notification_log
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE UNIQUE INDEX notification_log_dedupe_idx ON public.notification_log(user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX notification_log_user_created_idx ON public.notification_log(user_id, created_at DESC);