"use client"

import { useState } from "react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { Menu, X, Star } from "lucide-react"

type NavStyle = "home" | "mentorship" | "vip" | "glitter" | "highlight" | "contact" | "default"

const navItems: { label: string; href: string; style: NavStyle }[] = [
  { label: "Home",            href: "/",               style: "home" },
  { label: "Mentorship",      href: "/mentorship",     style: "mentorship" },
  { label: "VIP Group",       href: "/vip-group",      style: "vip" },
  { label: "Trade Dashboard", href: "/trade-dashboard",style: "glitter" },
  { label: "Intelligence",    href: "/intelligence",   style: "glitter" },
  { label: "USDT P2P",        href: "/usdt-p2p",       style: "highlight" },
  { label: "Funded Tools",    href: "/funded-tools",   style: "glitter" },
  { label: "Material",        href: "/material",       style: "glitter" },
  { label: "Contact",         href: "/contact",        style: "contact" },
]

function navClass(style: NavStyle): string {
  const base = "relative px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 "
  switch (style) {
    case "home":
      return base + "text-foreground bg-white/10 hover:bg-white/20 border border-white/20"
    case "mentorship":
      return base + "text-white bg-purple-700/70 hover:bg-purple-600/80 border border-purple-500/40"
    case "vip":
      return base + "text-foreground hover:text-foreground hover:bg-white/5"
    case "glitter":
      return base + "nav-glitter text-[#848E9C] hover:text-foreground bg-white/5 hover:bg-white/10 border border-white/10"
    case "highlight":
      return base + "font-bold bg-[#FCD535] text-[#0B0E11] hover:bg-[#F0B90B]"
    case "contact":
      return base + "text-white bg-blue-600/70 hover:bg-blue-500/80 border border-blue-500/40"
    default:
      return base + "text-[#848E9C] hover:text-foreground"
  }
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <Logo />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className={navClass(item.style)}>
                {/* VIP Group — gold star sparkle in corner */}
                {item.style === "vip" && (
                  <span className="absolute -top-1 -right-1 star-sparkle">
                    <Star className="w-3 h-3 fill-[#FCD535] text-[#FCD535]" />
                  </span>
                )}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border/50">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={navClass(item.style)}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.style === "vip" && (
                    <span className="absolute -top-1 -right-1 star-sparkle">
                      <Star className="w-3 h-3 fill-[#FCD535] text-[#FCD535]" />
                    </span>
                  )}
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
