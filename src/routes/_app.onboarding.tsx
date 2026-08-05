import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchProfile } from "@/lib/mindshift";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_app/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding | MindShift" },
      { name: "description", content: "Name the pattern you want to change and why it matters." },
      { property: "og:title", content: "Onboarding | MindShift" },
      {
        property: "og:description",
        content: "Name the pattern you want to change and why it matters.",
      },
    ],
  }),
  component: OnboardingPage,
});

type Answers = {
  habit: string;
  motivation: string;
  triggers: string;
  future_self: string;
  future_self_message: string;
};

const steps: {
  key: keyof Answers;
  question: string;
  helper: string;
  placeholder: string;
}[] = [
  {
    key: "habit",
    question: "What mistake or habit do you want to change?",
    helper: "Be specific and kind. One pattern is enough.",
    placeholder: "I keep scrolling my phone until 2am instead of sleeping.",
  },
  {
    key: "motivation",
    question: "Why do you want to change?",
    helper: "This is what we'll remind you of on the hard days.",
    placeholder: "I want to stop feeling exhausted and short-tempered with the people I love.",
  },
  {
    key: "triggers",
    question: "What usually triggers it?",
    helper: "Times, places, moods, people — anything you've noticed.",
    placeholder: "Stress after work, being alone in the evening, feeling bored.",
  },
  {
    key: "future_self",
    question: "What kind of person do you want to become?",
    helper: "Describe them in the present tense, as if it's already true.",
    placeholder: "Someone calm and rested who keeps promises to themselves.",
  },
  {
    key: "future_self_message",
    question: "Write something you want your future self to remember when you're tempted.",
    helper: "Private to you. We'll show it back unedited during interventions.",
    placeholder: "You always regret this by morning. Go to bed — tomorrow-you will thank you.",
  },
];

function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    habit: "",
    motivation: "",
    triggers: "",
    future_self: "",
    future_self_message: "",
  });

  useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: Boolean(user?.id),
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ ...answers, onboarding_completed: true })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Your commitment is set. This is day one.");
      navigate({ to: "/dashboard" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const step = steps[index]!;
  const value = answers[step.key];
  const isLast = index === steps.length - 1;

  return (
    <div className="hero-glow min-h-screen px-5 py-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Step {index + 1} of {steps.length}
        </p>
        <Progress value={((index + 1) / steps.length) * 100} className="mt-4 h-1.5" />

        <div key={step.key} className="surface-card mt-8 animate-rise rounded-3xl p-7 sm:p-9">
          <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">{step.question}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{step.helper}</p>
          <Textarea
            value={value}
            onChange={(event) =>
              setAnswers((current) => ({ ...current, [step.key]: event.target.value }))
            }
            placeholder={step.placeholder}
            rows={5}
            className="mt-6 resize-none rounded-2xl text-base"
          />

          <div className="mt-7 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              className="rounded-xl"
              disabled={index === 0}
              onClick={() => setIndex((current) => current - 1)}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            {isLast ? (
              <Button
                className="rounded-xl"
                disabled={!value.trim() || save.isPending}
                onClick={() => save.mutate()}
              >
                <Check className="mr-1.5 h-4 w-4" />
                {save.isPending ? "Saving…" : "Start my shift"}
              </Button>
            ) : (
              <Button
                className="rounded-xl"
                disabled={!value.trim()}
                onClick={() => setIndex((current) => current + 1)}
              >
                Continue
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Only you can read these answers. You can revisit them any time.
        </p>
      </div>
    </div>
  );
}
