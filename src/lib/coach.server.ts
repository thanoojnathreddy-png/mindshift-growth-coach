import { generateText } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  COACH_MODEL,
  COACH_PROVIDER_OPTIONS,
  createLovableAiGatewayProvider,
  requireGatewayKey,
} from "./ai-gateway.server";
import { COACH_PERSONA, contextToPrompt, loadCoachContext } from "./coach-context.server";
import { weekStartISO } from "./insights";

type AnyClient = SupabaseClient<any, any, any>;

export function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

async function complete(system: string, prompt: string) {
  const gateway = createLovableAiGatewayProvider(requireGatewayKey());
  const { text } = await generateText({
    model: gateway(COACH_MODEL),
    system,
    prompt,
    providerOptions: COACH_PROVIDER_OPTIONS,
  });
  return text.trim();
}

export async function ensureDailyCoaching(supabase: AnyClient, userId: string, force = false) {
  const messageDate = todayUTC();

  if (!force) {
    const { data } = await supabase
      .from("coach_messages")
      .select("message")
      .eq("user_id", userId)
      .eq("message_date", messageDate)
      .eq("kind", "daily")
      .maybeSingle();
    if (data?.message) return data.message as string;
  }

  const context = await loadCoachContext(supabase, userId);
  if (!context.profile?.habit) {
    return "Set your commitment and I'll start coaching you with something that actually fits your situation.";
  }

  const message = await complete(
    COACH_PERSONA,
    `${contextToPrompt(context)}

TASK: Write today's coaching message (${messageDate}) for this person. 2-4 sentences. Reference something specific and true from their data above — a trigger, yesterday's result, their streak, or their own words. If they slipped most recently, be compassionate and curious. If they were clean, name the win and connect it to the identity they want. Do not repeat your recent daily messages. Output only the message.`,
  );

  const { error } = await supabase.from("coach_messages").upsert(
    { user_id: userId, message_date: messageDate, kind: "daily", message },
    { onConflict: "user_id,message_date,kind" },
  );
  if (error) console.error("coach_messages upsert failed", error);
  return message;
}

export async function generateReflection(supabase: AnyClient, userId: string) {
  const context = await loadCoachContext(supabase, userId);
  const today = context.checkIns.find((entry) => entry.check_in_date === todayUTC());
  const messageDate = todayUTC();

  const task = today?.repeated
    ? `TASK: The user just logged a slip today. Write a reflection that (1) shows you understood what happened in their own words, (2) names the emotional trigger you can see, (3) encourages them without minimising, and (4) suggests exactly one small, concrete thing to try tomorrow. 4-5 sentences, warm and direct.`
    : `TASK: The user just logged a clean day. Congratulate them specifically, and connect today's choice to the person they said they want to become. 2-3 sentences. No clichés.`;

  const message = await complete(COACH_PERSONA, `${contextToPrompt(context)}\n\n${task}`);

  const { error } = await supabase.from("coach_messages").upsert(
    { user_id: userId, message_date: messageDate, kind: "reflection", message },
    { onConflict: "user_id,message_date,kind" },
  );
  if (error) console.error("reflection upsert failed", error);
  return message;
}

export async function ensureWeeklyInsight(supabase: AnyClient, userId: string, force = false) {
  const week_start = weekStartISO();

  if (!force) {
    const { data } = await supabase
      .from("weekly_insights")
      .select("summary, common_trigger, common_emotion, best_day, worst_day, trend")
      .eq("user_id", userId)
      .eq("week_start", week_start)
      .maybeSingle();
    if (data) return data;
  }

  const context = await loadCoachContext(supabase, userId);
  const { patterns } = context;
  if (patterns.totalCheckIns < 3) return null;

  const summary = await complete(
    COACH_PERSONA,
    `${contextToPrompt(context)}

TASK: Write a weekly insight for this user. Two short sentences maximum, stating patterns as observations with numbers where possible (for example "You stay clean 80% of the time on weekdays but slip most Saturdays"). Only claim what the data supports. Output only the insight.`,
  );

  const row = {
    user_id: userId,
    week_start,
    summary,
    common_trigger: patterns.commonTrigger,
    common_emotion: patterns.commonEmotion,
    best_day: patterns.bestDay,
    worst_day: patterns.worstDay,
    trend: `${patterns.successRate}% success over ${patterns.totalCheckIns} check-ins`,
  };

  const { error } = await supabase
    .from("weekly_insights")
    .upsert(row, { onConflict: "user_id,week_start" });
  if (error) console.error("weekly_insights upsert failed", error);
  return row;
}
