import { generateText } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  COACH_MODEL,
  COACH_PROVIDER_OPTIONS,
  createLovableAiGatewayProvider,
  requireGatewayKey,
} from "./ai-gateway.server";

type AnyClient = SupabaseClient<any, any, any>;

const STYLE_GUIDE: Record<string, string> = {
  calm: "Calm and grounding. Slow the moment down.",
  encouraging: "Warm and supportive. Believe in them out loud.",
  reflective: "Reflective. End with one gentle question.",
  logical: "Logical. Name the trade-off plainly, no drama.",
  direct: "Direct and clear — brief, respectful, never harsh.",
  progress: "Progress-focused. Point at what they have already built.",
};

const SAFE_RULES = `You are the MindShift intervention coach. The user is in a high-urge moment right now.
Rules:
- Maximum 2 short sentences, under 45 words total. No preamble, no lists, no emoji.
- Never shame, threaten, frighten, guilt-trip or manipulate. No "don't do it" commands.
- Use their own reason or identity words when you have them.
- If an alternative action is provided, point to it concretely.
- Never invent medical facts or statistics.`;

export type InterventionInput = {
  triggerKey: string | null;
  emotion: string | null;
  reason: string | null;
  source?: string | null;
  pauseCompleted?: boolean | null;
};

export type GeneratedIntervention = {
  id: string;
  message: string;
  alternative: string | null;
  style: string;
  reminder: string | null;
  futureSelfMessage: string | null;
};

function pickStyle(styles: string[], recent: (string | null)[]) {
  const pool = styles.length > 0 ? styles : ["calm", "encouraging", "reflective"];
  const helpful = recent.filter(Boolean) as string[];
  // Rotate: prefer a preferred style that wasn't used in the last two interventions.
  const lastTwo = new Set(helpful.slice(0, 2));
  const fresh = pool.filter((style) => !lastTwo.has(style));
  const candidates = fresh.length > 0 ? fresh : pool;
  return candidates[Math.floor(Math.random() * candidates.length)]!;
}

export async function createIntervention(
  supabase: AnyClient,
  userId: string,
  input: InterventionInput,
): Promise<GeneratedIntervention> {
  const [profileRes, planRes, historyRes, checkInsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "display_name, habit, motivation, triggers, future_self, future_self_message, coaching_styles, ai_personalization",
      )
      .eq("id", userId)
      .maybeSingle(),
    input.triggerKey
      ? supabase
          .from("if_then_plans")
          .select("alternative")
          .eq("user_id", userId)
          .eq("trigger_key", input.triggerKey)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("interventions")
      .select("trigger_key, coaching_style, decision, helped, alternative_suggested, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("check_ins")
      .select("check_in_date, repeated, trigger_note, feeling")
      .eq("user_id", userId)
      .order("check_in_date", { ascending: false })
      .limit(7),
  ]);

  const profile = (profileRes.data ?? {}) as Record<string, any>;
  const alternative = (planRes as any)?.data?.alternative ?? null;
  const history = (historyRes.data ?? []) as Record<string, any>[];
  const checkIns = (checkInsRes.data ?? []) as Record<string, any>[];
  const personalize = profile["ai_personalization"] !== false;
  const styles = (profile["coaching_styles"] as string[] | null) ?? [];
  const style = pickStyle(styles, history.map((row) => row["coaching_style"] ?? null));

  const reminder =
    (profile["motivation"] as string | null) ?? (profile["future_self"] as string | null) ?? null;

  let message: string;
  try {
    const gateway = createLovableAiGatewayProvider(requireGatewayKey());
    const context = personalize
      ? [
          `Commitment: ${profile["habit"] ?? "not set"}`,
          `Their reason for changing: ${profile["motivation"] ?? "not set"}`,
          `Identity they want: ${profile["future_self"] ?? "not set"}`,
          `Trigger right now: ${input.triggerKey ?? "unknown"}`,
          input.emotion ? `They described it as: ${input.emotion}` : "",
          input.reason ? `Reason they just typed: ${input.reason}` : "",
          alternative ? `Their if-then alternative: ${alternative}` : "No if-then plan for this trigger.",
          history.length > 0
            ? `Previous intervention outcomes (newest first): ${history
                .map(
                  (row) =>
                    `${row["trigger_key"] ?? "?"}→${row["decision"] ?? "no decision"}${
                      row["helped"] === true ? " (helped)" : row["helped"] === false ? " (didn't help)" : ""
                    }`,
                )
                .join("; ")}`
            : "No previous interventions.",
          checkIns.length > 0
            ? `Recent check-ins: ${checkIns
                .map((row) => `${row["check_in_date"]}: ${row["repeated"] ? "slip" : "clean"}`)
                .join(", ")}`
            : "No recent check-ins.",
        ]
          .filter(Boolean)
          .join("\n")
      : `Commitment: ${profile["habit"] ?? "not set"}\nTrigger right now: ${input.triggerKey ?? "unknown"}\n(AI personalisation is off — do not reference their stored history.)`;

    const { text } = await generateText({
      model: gateway(COACH_MODEL),
      system: `${SAFE_RULES}\nTone for this message: ${STYLE_GUIDE[style] ?? STYLE_GUIDE["calm"]}`,
      prompt: `${context}\n\nWrite the intervention message now. Output only the message.`,
      providerOptions: COACH_PROVIDER_OPTIONS,
    });
    message = text.trim();
  } catch (error) {
    console.error("intervention generation failed", error);
    message = alternative
      ? `You're here instead of on autopilot — that already counts. Try this first: ${alternative}`
      : "You're here instead of on autopilot, and that already counts. Give this moment one more breath before you decide.";
  }

  const { data: inserted, error } = await supabase
    .from("interventions")
    .insert({
      user_id: userId,
      trigger_key: input.triggerKey,
      emotion: input.emotion,
      commitment: profile["habit"] ?? null,
      message,
      alternative_suggested: alternative,
      coaching_style: style,
    })
    .select("id")
    .single();
  if (error) throw error;

  return {
    id: inserted!["id"] as string,
    message,
    alternative,
    style,
    reminder,
    futureSelfMessage: (profile["future_self_message"] as string | null) ?? null,
  };
}
