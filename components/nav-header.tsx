"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Menu, X, ChevronDown } from "lucide-react"
import { NotificationBell } from "@/components/notification-bell"
import { ThemeToggle } from "@/components/theme-toggle"
import { getSession } from "@/lib/community-utils"
import { BackButton } from "@/components/back-button"
import { UserAvatar } from "@/components/user-avatar"

type NavStyle = "highlight" | "default"
interface NavItem { label: string; href: string; style: NavStyle }

const NAV_ITEMS: NavItem[] = [
  { label: "Home",            href: "/",               style: "default"   },
  { label: "About",           href: "/about",          style: "default"   },
  { label: "Mentorship",      href: "/mentorship",     style: "default"   },
  { label: "VIP Group",       href: "/vip-group",      style: "default"   },
  { label: "Dashboard",       href: "/dashboard",      style: "default"   },
  { label: "Trade Dashboard", href: "/trade-dashboard",style: "default"   },
  { label: "Intelligence",    href: "/intelligence",   style: "default"   },
  { label: "USDT P2P",        href: "/usdt-p2p",       style: "highlight" },
  { label: "Community",       href: "/community",      style: "default"   },
  { label: "Funded Tools",    href: "/funded-tools",   style: "default"   },
  { label: "Material",        href: "/material",       style: "default"   },
  { label: "Blog",            href: "/blog",           style: "default"   },
  { label: "SMC Guide",       href: "/smc-guide",      style: "default"   },
  { label: "Profile",         href: "/profile",        style: "default"   },
  { label: "FAQ",             href: "/faq",            style: "default"   },
  { label: "Contact",         href: "/contact",        style: "default"   },
]

function navItemClass(style: NavStyle) {
  const base = "shrink-0 px-2.5 py-1 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap "
  return style === "highlight"
    ? base + "font-bold bg-[#FCD535] text-[#0B0E11] hover:bg-[#F0B90B]"
    : base + "text-muted-foreground hover:text-foreground hover:bg-secondary"
}

function OverflowNav({ items }: { items: NavItem[] }) {
  const navRef = useRef<HTMLElement>(null)
  const [visibleCount, setVisibleCount] = useState(items.length)
  const [moreOpen, setMoreOpen] = useState(false)

  const measure = useCallback(() => {
    const nav = navRef.current
    if (!nav) return
    const children = Array.from(nav.querySelectorAll<HTMLElement>("[data-navitem]"))
    if (children.length === 0) return
    children.forEach(el => { el.style.display = "" })
    const available = nav.offsetWidth - 72
    let total = 0
    let count = 0
    for (const el of children) {
      total += el.offsetWidth + 2
      if (total > available) break
      count++
    }
    setVisibleCount(count < items.length ? count : items.length)
  }, [items.length])

  useEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (navRef.current) ro.observe(navRef.current)
    return () => ro.disconnect()
  }, [measure])

  useEffect(() => {
    if (!moreOpen) return
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-more-menu]")) setMoreOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [moreOpen])

  const overflow = items.slice(visibleCount)

  return (
    <nav ref={navRef} className="hidden lg:flex items-center gap-0.5 flex-1 min-w-0 mx-3">
      {items.map((item, i) => (
        <Link
          key={item.href}
          href={item.href}
          data-navitem
          className={navItemClass(item.style)}
          style={{ display: i < visibleCount ? undefined : "none" }}
        >
          {item.label}
        </Link>
      ))}
      {overflow.length > 0 && (
        <div className="relative shrink-0" data-more-menu>
          <button
            onClick={() => setMoreOpen(v => !v)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors whitespace-nowrap"
            aria-expanded={moreOpen}
          >
            More <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
          </button>
          {moreOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-44 bg-background border border-border rounded-xl shadow-lg py-1 z-50">
              {overflow.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={
                    item.style === "highlight"
                      ? "flex items-center px-3 py-2 text-xs font-bold text-[#0B0E11] bg-[#FCD535] mx-1 my-0.5 rounded-lg"
                      : "flex items-center px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg mx-1 my-0.5 transition-colors"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const session = getSession()
    if (session) setUserId(session.id)
  }, [])

  return (
    <>
      <header
        suppressHydrationWarning
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-2">

            <div className="flex items-center gap-2 shrink-0">
              <BackButton inline />
              <Link href="/admin-login" aria-label="Admin Panel">
                <div className="relative w-9 h-9 rounded-lg bg-[#FCD535] flex items-center justify-center overflow-hidden">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 relative z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="5" y="10" width="4" height="8" fill="#0B0E11" rx="0.5" />
                    <rect x="6.5" y="7" width="1" height="3" fill="#0B0E11" />
                    <rect x="6.5" y="18" width="1" height="2" fill="#0B0E11" />
                    <rect x="13" y="4" width="5" height="14" fill="#0B0E11" rx="0.5" />
                    <rect x="15" y="1" width="1.5" height="3" fill="#0B0E11" />
                    <rect x="15" y="18" width="1.5" height="4" fill="#0B0E11" />
                  </svg>
                  <span className="absolute inset-0 z-20 pointer-events-none" style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)", backgroundSize: "200% 100%", animation: "logo-shine 3.5s linear infinite" }} />
                </div>
              </Link>
              <Link href="/" className="hidden xl:block text-base font-bold text-foreground whitespace-nowrap">
                OG <span className="text-[#FCD535]">KAAL</span> TRADER
              </Link>
            </div>

            <OverflowNav items={NAV_ITEMS} />

            <div className="flex items-center gap-1 shrink-0">
              <ThemeToggle />
              {userId && <NotificationBell userId={userId} />}
              <UserAvatar />
              <button
                className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(v => !v)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden py-3 border-t border-border/50">
              <nav className="flex flex-col gap-0.5 max-h-[75vh] overflow-y-auto">
                {NAV_ITEMS.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      item.style === "highlight"
                        ? "block px-4 py-3 text-sm font-bold rounded-lg bg-[#FCD535] text-[#0B0E11] text-center"
                        : "block px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }
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
    </>
  )
}
