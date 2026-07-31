import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, HeartHandshake, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchCheckIns, todayISO } from "@/lib/mindshift";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/check-in")({
  head: () => ({
    meta: [
      { title: "Daily check-in — MindShift" },
      { name: "description", content: "One honest question a day, with no judgement attached." },
      { property: "og:title", content: "Daily check-in — MindShift" },
      {
        property: "og:description",
        content: "One honest question a day, with no judgement attached.",
      },
    ],
  }),
  component: CheckInPage,
});

function CheckInPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [repeated, setRepeated] = useState<boolean | null>(null);
  const [whatHappened, setWhatHappened] = useState("");
  const [triggerNote, setTriggerNote] = useState("");
  const [feeling, setFeeling] = useState("");

  const { data: checkIns } = useQuery({
    queryKey: ["check-ins", user?.id],
    queryFn: () => fetchCheckIns(user!.id),
    enabled: Boolean(user?.id),
  });

  const existing = checkIns?.find((entry) => entry.check_in_date === todayISO());

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("check_ins").upsert(
        {
          user_id: user!.id,
          check_in_date: todayISO(),
          repeated: repeated!,
          what_happened: repeated ? whatHappened : null,
          trigger_note: repeated ? triggerNote : null,
          feeling: repeated ? feeling : null,
        },
        { onConflict: "user_id,check_in_date" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["check-ins", user?.id] });
      toast.success(
        repeated ? "Logged. Thank you for being honest with yourself." : "Logged. That's a win.",
      );
      navigate({ to: "/dashboard" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canSubmit =
    repeated === false || (repeated === true && whatHappened.trim() && feeling.trim());

  return (
    <div className="hero-glow min-h-screen px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <header className="animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Daily check-in
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Did you repeat your mistake today?
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {existing
              ? "You already checked in today — answering again will update it."
              : "There's no wrong answer here. Only useful ones."}
          </p>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <ChoiceCard
            selected={repeated === true}
            tone="slip"
            label="Yes"
            hint="It happened today."
            onClick={() => setRepeated(true)}
          />
          <ChoiceCard
            selected={repeated === false}
            tone="clean"
            label="No"
            hint="I stayed with my commitment."
            onClick={() => setRepeated(false)}
          />
        </div>

        {repeated === true && (
          <div className="surface-card mt-6 animate-rise space-y-6 rounded-3xl p-7">
            <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-4">
              <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                This isn't a confession — it's information. Three short answers and you're done.
              </p>
            </div>
            <Field
              id="what"
              label="What happened?"
              value={whatHappened}
              onChange={setWhatHappened}
              placeholder="Walk through the moment as plainly as you can."
            />
            <Field
              id="trigger"
              label="What triggered it?"
              value={triggerNote}
              onChange={setTriggerNote}
              placeholder="A person, a place, a feeling, a time of day…"
            />
            <Field
              id="feeling"
              label="How did you feel?"
              value={feeling}
              onChange={setFeeling}
              placeholder="Before, during and after."
            />
          </div>
        )}

        {repeated === false && (
          <div className="surface-card mt-6 animate-rise rounded-3xl p-7">
            <p className="text-sm leading-relaxed">
              Good. Days like this are how the new pattern gets built — quietly, and without drama.
            </p>
          </div>
        )}

        <Button
          className="mt-7 w-full rounded-xl"
          size="lg"
          disabled={repeated === null || !canSubmit || save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Saving…" : "Save today's check-in"}
        </Button>
      </div>
    </div>
  );
}

function ChoiceCard({
  selected,
  tone,
  label,
  hint,
  onClick,
}: {
  selected: boolean;
  tone: "slip" | "clean";
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "surface-card rounded-3xl p-6 text-left transition-all duration-200 hover:-translate-y-0.5",
        selected && "ring-2 ring-ring",
      )}
    >
      <span
        className={cn(
          "grid h-10 w-10 place-items-center rounded-2xl",
          tone === "clean"
            ? "bg-success text-success-foreground"
            : "bg-destructive text-destructive-foreground",
        )}
      >
        {tone === "clean" ? <Check className="h-4.5 w-4.5" /> : <X className="h-4.5 w-4.5" />}
      </span>
      <p className="mt-4 text-lg font-semibold">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </button>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="resize-none rounded-2xl"
      />
    </div>
  );
}
