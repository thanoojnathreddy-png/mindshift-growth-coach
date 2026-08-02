import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  decisionLabel,
  deleteInterventionHistory,
  fetchInterventions,
  interventionPatterns,
  triggerLabel,
} from "@/lib/intervention";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

export const Route = createFileRoute("/_app/interventions")({
  head: () => ({
    meta: [
      { title: "Interventions — MindShift" },
      {
        name: "description",
        content: "Every pause you created, the triggers behind them and what actually helped.",
      },
      { property: "og:title", content: "Interventions — MindShift" },
      {
        property: "og:description",
        content: "Every pause you created, the triggers behind them and what actually helped.",
      },
    ],
  }),
  component: InterventionsPage,
});

function InterventionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["interventions", user?.id],
    queryFn: () => fetchInterventions(user!.id),
    enabled: Boolean(user?.id),
  });

  const wipe = useMutation({
    mutationFn: () => deleteInterventionHistory(user!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["interventions", user?.id] });
      toast.success("Intervention history deleted.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = query.data ?? [];
  const patterns = interventionPatterns(rows);

  return (
    <div className="hero-glow min-h-screen px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="animate-rise">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Interventions
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Your pauses</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Private to you. Each row is a moment you interrupted autopilot — including the ones where
            the behaviour still happened.
          </p>
        </header>

        <section className="surface-card mt-8 rounded-3xl p-7">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5 text-primary" />
            What your data shows
          </span>
          {patterns.observations.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Not enough interventions yet to draw conclusions. Patterns appear here once you've used
              intervention mode a few times.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {patterns.observations.map((line) => (
                <li key={line} className="rounded-2xl bg-muted/60 p-4 text-sm leading-relaxed">
                  {line}
                </li>
              ))}
            </ul>
          )}
          {patterns.helpfulRate !== null && (
            <p className="mt-4 text-xs text-muted-foreground">
              You said an intervention helped {patterns.helpfulRate}% of the {patterns.helpedRated}{" "}
              times you rated one.
            </p>
          )}
        </section>

        <section className="mt-6 space-y-3">
          {query.isLoading ? (
            <Skeleton className="h-40 w-full rounded-3xl" />
          ) : rows.length === 0 ? (
            <div className="surface-card rounded-3xl p-7">
              <p className="text-sm leading-relaxed text-muted-foreground">
                No interventions logged yet. The "I'm about to slip" button on your dashboard starts
                one.
              </p>
            </div>
          ) : (
            rows.map((row) => (
              <article key={row.id} className="surface-card rounded-3xl p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-accent px-2.5 py-1 font-medium text-accent-foreground">
                    {triggerLabel(row.trigger_key)}
                  </span>
                  <span>
                    {new Date(row.created_at).toLocaleString(undefined, {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {row.coaching_style && <span>· {row.coaching_style} tone</span>}
                </div>
                {row.message && <p className="mt-3 text-sm leading-relaxed">{row.message}</p>}
                {row.alternative_suggested && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Alternative offered: {row.alternative_suggested}
                  </p>
                )}
                <p className="mt-3 text-xs font-medium">
                  {decisionLabel(row.decision)}
                  {row.helped === true
                    ? " · helped"
                    : row.helped === false
                      ? " · didn't help"
                      : ""}
                </p>
              </article>
            ))
          )}
        </section>

        {rows.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="mt-6 rounded-xl" disabled={wipe.isPending}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete intervention history
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete every intervention?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes all intervention records, including triggers and outcomes.
                  Your check-ins, journal and commitment stay untouched.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction className="rounded-xl" onClick={() => wipe.mutate()}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
