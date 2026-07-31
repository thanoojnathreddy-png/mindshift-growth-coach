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
          </div>
          <FooterColumn
            title="Product"
            items={[
              { label: "Features", href: "#features" },
              { label: "How it works", href: "#how-it-works" },
              { label: "FAQ", href: "#faq" },
            ]}
          />
          <FooterColumn
            title="Company"
            items={[
              { label: "Stories", href: "#stories" },
              { label: "Contact", href: "mailto:hello@mindshift.app" },
            ]}
          />
          <div>
            <h3 className="text-sm font-semibold">Get started</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <Link to="/signup" className="transition-colors hover:text-foreground">
                  Create an account
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
        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MindShift. Built for people, not perfection.</p>
          <p>MindShift is a self-reflection tool, not a substitute for medical care.</p>
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
