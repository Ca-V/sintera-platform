// Rota de PREVIEW de Indicadores — casca fina sobre IndicatorNew. Não é produção.

import IndicatorNew from '@/components/indicator/IndicatorNew'

export default function IndicatorPreviewPage() {
  return (
    <div>
      <p className="mx-auto mb-0 max-w-2xl px-4 pt-4 text-xs text-gold">
        Preview (dados reais) — Indicadores v2. Não é a tela de produção.
      </p>
      <IndicatorNew />
    </div>
  )
}
