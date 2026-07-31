import { Link } from "@tanstack/react-router";

export function Logo({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="gradient-brand grid h-9 w-9 shrink-0 place-items-center rounded-xl shadow-soft">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M4 15c0-5 3.5-9 8-9s8 3.2 8 7c0 3.2-2.6 5.4-6 5.4-1.4 0-2.3.5-2.8 1.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="text-primary-foreground"
          />
          <circle cx="9.5" cy="13" r="1.6" className="fill-current text-primary-foreground" />
        </svg>
      </span>
      {withWordmark && (
        <span className="font-display text-lg font-semibold tracking-tight">MindShift</span>
      )}
    </Link>
  );
}
