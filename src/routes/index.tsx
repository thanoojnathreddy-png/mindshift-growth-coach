import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  CalendarCheck,
  HeartHandshake,
  LineChart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import heroImage from "@/assets/hero-abstract.jpg";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";

const title = "MindShift — Stop Repeating The Same Mistake";
const description =
  "MindShift helps you break recurring habits through AI-powered coaching, daily accountability, and emotional support.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: BrainCircuit,
    title: "Pattern intelligence",
    body: "Your reflections turn into a map of the triggers, times and moods that keep pulling you back.",
  },
  {
    icon: CalendarCheck,
    title: "30-second check-ins",
    body: "One honest question a day. No streak shaming, no guilt — just clarity you can act on.",
  },
  {
    icon: HeartHandshake,
    title: "Coaching that's kind",
    body: "Support written like a friend who believes in you, not a scoreboard that measures you.",
  },
  {
    icon: LineChart,
    title: "Progress you can feel",
    body: "Streaks, success rate and calendars that show change even on the days it doesn't feel like it.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Your commitment and your slips belong to you alone. Nobody else can read them.",
  },
  {
    icon: Sparkles,
    title: "Identity-first",
    body: "You don't track a habit — you practise becoming the person you described on day one.",
  },
];

const steps = [
  {
    step: "01",
    title: "Name the pattern",
    body: "Tell MindShift the habit you keep repeating, why it matters, and what usually sets it off.",
  },
  {
    step: "02",
    title: "Check in daily",
    body: "Answer one question each day. If you slipped, we gently unpack what happened.",
  },
  {
    step: "03",
    title: "Shift the loop",
    body: "Watch your triggers lose power as your streak, success rate and self-trust grow.",
  },
];

const testimonials = [
  {
    quote:
      "For the first time I could see the pattern instead of just hating myself for it. That changed everything.",
    name: "Amara O.",
    role: "Designer, 6 weeks in",
  },
  {
    quote:
      "The check-in takes twenty seconds and somehow it's the most honest twenty seconds of my day.",
    name: "Daniel R.",
    role: "Founder, 3 months in",
  },
  {
    quote:
      "I've tried habit trackers for years. MindShift is the first one that felt like it was on my side.",
    name: "Lena K.",
    role: "Nurse, 11 weeks in",
  },
];

const faqs = [
  {
    q: "How is MindShift different from a habit tracker?",
    a: "Trackers count days. MindShift focuses on the loop underneath: the trigger, the feeling and the story you tell yourself. Check-ins are reflective, not just a tick box.",
  },
  {
    q: "What happens when I slip?",
    a: "Nothing punishing. You answer three short questions about what happened, what triggered it and how you felt — so the slip becomes information instead of shame.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Everything you write is tied to your account and only visible to you.",
  },
  {
    q: "Do I need to change everything at once?",
    a: "No. MindShift intentionally starts with one commitment. One pattern, changed properly, is worth more than ten half-tracked goals.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="hero-glow relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 md:pb-28 md:pt-24">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
              <div className="animate-rise">
                <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Personal growth, not performance tracking
                </span>
                <h1 className="mt-6 text-4xl font-semibold leading-[1.06] sm:text-5xl lg:text-6xl">
                  Stop Repeating <span className="text-gradient">The Same Mistake.</span>
                </h1>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {description}
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="rounded-full px-7 shadow-elevated">
                    <Link to="/signup">
                      Get Started
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                    <a href="#how-it-works">Learn More</a>
                  </Button>
                </div>
                <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
                  {[
                    ["1", "pattern at a time"],
                    ["30s", "daily check-in"],
                    ["0", "guilt trips"],
                  ].map(([value, label]) => (
                    <div key={label}>
                      <dt className="font-display text-2xl font-semibold">{value}</dt>
                      <dd className="mt-1 text-xs text-muted-foreground">{label}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="relative animate-rise">
                <img
                  src={heroImage}
                  alt="Soft flowing glass waves representing a calmer mind"
                  width={1280}
                  height={960}
                  className="w-full rounded-3xl border border-border object-cover shadow-elevated"
                />
                <div className="glass absolute -bottom-6 left-4 right-4 rounded-2xl p-4 sm:left-8 sm:right-auto sm:w-72">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Today's reflection
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    “You are not the habit. You're the person choosing, right now, to do it
                    differently.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-5 py-24">
          <SectionHeading
            eyebrow="Features"
            title="Built to understand you, not score you"
            body="Every part of MindShift exists to answer one question: what is really driving this pattern?"
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="surface-card group rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-accent-foreground">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="border-y border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-5 py-24">
            <SectionHeading
              eyebrow="How it works"
              title="Three steps, repeated gently"
              body="No 40-page plan. Just a loop that gets easier every time you close it."
            />
            <ol className="mt-14 grid gap-5 md:grid-cols-3">
              {steps.map((item) => (
                <li key={item.step} className="surface-card rounded-3xl p-7">
                  <span className="font-display text-sm font-semibold text-primary">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="stories" className="mx-auto max-w-6xl px-5 py-24">
          <SectionHeading
            eyebrow="Stories"
            title="People who stopped starting over"
            body="Early MindShift members, in their own words."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {testimonials.map((item) => (
              <figure key={item.name} className="surface-card rounded-3xl p-7">
                <blockquote className="text-sm leading-relaxed">“{item.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="gradient-brand grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-primary-foreground">
                    {item.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{item.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.role}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="faq" className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-3xl px-5 py-24">
            <SectionHeading eyebrow="FAQ" title="Questions people ask first" />
            <Accordion type="single" collapsible className="mt-10">
              {faqs.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q} className="border-border">
                  <AccordionTrigger className="text-left text-base font-medium">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-24">
          <div className="hero-glow surface-card overflow-hidden rounded-[2rem] px-8 py-16 text-center">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
              The next time it happens, you'll know why.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Start with one pattern. Give it two weeks of honesty. See what shifts.
            </p>
            <Button asChild size="lg" className="mt-9 rounded-full px-8 shadow-elevated">
              <Link to="/signup">
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="max-w-2xl">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>
      {body && <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{body}</p>}
    </div>
  );
}
