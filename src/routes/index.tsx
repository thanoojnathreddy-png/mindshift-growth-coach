import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  CalendarCheck,
  Ear,
  Hand,
  HeartHandshake,
  LineChart,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Split,
  Timer,
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

const title = "MindShift — Break the Pattern Before It Repeats";
const description =
  "MindShift helps you recognize recurring patterns, understand your triggers, and make more conscious choices with personalized AI support.";
const socialImage = "https://mindshift-growth-coach.lovable.app/og-image.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mindshift-growth-coach.lovable.app/" },
      { property: "og:image", content: socialImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: socialImage },
    ],
    links: [{ rel: "canonical", href: "https://mindshift-growth-coach.lovable.app/" }],
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
    icon: Hand,
    title: "In-the-moment intervention",
    body: "One button when the urge shows up: pause, your own reason, your trigger, your plan, your choice.",
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
    title: "Private to your account",
    body: "Your commitment, slips and interventions are tied to your account and visible only to you.",
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
    title: "Plan your alternative",
    body: "Write if-then plans so the difficult moment already has an answer waiting for it.",
  },
  {
    step: "03",
    title: "Check in and adjust",
    body: "Reflect daily, review your triggers, and keep tuning the plan that actually works for you.",
  },
];

const interventionFlow = [
  { icon: Timer, label: "Pause", body: "A few seconds before any decision." },
  { icon: HeartHandshake, label: "Remember why", body: "Your own reason, in your own words." },
  { icon: Ear, label: "Recognise trigger", body: "Stress, boredom, tiredness, pressure…" },
  { icon: ListChecks, label: "Use your plan", body: "The alternative you chose in advance." },
  { icon: Split, label: "Choose", body: "Consciously — whatever you decide." },
];

const faqs = [
  {
    q: "How is MindShift different from a habit tracker?",
    a: "A habit tracker mostly records whether a behaviour happened, after the fact. MindShift is built for the moment itself: it helps you understand the recurring pattern, recognise the trigger, prepare an alternative response, and use personalised AI coaching and interventions so the next choice is a conscious one rather than an automatic one. Tracking is there too — it just isn't the point.",
  },
  {
    q: "What happens when I slip?",
    a: "A slip isn't treated as failure. You can record what happened, name the trigger and the emotion behind it, and that information is used to make your next intervention more useful. There's no streak punishment and no guilt language — progress here doesn't require perfection.",
  },
  {
    q: "Is my data private?",
    a: "Everything you write — your commitment, check-ins, journal entries, if-then plans and intervention history — is stored in your own account in our database and protected by row-level security, so other users can't read it. To generate coaching and intervention messages, the relevant parts of that context are sent to a third-party AI model provider that processes them to produce a response. You can turn AI personalisation off in Settings so your stored history isn't used that way, and you can delete your intervention history at any time.",
    links: true,
  },
  {
    q: "Is MindShift therapy or medical treatment?",
    a: "No. MindShift is a personal reflection, accountability and behaviour-change support tool. It is not therapy, medical treatment or diagnosis, and it is not a replacement for professional care. If you're struggling with something serious, please talk to a qualified professional as well.",
  },
  {
    q: "How does the AI Coach personalise my experience?",
    a: "It only uses what you choose to give it: your commitment, your reasons for changing, the triggers you report, your daily check-ins, your if-then plans and your previous progress. It uses that to keep messages short, specific and relevant instead of generic. If you'd rather it didn't, personalisation can be switched off in Settings.",
  },
  {
    q: "Do I need to change everything at once?",
    a: "No. MindShift intentionally starts with one commitment. One pattern, changed properly, is worth more than ten half-tracked goals.",
  },
];

function Landing() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main>
        <section className="hero-glow relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 md:pb-28 md:pt-24">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
              <div className="animate-rise">
                <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                  Personal growth, not performance tracking
                </span>
                <h1 className="mt-6 text-[2rem] font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
                  Stop Repeating <span className="text-gradient">The Same Mistake.</span>
                </h1>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {description}
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="rounded-full px-7 shadow-elevated">
                    <Link to="/signup">
                      Start My Journey
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                    <a href="#difference">See How It's Different</a>
                  </Button>
                </div>
                <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Free during beta</span>
                  <span aria-hidden="true">·</span>
                  <span>No credit card required</span>
                </p>
                <p className="mt-8 max-w-md text-xs leading-relaxed text-muted-foreground">
                  MindShift supports personal reflection and behaviour change. It isn't a substitute
                  for professional medical or mental-health care.
                </p>
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

        <section id="difference" className="mx-auto max-w-6xl px-5 py-24">
          <SectionHeading
            eyebrow="The core difference"
            title="Trackers record the mistake. MindShift interrupts it."
            body="Same habit, two very different moments of attention."
          />
          <div className="mt-14 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <article className="surface-card rounded-3xl p-7">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Most trackers
              </h3>
              <ol className="mt-6 space-y-3">
                <FlowNode label="Mistake happens" />
                <FlowNode label="Record it" muted last />
              </ol>
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                Useful data — but the decision was already made.
              </p>
            </article>
            <article className="surface-card rounded-3xl p-7">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                MindShift
              </h3>
              <ol className="mt-6 grid gap-3 sm:grid-cols-2">
                <FlowNode label="Trigger appears" />
                <FlowNode label="Pause" accent />
                <FlowNode label="MindShift intervention" accent />
                <FlowNode label="Alternative action" accent />
                <FlowNode label="Conscious choice" accent last />
              </ol>
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                The attention arrives while you still have a choice to make.
              </p>
            </article>
          </div>
        </section>

        <section id="intervention" className="border-y border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-5 py-24">
            <SectionHeading
              eyebrow="Intervention mode"
              title="One button: “I'm About to Slip”"
              body="When you notice yourself falling into an old pattern, open MindShift and start an intervention. It won't stop every unwanted behaviour — but it gives you a real moment to decide instead of react."
            />
            <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {interventionFlow.map((item, index) => (
                <li key={item.label} className="surface-card rounded-3xl p-6">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-5 font-display text-xs font-semibold text-primary">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-1 text-base font-semibold">{item.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="rounded-full px-7 shadow-elevated">
                <Link to="/signup">
                  See How Intervention Works
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <Link to="/signup">Build My If-Then Plan</Link>
              </Button>
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
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
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
            <Button asChild size="lg" className="mt-12 rounded-full px-7 shadow-elevated">
              <Link to="/signup">
                Create My First Commitment
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section id="stories" className="mx-auto max-w-6xl px-5 py-24">
          <div className="surface-card rounded-[2rem] px-7 py-14 text-center sm:px-10">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Who it's for
            </span>
            <h2 className="mx-auto mt-4 max-w-2xl text-2xl font-semibold leading-tight sm:text-4xl">
              Built for people who are tired of repeating the same pattern.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              MindShift is in early beta. We'd rather show you nothing than show you invented
              numbers, so there are no user counts, ratings or testimonials here yet — real beta
              metrics will appear in this space once there's honest data to share.
            </p>
            <dl className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
              {[
                ["One pattern", "at a time, on purpose"],
                ["30 seconds", "for a daily check-in"],
                ["Zero", "guilt trips or streak shaming"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-border bg-background/60 p-5">
                  <dt className="font-display text-lg font-semibold">{value}</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="faq" className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-3xl px-5 py-24">
            <SectionHeading eyebrow="FAQ" title="Questions people ask first" />
            <Accordion type="single" collapsible className="mt-10 w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q} className="border-border">
                  <AccordionTrigger className="text-left text-base font-medium">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    <p>{faq.a}</p>
                    {faq.links && (
                      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                        <Link to="/privacy" className="font-medium text-primary underline">
                          Privacy Policy
                        </Link>
                        <Link to="/terms" className="font-medium text-primary underline">
                          Terms of Service
                        </Link>
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-24">
          <div className="hero-glow surface-card overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-8 sm:py-16">
            <h2 className="mx-auto max-w-2xl text-2xl font-semibold leading-tight sm:text-4xl">
              The next time it happens, you'll have a plan ready.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Start with one pattern. Give it two weeks of honesty. See what shifts.
            </p>
            <Button asChild size="lg" className="mt-9 rounded-full px-8 shadow-elevated">
              <Link to="/signup">
                Start Changing the Pattern
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Free during beta · No credit card required
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function FlowNode({
  label,
  accent,
  muted,
  last,
}: {
  label: string;
  accent?: boolean;
  muted?: boolean;
  last?: boolean;
}) {
  return (
    <li className="relative">
      <div
        className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
          accent
            ? "border-primary/30 bg-primary/10 text-foreground"
            : muted
              ? "border-border bg-muted text-muted-foreground"
              : "border-border bg-background/60 text-foreground"
        }`}
      >
        {label}
      </div>
      {!last && (
        <span aria-hidden="true" className="mt-1 block text-center text-xs text-muted-foreground">
          ↓
        </span>
      )}
    </li>
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
      <h2 className="mt-4 text-2xl font-semibold leading-tight sm:text-4xl">{title}</h2>
      {body && (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{body}</p>
      )}
    </div>
  );
}
