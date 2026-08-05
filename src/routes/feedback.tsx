import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";

const title = "Contact & Feedback | MindShift";
const description =
  "Report a bug, suggest a feature or tell the MindShift team how the AI coaching and reminders are working for you.";
const url = "https://mindshift-growth-coach.lovable.app/feedback";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: url }],
  }),
  component: FeedbackPage,
});

function FeedbackPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Beta</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
          Contact &amp; feedback
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          MindShift is an early beta built by a very small team. If something broke, felt off, or
          you wish it worked differently, this form is the fastest way to reach us. You can also
          email{" "}
          <a className="text-primary underline" href="mailto:hello@mindshift.app">
            hello@mindshift.app
          </a>
          .
        </p>

        <div className="surface-card mt-10 rounded-3xl p-6 sm:p-8">
          <FeedbackForm />
        </div>

        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
          If you are in crisis or need urgent help, please contact your local emergency services or
          a qualified professional. MindShift is a personal growth and accountability tool, not
          therapy or medical care.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
