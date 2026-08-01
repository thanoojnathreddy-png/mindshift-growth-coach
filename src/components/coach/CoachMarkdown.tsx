import ReactMarkdown from "react-markdown";

/** Coach output is markdown-ish; render it consistently everywhere. */
export function CoachMarkdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed [&_a]:underline [&_li]:ml-4 [&_li]:list-disc [&_strong]:font-semibold">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
