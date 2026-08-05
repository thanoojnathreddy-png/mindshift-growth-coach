import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

const title = "Privacy Policy | MindShift";
const description =
  "How MindShift stores your commitments, check-ins and intervention history, and how AI coaching uses that context.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Legal</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Draft placeholder for the MindShift beta. It describes how the product works today and
          will be replaced by a full legal policy before general availability.
        </p>

        <div className="mt-12 space-y-10">
          <Section title="What we store">
            <p>
              Only what you enter: your account email and display name, your commitment, your
              reasons and desired identity, your future-self message, daily check-ins, journal
              entries, if-then plans, intervention events (trigger, emotion, decision and whether
              the intervention helped), coach conversations, and the consequence metrics you define.
            </p>
          </Section>
          <Section title="Who can see it">
            <p>
              Your rows are tied to your account and protected by row-level security in our
              database, so other users cannot read them. Our team can technically access the
              database for operational reasons; we don't read your entries for any other purpose.
            </p>
          </Section>
          <Section title="AI processing">
            <p>
              To generate coaching, reflections and intervention messages, relevant parts of your
              context are sent to a third-party AI model provider, which processes them to return a
              response. You can turn AI personalisation off in Settings so your stored history isn't
              used this way.
            </p>
          </Section>
          <Section title="Your controls">
            <p>
              In Settings you can edit your commitment, disable AI personalisation, delete your
              intervention history, and reset your journey. We never contact anyone else on your
              behalf, and there are no automatic punishment systems.
            </p>
          </Section>
          <Section title="Payments">
            <p>MindShift is free during beta. We don't collect or process payment details.</p>
          </Section>
          <Section title="Contact">
            <p>
              Questions? Email{" "}
              <a className="text-primary underline" href="mailto:hello@mindshift.app">
                hello@mindshift.app
              </a>
              .
            </p>
          </Section>
        </div>

        <p className="mt-14 text-sm">
          <Link to="/terms" className="text-primary underline">
            Read the Terms of Service
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
