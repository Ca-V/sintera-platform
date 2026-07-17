import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import VideoSection from '@/components/landing/VideoSection'
import ModulesSection from '@/components/landing/ModulesSection'
import EcosystemSection from '@/components/landing/EcosystemSection'
import PillarsSection from '@/components/landing/PillarsSection'
import ScienceSection from '@/components/landing/ScienceSection'
import NotSection from '@/components/landing/NotSection'
import SobreSection from '@/components/landing/SobreSection'
import PricingSection from '@/components/landing/PricingSection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'

// HOM-001 — fluxo institucional: valor → como funciona → vídeo → módulos → propósito/missão/visão →
// evolução → 4 pilares (diferencial) → confiança → o que NÃO é (limites) → preço → ação.
export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features />
      <VideoSection />
      <ModulesSection />
      <SobreSection />
      <EcosystemSection />
      <PillarsSection />
      <ScienceSection />
      <NotSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  )
}
