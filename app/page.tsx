import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { MarketOverview } from "@/components/market-overview"
import { VipCommunitySection } from "@/components/vip-community-section"
import { ContactSection } from "@/components/contact-section"
import { SocialMediaSection } from "@/components/social-media-section"

export default function Home() {
  return (
    <div className="min-h-screen bg-background dark">
      <Header />
      <main>
        <HeroSection />
        <MarketOverview />
        <VipCommunitySection />
        <ContactSection />
        <SocialMediaSection />
      </main>
    </div>
  )
}
