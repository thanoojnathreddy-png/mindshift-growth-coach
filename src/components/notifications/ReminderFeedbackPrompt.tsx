import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  REMINDER_FEEDBACK,
  fetchPendingFeedback,
  saveReminderFeedback,
} from "@/lib/notifications";
import { Button } from "@/components/ui/button";

/**
 * Shown when the user arrives from a reminder — records whether the timing was
 * useful so future scheduling can be personalised.
 */
export function ReminderFeedbackPrompt() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const pending = useQuery({
    queryKey: ["reminder-feedback", user?.id],
    queryFn: () => fetchPendingFeedback(user!.id),
    enabled: Boolean(user?.id),
  });

  if (!pending.data) return null;

  const submit = async (feedback: string) => {
    try {
      await saveReminderFeedback(pending.data!.id, feedback);
      await queryClient.invalidateQueries({ queryKey: ["reminder-feedback", user?.id] });
      await queryClient.invalidateQueries({ queryKey: ["notification-history", user?.id] });
      toast.success("Thanks — that helps us time things better.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save that.");
    }
  };

  return (
    <section className="surface-card mt-6 rounded-3xl border-primary/30 p-6">
      <p className="text-sm font-semibold">Was this reminder useful?</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Only the timing feedback is stored — never the reminder's content.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {REMINDER_FEEDBACK.map((option) => (
          <Button
            key={option.key}
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => submit(option.key)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
