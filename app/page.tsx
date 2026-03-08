import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { MarketOverview } from "@/components/market-overview"
import { SocialMediaSection } from "@/components/social-media-section"

export default function Home() {
  return (
    <div className="min-h-screen bg-background dark">
      <Header />
      <main>
        <HeroSection />
        <MarketOverview />
        <SocialMediaSection />
      </main>
    </div>
  )
}
