import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import StatsSection from '@/components/landing/StatsSection'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import EcosystemSection from '@/components/landing/EcosystemSection'
import ScienceSection from '@/components/landing/ScienceSection'
import Testimonials from '@/components/landing/Testimonials'
import PricingSection from '@/components/landing/PricingSection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <StatsSection />
      <Features />
      <HowItWorks />
      <EcosystemSection />
      <ScienceSection />
      <Testimonials />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  )
}
