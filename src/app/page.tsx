import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import EcosystemSection from '@/components/landing/EcosystemSection'
import ScienceSection from '@/components/landing/ScienceSection'
import SobreSection from '@/components/landing/SobreSection'
import PricingSection from '@/components/landing/PricingSection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features />
      <SobreSection />
      <EcosystemSection />
      <ScienceSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  )
}
