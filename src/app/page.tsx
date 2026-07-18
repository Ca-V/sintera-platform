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

// HOM-001 — fluxo institucional (ordem fundadora 17/07): valor (Hero) → propósito/missão/visão → vídeo →
// como funciona → módulos → evolução (cresce com você) → 4 pilares (diferencial) → confiança → o que NÃO é
// (limites) → preço → ação.
export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <SobreSection />
      <VideoSection />
      <Features />
      <ModulesSection />
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
