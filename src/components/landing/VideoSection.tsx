'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Play } from 'lucide-react'

// HOM-001 — Vídeo institucional. Placeholder elegante enquanto o vídeo definitivo não é fornecido.
// Estrutura pronta: ao ter o arquivo/URL, trocar o bloco de poster por um <video>/embed responsivo
// (16:9, com legendas, sem autoplay — respeita prefers-reduced-motion e dados móveis).
export default function VideoSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="video" className="py-28 bg-white">
      <div ref={ref} className="max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }} className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blush border border-petal-light text-xs font-body font-medium text-petal-dark uppercase tracking-wider mb-5">
            Veja em ação
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-onyx leading-tight mb-4">
            Conheça a SINTERA <span className="text-gradient">em poucos minutos</span>
          </h2>
          <p className="font-body text-mauve text-lg max-w-2xl mx-auto leading-relaxed">
            Um panorama de como a plataforma organiza suas informações de saúde e como começar a usar.
          </p>
        </motion.div>

        {/* Poster placeholder 16:9 — substituir por <video>/embed quando houver o vídeo definitivo */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative rounded-3xl overflow-hidden border border-border shadow-lg aspect-video gradient-dark flex items-center justify-center">
          <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-petal/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-lavender/10 blur-3xl pointer-events-none" />
          <div className="relative text-center px-6">
            <div className="w-16 h-16 rounded-full bg-white/12 border border-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Play size={26} className="text-white ml-1" />
            </div>
            <p className="font-body text-sm font-medium text-white/80">Vídeo institucional em breve</p>
            <p className="font-body text-xs text-white/45 mt-1">Estamos preparando uma apresentação completa da plataforma.</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
