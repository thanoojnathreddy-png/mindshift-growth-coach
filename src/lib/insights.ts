/** Pure analytics helpers shared by client UI and server AI context. No I/O. */

export type CheckInLike = {
  check_in_date: string;
  repeated: boolean;
  what_happened: string | null;
  trigger_note: string | null;
  feeling: string | null;
};

export type Patterns = {
  currentStreak: number;
  longestStreak: number;
  successRate: number;
  totalCheckIns: number;
  cleanDays: number;
  slipDays: number;
  bestDay: string | null;
  worstDay: string | null;
  commonTrigger: string | null;
  commonEmotion: string | null;
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const STOP_WORDS = new Set([
  "the","and","was","were","that","this","with","have","had","for","are","but","not","you","your",
  "when","then","from","about","after","before","because","really","just","feel","felt","feeling",
  "very","some","being","been","them","they","there","what","into","also","more","much","like",
  "myself","again","would","could","should","didn","don","it's","i'm","time","day","today",
]);

function topWord(values: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    for (const raw of value.toLowerCase().split(/[^a-z']+/)) {
      const word = raw.trim();
      if (word.length < 4 || STOP_WORDS.has(word)) continue;
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let bestCount = 1;
  for (const [word, count] of counts) {
    if (count > bestCount) {
      best = word;
      bestCount = count;
    }
  }
  return best;
}

function weekdayExtremes(checkIns: CheckInLike[]) {
  const buckets = new Map<number, { clean: number; total: number }>();
  for (const entry of checkIns) {
    const day = new Date(`${entry.check_in_date}T00:00:00Z`).getUTCDay();
    const bucket = buckets.get(day) ?? { clean: 0, total: 0 };
    bucket.total += 1;
    if (!entry.repeated) bucket.clean += 1;
    buckets.set(day, bucket);
  }
  let best: { day: number; rate: number } | null = null;
  let worst: { day: number; rate: number } | null = null;
  for (const [day, bucket] of buckets) {
    if (bucket.total < 1) continue;
    const rate = bucket.clean / bucket.total;
    if (!best || rate > best.rate) best = { day, rate };
    if (!worst || rate < worst.rate) worst = { day, rate };
  }
  return {
    bestDay: best ? (WEEKDAYS[best.day] ?? null) : null,
    worstDay: worst && best && worst.day !== best.day ? (WEEKDAYS[worst.day] ?? null) : null,
  };
}

export function computePatterns(checkIns: CheckInLike[]): Patterns {
  const sorted = [...checkIns].sort((a, b) => a.check_in_date.localeCompare(b.check_in_date));
  const cleanDays = sorted.filter((entry) => !entry.repeated).length;
  const total = sorted.length;

  let longest = 0;
  let running = 0;
  for (const entry of sorted) {
    running = entry.repeated ? 0 : running + 1;
    longest = Math.max(longest, running);
  }

  let current = 0;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    if (sorted[i]?.repeated) break;
    current += 1;
  }

  const slips = sorted.filter((entry) => entry.repeated);
  const { bestDay, worstDay } = weekdayExtremes(sorted);

  return {
    currentStreak: current,
    longestStreak: longest,
    successRate: total === 0 ? 0 : Math.round((cleanDays / total) * 100),
    totalCheckIns: total,
    cleanDays,
    slipDays: total - cleanDays,
    bestDay,
    worstDay,
    commonTrigger: topWord(slips.map((entry) => entry.trigger_note)),
    commonEmotion: topWord(slips.map((entry) => entry.feeling)),
  };
}

/** Monday-based week start (UTC) as an ISO date string. */
export function weekStartISO(date = new Date()) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay();
  copy.setUTCDate(copy.getUTCDate() - ((day + 6) % 7));
  return copy.toISOString().slice(0, 10);
}
