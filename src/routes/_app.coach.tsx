import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Eraser, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { clearChatHistory, fetchChatHistory } from "@/lib/growth";
import { CoachMarkdown } from "@/components/coach/CoachMarkdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/coach")({
  head: () => ({
    meta: [
      { title: "AI Coach | MindShift" },
      {
        name: "description",
        content: "Talk things through with a coach that remembers your triggers and your streak.",
      },
      { property: "og:title", content: "AI Coach | MindShift" },
      {
        property: "og:description",
        content: "Talk things through with a coach that remembers your triggers and your streak.",
      },
    ],
  }),
  component: CoachPage,
});

const STARTERS = [
  "I'm feeling the urge right now.",
  "Why do I keep slipping on the same day every week?",
  "Help me plan for tonight.",
  "I slipped and I feel awful about it.",
];

function CoachPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const history = useQuery({
    queryKey: ["chat-history", user?.id],
    queryFn: () => fetchChatHistory(user!.id),
    enabled: Boolean(user?.id),
  });

  const initialMessages = useMemo<UIMessage[]>(
    () =>
      (history.data ?? []).map((row) => ({
        id: row.id,
        role: row.role === "assistant" ? "assistant" : "user",
        parts: [{ type: "text", text: row.content }],
      })),
    [history.data],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          return data.session?.access_token
            ? { Authorization: `Bearer ${data.session.access_token}` }
            : {};
        },
      }),
    [],
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    id: user?.id ?? "coach",
    messages: initialMessages,
    transport,
    onError: (error) => toast.error(error.message || "The coach couldn't reply. Try again."),
  });

  const busy = status === "submitted" || status === "streaming";

  const sentFromPause = useRef(false);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (sentFromPause.current || history.isLoading || !user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("from") !== "intervention") return;
    sentFromPause.current = true;
    const trigger = params.get("trigger");
    window.history.replaceState(null, "", "/coach");
    void send(
      `I just paused an urge${trigger ? ` (trigger: ${trigger})` : ""}. Help me walk through this choice using my commitment, my reasons and my if-then plan.`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.isLoading, user]);

  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const send = async (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    setInput("");
    await sendMessage({ text: value });
    await queryClient.invalidateQueries({ queryKey: ["chat-history", user?.id] });
  };

  const clear = async () => {
    if (!user) return;
    await clearChatHistory(user.id);
    setMessages([]);
    await queryClient.invalidateQueries({ queryKey: ["chat-history", user.id] });
    toast.success("Conversation cleared. Your check-ins and patterns are untouched.");
  };

  return (
    <div className="hero-glow flex min-h-screen flex-col px-5 py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              AI Coach
            </p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Talk it through</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your coach already knows your commitment, triggers and every check-in.
            </p>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" className="rounded-xl" onClick={clear}>
              <Eraser className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </header>

        <div className="mt-6 flex-1 space-y-4">
          {history.isLoading && <Skeleton className="h-24 w-full rounded-3xl" />}

          {!history.isLoading && messages.length === 0 && (
            <div className="surface-card animate-rise rounded-3xl p-7">
              <Sparkles className="h-6 w-6 text-primary" />
              <p className="mt-4 text-base leading-relaxed">
                Tell me what's going on and I'll work through it with you — no judgement, and I'll
                remember it next time.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => send(starter)}
                    className="rounded-full border border-border px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const text = message.parts
              .map((part) => (part.type === "text" ? part.text : ""))
              .join("");
            if (!text) return null;
            const mine = message.role === "user";
            return (
              <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-3xl px-5 py-4",
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "surface-card text-foreground",
                  )}
                >
                  {mine ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
                  ) : (
                    <CoachMarkdown>{text}</CoachMarkdown>
                  )}
                </div>
              </div>
            );
          })}

          {status === "submitted" && (
            <div className="flex justify-start">
              <div className="surface-card flex items-center gap-2 rounded-3xl px-5 py-4 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Thinking with you…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          className="glass sticky bottom-4 mt-6 flex items-end gap-2 rounded-3xl p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            placeholder="What's on your mind?"
            className="max-h-40 min-h-11 resize-none rounded-2xl border-0 bg-transparent focus-visible:ring-0"
          />
          <Button type="submit" size="icon" className="h-11 w-11 rounded-2xl" disabled={busy}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
