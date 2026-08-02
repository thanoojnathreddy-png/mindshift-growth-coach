import { supabase } from "@/integrations/supabase/client";

export type JournalEntry = {
  id: string;
  entry_date: string;
  content: string;
  mood: string | null;
  created_at: string;
};

export type WeeklyInsight = {
  week_start: string;
  summary: string;
  common_trigger: string | null;
  common_emotion: string | null;
  best_day: string | null;
  worst_day: string | null;
  trend: string | null;
};

export type ChatRow = { id: string; role: string; content: string };

export type CommitmentFields = {
  habit: string;
  motivation: string;
  triggers: string;
  future_self: string;
  reminder_preference: string;
};

export async function fetchJournal(userId: string, limit = 20): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("id, entry_date, content, mood, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as JournalEntry[];
}

export async function addJournalEntry(userId: string, content: string, mood: string | null) {
  const { error } = await supabase
    .from("journal_entries")
    .insert({ user_id: userId, content, mood });
  if (error) throw error;
}

export async function deleteJournalEntry(id: string) {
  const { error } = await supabase.from("journal_entries").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchWeeklyInsight(userId: string): Promise<WeeklyInsight | null> {
  const { data, error } = await supabase
    .from("weekly_insights")
    .select("week_start, summary, common_trigger, common_emotion, best_day, worst_day, trend")
    .eq("user_id", userId)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as WeeklyInsight | null;
}

export async function fetchCoachMessage(userId: string, date: string, kind: "daily" | "reflection") {
  const { data, error } = await supabase
    .from("coach_messages")
    .select("message")
    .eq("user_id", userId)
    .eq("message_date", date)
    .eq("kind", kind)
    .maybeSingle();
  if (error) throw error;
  return (data?.message as string | undefined) ?? null;
}

export async function fetchChatHistory(userId: string): Promise<ChatRow[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as ChatRow[];
}

export async function clearChatHistory(userId: string) {
  const { error } = await supabase.from("chat_messages").delete().eq("user_id", userId);
  if (error) throw error;
}

export async function updateCommitment(userId: string, fields: Partial<CommitmentFields>) {
  const { error } = await supabase.from("profiles").update(fields).eq("id", userId);
  if (error) throw error;
}

/**
 * "commitment" keeps every past check-in, journal entry and conversation and only
 * clears the commitment answers. "everything" wipes the whole journey.
 */
export async function resetJourney(userId: string, mode: "commitment" | "everything") {
  if (mode === "everything") {
    for (const table of [
      "check_ins",
      "journal_entries",
      "coach_messages",
      "chat_messages",
      "weekly_insights",
      "interventions",
      "if_then_plans",
      "consequence_logs",
      "consequence_metrics",
    ] as const) {
      const { error } = await supabase.from(table).delete().eq("user_id", userId);
      if (error) throw error;
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      habit: null,
      motivation: null,
      triggers: null,
      future_self: null,
      future_self_message: null,
      onboarding_completed: false,
      journey_started_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw error;
}
