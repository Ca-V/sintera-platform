// Rota de PREVIEW do Dashboard — casca fina sobre o container DashboardNew
// (mesma composição que o DashboardEntry usará no cutover). Não é produção.

import DashboardNew from '@/components/dashboard/DashboardNew'

export default function DashboardPreviewPage() {
  return (
    <div>
      <p className="mx-auto mb-0 max-w-3xl px-4 pt-4 text-xs text-gold">
        Preview (dados reais) — Dashboard v2. Não é a tela de produção.
      </p>
      <DashboardNew />
    </div>
  )
}
