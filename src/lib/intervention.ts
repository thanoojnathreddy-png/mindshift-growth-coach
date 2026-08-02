import { supabase } from "@/integrations/supabase/client";

/** Shared, client-safe vocabulary + data access for the behavioural intervention engine. */

export const TRIGGERS = [
  { key: "stress", label: "Stress" },
  { key: "boredom", label: "Boredom" },
  { key: "anger", label: "Anger" },
  { key: "loneliness", label: "Loneliness" },
  { key: "tiredness", label: "Tiredness" },
  { key: "social_pressure", label: "Social pressure" },
  { key: "habit", label: "Habit / automatic urge" },
  { key: "other", label: "Something else" },
] as const;

export type TriggerKey = (typeof TRIGGERS)[number]["key"];

export function triggerLabel(key: string | null | undefined) {
  return TRIGGERS.find((item) => item.key === key)?.label ?? "Unspecified";
}

export const COACHING_STYLES = [
  { key: "calm", label: "Calm", hint: "Slow, steady, grounding." },
  { key: "encouraging", label: "Encouraging", hint: "Warm and supportive." },
  { key: "reflective", label: "Reflective", hint: "Asks you a question." },
  { key: "logical", label: "Logical", hint: "Names the trade-off plainly." },
  { key: "direct", label: "Direct", hint: "Short and clear, never harsh." },
  { key: "progress", label: "Progress-focused", hint: "Points at what you've built." },
] as const;

export type CoachingStyleKey = (typeof COACHING_STYLES)[number]["key"];

export const FRICTION_LEVELS = [
  { key: "off", label: "Off", hint: "Go straight to the choices." },
  { key: "light", label: "Light", hint: "A 5-second pause only." },
  { key: "standard", label: "Standard", hint: "10-second pause and hold-to-continue." },
  { key: "high", label: "High", hint: "Longer pause, hold-to-continue, write your reason." },
] as const;

export type FrictionKey = (typeof FRICTION_LEVELS)[number]["key"];

export type FrictionConfig = {
  pauseSeconds: number;
  holdSeconds: number;
  askReason: boolean;
};

export function frictionConfig(level: string | null | undefined): FrictionConfig {
  switch (level) {
    case "off":
      return { pauseSeconds: 0, holdSeconds: 0, askReason: false };
    case "light":
      return { pauseSeconds: 5, holdSeconds: 0, askReason: false };
    case "high":
      return { pauseSeconds: 15, holdSeconds: 3, askReason: true };
    default:
      return { pauseSeconds: 10, holdSeconds: 2, askReason: false };
  }
}

export const DECISIONS = [
  { key: "alternative", label: "I chose my alternative" },
  { key: "another_minute", label: "I need another minute" },
  { key: "repeated", label: "I still repeated the behaviour" },
] as const;

export type DecisionKey = (typeof DECISIONS)[number]["key"];

export function decisionLabel(key: string | null | undefined) {
  return DECISIONS.find((item) => item.key === key)?.label ?? "No decision recorded";
}

export type InterventionPreferences = {
  friction_level: string;
  coaching_styles: string[];
  ai_personalization: boolean;
  future_self_message: string | null;
};

export type IfThenPlan = {
  id: string;
  trigger_key: string;
  alternative: string;
};

export type InterventionRow = {
  id: string;
  trigger_key: string | null;
  emotion: string | null;
  message: string | null;
  alternative_suggested: string | null;
  coaching_style: string | null;
  decision: string | null;
  helped: boolean | null;
  created_at: string;
};

export type ConsequenceMetric = {
  id: string;
  label: string;
  unit: string;
  amount_per_slip: number;
};

export type ConsequenceLog = {
  id: string;
  metric_id: string;
  amount: number;
  log_date: string;
};

export async function fetchInterventionPreferences(
  userId: string,
): Promise<InterventionPreferences | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("friction_level, coaching_styles, ai_personalization, future_self_message")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as InterventionPreferences | null;
}

export async function updateInterventionPreferences(
  userId: string,
  fields: Partial<InterventionPreferences>,
) {
  const { error } = await supabase.from("profiles").update(fields).eq("id", userId);
  if (error) throw error;
}

export async function fetchIfThenPlans(userId: string): Promise<IfThenPlan[]> {
  const { data, error } = await supabase
    .from("if_then_plans")
    .select("id, trigger_key, alternative")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as IfThenPlan[];
}

export async function saveIfThenPlan(userId: string, triggerKey: string, alternative: string) {
  const { error } = await supabase
    .from("if_then_plans")
    .upsert(
      { user_id: userId, trigger_key: triggerKey, alternative },
      { onConflict: "user_id,trigger_key" },
    );
  if (error) throw error;
}

export async function deleteIfThenPlan(id: string) {
  const { error } = await supabase.from("if_then_plans").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchInterventions(userId: string, limit = 60): Promise<InterventionRow[]> {
  const { data, error } = await supabase
    .from("interventions")
    .select(
      "id, trigger_key, emotion, message, alternative_suggested, coaching_style, decision, helped, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as InterventionRow[];
}

export async function updateIntervention(
  id: string,
  fields: { decision?: string; helped?: boolean; emotion?: string | null },
) {
  const { error } = await supabase.from("interventions").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deleteInterventionHistory(userId: string) {
  const { error } = await supabase.from("interventions").delete().eq("user_id", userId);
  if (error) throw error;
}

export async function fetchConsequenceMetrics(userId: string): Promise<ConsequenceMetric[]> {
  const { data, error } = await supabase
    .from("consequence_metrics")
    .select("id, label, unit, amount_per_slip")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ConsequenceMetric[];
}

export async function addConsequenceMetric(
  userId: string,
  metric: { label: string; unit: string; amount_per_slip: number },
) {
  const { error } = await supabase.from("consequence_metrics").insert({ user_id: userId, ...metric });
  if (error) throw error;
}

export async function deleteConsequenceMetric(id: string) {
  const { error } = await supabase.from("consequence_metrics").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchConsequenceLogs(userId: string): Promise<ConsequenceLog[]> {
  const { data, error } = await supabase
    .from("consequence_logs")
    .select("id, metric_id, amount, log_date")
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(400);
  if (error) throw error;
  return (data ?? []) as ConsequenceLog[];
}

export async function addConsequenceLog(userId: string, metricId: string, amount: number) {
  const { error } = await supabase
    .from("consequence_logs")
    .insert({ user_id: userId, metric_id: metricId, amount });
  if (error) throw error;
}

/** Cumulative cost = amounts the user logged + amount_per_slip × slips in the window. */
export function consequenceTotals(
  metrics: ConsequenceMetric[],
  logs: ConsequenceLog[],
  slipDates: string[],
  sinceISO?: string,
) {
  const inWindow = (date: string) => (sinceISO ? date >= sinceISO : true);
  const slips = slipDates.filter(inWindow).length;
  return metrics.map((metric) => {
    const logged = logs
      .filter((log) => log.metric_id === metric.id && inWindow(log.log_date))
      .reduce((sum, log) => sum + Number(log.amount), 0);
    const estimated = Number(metric.amount_per_slip) * slips;
    return { metric, logged, estimated, total: logged + estimated, slips };
  });
}

export function monthStartISO(date = new Date()) {
  return `${date.toISOString().slice(0, 7)}-01`;
}

/** Data-backed observations only — never invents a claim the rows don't support. */
export function interventionPatterns(rows: InterventionRow[]) {
  const total = rows.length;
  const triggerCounts = new Map<string, number>();
  const alternativeStats = new Map<string, { used: number; helped: number }>();
  let helpedYes = 0;
  let helpedRated = 0;
  let choseAlternative = 0;

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const weekTriggerCounts = new Map<string, number>();

  for (const row of rows) {
    if (row.trigger_key) {
      triggerCounts.set(row.trigger_key, (triggerCounts.get(row.trigger_key) ?? 0) + 1);
      if (row.created_at >= weekAgo) {
        weekTriggerCounts.set(row.trigger_key, (weekTriggerCounts.get(row.trigger_key) ?? 0) + 1);
      }
    }
    if (row.helped !== null) {
      helpedRated += 1;
      if (row.helped) helpedYes += 1;
    }
    if (row.decision === "alternative") choseAlternative += 1;
    if (row.alternative_suggested) {
      const stat = alternativeStats.get(row.alternative_suggested) ?? { used: 0, helped: 0 };
      stat.used += 1;
      if (row.decision === "alternative" || row.helped) stat.helped += 1;
      alternativeStats.set(row.alternative_suggested, stat);
    }
  }

  const topTrigger = [...triggerCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  const topWeekTrigger = [...weekTriggerCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  const bestAlternative =
    [...alternativeStats.entries()]
      .filter(([, stat]) => stat.used >= 2)
      .sort((a, b) => b[1].helped / b[1].used - a[1].helped / a[1].used)[0] ?? null;

  const observations: string[] = [];
  if (topWeekTrigger && topWeekTrigger[1] >= 2) {
    observations.push(
      `You've reported ${triggerLabel(topWeekTrigger[0]).toLowerCase()} as a trigger ${topWeekTrigger[1]} times in the last 7 days.`,
    );
  }
  if (bestAlternative && bestAlternative[1].helped > 0) {
    observations.push(
      `Your "${bestAlternative[0]}" alternative helped in ${bestAlternative[1].helped} of your last ${bestAlternative[1].used} interventions.`,
    );
  }
  if (total >= 3) {
    observations.push(
      `You paused ${total} times and chose your alternative in ${choseAlternative} of them.`,
    );
  }

  return {
    total,
    choseAlternative,
    helpedYes,
    helpedRated,
    helpfulRate: helpedRated === 0 ? null : Math.round((helpedYes / helpedRated) * 100),
    topTrigger: topTrigger ? { key: topTrigger[0], count: topTrigger[1] } : null,
    observations,
  };
}
