import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });

    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed. Please try again.");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    window.location.assign("/dashboard");
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full rounded-xl"
      onClick={signIn}
      disabled={loading}
    >
      <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.2h6.6c-.1 1.1-.8 2.7-2.4 3.8l-.02.14 3.5 2.7.24.02c2.2-2 3.5-5 3.5-8.7z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.3 1.2-4.2 1.2-3 0-5.6-2-6.5-4.8l-.14.01-3.6 2.8-.05.13C3.7 21.3 7.6 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.5 14.6c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3l-.01-.15-3.7-2.87-.12.06A11.9 11.9 0 0 0 .5 12.3c0 1.9.5 3.7 1.2 5.3l3.8-3z"
        />
        <path
          fill="#EA4335"
          d="M12 4.8c2.1 0 3.6.9 4.4 1.7l3.2-3.1C17.9 1.6 15.2.5 12 .5 7.6.5 3.7 3.2 1.7 7l3.8 3c.9-2.8 3.5-5.2 6.5-5.2z"
        />
      </svg>
      {loading ? "Connecting…" : label}
    </Button>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-widest text-muted-foreground">or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
