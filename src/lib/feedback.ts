import { supabase } from "@/integrations/supabase/client";

export const FEEDBACK_TYPES = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature suggestion" },
  { value: "ai", label: "AI response feedback" },
  { value: "notification", label: "Notification problem" },
  { value: "other", label: "Other" },
] as const;

export type FeedbackInput = {
  feedbackType: string;
  message: string;
  pagePath?: string | null;
  userId?: string | null;
};

/** Coarse, non-identifying browser bucket. Never a full user-agent string. */
function browserCategory() {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return "Other";
}

/** Coarse device bucket — no model, no identifiers. */
function deviceCategory() {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  if (/Mobi|iPhone|Android/i.test(ua)) return "Mobile";
  return "Desktop";
}

export async function submitFeedback(input: FeedbackInput) {
  const isBug = input.feedbackType === "bug";
  const { error } = await supabase.from("feedback").insert({
    user_id: input.userId ?? null,
    feedback_type: input.feedbackType,
    message: input.message.trim(),
    page_path: input.pagePath ?? null,
    // Technical context is only useful for bug reports, so we don't collect it otherwise.
    browser_category: isBug ? browserCategory() : null,
    device_category: isBug ? deviceCategory() : null,
  });

  if (error) {
    throw new Error("We couldn't send your feedback just now. Please try again in a moment.");
  }
}
