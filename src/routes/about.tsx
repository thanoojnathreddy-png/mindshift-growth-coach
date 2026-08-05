import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

const title = "About | MindShift";
const description =
  "Why MindShift exists: a calm, private tool that helps you interrupt recurring patterns in the moment instead of just tracking them.";
const url = "https://mindshift-growth-coach.lovable.app/about";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: url }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">About</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">About MindShift</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Most habit apps ask you to record what already happened. MindShift is built around the
          few seconds before it happens — the moment you notice the old pattern starting and could
          still choose differently.
        </p>

        <div className="mt-12 space-y-10">
          <Section title="What MindShift does">
            <p>
              You name one pattern you want to change and why it matters to you. From there
              MindShift gives you three things: a daily 30-second check-in, an in-the-moment
              intervention you can trigger yourself, and coaching that uses your own words and
              history rather than generic advice.
            </p>
          </Section>
          <Section title="What we believe">
            <p>
              Shame doesn't change behaviour; awareness and a prepared alternative do. MindShift
              never punishes you, never contacts anyone on your behalf, and never scores you against
              other people. A slip is information, not a verdict.
            </p>
          </Section>
          <Section title="Privacy first">
            <p>
              Everything you write belongs to your account and is protected by row-level security.
              AI personalisation only sends the context needed for the message being generated, and
              you can turn it off entirely in Settings.{" "}
              <Link to="/privacy" className="text-primary underline">
                Read the Privacy Policy
              </Link>
              .
            </p>
          </Section>
          <Section title="Where we are">
            <p>
              MindShift is in open beta and free to use — no credit card, no paid tiers yet.
              Features may change while we learn from early users.{" "}
              <Link to="/feedback" className="text-primary underline">
                Send us feedback
              </Link>{" "}
              — it directly shapes what we build.
            </p>
          </Section>
          <Section title="Important limitation">
            <p>
              MindShift supports personal reflection and behaviour change. It is not therapy,
              medical treatment, diagnosis or emergency support, and it is not a substitute for
              professional care.
            </p>
          </Section>
        </div>
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
