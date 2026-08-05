import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { fetchProfile } from "@/lib/mindshift";
import { resetJourney, updateCommitment } from "@/lib/growth";
import { InterventionSettings } from "@/components/intervention/InterventionSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings | MindShift" },
      { name: "description", content: "Edit your commitment, reminders, or start a fresh journey." },
      { property: "og:title", content: "Settings | MindShift" },
      {
        property: "og:description",
        content: "Edit your commitment, reminders, or start a fresh journey.",
      },
    ],
  }),
  component: SettingsPage,
});

const REMINDERS = [
  { value: "morning", label: "Morning (start the day intentionally)" },
  { value: "evening", label: "Evening (reflect before bed)" },
  { value: "none", label: "No reminders" },
] as const;

function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: Boolean(user?.id),
  });

  const [form, setForm] = useState({
    display_name: "",
    habit: "",
    motivation: "",
    triggers: "",
    future_self: "",
    reminder_preference: "evening",
  });

  useEffect(() => {
    const profile = profileQuery.data as (typeof profileQuery.data & {
      reminder_preference?: string | null;
    }) | null;
    if (!profile) return;
    setForm({
      display_name: profile.display_name ?? "",
      habit: profile.habit ?? "",
      motivation: profile.motivation ?? "",
      triggers: profile.triggers ?? "",
      future_self: profile.future_self ?? "",
      reminder_preference: profile.reminder_preference ?? "evening",
    });
  }, [profileQuery.data]);

  const save = useMutation({
    mutationFn: () => updateCommitment(user!.id, form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      await queryClient.invalidateQueries({ queryKey: ["daily-coaching", user?.id] });
      toast.success("Updated. Your coach will use this from now on.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reset = useMutation({
    mutationFn: (mode: "commitment" | "everything") => resetJourney(user!.id, mode),
    onSuccess: async () => {
      queryClient.clear();
      toast.success("Fresh start. Let's set your commitment again.");
      navigate({ to: "/onboarding" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-5 py-10">
        <Skeleton className="h-10 w-56 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="hero-glow min-h-screen px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Settings</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Your commitment</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Change your answers whenever they stop being true. Nothing is locked in.
          </p>
        </header>

        <section className="surface-card mt-8 space-y-6 rounded-3xl p-7">
          <div className="space-y-2">
            <Label htmlFor="display_name">Your name</Label>
            <Input
              id="display_name"
              value={form.display_name}
              onChange={(event) => setForm({ ...form, display_name: event.target.value })}
              className="rounded-2xl"
            />
          </div>
          <FormField
            id="habit"
            label="The habit or mistake you're changing"
            value={form.habit}
            onChange={(value) => setForm({ ...form, habit: value })}
          />
          <FormField
            id="motivation"
            label="Why it matters to you"
            value={form.motivation}
            onChange={(value) => setForm({ ...form, motivation: value })}
          />
          <FormField
            id="triggers"
            label="Situations that set it off"
            value={form.triggers}
            onChange={(value) => setForm({ ...form, triggers: value })}
          />
          <FormField
            id="future_self"
            label="Who you're becoming"
            value={form.future_self}
            onChange={(value) => setForm({ ...form, future_self: value })}
          />

          <div className="space-y-2">
            <Label>When should we nudge you?</Label>
            <Select
              value={form.reminder_preference}
              onValueChange={(value) => setForm({ ...form, reminder_preference: value })}
            >
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDERS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Sets the general tone for nudges. Exact times, days and quiet hours live in{" "}
              <span className="font-medium text-foreground">Notifications</span>.
            </p>

          </div>

          <Button
            className="w-full rounded-xl sm:w-auto"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            <Save className="mr-2 h-4 w-4" />
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </section>

        <InterventionSettings />

        <section className="surface-card mt-6 rounded-3xl p-7">
          <h2 className="text-lg font-semibold">Password</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Set a new password for this account. You'll stay signed in on this device.
          </p>
          <div className="mt-5 space-y-3 sm:max-w-sm">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="rounded-2xl"
              placeholder="At least 8 characters"
            />
            <Button
              variant="outline"
              className="w-full rounded-xl sm:w-auto"
              disabled={changePassword.isPending}
              onClick={() => changePassword.mutate()}
            >
              {changePassword.isPending ? "Updating…" : "Update password"}
            </Button>
          </div>
        </section>



        <section className="surface-card mt-6 rounded-3xl border-destructive/30 p-7">
          <h2 className="text-lg font-semibold">Start over</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Choose a new commitment while keeping your history, or wipe everything and begin from
            zero.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <ResetButton
              icon={RefreshCcw}
              label="New commitment, keep history"
              title="Set a new commitment?"
              description="Your check-ins, journal and conversations stay. You'll go through onboarding again to set a new commitment."
              pending={reset.isPending}
              onConfirm={() => reset.mutate("commitment")}
            />
            <ResetButton
              icon={RotateCcw}
              destructive
              label="Reset everything"
              title="Delete your whole journey?"
              description="This permanently removes every check-in, journal entry, coaching message and conversation. This cannot be undone."
              pending={reset.isPending}
              onConfirm={() => reset.mutate("everything")}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function FormField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="resize-none rounded-2xl"
      />
    </div>
  );
}

function ResetButton({
  icon: Icon,
  label,
  title,
  description,
  destructive,
  pending,
  onConfirm,
}: {
  icon: typeof RotateCcw;
  label: string;
  title: string;
  description: string;
  destructive?: boolean;
  pending: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={destructive ? "destructive" : "outline"}
          className="flex-1 rounded-xl"
          disabled={pending}
        >
          <Icon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
          <AlertDialogAction className="rounded-xl" onClick={onConfirm}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
