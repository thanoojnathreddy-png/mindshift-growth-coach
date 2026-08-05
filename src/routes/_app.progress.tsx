import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Flame, Sparkles, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  computeStats,
  dateISO,
  fetchCheckIns,
  monthlySeries,
  weeklySeries,
  type CheckIn,
} from "@/lib/mindshift";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/progress")({
  head: () => ({
    meta: [
      { title: "Progress | MindShift" },
      { name: "description", content: "See your streaks, patterns and reflections over time." },
      { property: "og:title", content: "Progress | MindShift" },
      {
        property: "og:description",
        content: "See your streaks, patterns and reflections over time.",
      },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["check-ins", user?.id],
    queryFn: () => fetchCheckIns(user!.id),
    enabled: Boolean(user?.id),
  });

  const checkIns = data ?? [];
  const stats = computeStats(checkIns);
  const weekly = weeklySeries(checkIns);
  const monthly = monthlySeries(checkIns);
  const reflections = checkIns.filter((entry) => entry.repeated).slice(0, 5);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-5 py-10">
        <Skeleton className="h-10 w-52 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="hero-glow min-h-screen px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Progress</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">The pattern, in full view</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every check-in adds a little more clarity about what actually drives the habit.
          </p>
        </header>

        <section className="mt-8 grid gap-5 sm:grid-cols-3">
          <Metric icon={Flame} label="Current streak" value={`${stats.currentStreak}d`} />
          <Metric icon={Sparkles} label="Longest streak" value={`${stats.longestStreak}d`} />
          <Metric icon={TrendingUp} label="Success rate" value={`${stats.successRate}%`} />
        </section>

        <section className="mt-5 surface-card rounded-3xl p-7">
          <h2 className="text-lg font-semibold">Last 5 weeks</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Green means you stayed with your commitment. Red means a slip you logged honestly.
          </p>
          <CalendarGrid checkIns={checkIns} />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="surface-card rounded-3xl p-7">
            <h2 className="text-lg font-semibold">This week</h2>
            <div className="mt-6 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly} barGap={2}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis hide domain={[0, 1]} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Bar dataKey="clean" name="Clean" fill="var(--success)" radius={4} />
                  <Bar dataKey="slip" name="Slip" fill="var(--destructive)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="surface-card rounded-3xl p-7">
            <h2 className="text-lg font-semibold">Success rate by month</h2>
            <div className="mt-6 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--muted-foreground)"
                    unit="%"
                    width={38}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    name="Success rate"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="surface-card mt-5 rounded-3xl p-7">
          <h2 className="text-lg font-semibold">Recent reflections</h2>
          {reflections.length === 0 ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              No slips logged yet. When one happens, your notes will appear here so you can spot the
              pattern behind it.
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {reflections.map((entry) => (
                <li key={entry.id} className="rounded-2xl bg-muted/60 p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {new Date(`${entry.check_in_date}T00:00:00`).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{entry.what_happened}</p>
                  {entry.trigger_note && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Trigger: </span>
                      {entry.trigger_note}
                    </p>
                  )}
                  {entry.feeling && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Felt: </span>
                      {entry.feeling}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
}) {
  return (
    <div className="surface-card rounded-3xl p-6">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}

function CalendarGrid({ checkIns }: { checkIns: CheckIn[] }) {
  const map = new Map(checkIns.map((entry) => [entry.check_in_date, entry]));
  const days: { key: string; state: "clean" | "slip" | "empty" }[] = [];
  for (let i = 34; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = dateISO(date);
    const entry = map.get(key);
    days.push({ key, state: entry ? (entry.repeated ? "slip" : "clean") : "empty" });
  }

  return (
    <div className="mt-6 grid max-w-sm grid-cols-7 gap-1.5 sm:gap-2">
      {days.map((day) => (
        <div
          key={day.key}
          title={day.key}
          className={cn(
            "aspect-square rounded-lg border border-border/60",
            day.state === "clean" && "border-transparent bg-success",
            day.state === "slip" && "border-transparent bg-destructive",
            day.state === "empty" && "bg-muted/50",
          )}
        />
      ))}
    </div>
  );
}
