"use client"

import Link from "next/link"
import { Youtube, Send, Instagram } from "lucide-react"

const socialPlatforms = [
  {
    name: "Instagram",
    icon: Instagram,
    username: "@ogkaaltrader",
    url: "https://www.instagram.com/ogkaaltrader",
    color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
    hoverGlow: "hover:shadow-pink-500/20",
  },
  {
    name: "Telegram",
    icon: Send,
    username: "@ogkaaltrading",
    url: "https://t.me/ogkaaltrading",
    color: "bg-sky-500",
    hoverGlow: "hover:shadow-sky-500/20",
  },
  {
    name: "YouTube",
    icon: Youtube,
    username: "@ogkaaltrader",
    url: "https://youtube.com/@ogkaaltrader",
    color: "bg-red-600",
    hoverGlow: "hover:shadow-red-500/20",
  },
]

export function SocialMediaSection() {
  return (
    <section className="py-16 sm:py-20 px-4 border-t border-border/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Connect With <span className="text-primary">OG KAAL TRADER</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-balance">
            Stay updated with the latest market insights, trade setups, and community discussions
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {socialPlatforms.map((platform) => (
            <Link
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative bg-card border border-border/50 rounded-xl p-4 sm:p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-xl ${platform.hoverGlow}`}
            >
              {/* Mobile: horizontal layout; sm+: vertical */}
              <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:text-center sm:gap-0">
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full ${platform.color} flex items-center justify-center shrink-0 sm:mb-4 transition-transform duration-300 group-hover:scale-110`}
                >
                  <platform.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>

                <div className="flex-1 sm:flex-none sm:w-full">
                  <h3 className="text-base sm:text-xl font-semibold text-foreground sm:mb-2">
                    {platform.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground sm:mb-4">
                    {platform.username}
                  </p>
                </div>

                <div className="sm:w-full py-2 px-4 rounded-lg bg-primary/10 border border-primary/30 text-primary font-medium text-sm transition-all group-hover:bg-primary group-hover:text-primary-foreground text-center shrink-0">
                  Follow
                </div>
              </div>

              <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
