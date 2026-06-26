// T2-B1b — separação conceitual: a evolução longitudinal por biomarcador agora
// vive em Indicadores (/dashboard/saude); a linha do tempo de exames/documentos/
// eventos vive no Histórico (/dashboard/timeline). Esta rota antiga ("Evolução dos
// indicadores") deixou de existir para não duplicar Indicadores — redireciona.
//
// TODO(T2-B1, temporário): este redirect é uma TRANSIÇÃO, não solução arquitetural.
// Remover a rota /dashboard/historico quando a navegação definitiva estiver
// consolidada (nenhum link interno/externo apontar mais para cá).
import { redirect } from 'next/navigation'

export default function HistoricoRedirect() {
  redirect('/dashboard/saude')
}
