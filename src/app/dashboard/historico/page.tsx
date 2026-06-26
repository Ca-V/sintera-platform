// "Histórico de Saúde" é um módulo único com duas visões: Linha do Tempo
// (/dashboard/timeline) e Evolução (/dashboard/saude). Esta rota legada é mantida
// como atalho estável e leva à visão padrão (Linha do Tempo).
import { redirect } from 'next/navigation'

export default function HistoricoRedirect() {
  redirect('/dashboard/timeline')
}
