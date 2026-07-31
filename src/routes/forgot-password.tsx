import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — MindShift" },
      { name: "description", content: "Send yourself a secure link to reset your MindShift password." },
      { property: "og:title", content: "Reset your password — MindShift" },
      {
        property: "og:description",
        content: "Send yourself a secure link to reset your MindShift password.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a secure link to set a new one."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to log in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-border bg-muted/50 p-6 text-center">
          <MailCheck className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-4 text-sm leading-relaxed">
            If an account exists for <span className="font-medium">{email}</span>, a reset link is on
            its way. Check your inbox and spam folder.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
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
          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
