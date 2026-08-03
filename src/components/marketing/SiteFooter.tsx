import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              A calmer way to break the patterns you keep repeating — with reflection,
              accountability and coaching that never judges you.
            </p>
            <p className="mt-4 text-xs font-medium text-foreground">
              Free during beta · No credit card required
            </p>
          </div>
          <FooterColumn
            title="Product"
            items={[
              { label: "Why it's different", href: "#difference" },
              { label: "Intervention", href: "#intervention" },
              { label: "Features", href: "#features" },
              { label: "How it works", href: "#how-it-works" },
              { label: "FAQ", href: "#faq" },
            ]}
          />
          <div>
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <Link to="/privacy" className="transition-colors hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="transition-colors hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@mindshift.app"
                  className="transition-colors hover:text-foreground"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Get started</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <Link to="/signup" className="transition-colors hover:text-foreground">
                  Start my journey
                </Link>
              </li>
              <li>
                <Link to="/login" className="transition-colors hover:text-foreground">
                  Log in
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MindShift. Built for people, not perfection.</p>
          <p className="max-w-md sm:text-right">
            MindShift supports personal reflection and behaviour change. It isn't therapy, medical
            treatment or a substitute for professional medical or mental-health care.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item.label}>
            <a href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
