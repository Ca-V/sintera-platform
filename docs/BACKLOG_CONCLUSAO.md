# BACKLOG DE CONCLUSÃO — Exames & Eventos (sprint de 1 semana)

> **Determinação da fundadora (16/07/2026):** prioridade ABSOLUTA = concluir Exames e Eventos com
> **qualidade de produção em até 1 semana**, disponibilidade integral. Trabalhar por **backlog de conclusão**
> (cada ciclo ataca o próximo item até `Done`), não por varredura de superfície. Autorização ampla: implementar
> autonomamente TUDO que não altere **arquitetura permanente / estratégia / compliance**. Adiar SÓ o que depende
> exclusivamente de **infra externa · certificação · jurídico · ambiente de produção**.
>
> **Antes do merge de cada item:** Compliance Gate (9 eixos, `COMPLIANCE-001`) + aderência ao **SPAGS**
> (documento mestre — quando disponível; interino: `ADR-000`). Mudança de arquitetura permanente → SPAGS/ADR
> primeiro, depois a implementação. Validação VISUAL de UI fica para a fundadora (implemento com teste + suíte verde).
>
> Estados: `□` a fazer · `▣` em andamento · `☑` Done (código + teste/TSC + suíte verde + commit) · `⏸` adiado (dep. externa).

## BACKLOG — EXAMES
- ☑ **EXA-C1 — Multi-exame: agrupar "partes do mesmo documento"** — núcleo puro `bundleGroup` (`bundlePartInfo`/`bundlePartLabel`/`groupBundleParts`, `FUNC-bundle-group` 5 casos) + UI: partes adjacentes por ano + indicador "Parte X de N de um documento · ver documento" no card. Fecha NC-0010 (validação visual + homologação com doc real pendentes). commit abaixo.
- ☑ **EXA-C2 — Care flow stepper** — mapeador puro `careStageFor` (contexto do registro → etapa, desacoplado de HealthEvent; +5 testes) + `CareFlowStepper` (componente apresentacional) fiado no detalhe: carrega status dos eventos vinculados via contrato público da Jornada (`eventServicesFor().query.listByExam`), resolve a etapa no domínio e exibe o stepper (agendado ≠ realizado ≠ resultado). Fecha EXA-F005/NC-0011. commit abaixo.
- ☑ **EXA-C3 — Exibir resultados clínicos não-laboratoriais** — read-side GENÉRICO via UCDA: `groupUcdaForDisplay` (puro, agrupa por group›region›anatomy, sem lógica por modalidade; +2 testes) + `ClinicalResultsCard` + detalhe carrega `clinical_results`→`clinicalResultsToUcda` e exibe "Resultados estruturados"; fallback "Documento disponível" suprimido quando há resultado clínico. **Não é o fork E6** (presentação rica por modalidade segue futura) — additive sobre contrato canônico existente, respeita Convergência Progressiva e a regra binária; não toca arquitetura permanente. Fecha NC-0009 (homologação com Pentacam real = EXA-D1). commit abaixo.
- ⏸ **EXA-D1 — Homologação** qualitativos/imagem/multi-exame → depende de **documentos reais**.
- ⏸ **EXA-D2 — Auditoria Funcional** das 13 jornadas → depende de **ambiente executável logado**.

## BACKLOG — EVENTOS
- ☑ **EVT-C1 — Eventos legados no Histórico/Relatório**: novo `EventQueryService.listAll` (expõe `repo.listAllEvents` = união legado+canônico com dedup, sem recorte temporal; +1 teste de delegação); `timeline`, `relatorio` e `r/[token]` deixam de consultar `health_events` direto e passam a ler pelo contrato canônico (o compartilhamento usa o mesmo caminho via client admin). Eventos legados voltam a aparecer nas 3 superfícies. Fecha NC-0013/0014. commit abaixo.
- ☑ **EVT-C2 — Surfacar preparo/desfecho/modalidade** — helpers puros `modalityLabel`/`outcomeSummary`/`hasOutcome` (presentation.ts, +3 testes) fiados na **Agenda** (chip de modalidade + linha "📋 Preparo" p/ planejado + "📝 Desfecho" p/ realizado) e no **Histórico** (mesmos sinais no card da Jornada). Projeção do MESMO domínio — nada inventado. Fecha NC-0007. commit abaixo.
- ☑ **EVT-C3 — Capturar "tipo de profissional"** — select "Tipo" no AgendarModal (ao lado de Profissional) → `professionalKind` no input → `saveEvent` → `professional_kind`. Fonte ÚNICA `PROFESSIONAL_KIND_DEFS`/`professionalKindLabel` em presentation.ts (+2 testes); as 3 telas de exibição (timeline/relatorio/r[token]) deixam de duplicar o mapa `PROF_LABEL` e consomem o helper. Fecha NC-0012 (e reduz duplicação da família NC-0014). commit abaixo.
- ☑ **EVT-C4 — Marca visual de "retorno"** — predicado de domínio `isReturnVisit(ev)` (respeita o booleano `isReturn` E o tipo legado `retorno`; +1 teste event.test) + chip "📋 Retorno" na Agenda e no Histórico. Fecha NC-0016. commit abaixo.
- ☑ **EVT-C5 — Exibir/ordenar por prioridade** — helpers puros `priorityBadge`/`priorityRank`/`byPriority` (presentation.ts, +3 testes); chip "🔴/🟡/🟢 prioridade" na Agenda e no Histórico; ordenação por prioridade na visão "por tipo" da Agenda (desempate por data), mantendo a cronologia na visão "por data". Fecha NC-0017. commit abaixo.
- □ **EVT-C6 — EventLink write-side**: popular "Relacionado" ao criar evento a partir de exame/pedido (read-side já existe). Fecha NC-0006 + parte da NC-0018.
- ⏸ **EVT-D1 — Cron de lembretes** → depende de **segredo/URL de produção** (Vault). NC-0015.

## Regra do ciclo (loop)
Cada ciclo: pega o **próximo `□`** (topo→baixo, Exames antes de Eventos por prioridade), implementa até `Done`
(código + teste onde a lógica for extraível + TSC + suíte verde + Compliance Gate + commit), marca `☑` aqui.
Item que se revelar dependente de arquitetura/estratégia/compliance → **trazer à fundadora** (não implementar às cegas).
Ao esvaziar os `□`, encerrar o ciclo → **auditoria de aderência ao SPAGS** + relatório dos 4 pontos.
