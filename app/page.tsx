import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { WhatYouLearnSection } from "@/components/what-you-learn-section"
import { MentorshipProgramSection } from "@/components/mentorship-program-section"
import { GoldTicker } from "@/components/gold-ticker"
import { NavigationCardsSection } from "@/components/navigation-cards-section"
import { TopBrokersSection } from "@/components/top-brokers-section"
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
        <WhatYouLearnSection />
        <MentorshipProgramSection />
        <GoldTicker />
        <NavigationCardsSection />
        <TopBrokersSection />
        <ContactSection />
        <SocialMediaSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  )
}
