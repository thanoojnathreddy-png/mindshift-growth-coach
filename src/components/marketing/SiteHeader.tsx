import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Stories", href: "#stories" },
  { label: "FAQ", href: "#faq" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5 md:flex md:justify-between">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {!loading && user ? (
            <Button asChild size="sm" className="rounded-full">
              <Link to="/dashboard">Open app</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full">
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border px-5 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col gap-3 text-sm">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {!loading && user ? (
              <Button asChild className="rounded-full">
                <Link to="/dashboard">Open app</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
