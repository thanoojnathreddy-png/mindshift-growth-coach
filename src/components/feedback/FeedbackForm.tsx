import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { FEEDBACK_TYPES, submitFeedback } from "@/lib/feedback";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FeedbackForm({ onDone }: { onDone?: () => void }) {
  const { user } = useAuth();
  const [feedbackType, setFeedbackType] = useState<string>("bug");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (message.trim().length < 5) {
      toast.error("Please add a little more detail so we can act on it.");
      return;
    }
    setSaving(true);
    try {
      await submitFeedback({
        feedbackType,
        message,
        userId: user?.id ?? null,
        pagePath: typeof window === "undefined" ? null : window.location.pathname,
      });
      setMessage("");
      toast.success("Thank you — your feedback is with us.");
      onDone?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please retry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="feedback-type">What kind of feedback is this?</Label>
        <Select value={feedbackType} onValueChange={setFeedbackType}>
          <SelectTrigger id="feedback-type" className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FEEDBACK_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-message">Tell us what happened</Label>
        <Textarea
          id="feedback-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          maxLength={2000}
          required
          className="rounded-xl"
          placeholder="What were you doing, and what did you expect instead?"
        />
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        We store your message, the feedback type and the page you were on. For bug reports we also
        note your browser and device category. We never send your journal entries, coach
        conversations or account credentials.
      </p>

      <Button type="submit" disabled={saving} className="w-full rounded-xl">
        {saving ? "Sending…" : "Send feedback"}
      </Button>
    </form>
  );
}
