import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes the signed-in user's account and all data owned by it. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Rows referencing auth.users cascade on delete, so removing the auth user
    // clears profile, check-ins, journal, interventions, coach memory and devices.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) {
      console.error("account deletion failed", error);
      throw new Error("We couldn't delete your account just now. Please try again.");
    }
    return { deleted: true };
  });
