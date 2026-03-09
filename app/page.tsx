import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { WhatYouLearnSection } from "@/components/what-you-learn-section"
import { MentorshipProgramSection } from "@/components/mentorship-program-section"
import { NavigationCardsSection } from "@/components/navigation-cards-section"
import { MarketOverview } from "@/components/market-overview"
import { ContactSection } from "@/components/contact-section"
import { SocialMediaSection } from "@/components/social-media-section"
import { FaqSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <WhatYouLearnSection />
        <MentorshipProgramSection />
        <NavigationCardsSection />
        <div id="market-overview">
          <MarketOverview />
        </div>
        <ContactSection />
        <SocialMediaSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  )
}
