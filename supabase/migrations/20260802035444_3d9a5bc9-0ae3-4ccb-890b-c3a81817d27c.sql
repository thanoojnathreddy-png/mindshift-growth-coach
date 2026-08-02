-- Profile additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS friction_level text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS coaching_styles text[] NOT NULL DEFAULT ARRAY['calm','encouraging','reflective']::text[],
  ADD COLUMN IF NOT EXISTS ai_personalization boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS future_self_message text;

-- If-Then plans
CREATE TABLE public.if_then_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_key text NOT NULL,
  alternative text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, trigger_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.if_then_plans TO authenticated;
GRANT ALL ON public.if_then_plans TO service_role;
ALTER TABLE public.if_then_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own if then plans" ON public.if_then_plans
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_if_then_plans_updated_at BEFORE UPDATE ON public.if_then_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Interventions
CREATE TABLE public.interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_key text,
  emotion text,
  commitment text,
  message text,
  alternative_suggested text,
  coaching_style text,
  decision text,
  helped boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interventions TO authenticated;
GRANT ALL ON public.interventions TO service_role;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own interventions" ON public.interventions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_interventions_updated_at BEFORE UPDATE ON public.interventions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX interventions_user_created_idx ON public.interventions (user_id, created_at DESC);

-- Consequence metrics
CREATE TABLE public.consequence_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  unit text NOT NULL,
  amount_per_slip numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consequence_metrics TO authenticated;
GRANT ALL ON public.consequence_metrics TO service_role;
ALTER TABLE public.consequence_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own consequence metrics" ON public.consequence_metrics
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_consequence_metrics_updated_at BEFORE UPDATE ON public.consequence_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Consequence logs
CREATE TABLE public.consequence_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_id uuid NOT NULL REFERENCES public.consequence_metrics(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  log_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'utc'))::date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consequence_logs TO authenticated;
GRANT ALL ON public.consequence_logs TO service_role;
ALTER TABLE public.consequence_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own consequence logs" ON public.consequence_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX consequence_logs_user_date_idx ON public.consequence_logs (user_id, log_date DESC);