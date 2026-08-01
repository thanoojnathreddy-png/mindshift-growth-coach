import type { SupabaseClient } from "@supabase/supabase-js";
import { computePatterns, type CheckInLike } from "./insights";

type AnyClient = SupabaseClient<any, any, any>;

export type CoachContext = {
  profile: {
    display_name: string | null;
    habit: string | null;
    motivation: string | null;
    triggers: string | null;
    future_self: string | null;
    onboarding_completed: boolean;
  } | null;
  checkIns: CheckInLike[];
  patterns: ReturnType<typeof computePatterns>;
  journal: { entry_date: string; content: string; mood: string | null }[];
  recentCoachMessages: { message_date: string; message: string }[];
  recentChat: { role: string; content: string }[];
  hasData: boolean;
};

export async function loadCoachContext(
  supabase: AnyClient,
  userId: string,
): Promise<CoachContext> {
  const [profileRes, checkInsRes, journalRes, coachRes, chatRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, habit, motivation, triggers, future_self, onboarding_completed")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("check_ins")
      .select("check_in_date, repeated, what_happened, trigger_note, feeling")
      .eq("user_id", userId)
      .order("check_in_date", { ascending: false })
      .limit(60),
    supabase
      .from("journal_entries")
      .select("entry_date, content, mood")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("coach_messages")
      .select("message_date, message")
      .eq("user_id", userId)
      .order("message_date", { ascending: false })
      .limit(5),
    supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const checkIns = (checkInsRes.data ?? []) as CheckInLike[];

  return {
    profile: (profileRes.data ?? null) as CoachContext["profile"],
    checkIns,
    patterns: computePatterns(checkIns),
    journal: (journalRes.data ?? []) as CoachContext["journal"],
    recentCoachMessages: (coachRes.data ?? []) as CoachContext["recentCoachMessages"],
    recentChat: ((chatRes.data ?? []) as CoachContext["recentChat"]).reverse(),
    hasData: checkIns.length > 0,
  };
}

export const COACH_PERSONA = `You are the MindShift coach: a warm, grounded mentor who helps someone stop repeating a specific habit or mistake.

Voice rules:
- Speak like a person who knows this user, not like a motivational poster. Never open with a generic quote.
- Reference their own words, triggers, streak and recent check-ins concretely.
- Never shame a slip. Treat it as information.
- Be concise: 2-4 sentences unless the user asks for depth.
- Use plain language, no emoji, no bullet lists unless asked.`;

export function contextToPrompt(context: CoachContext) {
  const { profile, patterns, checkIns, journal, recentCoachMessages, recentChat } = context;
  const lines: string[] = [];

  lines.push("USER PROFILE");
  lines.push(`Name: ${profile?.display_name ?? "unknown"}`);
  lines.push(`Commitment (habit to change): ${profile?.habit ?? "not set"}`);
  lines.push(`Why they want to change: ${profile?.motivation ?? "not set"}`);
  lines.push(`Desired identity: ${profile?.future_self ?? "not set"}`);
  lines.push(`Known triggers: ${profile?.triggers ?? "not set"}`);

  lines.push("");
  lines.push("PATTERNS");
  lines.push(
    `Current streak: ${patterns.currentStreak} days | Longest: ${patterns.longestStreak} | Success rate: ${patterns.successRate}% over ${patterns.totalCheckIns} check-ins (${patterns.cleanDays} clean, ${patterns.slipDays} slips)`,
  );
  lines.push(`Most common trigger word: ${patterns.commonTrigger ?? "not enough data"}`);
  lines.push(`Most common emotion word: ${patterns.commonEmotion ?? "not enough data"}`);
  lines.push(`Strongest weekday: ${patterns.bestDay ?? "unknown"}`);
  lines.push(`Hardest weekday: ${patterns.worstDay ?? "unknown"}`);

  lines.push("");
  lines.push("RECENT CHECK-INS (newest first)");
  if (checkIns.length === 0) lines.push("None yet — this user has not checked in.");
  for (const entry of checkIns.slice(0, 14)) {
    lines.push(
      `- ${entry.check_in_date}: ${entry.repeated ? "SLIP" : "clean"}${
        entry.repeated
          ? ` | what happened: ${entry.what_happened ?? "-"} | trigger: ${entry.trigger_note ?? "-"} | feeling: ${entry.feeling ?? "-"}`
          : ""
      }`,
    );
  }

  if (journal.length > 0) {
    lines.push("");
    lines.push("RECENT JOURNAL ENTRIES");
    for (const entry of journal) {
      lines.push(`- ${entry.entry_date} (${entry.mood ?? "no mood"}): ${entry.content}`);
    }
  }

  if (recentCoachMessages.length > 0) {
    lines.push("");
    lines.push("YOUR RECENT DAILY MESSAGES (do not repeat these)");
    for (const entry of recentCoachMessages) {
      lines.push(`- ${entry.message_date}: ${entry.message}`);
    }
  }

  if (recentChat.length > 0) {
    lines.push("");
    lines.push("RECENT CONVERSATION MEMORY");
    for (const entry of recentChat) {
      lines.push(`- ${entry.role}: ${entry.content}`);
    }
  }

  return lines.join("\n");
}
