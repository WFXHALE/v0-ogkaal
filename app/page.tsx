import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { MarketOverview } from "@/components/market-overview"
import { ServicesPreview } from "@/components/services-preview"
import { ContactSection } from "@/components/contact-section"
import { SocialMediaSection } from "@/components/social-media-section"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <MarketOverview />
        <ServicesPreview />
        <ContactSection />
        <SocialMediaSection />
      </main>
    </div>
  )
}
