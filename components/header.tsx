"use client"

// v2 — lucide imports reduced to Menu and X only
import { useState } from "react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { Menu, X } from "lucide-react"

type NavStyle = "highlight" | "default"

function navClass(style: NavStyle): string {
  const base =
    "relative shrink-0 px-2.5 py-1 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap "
  if (style === "highlight") {
    return base + "font-bold bg-[#FCD535] text-[#0B0E11] hover:bg-[#F0B90B]"
  }
  return base + "text-[#848E9C] hover:text-foreground hover:bg-white/[0.08]"
}

const NAV_ITEMS: { label: string; href: string; style: NavStyle }[] = [
  { label: "Home",            href: "/",               style: "default"    },
  { label: "Mentorship",      href: "/mentorship",     style: "default"    },
  { label: "VIP Group",       href: "/vip-group",      style: "default"    },
  { label: "Trade Dashboard", href: "/trade-dashboard",style: "default"    },
  { label: "Intelligence",    href: "/intelligence",   style: "default"    },
  { label: "USDT P2P",        href: "/usdt-p2p",       style: "highlight"  },
  { label: "Community",       href: "/community",      style: "default"    },
  { label: "Funded Tools",    href: "/funded-tools",   style: "default"    },
  { label: "Material",        href: "/material",       style: "default"    },
  { label: "FAQ",             href: "/faq",            style: "default"    },
  { label: "Contact",         href: "/contact",        style: "default"    },
]

// Named SiteHeader to bust the Turbopack HMR chunk; re-exported as Header below
function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header
      suppressHydrationWarning
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <Logo />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto scrollbar-none flex-1 mx-4">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={navClass(item.style)}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Hamburger */}
          <button
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

          {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border/50">
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navClass(item.style) + " block w-full"}
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

export { SiteHeader as Header }
