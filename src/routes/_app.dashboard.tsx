import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  CalendarCheck,
  Flame,
  LifeBuoy,
  Lightbulb,
  MessageCircleHeart,
  NotebookPen,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { computeStats, fetchCheckIns, fetchProfile, todayISO } from "@/lib/mindshift";
import { fetchJournal } from "@/lib/growth";
import { fetchInterventions, interventionPatterns } from "@/lib/intervention";
import { getDailyCoaching, getWeeklyInsight } from "@/lib/coach.functions";
import { CoachMarkdown } from "@/components/coach/CoachMarkdown";
import { InterventionMode } from "@/components/intervention/InterventionMode";
import { ConsequenceDashboard } from "@/components/intervention/ConsequenceDashboard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MindShift" },
      {
        name: "description",
        content: "Your AI coach, streak and today's check-in in one calm place.",
      },
      { property: "og:title", content: "Dashboard — MindShift" },
      {
        property: "og:description",
        content: "Your AI coach, streak and today's check-in in one calm place.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const dailyCoaching = useServerFn(getDailyCoaching);
  const weeklyInsight = useServerFn(getWeeklyInsight);
  const [interventionOpen, setInterventionOpen] = useState(false);

  const interventionsQuery = useQuery({
    queryKey: ["interventions", user?.id],
    queryFn: () => fetchInterventions(user!.id, 30),
    enabled: Boolean(user?.id),
  });


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

  const journalQuery = useQuery({
    queryKey: ["journal", user?.id],
    queryFn: () => fetchJournal(user!.id, 3),
    enabled: Boolean(user?.id),
  });

  const profile = profileQuery.data;
  const ready = Boolean(user?.id) && Boolean(profile?.onboarding_completed);

  const coachQuery = useQuery({
    queryKey: ["daily-coaching", user?.id, todayISO()],
    queryFn: () => dailyCoaching({ data: {} }),
    enabled: ready,
    staleTime: Infinity,
    retry: false,
  });

  const insightQuery = useQuery({
    queryKey: ["weekly-insight", user?.id],
    queryFn: () => weeklyInsight({ data: {} }),
    enabled: ready,
    staleTime: 1000 * 60 * 30,
    retry: false,
  });

  const interventionPattern = interventionPatterns(interventionsQuery.data ?? []);
  const checkIns = checkInsQuery.data ?? [];
  const stats = computeStats(checkIns);
  const today = checkIns.find((entry) => entry.check_in_date === todayISO());
  const firstName = profile?.display_name?.split(" ")[0] ?? "there";
  const insight = insightQuery.data?.insight ?? null;

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
            Four short questions and your coach can start working with you.
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

        {/* Behavioural intervention entry point — the fastest path out of autopilot. */}
        <section className="surface-card mt-7 animate-rise rounded-3xl border-primary/30 p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <LifeBuoy className="h-3.5 w-3.5 text-primary" />
                Feeling the urge right now?
              </span>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Ten seconds, your own reason, and one alternative. No judgement, whatever you decide
                afterwards.
              </p>
            </div>
            <Button
              size="lg"
              className="shrink-0 rounded-2xl px-7 py-6 text-base"
              onClick={() => setInterventionOpen(true)}
            >
              <ShieldCheck className="mr-2 h-5 w-5" />
              I'm about to slip
            </Button>
          </div>
          {interventionPattern.observations.length > 0 && (
            <div className="mt-6 space-y-2">
              {interventionPattern.observations.slice(0, 2).map((line) => (
                <p key={line} className="rounded-2xl bg-muted/60 p-4 text-sm leading-relaxed">
                  {line}
                </p>
              ))}
              <Button asChild variant="ghost" size="sm" className="rounded-xl px-2">
                <Link to="/interventions">See all interventions</Link>
              </Button>
            </div>
          )}
        </section>



        {/* AI coach note — the centrepiece of the dashboard. */}
        <section className="surface-card mt-8 animate-rise rounded-3xl p-7">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MessageCircleHeart className="h-3.5 w-3.5 text-primary" />
              Your coach, today
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-muted-foreground"
              disabled={coachQuery.isFetching}
              onClick={() => coachQuery.refetch()}
              aria-label="Refresh coaching"
            >
              <RefreshCcw className={coachQuery.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            </Button>
          </div>

          {coachQuery.isPending ? (
            <div className="mt-5 space-y-2">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-4/5 rounded-lg" />
            </div>
          ) : coachQuery.isError ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Your coach couldn't be reached right now. Try refreshing in a moment.
            </p>
          ) : (
            <div className="mt-4 text-base leading-relaxed">
              <CoachMarkdown>{coachQuery.data?.message ?? ""}</CoachMarkdown>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button asChild className="rounded-xl">
              <Link to="/coach">
                Talk to your coach
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/check-in">{today ? "Update today's check-in" : "Check in for today"}</Link>
            </Button>
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

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="surface-card rounded-3xl p-7">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
              This week's insight
            </span>
            {insightQuery.isPending ? (
              <div className="mt-5 space-y-2">
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/5 rounded-lg" />
              </div>
            ) : insight ? (
              <>
                <p className="mt-4 text-base leading-relaxed">{insight.summary}</p>
                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  <InsightFact label="Common trigger" value={insight.common_trigger} />
                  <InsightFact label="Common emotion" value={insight.common_emotion} />
                  <InsightFact label="Strongest day" value={insight.best_day} />
                  <InsightFact label="Hardest day" value={insight.worst_day} />
                </dl>
              </>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                A few more check-ins and your coach will start spotting patterns across your week.
              </p>
            )}
          </div>

          <div className="surface-card rounded-3xl p-7">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Target className="h-3.5 w-3.5 text-primary" />
              Current commitment
            </span>
            <p className="mt-4 text-base font-medium leading-relaxed">
              {profile?.habit ?? "No commitment set yet."}
            </p>
            {profile?.future_self && (
              <p className="mt-4 rounded-2xl bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Becoming: </span>
                {profile.future_self}
              </p>
            )}
            <div className="mt-5 space-y-4">
              <SummaryRow label="Clean days" value={stats.cleanDays} total={stats.totalCheckIns} />
              <SummaryRow label="Slips" value={stats.slipDays} total={stats.totalCheckIns} />
            </div>
            <Button asChild variant="ghost" size="sm" className="mt-4 rounded-xl px-2">
              <Link to="/settings">Edit commitment</Link>
            </Button>
          </div>
        </section>

        <section className="surface-card mt-5 rounded-3xl p-7">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <NotebookPen className="h-3.5 w-3.5 text-primary" />
              Recent journal
            </span>
            <Button asChild variant="ghost" size="sm" className="rounded-xl">
              <Link to="/journal">Open journal</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {(journalQuery.data ?? []).length === 0 ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Nothing written yet. A short entry gives your coach much more to work with.
              </p>
            ) : (
              (journalQuery.data ?? []).map((entry) => (
                <div key={entry.id} className="rounded-2xl bg-muted/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {entry.entry_date}
                    {entry.mood ? ` · ${entry.mood}` : ""}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed">{entry.content}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function InsightFact({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-4">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium capitalize">{value ?? "—"}</dd>
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
