ALTER TABLE public.interventions
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS pause_completed boolean;