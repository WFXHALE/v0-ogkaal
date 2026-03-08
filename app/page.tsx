import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { MarketOverview } from "@/components/market-overview"
import { TeachingFormatSection } from "@/components/teaching-format-section"
import { VipSignalsSection } from "@/components/vip-signals-section"
import { StudentResourcesSection } from "@/components/student-resources-section"
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
        <TeachingFormatSection />
        <VipSignalsSection />
        <StudentResourcesSection />
        <ServicesPreview />
        <ContactSection />
        <SocialMediaSection />
      </main>
    </div>
  )
}
