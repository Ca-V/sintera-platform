// Rota de PREVIEW da Timeline — casca fina sobre TimelineNew. Não é produção.

import TimelineNew from '@/components/timeline/TimelineNew'

export default function TimelinePreviewPage() {
  return (
    <div>
      <p className="mx-auto mb-0 max-w-2xl px-4 pt-4 text-xs text-gold">
        Preview (dados reais) — Timeline v2. Não é a tela de produção.
      </p>
      <TimelineNew />
    </div>
  )
}
