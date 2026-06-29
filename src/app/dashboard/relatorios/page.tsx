// "Relatórios" tem uma única rota canônica: /dashboard/relatorio. Esta rota no
// plural era uma duplicata (placeholder) — mantida apenas como redirect estável
// para não quebrar links antigos.
import { redirect } from 'next/navigation'

export default function RelatoriosRedirect() {
  redirect('/dashboard/relatorio')
}
