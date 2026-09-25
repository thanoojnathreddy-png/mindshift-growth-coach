import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  Check,
  Heart,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { generateIntervention } from "@/lib/intervention.functions";
import {
  TRIGGERS,
  fetchIfThenPlans,
  fetchInterventionPreferences,
  frictionConfig,
  triggerLabel,
  updateIntervention,
} from "@/lib/intervention";
import { fetchProfile } from "@/lib/mindshift";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Source = "manual" | "reminder" | "friction-shield";
type Step = "pause" | "remember" | "plan" | "choice" | "feedback" | "done";

export const Route = createFileRoute("/_app/intervention")({
  validateSearch: (search: Record<string, unknown>): { source: Source; trigger?: string | undefined } => ({
    source: (["manual", "reminder", "friction-shield"] as const).includes(
      search["source"] as Source,
    )
      ? (search["source"] as Source)
      : ("manual" as Source),
    trigger: typeof search["trigger"] === "string" ? (search["trigger"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pause | MindShift" },
      {
        name: "description",
        content: "A ten-second pause between the urge and your next choice.",
      },
      { property: "og:title", content: "Pause | MindShift" },
      {
        property: "og:description",
        content: "A ten-second pause between the urge and your next choice.",
      },
    ],
  }),
  component: InterventionPage,
});

function InterventionPage() {
  const { source, trigger: triggerParam } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const runIntervention = useServerFn(generateIntervention);

  const prefsQuery = useQuery({
    queryKey: ["intervention-prefs", user?.id],
    queryFn: () => fetchInterventionPreferences(user!.id),
    enabled: Boolean(user?.id),
  });
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: Boolean(user?.id),
  });
  const plansQuery = useQuery({
    queryKey: ["if-then-plans", user?.id],
    queryFn: () => fetchIfThenPlans(user!.id),
    enabled: Boolean(user?.id),
  });

  const friction = frictionConfig(prefsQuery.data?.friction_level);
  // A pause is the point of this screen, so never drop below a short countdown.
  const pauseSeconds = friction.pauseSeconds > 0 ? friction.pauseSeconds : 10;

  const [step, setStep] = useState<Step>("pause");
  const [seconds, setSeconds] = useState(10);
  const [trigger, setTrigger] = useState<string | null>(triggerParam ?? null);
  const startedRef = useRef(false);

  const generate = useMutation({
    mutationFn: (input: { triggerKey: string | null }) =>
      runIntervention({
        data: { triggerKey: input.triggerKey, source, pauseCompleted: true },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interventions", user?.id] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const record = useMutation({
    mutationFn: (fields: { decision?: string; helped?: boolean }) =>
      updateIntervention(generate.data!.id, fields),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interventions", user?.id] }),
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    if (prefsQuery.isLoading || startedRef.current) return;
    startedRef.current = true;
    setSeconds(pauseSeconds);
  }, [prefsQuery.isLoading, pauseSeconds]);

  useEffect(() => {
    if (step !== "pause" || seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, seconds]);

  const profile = profileQuery.data;
  const prefs = prefsQuery.data;

  // The user's own words, in the order the product promises: future-self message first.
  const ownWords = useMemo(() => {
    if (prefs?.future_self_message?.trim()) {
      return {
        label: "These are your own words from when you decided to change.",
        text: prefs.future_self_message.trim(),
      };
    }
    if (profile?.future_self?.trim()) {
      return { label: "The person you said you wanted to become.", text: profile.future_self.trim() };
    }
    if (profile?.motivation?.trim()) {
      return { label: "The reason you gave when you started.", text: profile.motivation.trim() };
    }
    return null;
  }, [prefs?.future_self_message, profile?.future_self, profile?.motivation]);

  const plans = plansQuery.data ?? [];
  const plan = (trigger ? plans.find((item) => item.trigger_key === trigger) : null) ?? plans[0] ?? null;
  const alternative = generate.data?.alternative ?? plan?.alternative ?? null;

  const leave = () => navigate({ to: "/dashboard" });

  const choose = (decision: string) => {
    if (generate.data?.id) record.mutate({ decision });
    if (decision === "alternative") {
      setStep("feedback");
      return;
    }
    if (decision === "coach") {
      navigate({
        to: "/coach",
        search: { from: "intervention", trigger: trigger ?? undefined },
      });
      return;
    }
    setStep("done");
  };

  return (
    <div className="hero-glow min-h-screen px-5 py-8">
      <div className="mx-auto flex w-full max-w-xl flex-col">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            MindShift pause
          </span>
          <Button variant="ghost" size="icon" onClick={leave} aria-label="Leave this pause">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-8" aria-live="polite">
          {prefsQuery.isLoading ? (
            <Skeleton className="h-56 w-full rounded-3xl" />
          ) : step === "pause" ? (
            <PauseStep
              seconds={seconds}
              total={pauseSeconds}
              onContinue={() => {
                generate.mutate({ triggerKey: trigger });
                setStep("remember");
              }}
            />
          ) : step === "remember" ? (
            <StepCard
              eyebrow="Remember why"
              title="Remember why you started."
              body={
                ownWords ? (
                  <blockquote className="rounded-2xl bg-muted/60 p-5">
                    <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <Heart className="h-3 w-3 text-primary" />
                      {ownWords.label}
                    </p>
                    <p className="mt-2.5 text-base leading-relaxed">{ownWords.text}</p>
                  </blockquote>
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    You haven't written your reason down yet. You can add it in Settings, and it will
                    appear here the next time you need it.
                  </p>
                )
              }
              action={
                <div className="space-y-2.5">
                  <Button className="w-full rounded-xl py-6" onClick={() => setStep("plan")}>
                    Continue
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                  {!trigger && (
                    <details className="rounded-2xl border border-border p-4">
                      <summary className="cursor-pointer text-sm font-medium">
                        Name what's happening (optional)
                      </summary>
                      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                        {TRIGGERS.map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setTrigger(item.key)}
                            className={cn(
                              "rounded-2xl border border-border bg-card/60 px-4 py-3.5 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-accent",
                              trigger === item.key && "border-primary bg-accent",
                            )}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              }
              footer="You don't have to decide immediately."
            />
          ) : step === "plan" ? (
            <StepCard
              eyebrow={trigger ? `Your plan · ${triggerLabel(trigger)}` : "Your plan"}
              title={alternative ? "Your plan" : "You don't have a plan for this yet."}
              body={
                <div className="space-y-4">
                  {generate.isPending ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                      Preparing something short for you…
                    </p>
                  ) : (
                    generate.data?.message && (
                      <p className="text-base leading-relaxed">{generate.data.message}</p>
                    )
                  )}

                  {alternative ? (
                    <div className="rounded-2xl border border-primary/30 bg-accent p-5">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        If I feel the urge to repeat this pattern
                      </p>
                      <p className="mt-2 text-base leading-relaxed">
                        <span className="font-medium">Then I will </span>
                        {alternative}
                      </p>
                    </div>
                  ) : (
                    <Button asChild variant="outline" className="w-full rounded-xl">
                      <a href="/settings">Create an If-Then plan</a>
                    </Button>
                  )}
                </div>
              }
              action={
                <Button className="w-full rounded-xl py-6" onClick={() => setStep("choice")}>
                  Continue
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              }
            />
          ) : step === "choice" ? (
            <StepCard
              eyebrow="Conscious choice"
              title="What do you want to do now?"
              body={
                <div className="space-y-2.5">
                  <Button
                    className="w-full rounded-2xl py-7 text-base"
                    onClick={() => choose("alternative")}
                  >
                    <Check className="mr-2 h-5 w-5" />
                    I'll choose my alternative
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl py-7 text-base"
                    onClick={() => choose("coach")}
                  >
                    <MessageCircleHeart className="mr-2 h-5 w-5" />
                    Talk to my AI Coach
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full rounded-2xl py-6 text-sm text-muted-foreground"
                    onClick={() => choose("repeated")}
                  >
                    Continue anyway
                  </Button>
                </div>
              }
              footer="Whatever you pick is information, not a verdict. Nothing here judges you."
            />
          ) : step === "feedback" ? (
            <StepCard
              eyebrow="Good. You made the choice consciously."
              title="Did this pause help?"
              body={
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl py-7"
                    onClick={() => {
                      if (generate.data?.id) record.mutate({ helped: true });
                      setStep("done");
                    }}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Yes
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl py-7"
                    onClick={() => {
                      if (generate.data?.id) record.mutate({ helped: false });
                      setStep("done");
                    }}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Not really
                  </Button>
                </div>
              }
              footer="Your answer only shapes which approach you get next time."
            />
          ) : (
            <StepCard
              eyebrow="Done"
              title="You created a pause. That's the skill."
              body={
                <p className="text-sm leading-relaxed text-muted-foreground">
                  This moment is saved privately so MindShift can learn which pauses actually work
                  for you.
                </p>
              }
              action={
                <Button className="w-full rounded-xl py-6" onClick={leave}>
                  Back to my dashboard
                </Button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PauseStep({
  seconds,
  total,
  onContinue,
}: {
  seconds: number;
  total: number;
  onContinue: () => void;
}) {
  const done = seconds <= 0;
  return (
    <div className="surface-card animate-rise rounded-3xl p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pause</p>
      <h1 className="mt-4 text-2xl font-semibold leading-snug sm:text-3xl">Pause for a second.</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Give yourself {total} seconds before making the next choice.
      </p>
      <div
        className={cn(
          "mx-auto mt-8 grid h-32 w-32 place-items-center rounded-full bg-accent transition-transform duration-1000 motion-reduce:transition-none motion-reduce:scale-100",
          done ? "scale-100" : "scale-105",
        )}
      >
        <span className="font-display text-4xl font-semibold" role="timer" aria-live="polite">
          {Math.max(seconds, 0)}
        </span>
      </div>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        {done
          ? "Take a breath. Now think about what you actually want."
          : "Breathe in slowly, then out. Nothing has to happen in this moment."}
      </p>
      <Button className="mt-8 w-full rounded-xl py-6" disabled={!done} onClick={onContinue}>
        {done ? "I'm ready" : "Stay with it…"}
      </Button>
    </div>
  );
}

function StepCard({
  eyebrow,
  title,
  body,
  action,
  footer,
}: {
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  action?: React.ReactNode;
  footer?: string;
}) {
  return (
    <div className="surface-card animate-rise rounded-3xl p-7">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-2xl font-semibold leading-snug">{title}</h1>
      <div className="mt-6">{body}</div>
      {action && <div className="mt-7">{action}</div>}
      {footer && <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{footer}</p>}
    </div>
  );
}
