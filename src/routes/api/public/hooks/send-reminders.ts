import { createFileRoute } from "@tanstack/react-router";

/**
 * Cron endpoint: pg_cron hits this every 5 minutes to deliver due reminders.
 * Public prefix, so the caller is verified here with the project's apikey.
 */
export const Route = createFileRoute("/api/public/hooks/send-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace("Bearer ", "");
        const expected =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];

        if (!expected || !apiKey || apiKey !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { runDueReminders } = await import("@/lib/reminders.server");
          const result = await runDueReminders(supabaseAdmin);
          return Response.json({ ok: true, ...result });
        } catch (error) {
          console.error("[send-reminders] failed", error);
          return new Response(
            JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "failed" }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
