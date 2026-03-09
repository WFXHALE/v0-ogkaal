import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} OG KAAL TRADER. All rights reserved.
        </p>
        <nav className="flex items-center gap-4 flex-wrap justify-center">
          <Link
            href="/terms"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms &amp; Conditions
          </Link>
          <span className="text-muted-foreground/40 text-xs select-none">|</span>
          <Link
            href="/privacy"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-muted-foreground/40 text-xs select-none">|</span>
          <Link
            href="/disclaimer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Trading Disclaimer
          </Link>
        </nav>
      </div>
    </footer>
  )
}
