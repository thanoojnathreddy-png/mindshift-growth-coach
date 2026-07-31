import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  display_name: string | null;
  habit: string | null;
  motivation: string | null;
  triggers: string | null;
  future_self: string | null;
  onboarding_completed: boolean;
};

export type CheckIn = {
  id: string;
  check_in_date: string;
  repeated: boolean;
  what_happened: string | null;
  trigger_note: string | null;
  feeling: string | null;
};

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function dateISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, habit, motivation, triggers, future_self, onboarding_completed")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function fetchCheckIns(userId: string): Promise<CheckIn[]> {
  const { data, error } = await supabase
    .from("check_ins")
    .select("id, check_in_date, repeated, what_happened, trigger_note, feeling")
    .eq("user_id", userId)
    .order("check_in_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CheckIn[];
}

export type Stats = {
  currentStreak: number;
  longestStreak: number;
  successRate: number;
  totalCheckIns: number;
  cleanDays: number;
  slipDays: number;
};

/** Streak = consecutive most recent days checked in without repeating the habit. */
export function computeStats(checkIns: CheckIn[]): Stats {
  const sorted = [...checkIns].sort((a, b) => a.check_in_date.localeCompare(b.check_in_date));
  const cleanDays = sorted.filter((c) => !c.repeated).length;
  const total = sorted.length;

  let longest = 0;
  let running = 0;
  for (const entry of sorted) {
    running = entry.repeated ? 0 : running + 1;
    longest = Math.max(longest, running);
  }

  let current = 0;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    if (sorted[i].repeated) break;
    current += 1;
  }

  return {
    currentStreak: current,
    longestStreak: longest,
    successRate: total === 0 ? 0 : Math.round((cleanDays / total) * 100),
    totalCheckIns: total,
    cleanDays,
    slipDays: total - cleanDays,
  };
}

/**
 * PLACEHOLDER: daily motivation is picked from a static library.
 * Replace with AI-generated, context-aware coaching (Lovable AI Gateway) later.
 */
const MOTIVATIONS = [
  "Every time you notice the urge and pause, you're rewiring the pattern. That pause is progress.",
  "You are not the habit. You're the person choosing, right now, to do it differently.",
  "One honest check-in beats a week of pretending. Keep showing up for yourself.",
  "Relapse isn't failure — it's data. What did today teach you about your triggers?",
  "The version of you that you're becoming is built from small, unglamorous choices like today's.",
  "Progress is quieter than you expect. Trust the streak, not the mood.",
  "Be as patient with yourself as you would be with someone you love.",
];

export function dailyMotivation(seed = todayISO()) {
  const sum = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return MOTIVATIONS[sum % MOTIVATIONS.length];
}

export function weeklySeries(checkIns: CheckIn[]) {
  const map = new Map(checkIns.map((c) => [c.check_in_date, c]));
  const out: { label: string; clean: number; slip: number }[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const entry = map.get(dateISO(date));
    out.push({
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      clean: entry && !entry.repeated ? 1 : 0,
      slip: entry && entry.repeated ? 1 : 0,
    });
  }
  return out;
}

export function monthlySeries(checkIns: CheckIn[]) {
  const buckets = new Map<string, { clean: number; total: number }>();
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    buckets.set(date.toISOString().slice(0, 7), { clean: 0, total: 0 });
  }
  for (const entry of checkIns) {
    const key = entry.check_in_date.slice(0, 7);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.total += 1;
    if (!entry.repeated) bucket.clean += 1;
  }
  return [...buckets.entries()].map(([key, value]) => ({
    label: new Date(`${key}-01T00:00:00Z`).toLocaleDateString(undefined, { month: "short" }),
    rate: value.total === 0 ? 0 : Math.round((value.clean / value.total) * 100),
  }));
}
