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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {socialPlatforms.map((platform) => (
            <Link
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative bg-card border border-border/50 rounded-xl p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-xl ${platform.hoverGlow}`}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-16 h-16 rounded-full ${platform.color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}
                >
                  <platform.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {platform.name}
                </h3>

                <p className="text-sm text-muted-foreground mb-4">
                  {platform.username}
                </p>

                <div className="w-full py-2.5 px-4 rounded-lg bg-primary/10 border border-primary/30 text-primary font-medium text-sm transition-all group-hover:bg-primary group-hover:text-primary-foreground">
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
