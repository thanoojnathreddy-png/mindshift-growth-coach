import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton, OrDivider } from "@/components/auth/GoogleButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — MindShift" },
      {
        name: "description",
        content: "Start with one pattern. Create your free MindShift account in under a minute.",
      },
      { property: "og:title", content: "Create your account — MindShift" },
      {
        property: "og:description",
        content: "Start with one pattern. Create your free MindShift account in under a minute.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: name },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data.session) {
      toast.success("Check your email to confirm your account.");
      return;
    }

    toast.success("Account created. Let's set up your commitment.");
    navigate({ to: "/onboarding" });
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="One pattern, changed properly. That's all we ask for."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <GoogleButton label="Sign up with Google" />
      <OrDivider />
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">First name</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-xl"
            placeholder="Alex"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-xl"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-xl"
            placeholder="At least 8 characters"
          />
        </div>
        <Button type="submit" className="w-full rounded-xl" disabled={loading}>
          {loading ? "Creating account…" : "Start My Journey"}
        </Button>
        <p className="text-center text-xs font-medium">
          Free during beta · No credit card required
        </p>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Your reflections are tied to your account and only visible to you. MindShift supports
          personal reflection and behaviour change — it isn't a substitute for professional medical
          or mental-health care. See our{" "}
          <Link to="/privacy" className="text-primary underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link to="/terms" className="text-primary underline">
            Terms
          </Link>
          .
        </p>

      </form>
    </AuthShell>
  );
}
