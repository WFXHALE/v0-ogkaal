"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, ChevronDown } from "lucide-react"
import { NotificationBell } from "@/components/notification-bell"
import { ThemeToggle } from "@/components/theme-toggle"
import { getSession } from "@/lib/community-utils"
import { BackButton } from "@/components/back-button"
import { UserAvatar } from "@/components/client-avatar"
import { LanguagePicker } from "@/components/language-picker"

interface NavItem { label: string; href: string }

const MORE_ITEMS: NavItem[] = [
  { label: "Home", href: "/home" },
  { label: "Mentorship", href: "/mentorship" },
  { label: "VIP Group", href: "/vip-group" },
  { label: "Intelligence", href: "/intelligence" },
  { label: "Indicators", href: "/indicators" },
  { label: "Prop Firms", href: "/prop-firms" },
  { label: "Community", href: "/community" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "Wallet", href: "/wallet" },
  { label: "Trade Dashboard", href: "/trade-dashboard" },
  { label: "SMC Guide", href: "/smc-guide" },
  { label: "Material", href: "/material" },
  { label: "Performance", href: "/performance" },
  { label: "VIP Signals", href: "/vip-signals" },
  { label: "About", href: "/about" },
  { label: "My Profile", href: "/profile" },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const logoClickCount = useRef(0)
  const logoClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    logoClickCount.current += 1
    if (logoClickTimer.current) clearTimeout(logoClickTimer.current)
    logoClickTimer.current = setTimeout(() => { logoClickCount.current = 0 }, 3000)
    if (logoClickCount.current === 5) {
      e.preventDefault()
      logoClickCount.current = 0
      if (logoClickTimer.current) clearTimeout(logoClickTimer.current)
      router.push("/kaal-admin-console")
    }
  }, [router])

  useEffect(() => {
    const session = getSession()
    if (session) setUserId(session.id)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setMoreOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!moreOpen) return
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-more-menu]")) setMoreOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [moreOpen])

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/")
  const moreHasActive = MORE_ITEMS.some(item => isActive(item.href))

  return (
    <header suppressHydrationWarning className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <BackButton inline />
            <Link href="/" onClick={handleLogoClick} aria-label="OG KAAL TRADER — USDT P2P">
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

          <nav className="hidden lg:flex items-center gap-2 flex-1 min-w-0">
            <Link href="/" className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${pathname === "/" || pathname.startsWith("/usdt-p2p") ? "text-foreground bg-secondary/70" : "text-muted-foreground hover:text-foreground"}`}>
              USDT P2P
            </Link>
            <div className="relative" data-more-menu>
              <button onClick={() => setMoreOpen(v => !v)} aria-expanded={moreOpen} className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${moreHasActive ? "text-foreground bg-secondary/70" : "text-muted-foreground hover:text-foreground"}`}>
                More <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
              </button>
              {moreOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 max-h-[75vh] overflow-y-auto bg-background border border-border rounded-xl shadow-xl py-1 z-50">
                  {MORE_ITEMS.map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} className={`block px-3 py-2.5 text-xs font-medium transition-colors ${isActive(item.href) ? "text-foreground bg-secondary/60" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"}`}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {userId && <NotificationBell userId={userId} />}
            <UserAvatar />
            <ThemeToggle />
            <button className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(v => !v)} aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}>
              <Menu className={`w-5 h-5 transition-transform duration-200 ${mobileMenuOpen ? "rotate-90" : ""}`} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-border/50">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-semibold text-foreground bg-secondary/60 rounded-lg">
              USDT P2P
            </Link>
            <div className="mt-2" data-more-menu>
              <button onClick={() => setMoreOpen(v => !v)} aria-expanded={moreOpen} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground rounded-lg">
                More <ChevronDown className={`w-4 h-4 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
              </button>
              {moreOpen && (
                <nav className="flex flex-col gap-0.5 max-h-[65vh] overflow-y-auto px-1 pb-2">
                  {MORE_ITEMS.map(item => (
                    <Link key={item.href} href={item.href} onClick={() => { setMobileMenuOpen(false); setMoreOpen(false) }} className={`px-4 py-2.5 text-sm rounded-lg ${isActive(item.href) ? "text-foreground bg-secondary/60" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"}`}>
                      {item.label}
                    </Link>
                  ))}
                  <div className="px-4 pt-2"><LanguagePicker onPick={() => { setMobileMenuOpen(false); setMoreOpen(false) }} /></div>
                </nav>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
