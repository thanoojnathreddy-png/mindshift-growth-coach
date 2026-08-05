import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { label: "Why it's different", href: "#difference" },
  { label: "Intervention", href: "#intervention" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5 md:flex md:justify-between">
        <Logo withBeta />
        <nav
          aria-label="Main"
          className="hidden items-center gap-7 text-sm text-muted-foreground md:flex"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-sm transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {!loading && user ? (
            <Button asChild size="sm" className="rounded-full">
              <Link to="/dashboard">Open app</Link>
            </Button>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-sm text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Log In
              </Link>
              <Button asChild size="sm" className="rounded-full px-5 shadow-elevated">
                <Link to="/signup">Start My Journey</Link>
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <div id="mobile-nav" className="border-t border-border px-5 pb-5 pt-3 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col text-sm">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            {!loading && user ? (
              <Button asChild className="min-h-11 rounded-full">
                <Link to="/dashboard">Open app</Link>
              </Button>
            ) : (
              <>
                <Button asChild className="min-h-11 rounded-full shadow-elevated">
                  <Link to="/signup" onClick={() => setOpen(false)}>
                    Start My Journey
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="min-h-11 rounded-full">
                  <Link to="/login" onClick={() => setOpen(false)}>
                    Log In
                  </Link>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Free during beta · No credit card required
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
