import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarCheck,
  Flame,
  Quote,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  computeStats,
  dailyMotivation,
  fetchCheckIns,
  fetchProfile,
  todayISO,
} from "@/lib/mindshift";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MindShift" },
      { name: "description", content: "Your commitment, streak and today's check-in in one place." },
      { property: "og:title", content: "Dashboard — MindShift" },
      {
        property: "og:description",
        content: "Your commitment, streak and today's check-in in one place.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: Boolean(user?.id),
  });

  const checkInsQuery = useQuery({
    queryKey: ["check-ins", user?.id],
    queryFn: () => fetchCheckIns(user!.id),
    enabled: Boolean(user?.id),
  });

  const profile = profileQuery.data;
  const checkIns = checkInsQuery.data ?? [];
  const stats = computeStats(checkIns);
  const today = checkIns.find((entry) => entry.check_in_date === todayISO());
  const firstName = profile?.display_name?.split(" ")[0] ?? "there";

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-5 py-10">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    );
  }

  if (profile && !profile.onboarding_completed) {
    return (
      <div className="hero-glow grid min-h-[70vh] place-items-center px-5">
        <div className="surface-card max-w-md rounded-3xl p-8 text-center">
          <Sparkles className="mx-auto h-7 w-7 text-primary" />
          <h1 className="mt-4 text-xl font-semibold">Let's set your commitment</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Four short questions and your dashboard comes alive.
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link to="/onboarding">
              Start onboarding
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-glow min-h-screen px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Welcome back, {firstName}.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {today
              ? "You've already checked in today. That's the whole job."
              : "One honest question is waiting for you."}
          </p>
        </header>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="surface-card rounded-3xl p-7">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Target className="h-3.5 w-3.5 text-primary" />
              Current commitment
            </span>
            <p className="mt-4 text-lg font-medium leading-relaxed">
              {profile?.habit ?? "No commitment set yet."}
            </p>
            {profile?.future_self && (
              <p className="mt-5 rounded-2xl bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Becoming: </span>
                {profile.future_self}
              </p>
            )}
            <Button asChild variant="ghost" size="sm" className="mt-4 rounded-xl px-2">
              <Link to="/onboarding">Update my answers</Link>
            </Button>
          </div>

          {/* PLACEHOLDER: AI coaching. Swap dailyMotivation() for a generated, context-aware note. */}
          <div className="surface-card flex flex-col justify-between rounded-3xl p-7">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Quote className="h-3.5 w-3.5 text-primary" />
                Today's motivation
              </span>
              <p className="mt-4 text-base leading-relaxed">{dailyMotivation()}</p>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              AI-personalised coaching arrives in a future release.
            </p>
          </div>
        </section>

        <section className="mt-5 grid gap-5 sm:grid-cols-3">
          <StatTile
            icon={Flame}
            label="Current streak"
            value={`${stats.currentStreak}`}
            suffix={stats.currentStreak === 1 ? "day" : "days"}
          />
          <StatTile icon={TrendingUp} label="Success rate" value={`${stats.successRate}`} suffix="%" />
          <StatTile
            icon={CalendarCheck}
            label="Check-ins logged"
            value={`${stats.totalCheckIns}`}
            suffix="total"
          />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="surface-card rounded-3xl p-7">
            <h2 className="text-lg font-semibold">Today's check-in</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {today
                ? today.repeated
                  ? "You logged a slip today. That honesty is what changes the pattern."
                  : "You stayed with your commitment today. Well done."
                : "Thirty seconds. No judgement, whatever the answer is."}
            </p>
            <Button asChild className="mt-6 w-full rounded-xl">
              <Link to="/check-in">
                {today ? "Update today's check-in" : "Check in for today"}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="surface-card rounded-3xl p-7">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Progress summary</h2>
              <Button asChild variant="ghost" size="sm" className="rounded-xl">
                <Link to="/progress">Details</Link>
              </Button>
            </div>
            <div className="mt-5 space-y-5">
              <SummaryRow label="Clean days" value={stats.cleanDays} total={stats.totalCheckIns} />
              <SummaryRow label="Slips" value={stats.slipDays} total={stats.totalCheckIns} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Longest streak</span>
                <span className="font-medium">
                  {stats.longestStreak} {stats.longestStreak === 1 ? "day" : "days"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <div className="surface-card rounded-3xl p-6">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl font-semibold">
        {value}
        <span className="ml-1.5 text-sm font-normal text-muted-foreground">{suffix}</span>
      </p>
    </div>
  );
}

function SummaryRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <Progress value={percent} className="mt-2 h-1.5" />
    </div>
  );
}
