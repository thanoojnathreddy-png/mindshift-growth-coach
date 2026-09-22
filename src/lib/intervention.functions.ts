import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateIntervention = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      triggerKey?: string | null;
      emotion?: string | null;
      reason?: string | null;
      source?: string | null;
      pauseCompleted?: boolean | null;
    }) => ({
      triggerKey: input?.triggerKey ?? null,
      emotion: input?.emotion ?? null,
      reason: input?.reason ?? null,
      source: input?.source ?? null,
      pauseCompleted: input?.pauseCompleted ?? null,
    }),
  )
  .handler(async ({ data, context }) => {
    const { createIntervention } = await import("@/lib/intervention.server");
    return createIntervention(context.supabase, context.userId, data);
  });
