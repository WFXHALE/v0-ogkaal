"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Menu, X } from "lucide-react"

const navItems = [
  { label: "Home", href: "/", isHome: true },
  { label: "Mentorship", href: "/mentorship" },
  { label: "VIP Group", href: "/vip-group" },
  { label: "Trade Dashboard", href: "/trade-dashboard" },
  { label: "Intelligence", href: "/intelligence" },
  { label: "USDT P2P", href: "/usdt-p2p", isHighlight: true },
  { label: "Funded Tools", href: "/funded-tools" },
  { label: "Material", href: "/material" },
  { label: "Contact", href: "/contact" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <Logo />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`px-3 py-2 text-sm transition-colors rounded-md ${
                  item.isHighlight
                    ? "font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                    : item.isHome
                    ? "font-bold text-primary bg-primary/10 hover:bg-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border/50">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-2 text-sm transition-colors rounded-md ${
                    item.isHighlight
                      ? "font-bold bg-primary text-primary-foreground"
                      : item.isHome
                      ? "font-bold text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
