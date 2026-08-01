import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import {
  COACH_MODEL,
  COACH_PROVIDER_OPTIONS,
  createLovableAiGatewayProvider,
} from "@/lib/ai-gateway.server";
import { COACH_PERSONA, contextToPrompt, loadCoachContext } from "@/lib/coach-context.server";

function textOf(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const url = process.env["SUPABASE_URL"];
        const anon =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
        const gatewayKey = process.env["LOVABLE_API_KEY"];
        if (!url || !anon) return new Response("Backend not configured", { status: 500 });
        if (!gatewayKey) return new Response("AI is not configured", { status: 500 });

        const supabase = createClient(url, anon, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });

        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const body = (await request.json()) as { messages?: UIMessage[] };
        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (messages.length === 0) return new Response("Messages are required", { status: 400 });

        const lastUser = [...messages].reverse().find((message) => message.role === "user");
        if (lastUser) {
          const { error } = await supabase.from("chat_messages").insert({
            user_id: userId,
            role: "user",
            content: textOf(lastUser),
            client_message_id: lastUser.id,
          });
          if (error) console.error("failed to persist user message", error);
        }

        const coachContext = await loadCoachContext(supabase, userId);
        const gateway = createLovableAiGatewayProvider(gatewayKey);

        const result = streamText({
          model: gateway(COACH_MODEL),
          system: `${COACH_PERSONA}\n\nEverything you know about this user:\n${contextToPrompt(coachContext)}`,
          messages: await convertToModelMessages(messages),
          providerOptions: COACH_PROVIDER_OPTIONS,
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ responseMessage }) => {
            const content = textOf(responseMessage);
            if (!content) return;
            const { error } = await supabase.from("chat_messages").insert({
              user_id: userId,
              role: "assistant",
              content,
              client_message_id: responseMessage.id,
            });
            if (error) console.error("failed to persist assistant message", error);
          },
        });
      },
    },
  },
});
