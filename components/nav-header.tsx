"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, ChevronDown } from "lucide-react"
import { NotificationBell } from "@/components/notification-bell"
import { ThemeToggle } from "@/components/theme-toggle"
import { getSession } from "@/lib/community-utils"
import { BackButton } from "@/components/back-button"
import { UserAvatar } from "@/components/client-avatar"

// ── Nav items — Profile is NOT here; it lives in the UserAvatar dropdown ──────
interface NavItem { label: string; href: string }

// Dashboard is accessed via the Profile icon — not a nav link
const NAV_ITEMS: NavItem[] = [
  { label: "Home",         href: "/"             },
  { label: "USDT P2P",     href: "/usdt-p2p"     },
  { label: "Mentorship",   href: "/mentorship"   },
  { label: "VIP Group",    href: "/vip-group"    },
  { label: "Intelligence", href: "/intelligence" },
  { label: "Funded Tools", href: "/funded-tools" },
  { label: "Material",     href: "/material"     },
  { label: "Community",    href: "/community"    },
  { label: "About",        href: "/about"        },
  { label: "Contact",      href: "/contact"      },
  { label: "FAQ",          href: "/faq"          },
]

// ── Single nav link with gold underline for active page ───────────────────────
function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      data-navitem
      className={[
        "relative shrink-0 px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors duration-150",
        "pb-[14px]", // extra bottom padding so the underline sits at the bar bottom
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {item.label}
      {/* Gold underline — shown on active, faint on hover */}
      <span
        className={[
          "absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-[#FCD535] transition-all duration-200",
          active ? "w-[80%] opacity-100" : "w-0 opacity-0 group-hover:w-[80%] group-hover:opacity-30",
        ].join(" ")}
      />
    </Link>
  )
}

// ── Overflow nav — renders nothing until mounted so SSR and client always match ─
function OverflowNav({ items, pathname }: { items: NavItem[]; pathname: string }) {
  const containerRef              = useRef<HTMLDivElement>(null)
  const measureRef                = useRef<HTMLDivElement>(null)
  const [mounted, setMounted]     = useState(false)
  const [visibleCount, setVisibleCount] = useState(items.length)
  const [moreOpen, setMoreOpen]   = useState(false)

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/")

  const measure = useCallback(() => {
    const container = containerRef.current
    const ruler     = measureRef.current
    if (!container || !ruler) return
    const available = container.offsetWidth - 72 // reserve ~72px for "More"
    const els = Array.from(ruler.querySelectorAll<HTMLElement>("[data-measure]"))
    let total = 0
    let count = 0
    for (const el of els) {
      total += el.offsetWidth + 4
      if (total > available) break
      count++
    }
    setVisibleCount(Math.max(1, count))
  }, [])

  // Only run on the client — avoids any SSR/client mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [mounted, measure])

  useEffect(() => {
    if (!moreOpen) return
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-more-menu]")) setMoreOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [moreOpen])

  const visible  = mounted ? items.slice(0, visibleCount) : items
  const overflow = mounted ? items.slice(visibleCount)    : []
  const moreHasActive = overflow.some(i => isActive(i.href))

  return (
    <div ref={containerRef} className="hidden lg:flex items-center flex-1 min-w-0 overflow-hidden relative">
      {/* Invisible ruler — all items rendered off-screen to measure widths */}
      <div
        ref={measureRef}
        aria-hidden
        className="absolute inset-0 flex items-center pointer-events-none opacity-0 overflow-hidden"
      >
        {items.map(item => (
          <span
            key={item.href}
            data-measure
            className="shrink-0 px-3 py-1 text-xs font-medium whitespace-nowrap pb-[14px]"
          >
            {item.label}
          </span>
        ))}
      </div>

      {/* Visible items */}
      <nav className="flex items-center">
        {visible.map(item => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
          />
        ))}
      </nav>

      {/* "More" dropdown for overflow items — only shown after mount */}
      {mounted && overflow.length > 0 && (
        <div className="relative shrink-0 ml-1" data-more-menu>
          <button
            onClick={() => setMoreOpen(v => !v)}
            aria-expanded={moreOpen}
            className={[
              "relative flex items-center gap-0.5 px-2 py-1 pb-[14px] text-xs font-medium whitespace-nowrap transition-colors duration-150",
              moreHasActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            More
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
            {moreHasActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] rounded-full bg-[#FCD535]" />
            )}
          </button>

          {moreOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-48 bg-background border border-border rounded-xl shadow-xl py-1 z-50">
              {overflow.map(item => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={[
                      "flex items-center justify-between px-3 py-2.5 text-xs font-medium transition-colors",
                      active
                        ? "text-foreground bg-secondary/60"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                    ].join(" ")}
                  >
                    {item.label}
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535] shrink-0" />}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const session = getSession()
    if (session) setUserId(session.id)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/")

  return (
    <>
      <header
        suppressHydrationWarning
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-3">

            {/* Left: back button + logo */}
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

            {/* Desktop overflow nav */}
            <OverflowNav items={NAV_ITEMS} pathname={pathname} />

            {/* Right actions: Notifications | Profile avatar | Theme toggle | Hamburger */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto lg:ml-0">
              {userId && <NotificationBell userId={userId} />}
              <UserAvatar />
              {/* Theme toggle — far right on desktop */}
              <ThemeToggle />
              {/* Hamburger — mobile only, always visible, no X icon */}
              <button
                className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(v => !v)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                <Menu className={`w-5 h-5 transition-transform duration-200 ${mobileMenuOpen ? "rotate-90" : ""}`} />
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-3 border-t border-border/50">
              <nav className="flex flex-col gap-0.5 max-h-[75vh] overflow-y-auto">
                {NAV_ITEMS.map(item => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={[
                        "flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                        active
                          ? "text-foreground bg-secondary/60 border-l-2 border-[#FCD535] pl-3"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                      ].join(" ")}
                    >
                      {item.label}
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535] shrink-0" />}
                    </Link>
                  )
                })}
                {/* Sub-pages accessible from mobile — shown as secondary items */}
                <div className="mt-1 pt-1 border-t border-border/40">
                  <p className="px-4 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Quick Links</p>
                  {[
                    { label: "Trade Dashboard", href: "/trade-dashboard" },
                    { label: "SMC Guide",       href: "/smc-guide" },
                    { label: "Blog",            href: "/blog" },
                    { label: "My Profile",      href: "/profile" },
                  ].map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={[
                        "flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                        isActive(item.href)
                          ? "text-foreground bg-secondary/60 border-l-2 border-[#FCD535] pl-3"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                      ].join(" ")}
                    >
                      {item.label}
                      {isActive(item.href) && <span className="w-1.5 h-1.5 rounded-full bg-[#FCD535] shrink-0" />}
                    </Link>
                  ))}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  )
}
