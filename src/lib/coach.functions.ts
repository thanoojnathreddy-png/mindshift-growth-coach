import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ensureDailyCoaching,
  ensureWeeklyInsight,
  generateReflection,
} from "@/lib/coach.server";

export const getDailyCoaching = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { force?: boolean } | undefined) => ({ force: input?.force ?? false }))
  .handler(async ({ data, context }) => ({
    message: await ensureDailyCoaching(context.supabase, context.userId, data.force),
  }));

export const getCheckInReflection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({
    message: await generateReflection(context.supabase, context.userId),
  }));

export const getWeeklyInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { force?: boolean } | undefined) => ({ force: input?.force ?? false }))
  .handler(async ({ data, context }) => ({
    insight: await ensureWeeklyInsight(context.supabase, context.userId, data.force),
  }));
