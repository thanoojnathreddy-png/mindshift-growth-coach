import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, Heart, ShieldCheck, Sparkles, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { generateIntervention } from "@/lib/intervention.functions";
import {
  DECISIONS,
  TRIGGERS,
  fetchIfThenPlans,
  fetchInterventionPreferences,
  frictionConfig,
  updateIntervention,
} from "@/lib/intervention";
import { fetchProfile } from "@/lib/mindshift";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Step = "pause" | "why" | "trigger" | "reason" | "plan" | "choice" | "feedback" | "done";

export function InterventionMode({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
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
  const [step, setStep] = useState<Step>("pause");
  const [seconds, setSeconds] = useState(friction.pauseSeconds);
  const [trigger, setTrigger] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const startedRef = useRef(false);

  const generate = useMutation({
    mutationFn: (input: { triggerKey: string | null; reason: string | null }) =>
      runIntervention({ data: { triggerKey: input.triggerKey, reason: input.reason } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["interventions", user?.id] });
      setStep("plan");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const record = useMutation({
    mutationFn: (fields: { decision?: string; helped?: boolean }) =>
      updateIntervention(generate.data!.id, fields),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interventions", user?.id] }),
    onError: (error: Error) => toast.error(error.message),
  });

  // Sync the countdown once preferences arrive, then tick it down.
  useEffect(() => {
    if (prefsQuery.isLoading || startedRef.current) return;
    startedRef.current = true;
    if (friction.pauseSeconds === 0) {
      setStep("why");
    } else {
      setSeconds(friction.pauseSeconds);
    }
  }, [prefsQuery.isLoading, friction.pauseSeconds]);

  useEffect(() => {
    if (step !== "pause" || seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, seconds]);

  const profile = profileQuery.data;
  const prefs = prefsQuery.data;
  const ownWords = [profile?.motivation, profile?.future_self, prefs?.future_self_message].filter(
    Boolean,
  ) as string[];
  const highlight = ownWords[0] ?? null;
  const plan = plansQuery.data?.find((item) => item.trigger_key === trigger) ?? null;

  const submitTrigger = (key: string) => {
    setTrigger(key);
    if (friction.askReason) {
      setStep("reason");
    } else {
      generate.mutate({ triggerKey: key, reason: null });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-background">
      <div className="hero-glow min-h-full px-5 py-8">
        <div className="mx-auto flex max-w-xl flex-col">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Intervention mode
            </span>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Leave intervention">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-10">
            {prefsQuery.isLoading ? (
              <Skeleton className="h-48 w-full rounded-3xl" />
            ) : step === "pause" ? (
              <PauseStep
                seconds={seconds}
                total={friction.pauseSeconds}
                onContinue={() => setStep("why")}
              />
            ) : step === "why" ? (
              <StepCard
                eyebrow="Remember why"
                title="This is why you started."
                body={
                  highlight ? (
                    <blockquote className="rounded-2xl bg-muted/60 p-5 text-base leading-relaxed">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {prefs?.future_self_message && highlight === prefs.future_self_message
                          ? "A message from your past self"
                          : "In your own words"}
                      </p>
                      <p className="mt-2">{highlight}</p>
                    </blockquote>
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      You haven't written your reason yet. Add it in Settings and it'll show up here
                      next time.
                    </p>
                  )
                }
                action={
                  <Button className="w-full rounded-xl" onClick={() => setStep("trigger")}>
                    Continue
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                }
              />
            ) : step === "trigger" ? (
              <StepCard
                eyebrow="Name it"
                title="What's happening right now?"
                body={
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {TRIGGERS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => submitTrigger(item.key)}
                        className="rounded-2xl border border-border bg-card/60 px-4 py-3.5 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                }
              />
            ) : step === "reason" ? (
              <StepCard
                eyebrow="Write my reason"
                title="In one sentence, why did you decide to change this?"
                body={
                  <Textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={3}
                    placeholder="Because I want to wake up clear-headed and keep promises to myself."
                    className="resize-none rounded-2xl text-base"
                    autoFocus
                  />
                }
                action={
                  <Button
                    className="w-full rounded-xl"
                    disabled={!reason.trim() || generate.isPending}
                    onClick={() => generate.mutate({ triggerKey: trigger, reason: reason.trim() })}
                  >
                    {generate.isPending ? "One moment…" : "Continue"}
                  </Button>
                }
              />
            ) : step === "plan" ? (
              <PlanStep
                message={generate.data?.message ?? ""}
                alternative={generate.data?.alternative ?? plan?.alternative ?? null}
                futureSelfMessage={generate.data?.futureSelfMessage ?? null}
                holdSeconds={friction.holdSeconds}
                onContinue={() => setStep("choice")}
              />
            ) : step === "choice" ? (
              <StepCard
                eyebrow="Conscious choice"
                title="What do you want to do now?"
                body={
                  <div className="space-y-2.5">
                    {DECISIONS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          record.mutate({ decision: item.key });
                          if (item.key === "another_minute") {
                            setSeconds(60);
                            setStep("pause");
                            return;
                          }
                          setStep("feedback");
                        }}
                        className="w-full rounded-2xl border border-border bg-card/60 px-4 py-4 text-left text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                }
                footer="Whatever you pick is information, not a verdict. Nothing here judges you."
              />
            ) : step === "feedback" ? (
              <StepCard
                eyebrow="Effectiveness"
                title="Did this help?"
                body={
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl py-6"
                      onClick={() => {
                        record.mutate({ helped: true });
                        setStep("done");
                      }}
                    >
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Yes
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl py-6"
                      onClick={() => {
                        record.mutate({ helped: false });
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
                    This moment is saved privately so MindShift can learn which interventions
                    actually work for you.
                  </p>
                }
                action={
                  <Button className="w-full rounded-xl" onClick={onClose}>
                    <Check className="mr-1.5 h-4 w-4" />
                    Back to my dashboard
                  </Button>
                }
              />
            )}
          </div>

          {generate.isPending && step !== "reason" && (
            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 animate-pulse text-primary" />
              Preparing something short for you…
            </p>
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
      <h1 className="mt-4 text-2xl font-semibold leading-snug sm:text-3xl">
        Give yourself {total} seconds before deciding.
      </h1>
      <div
        className={cn(
          "mx-auto mt-8 grid h-32 w-32 place-items-center rounded-full bg-accent transition-transform duration-1000",
          done ? "scale-100" : "scale-105",
        )}
        aria-live="polite"
      >
        <span className="font-display text-4xl font-semibold">{Math.max(seconds, 0)}</span>
      </div>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        Breathe in slowly, then out. Nothing has to happen in this moment.
      </p>
      <Button className="mt-8 w-full rounded-xl" disabled={!done} onClick={onContinue}>
        {done ? "I'm ready" : "Stay with it…"}
      </Button>
    </div>
  );
}

function PlanStep({
  message,
  alternative,
  futureSelfMessage,
  holdSeconds,
  onContinue,
}: {
  message: string;
  alternative: string | null;
  futureSelfMessage: string | null;
  holdSeconds: number;
  onContinue: () => void;
}) {
  const showFutureSelf = Boolean(futureSelfMessage) && Math.random() < 0.5;
  return (
    <div className="surface-card animate-rise rounded-3xl p-7">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Your plan for this moment
      </p>
      <p className="mt-4 text-lg leading-relaxed">{message}</p>

      {alternative ? (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-accent p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your if-then plan
          </p>
          <p className="mt-2 text-base leading-relaxed">
            <span className="font-medium">Then I will </span>
            {alternative}
          </p>
        </div>
      ) : (
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          You don't have an if-then plan for this trigger yet. You can add one in Settings so it's
          ready next time.
        </p>
      )}

      {showFutureSelf && (
        <blockquote className="mt-5 rounded-2xl bg-muted/60 p-5">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Heart className="h-3 w-3 text-primary" />
            A message from your past self
          </p>
          <p className="mt-2 text-sm leading-relaxed">{futureSelfMessage}</p>
        </blockquote>
      )}

      <div className="mt-7">
        {holdSeconds > 0 ? (
          <HoldToContinue seconds={holdSeconds} onComplete={onContinue} />
        ) : (
          <Button className="w-full rounded-xl" onClick={onContinue}>
            Continue
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function HoldToContinue({ seconds, onComplete }: { seconds: number; onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const holding = useRef(false);

  useEffect(() => {
    if (progress >= 100) onComplete();
  }, [progress, onComplete]);

  useEffect(() => {
    const step = 100 / (seconds * 10);
    const timer = setInterval(() => {
      setProgress((value) => {
        if (holding.current) return Math.min(100, value + step);
        return Math.max(0, value - step * 2);
      });
    }, 100);
    return () => clearInterval(timer);
  }, [seconds]);

  return (
    <div>
      <Button
        className="w-full select-none rounded-xl py-6"
        onPointerDown={() => {
          holding.current = true;
        }}
        onPointerUp={() => {
          holding.current = false;
        }}
        onPointerLeave={() => {
          holding.current = false;
        }}
      >
        Hold to continue
      </Button>
      <Progress value={progress} className="mt-3 h-1.5" />
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Keep holding for {seconds} seconds — it's just a speed bump for autopilot.
      </p>
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
