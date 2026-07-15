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
| EVT-F006 | Vínculos evento ↔ entidades (`EventLink`) | Implementado | ✅ | ✅ | ⬜ | `event.ts`/`related.ts` (modelo+leitura+UI "Relacionado") | Lacuna: **write-side NÃO fiado** (`links` sempre `[]`) → "Relacionado" vazio na prática. Registrada em **NC-0006** (justificada: população = vínculo duro, adiado); o estado funcional não muda por isso |
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
| NC-0006 | 15/07 | Claude | Auditoria estática | Eventos | EVT-F006 | Funcional | baixa | 🟡 justificada (adiada) | `EventLink` tem modelo+leitura+UI "Relacionado", mas nenhum fluxo GRAVA links (`health_events.links` sempre `[]`) → "Relacionado" vazio. População = vínculo duro (adiado por decisão da fundadora; não bloqueia) |
| NC-0007 | 15/07 | Claude | Auditoria estática | Eventos | EVT-F001/002 | UX | média | 🟠 aberta (decisão de UX) | `preparation` (preparo), `outcome` (desfecho), `modality` são capturados/editáveis no modal mas **nunca exibidos nas telas** Agenda/Histórico (aparecem só na notificação e-mail/WhatsApp via `buildEventNotification`). Ex.: desfecho registrado "após realizar" não aparece no Histórico. **Correção altera UX** → decisão de produto |
| NC-0012 | 15/07 | Claude | Auditoria estática | Eventos | EVT-F001 | Funcional | média | 🟠 aberta (produto) | `professional_kind` é **lido e renderizado** em 3 telas (`timeline:167,289` · `relatorio:219,235` · `r/[token]:87,243` via `PROF_LABEL`), mas **nenhum caminho de escrita** o preenche. **Investigado:** render degrada graciosamente com `null` (timeline:289 — sem grafismo quebrado), logo não há bug de robustez; popular exige **campo de captura "tipo de profissional"** = decisão de produto. Sem fonte de inferência confiável |
| NC-0013 | 15/07 | Claude | Auditoria estática | Eventos | EVT-F008 | Dados | média | 🟠 aberta (validação exec.) | Eventos legados que vivem só em `agenda_events` aparecem na **Agenda** (repositório com dedup) mas **nunca** no Histórico/Relatório/relatório compartilhado, que consultam `health_events` **direto** (`timeline:135` · `relatorio:219` · `r/[token]:87`). **Confirmado no banco (read-only): 9 de 11 eventos legados são órfãos** (sem espelho canônico) → reprodutível, não hipotético. Correção = rotear pelo repositório; muda o que o usuário vê e toca o caminho **público** `r/[token]` → exige validação em ambiente executável |
| NC-0014 | 15/07 | Claude | Auditoria estática | Eventos | EVT-F008 | Arquitetural | média | 🟠 aberta | Leitura de `health_events` **reimplementada inline** em 3 telas (`timeline:135-183` · `relatorio` · `r/[token]`), contornando o repositório e a ordenação canônica `sortByWhen` (que `event.ts:198-209` declara congelada). Causa-raiz da NC-0013; fonte de divergência futura |
| NC-0015 | 15/07 | Claude | Auditoria estática | Eventos | EVT-F004 | Funcional | média | 🟠 aberta (integração externa) | Worker de lembretes (`api/agenda/reminders`) completo, mas o **cron não está versionado** (só passo manual). **Investigado:** a rota exige `x-admin-secret === ADMIN_SECRET` (`route.ts:35`) e POST à URL de produção (`www.sinteramais.com.br`); versionar em migração **commitaria o segredo no git** (anti-padrão de segurança — por isso o setup é manual) e **ativa notificações reais** (efeito externo → exige autorização). Dependência externa confirmada. Alternativa futura: referenciar o segredo via Supabase Vault |
| NC-0016 | 15/07 | Claude | Auditoria estática | Eventos | EVT-F001 | UX | média | 🟠 aberta | `is_return` ("é um retorno") é capturado/persistido (`AgendarModal:301` · `event.ts:241`) mas **sem exibição distintiva**: o timeline marca "retorno" por `event_type==='retorno'` (legado), não pelo booleano → um evento novo salvo como `consulta` com `isReturn=true` **perde qualquer marca visual de retorno** |
| NC-0017 | 15/07 | Claude | Auditoria estática | Eventos | EVT-F001 | UX | baixa | 🟠 aberta | `priority` é capturada/persistida (`AgendarModal:407` · `event.ts:243`) mas **nenhuma lista** exibe ou ordena por ela (família NC-0007) |
| NC-0018 | 15/07 | Claude | Auditoria estática | Eventos | EVT-F006 | Funcional | baixa | 🟡 justificada (adiada) | Trilha de leitura de vínculos/cadeia **latente** (relacionada à NC-0006): `listByExam/Biomarker/Protocol` (service+repo) sem consumidor de UI; `parent_event_id`/`root_event_id` + `EventLinkRelationship` modelados, nunca escritos nem lidos; `generateOccurrences`/`count` de recorrência só-modelo (roll-forward funciona 1 a 1); subcampos de `Outcome` (diagnosis/conduct/…) modelados, só `summary` capturado. Adiado (vínculo duro) |
| NC-0019 | 15/07 | Claude | Auditoria estática | Eventos | EVT-F003 | Dados | baixa | ✅ encerrada | commit `fa84fe5` · `'recurrence'` adicionado ao union `EventSource` (`event.ts`); `source` é `string`, `isDerived` já correto → fix aditivo sem mudança de comportamento |

## Situação do domínio (passo a passo do LIFECYCLE)
- **1. Implementação:** ✅ (domínio central maduro; não adicionar features — escopo do ciclo).
- **2. Auditoria estática (código):** ✅ concluída + **aprofundada** — domínio bem testado (event/service/
  repository/presentation/notification `.test` **executados** após NC-0004; verdes) + varredura de latências.
  **0 NC crítica/alta**; registradas NC-0012 a NC-0019 (média/baixa): professional_kind sem escrita ·
  eventos legados invisíveis no Histórico (leitura fora do repositório) · cron de lembretes não versionado ·
  is_return/priority não exibidos · vínculos/cadeia latentes · `source:'recurrence'` fora do union. Nenhuma bloqueia.
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
