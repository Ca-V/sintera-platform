// Rota de PREVIEW do Relatório — casca fina sobre ReportNew. Não é produção.

import ReportNew from '@/components/report/ReportNew'

export default function ReportPreviewPage() {
  return (
    <div>
      <p className="mx-auto mb-0 max-w-2xl px-4 pt-4 text-xs text-gold">
        Preview (dados reais) — Relatório v2. Não é a tela de produção.
      </p>
      <ReportNew />
    </div>
  )
}
