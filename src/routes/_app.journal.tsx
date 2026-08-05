import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NotebookPen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { addJournalEntry, deleteJournalEntry, fetchJournal } from "@/lib/growth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/journal")({
  head: () => ({
    meta: [
      { title: "Journal | MindShift" },
      { name: "description", content: "Write freely. Your coach reads it to understand you better." },
      { property: "og:title", content: "Journal | MindShift" },
      {
        property: "og:description",
        content: "Write freely. Your coach reads it to understand you better.",
      },
    ],
  }),
  component: JournalPage,
});

const MOODS = ["Calm", "Restless", "Low", "Hopeful", "Frustrated", "Proud"] as const;

function JournalPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);

  const entries = useQuery({
    queryKey: ["journal", user?.id],
    queryFn: () => fetchJournal(user!.id),
    enabled: Boolean(user?.id),
  });

  const save = useMutation({
    mutationFn: () => addJournalEntry(user!.id, content.trim(), mood),
    onSuccess: async () => {
      setContent("");
      setMood(null);
      await queryClient.invalidateQueries({ queryKey: ["journal", user?.id] });
      toast.success("Saved. Your coach will factor this in.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteJournalEntry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journal", user?.id] }),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="hero-glow min-h-screen px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Journal</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Think out loud</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Anything you write here becomes part of what your coach remembers about you.
          </p>
        </header>

        <div className="surface-card mt-8 rounded-3xl p-7">
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={5}
            placeholder="What happened today, and what did it stir up?"
            className="resize-none rounded-2xl"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {MOODS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMood(mood === item ? null : item)}
                className={cn(
                  "rounded-full border border-border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  mood === item
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <Button
            className="mt-5 w-full rounded-xl sm:w-auto"
            disabled={!content.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Saving…" : "Save entry"}
          </Button>
        </div>

        <section className="mt-8 space-y-4">
          {entries.isLoading && <Skeleton className="h-28 w-full rounded-3xl" />}
          {!entries.isLoading && (entries.data ?? []).length === 0 && (
            <div className="surface-card rounded-3xl p-7 text-center">
              <NotebookPen className="mx-auto h-6 w-6 text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">
                No entries yet. Even two sentences help.
              </p>
            </div>
          )}
          {(entries.data ?? []).map((entry) => (
            <article key={entry.id} className="surface-card rounded-3xl p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {new Date(`${entry.entry_date}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                  {entry.mood ? ` · ${entry.mood}` : ""}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl text-muted-foreground"
                  onClick={() => remove.mutate(entry.id)}
                  aria-label="Delete entry"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{entry.content}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
