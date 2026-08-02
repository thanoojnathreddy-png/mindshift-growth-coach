import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { fetchCheckIns } from "@/lib/mindshift";
import {
  addConsequenceLog,
  addConsequenceMetric,
  consequenceTotals,
  deleteConsequenceMetric,
  fetchConsequenceLogs,
  fetchConsequenceMetrics,
  monthStartISO,
} from "@/lib/intervention";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** "What this pattern is costing me" — user-defined, user-supplied numbers only. */
export function ConsequenceDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ label: "", unit: "", amount_per_slip: "" });
  const [logDrafts, setLogDrafts] = useState<Record<string, string>>({});

  const metricsQuery = useQuery({
    queryKey: ["consequence-metrics", user?.id],
    queryFn: () => fetchConsequenceMetrics(user!.id),
    enabled: Boolean(user?.id),
  });
  const logsQuery = useQuery({
    queryKey: ["consequence-logs", user?.id],
    queryFn: () => fetchConsequenceLogs(user!.id),
    enabled: Boolean(user?.id),
  });
  const checkInsQuery = useQuery({
    queryKey: ["check-ins", user?.id],
    queryFn: () => fetchCheckIns(user!.id),
    enabled: Boolean(user?.id),
  });

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["consequence-metrics", user?.id] }),
      queryClient.invalidateQueries({ queryKey: ["consequence-logs", user?.id] }),
    ]);

  const create = useMutation({
    mutationFn: () =>
      addConsequenceMetric(user!.id, {
        label: draft.label.trim(),
        unit: draft.unit.trim(),
        amount_per_slip: Number(draft.amount_per_slip || 0),
      }),
    onSuccess: async () => {
      await invalidate();
      setDraft({ label: "", unit: "", amount_per_slip: "" });
      setAdding(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteConsequenceMetric(id),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const log = useMutation({
    mutationFn: (input: { metricId: string; amount: number }) =>
      addConsequenceLog(user!.id, input.metricId, input.amount),
    onSuccess: async (_data, input) => {
      await invalidate();
      setLogDrafts((current) => ({ ...current, [input.metricId]: "" }));
      toast.success("Logged.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const slipDates = (checkInsQuery.data ?? [])
    .filter((entry) => entry.repeated)
    .map((entry) => entry.check_in_date);
  const monthTotals = consequenceTotals(
    metricsQuery.data ?? [],
    logsQuery.data ?? [],
    slipDates,
    monthStartISO(),
  );
  const allTimeTotals = consequenceTotals(metricsQuery.data ?? [], logsQuery.data ?? [], slipDates);

  return (
    <section className="surface-card rounded-3xl p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Wallet className="h-3.5 w-3.5 text-primary" />
          What this pattern is costing me
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl"
          onClick={() => setAdding((value) => !value)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add a cost
        </Button>
      </div>

      {adding && (
        <div className="mt-5 grid gap-3 rounded-2xl bg-muted/60 p-5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="cost-label" className="text-xs">
              What it costs
            </Label>
            <Input
              id="cost-label"
              value={draft.label}
              placeholder="Hours wasted"
              onChange={(event) => setDraft({ ...draft, label: event.target.value })}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cost-unit" className="text-xs">
              Unit
            </Label>
            <Input
              id="cost-unit"
              value={draft.unit}
              placeholder="hours"
              onChange={(event) => setDraft({ ...draft, unit: event.target.value })}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cost-amount" className="text-xs">
              Typical amount per slip
            </Label>
            <Input
              id="cost-amount"
              type="number"
              min="0"
              step="0.1"
              value={draft.amount_per_slip}
              placeholder="1.5"
              onChange={(event) => setDraft({ ...draft, amount_per_slip: event.target.value })}
              className="rounded-xl"
            />
          </div>
          <Button
            className="rounded-xl sm:col-span-3 sm:w-fit"
            disabled={!draft.label.trim() || !draft.unit.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Saving…" : "Save cost"}
          </Button>
        </div>
      )}

      {monthTotals.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Define your own measurable costs — money, hours, missed study sessions, lost sleep — and
          MindShift will add up only the numbers you provide. Nothing is estimated for you.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {monthTotals.map((row, index) => {
            const allTime = allTimeTotals[index]!;
            return (
              <div key={row.metric.id} className="rounded-2xl bg-muted/60 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{row.metric.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Approximately{" "}
                      <span className="font-display text-lg font-semibold text-foreground">
                        {round(row.total)} {row.metric.unit}
                      </span>{" "}
                      this month · {round(allTime.total)} {row.metric.unit} in total
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {round(row.logged)} logged by you
                      {Number(row.metric.amount_per_slip) > 0
                        ? ` · ${round(row.estimated)} from ${row.slips} slip${row.slips === 1 ? "" : "s"} at ${round(Number(row.metric.amount_per_slip))} each`
                        : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl text-muted-foreground"
                    aria-label={`Delete ${row.metric.label}`}
                    onClick={() => remove.mutate(row.metric.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={logDrafts[row.metric.id] ?? ""}
                    placeholder={`Add ${row.metric.unit}`}
                    onChange={(event) =>
                      setLogDrafts((current) => ({
                        ...current,
                        [row.metric.id]: event.target.value,
                      }))
                    }
                    className="max-w-36 rounded-xl"
                  />
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    disabled={!logDrafts[row.metric.id] || log.isPending}
                    onClick={() =>
                      log.mutate({
                        metricId: row.metric.id,
                        amount: Number(logDrafts[row.metric.id]),
                      })
                    }
                  >
                    Log
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
