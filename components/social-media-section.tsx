"use client"

import { Youtube, Send, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"

const socialPlatforms = [
  {
    name: "YouTube",
    icon: Youtube,
    followers: "125K+",
    username: "@OGCallTrader",
    color: "bg-red-600",
    hoverColor: "hover:bg-red-700",
  },
  {
    name: "Telegram",
    icon: Send,
    followers: "50K+",
    username: "@OGCallTrader",
    color: "bg-sky-500",
    hoverColor: "hover:bg-sky-600",
  },
  {
    name: "Instagram",
    icon: Instagram,
    followers: "85K+",
    username: "@OGCallTrader",
    color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
    hoverColor: "hover:opacity-90",
  },
]

export function SocialMediaSection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Join Our <span className="text-primary">Community</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Connect with thousands of traders and stay updated with the latest market insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {socialPlatforms.map((platform) => (
            <div
              key={platform.name}
              className="group relative bg-card border border-border/50 rounded-xl p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-16 h-16 rounded-full ${platform.color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}
                >
                  <platform.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-1">
                  {platform.name}
                </h3>

                <p className="text-2xl font-bold text-primary mb-1">
                  {platform.followers}
                </p>
                <p className="text-sm text-muted-foreground mb-4">Followers</p>

                <p className="text-sm text-muted-foreground mb-5">
                  {platform.username}
                </p>

                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                >
                  Follow
                </Button>
              </div>

              <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
