import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

const title = "Terms of Service — MindShift";
const description =
  "The terms for using MindShift during its free beta, including what the product is and what it isn't.";

export const Route = createFileRoute("/terms")({
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
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Legal</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">Terms of Service</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Draft placeholder for the MindShift beta, to be replaced by full terms before general
          availability.
        </p>

        <div className="mt-12 space-y-10">
          <Section title="What MindShift is">
            <p>
              MindShift is a personal reflection, accountability and behaviour-change support tool.
              It helps you notice recurring patterns, prepare alternatives and make more conscious
              choices.
            </p>
          </Section>
          <Section title="What MindShift is not">
            <p>
              It is not therapy, medical treatment, diagnosis or emergency support, and it is not a
              replacement for professional care. If you are in crisis, contact local emergency
              services or a qualified professional.
            </p>
          </Section>
          <Section title="Beta status and pricing">
            <p>
              MindShift is currently free during beta and no credit card is required. Features may
              change or break while in beta. If paid plans are introduced later, existing users will
              be told before anything changes.
            </p>
          </Section>
          <Section title="Your account">
            <p>
              You're responsible for keeping your login secure and for the content you enter. Don't
              use MindShift to store other people's sensitive information.
            </p>
          </Section>
          <Section title="Availability">
            <p>
              The beta is provided as-is, without warranties, and we can't guarantee uninterrupted
              availability or any particular outcome from using it.
            </p>
          </Section>
        </div>

        <p className="mt-14 text-sm">
          <Link to="/privacy" className="text-primary underline">
            Read the Privacy Policy
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
