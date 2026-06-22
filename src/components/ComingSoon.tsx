import { Hammer } from 'lucide-react'

// Placeholder das áreas novas (Fase 1 da nova arquitetura de navegação).
// Conteúdo funcional entra na Fase 2.
export default function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-blush flex items-center justify-center mx-auto">
        <Hammer size={20} className="text-petal" />
      </div>
      <h1 className="font-display text-xl font-semibold text-onyx">{title}</h1>
      <p className="font-body text-sm text-mauve leading-relaxed">{desc}</p>
      <p className="font-body text-[11px] text-mauve/50">Em construção — esta área estará disponível em breve.</p>
    </div>
  )
}
