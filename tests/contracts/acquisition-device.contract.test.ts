// ============================================================
// CONTRATO DE FLUXO — Aquisição de dispositivo (Etapa 1 · Quadro 2.2)
// ============================================================
// Natureza: PREPARAÇÃO (Frente B). `it.todo` — não executa, não quebra o gate.
// Ativação: Estado 2 → implementar → remover `.todo` → verde → fluxo homologado.
//
// ORIGEM: descoberto nos testes (lente de contato cadastrada ficou SÓ no catálogo).
// CENÁRIO: a usuária registra a COMPRA de um dispositivo (lente, óculos, CPAP…).
// ENTRADA: item do catálogo (`medications`, kind=dispositivo) + data + valor.
// COMPORTAMENTO ESPERADO: EVENTO de Compra em `health_events` + `EventLink{type:'device', id}`.
//   (Requer ESTENDER `EventLinkKind` com 'device'.)
// PROJEÇÕES ESPERADAS:
//   • Catálogo — item permanece. • Histórico — compra concluída. • Gastos — valor lançado.
//   • Agenda — só quando houver troca/manutenção programada (não obrigatório).
// CRITÉRIO DE ACEITE: Catálogo + Evento + Histórico + Gastos.

import { describe, it } from 'vitest'

describe('Contrato — Aquisição de dispositivo (Compra → Catálogo+Evento+Histórico+Gastos)', () => {
  it.todo('cria health_event de Compra vinculado ao dispositivo (EventLink type=device)')
  it.todo('projeta a compra no Histórico')
  it.todo('lança o valor em Gastos')
  it.todo('NÃO força entrada na Agenda quando não há troca programada')
  it.todo('cadastro SEM compra continua só no Catálogo (não gera evento)')
})

// DEPENDÊNCIAS DE IMPLEMENTAÇÃO:
// [ ] EventLinkKind ESTENDIDO com 'device' (e 'product')
// [ ] Óculos/lentes migrados de "Problemas de Saúde" para Catálogo/Dispositivos (REV-09)
// [ ] command.create suporta Ação=Compra com amount_cents
// [ ] Projeções Histórico e Gastos cobrem dispositivo
