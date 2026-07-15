# Eventos Assistenciais — ESTADO do Domínio (Controle 1: Backlog Funcional)

> **Processo:** `docs/LIFECYCLE_DOMINIOS.md` (ciclo de 8 passos, 2 gates, NCs, homologação/certificação).
> Este documento contém apenas o **ESTADO** do domínio Eventos Assistenciais (prefixo de ID **`EVT`**).
> É a **entidade CENTRAL** do domínio clínico-administrativo: o MESMO mecanismo (`health_events` + serviço
> de domínio + `AgendarModal`/`eventForm`) atende exames · consultas · procedimentos · vacinas · medicamentos ·
> suplementos · avaliações. Nenhum módulo replica lógica de evento.
>
> Estado global: **em desenvolvimento** (auditoria estática em curso; nenhum item `Homologado`).

## Backlog / plano de execução (3 eixos: Código × Testes × Homologação)

| ID | Funcionalidade | Estado | Cód | Test | Homol | Evidências | Observações |
|---|---|---|:--:|:--:|:--:|---|---|
| EVT-F001 | Criar/editar evento (todos os tipos, mesmo mecanismo) | Implementado | ✅ | ✅ | ⬜ | `service.ts` · `service.test` · `AgendarModal`/`eventForm` | consulta/exame/procedimento/vacina/plano/outro |
| EVT-F002 | Estados do evento (planejado/realizado/cancelado/perdido) | Implementado | ✅ | ✅ | ⬜ | `event.ts` (`isConcluded/isClosed/isUpcoming`) · `event.test` | transições via serviço |
| EVT-F003 | Recorrência | Implementado | ✅ | ✅ | ⬜ | `lib/recurrence` · `FUNC-recurrence` | freq/interval/until/count |
| EVT-F004 | Lembretes/notificações do evento | Implementado | ✅ | ✅ | ⬜ | `reminder_enabled` · NOTIF-001 · `notification.test` | por categoria (e-mail/WhatsApp) |
| EVT-F005 | Financeiro do evento (valor + NF → Despesas) | Implementado | ✅ | ✅ | ⬜ | `isFinancial/hasCost` · `agenda/money` · `FUNC-money` | directExpense/realizado → Gastos |
| EVT-F006 | Vínculos evento ↔ entidades (`EventLink`) | Implementado | ✅ | 🔄 | ⬜ | `event.ts` (`EventLink`: exam/biomarker/medication…; origin/follow_up/generated_from) | modelo pronto; cobertura de wiring a auditar |
| EVT-F007 | Anexo (comprovante/laudo/NF) | Implementado | ✅ | N/A | ⬜ | `attachmentUrl` (AgendarModal) | upload no modal |
| EVT-F008 | Agenda (previsto) × Histórico (realizado) | Implementado | ✅ | ✅ | ⬜ | `event.ts` (isUpcoming/isPast) · timeline/relatório | separação definitiva |
| EVT-F009 | Despesas (projeção financeira / Gastos) | Implementado | ✅ | ✅ | ⬜ | `service.query.listFinancial` · `gastos` | mesma fonte do módulo Gastos |
| EVT-F010 | Sugestões de evento | Implementado | ✅ | 🔄 | ⬜ | `suggestions.ts` | auditar cobertura |
| EVT-F011 | Coexistência `health_events` × `agenda_events` (dedup) | Implementado | ✅ | ✅ | ⬜ | `repository.ts` · `repository.test` | convergência = limpeza futura (não bloqueia) |

**Leitura honesta:** domínio maduro e bem testado (event/service/repository/presentation/notification `.test`).
`Testes` ✅ na maior parte; UI (AgendarModal/agenda) = N/A unitário. Nenhum item `Homologado` (não iniciada a
homologação). **Pendência de arquitetura registrada (não-bloqueante):** convergência das duas tabelas de evento.

## Registro de Não-Conformidades (NC) — sequência GLOBAL
Descobertas na auditoria estática de Eventos (afetam a plataforma):

| NC | Data | Resp. | Origem | Domínio | Func. | Tipo | Sev. | Estado | Evidência |
|---|---|---|---|---|---|---|---|---|---|
| NC-0004 | 15/07 | Claude | Auditoria estática | Plataforma/Testes | — | Funcional | alta | ✅ encerrada | `vitest.config.ts` (`include` passa a cobrir `src/**`); 26 arquivos órfãos voltaram a rodar (298→600 testes) |
| NC-0005 | 15/07 | Claude | Teste automatizado | biomarkers | EXA-F012 (adj.) | Funcional | baixa | ✅ encerrada | `catalogLabels.test` atualizado ao rótulo canônico ("Exame de sangue"/"Exame de urina (24 horas)") — comportamento intencional |

## Situação do domínio (passo a passo do LIFECYCLE)
- **1. Implementação:** ✅ (domínio central maduro; não adicionar features — escopo do ciclo).
- **2. Auditoria estática (código):** ✅ concluída — domínio bem testado (event/service/repository/
  presentation/notification `.test` **agora executados** após NC-0004; todos verdes) + jornadas tracejadas.
  Nenhuma NC crítica/alta (NC-0004/0005 de plataforma, encerradas).
- **3. Gate Arquitetural:** ✅ **PASSOU** — mecanismo único de evento (sem duplicação por módulo) · desacoplado
  (`health_events`+serviço) · reúso · não acopla modalidade · `ARCH-*` verdes. 0 NC.
- **4. Gate Regulatório:** ✅ **PASSOU** — organiza/agenda, não interpreta nem gera conteúdo clínico (RDC 657) ·
  rastreabilidade (`EventLink`) · auditabilidade (source/created) · LGPD (RLS). 0 NC.
- **5. Auditoria funcional (execução):** PENDENTE — ambiente executável (preview/staging), não exige produção.
- **6–8 (Homologação · Certificação · Encerramento):** não iniciados.

## Roteiro da Auditoria Funcional (execução no preview) — passo 5
Percorrer no preview; divergência = NC (Tipo+Severidade → EVT-F → corrigir → evidência).

| Jornada | Passos | Resultado esperado | Sinais de defeito |
|---|---|---|---|
| Criar evento | Agenda → Novo evento (cada tipo: consulta/exame/procedimento/vacina/plano/outro) | evento na Agenda com tipo/data/hora | tipo some · não salva |
| Concluir/reabrir | marcar como Realizado; depois Reabrir | vai ao Histórico (e Gastos se tiver valor); reabrir volta à Agenda | fica na Agenda · não recalcula |
| Recorrência | criar com frequência + até | próximas ocorrências previstas na Agenda | não gera série · datas erradas |
| Financeiro | evento com valor + NF, status Realizado | entra em Despesas/Gastos | não entra · valor errado |
| Lembrete | ativar lembrete + telefone/canal | respeita canal por categoria (NOTIF-001) | ignora preferência |
| Agenda × Histórico | ver Agenda (previstos) e Histórico (realizados) | separados; agendado ≠ realizado | mistura previsto/realizado |
| Vínculos | evento originado de exame/pedido (`EventLink`) | vínculo preservado (origem/follow_up) | vínculo perdido |
| Sugestões | conferir sugestões de evento | coerentes com o contexto | sugestão inválida |

### Registro de EXECUÇÃO da Auditoria Funcional (preencher conforme cada jornada roda no preview)
Resultado: ⬜ não executada · ✅ aprovada · ❌ reprovada (gerou NC).

| Jornada | Executor | Data | Resultado | NCs |
|---|---|---|:--:|---|
| Criar evento | — | — | ⬜ | — |
| Concluir/reabrir | — | — | ⬜ | — |
| Recorrência | — | — | ⬜ | — |
| Financeiro | — | — | ⬜ | — |
| Lembrete | — | — | ⬜ | — |
| Agenda × Histórico | — | — | ⬜ | — |
| Vínculos (`EventLink`) | — | — | ⬜ | — |
| Sugestões | — | — | ⬜ | — |

**Progresso da Auditoria Funcional: 0/8 jornadas executadas.** Domínio PREPARADO — sem engenharia pendente;
aguarda apenas a execução das jornadas no preview.
