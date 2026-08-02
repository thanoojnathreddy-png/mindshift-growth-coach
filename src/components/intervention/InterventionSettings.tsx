import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  COACHING_STYLES,
  FRICTION_LEVELS,
  TRIGGERS,
  deleteIfThenPlan,
  deleteInterventionHistory,
  fetchIfThenPlans,
  fetchInterventionPreferences,
  saveIfThenPlan,
  triggerLabel,
  updateInterventionPreferences,
} from "@/lib/intervention";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export function InterventionSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const prefsQuery = useQuery({
    queryKey: ["intervention-prefs", user?.id],
    queryFn: () => fetchInterventionPreferences(user!.id),
    enabled: Boolean(user?.id),
  });
  const plansQuery = useQuery({
    queryKey: ["if-then-plans", user?.id],
    queryFn: () => fetchIfThenPlans(user!.id),
    enabled: Boolean(user?.id),
  });

  const [futureSelf, setFutureSelf] = useState("");
  const [planDraft, setPlanDraft] = useState({ trigger_key: "stress", alternative: "" });

  useEffect(() => {
    if (prefsQuery.data) setFutureSelf(prefsQuery.data.future_self_message ?? "");
  }, [prefsQuery.data]);

  const prefs = prefsQuery.data;
  const styles = prefs?.coaching_styles ?? [];

  const savePrefs = useMutation({
    mutationFn: (fields: Parameters<typeof updateInterventionPreferences>[1]) =>
      updateInterventionPreferences(user!.id, fields),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["intervention-prefs", user?.id] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const savePlan = useMutation({
    mutationFn: () =>
      saveIfThenPlan(user!.id, planDraft.trigger_key, planDraft.alternative.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["if-then-plans", user?.id] });
      setPlanDraft({ trigger_key: "stress", alternative: "" });
      toast.success("Plan saved. It'll appear during interventions for that trigger.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removePlan = useMutation({
    mutationFn: (id: string) => deleteIfThenPlan(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["if-then-plans", user?.id] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const wipeHistory = useMutation({
    mutationFn: () => deleteInterventionHistory(user!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["interventions", user?.id] });
      toast.success("Intervention history deleted.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleStyle = (key: string) => {
    const next = styles.includes(key) ? styles.filter((item) => item !== key) : [...styles, key];
    savePrefs.mutate({ coaching_styles: next.length > 0 ? next : ["calm"] });
  };

  return (
    <>
      <section className="surface-card mt-6 space-y-6 rounded-3xl p-7">
        <div>
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Intervention mode
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            What happens when you press "I'm about to slip".
          </p>
        </div>

        <div className="space-y-2">
          <Label>How much friction before the choices?</Label>
          <Select
            value={prefs?.friction_level ?? "standard"}
            onValueChange={(value) => savePrefs.mutate({ friction_level: value })}
          >
            <SelectTrigger className="rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FRICTION_LEVELS.map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.label} — {item.hint}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Friction exists to create a moment for a conscious decision — never to annoy you. Turn it
            off any time.
          </p>
        </div>

        <div className="space-y-3">
          <Label>Coaching styles you're open to</Label>
          <div className="flex flex-wrap gap-2">
            {COACHING_STYLES.map((item) => {
              const active = styles.includes(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleStyle(item.key)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-2xl border px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                  title={item.hint}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Your coach rotates between these and leans on the ones you said helped.
          </p>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-2xl bg-muted/60 p-5">
          <div>
            <p className="text-sm font-medium">Personalise with my history</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              When off, interventions use only your commitment and the trigger you pick — no
              check-ins, journal or past outcomes are sent to the AI.
            </p>
          </div>
          <Switch
            checked={prefs?.ai_personalization ?? true}
            onCheckedChange={(value) => savePrefs.mutate({ ai_personalization: value })}
            aria-label="AI personalisation"
          />
        </div>
      </section>

      <section className="surface-card mt-6 space-y-5 rounded-3xl p-7">
        <div>
          <h2 className="text-lg font-semibold">If-then plans</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Decide your alternative now, while it's calm. MindShift shows it back to you in the
            moment.
          </p>
        </div>

        <div className="space-y-3">
          {(plansQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No plans yet.</p>
          ) : (
            (plansQuery.data ?? []).map((plan) => (
              <div
                key={plan.id}
                className="flex items-start justify-between gap-3 rounded-2xl bg-muted/60 p-4"
              >
                <p className="text-sm leading-relaxed">
                  <span className="font-medium">IF</span> {triggerLabel(plan.trigger_key).toLowerCase()},{" "}
                  <span className="font-medium">THEN</span> I will {plan.alternative}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl text-muted-foreground"
                  aria-label="Delete plan"
                  onClick={() => removePlan.mutate(plan.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
          <div className="space-y-1.5">
            <Label className="text-xs">IF this happens</Label>
            <Select
              value={planDraft.trigger_key}
              onValueChange={(value) => setPlanDraft({ ...planDraft, trigger_key: value })}
            >
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGERS.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="alternative" className="text-xs">
              THEN I will
            </Label>
            <Input
              id="alternative"
              value={planDraft.alternative}
              placeholder="work for only 5 minutes before deciding what to do next"
              onChange={(event) => setPlanDraft({ ...planDraft, alternative: event.target.value })}
              className="rounded-2xl"
            />
          </div>
        </div>
        <Button
          className="rounded-xl sm:w-auto"
          disabled={!planDraft.alternative.trim() || savePlan.isPending}
          onClick={() => savePlan.mutate()}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Save plan
        </Button>
      </section>

      <section className="surface-card mt-6 space-y-4 rounded-3xl p-7">
        <div>
          <h2 className="text-lg font-semibold">Message to your future self</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Something you want to remember when you're tempted. Shown back to you, unedited, during
            some interventions.
          </p>
        </div>
        <Textarea
          value={futureSelf}
          onChange={(event) => setFutureSelf(event.target.value)}
          rows={4}
          placeholder="You always regret this by morning. The version of you that goes to bed at 11 is the one you like."
          className="resize-none rounded-2xl"
        />
        <Button
          className="rounded-xl sm:w-auto"
          disabled={savePrefs.isPending}
          onClick={() => {
            savePrefs.mutate({ future_self_message: futureSelf.trim() || null });
            toast.success("Saved privately.");
          }}
        >
          Save message
        </Button>
      </section>

      <section className="surface-card mt-6 rounded-3xl p-7">
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
          <Lock className="h-4 w-4 text-primary" />
          Privacy
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>
            MindShift stores your commitment answers, check-ins, journal entries, conversations and
            intervention records (date, time, trigger, the message shown, your decision and whether it
            helped).
          </li>
          <li>Only your signed-in account can read any of it. Nobody is ever contacted for you.</li>
          <li>
            Turning off personalisation above stops your history being used to generate coaching.
          </li>
        </ul>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="mt-5 rounded-xl" disabled={wipeHistory.isPending}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete intervention history
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete every intervention record?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes all triggers, messages and outcomes from intervention mode.
                Your commitment, check-ins and journal stay untouched.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction className="rounded-xl" onClick={() => wipeHistory.mutate()}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </>
  );
}
