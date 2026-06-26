// T2-B1b — separação conceitual: a evolução longitudinal por biomarcador agora
// vive em Indicadores (/dashboard/saude); a linha do tempo de exames/documentos/
// eventos vive no Histórico (/dashboard/timeline). Esta rota antiga ("Evolução dos
// indicadores") deixou de existir para não duplicar Indicadores — redireciona.
import { redirect } from 'next/navigation'

export default function HistoricoRedirect() {
  redirect('/dashboard/saude')
}
