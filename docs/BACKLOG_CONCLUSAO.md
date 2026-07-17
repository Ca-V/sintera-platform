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
- □ **EXA-C2 — Care flow stepper** Pedido→Agendamento→Realização→Resultado no detalhe do exame/pedido (consumir `careFlow`/`resolveCareStage` já modelado+testado). Fecha EXA-F005/NC-0011.
- □ **EXA-C3 — Exibir resultados clínicos não-laboratoriais** (CPE `clinical_results`, ex. parâmetros por olho do Pentacam) via `clinicalResultsToUcda`. Fecha NC-0009. *(Avaliar se toca arquitetura/E6 → se sim, SPAGS antes.)*
- ⏸ **EXA-D1 — Homologação** qualitativos/imagem/multi-exame → depende de **documentos reais**.
- ⏸ **EXA-D2 — Auditoria Funcional** das 13 jornadas → depende de **ambiente executável logado**.

## BACKLOG — EVENTOS
- □ **EVT-C1 — Eventos legados no Histórico/Relatório**: rotear as leituras pelo repositório canônico (dedup legado+canônico) — hoje `timeline`/`relatorio`/`r/[token]` consultam `health_events` direto e somem 9 eventos legados. Fecha NC-0013/0014.
- □ **EVT-C2 — Surfacar preparo/desfecho/modalidade** em Agenda/Histórico (hoje só na notificação). Fecha NC-0007.
- □ **EVT-C3 — Capturar "tipo de profissional"** (campo no AgendarModal → `professional_kind`, já exibido em 3 telas). Fecha NC-0012.
- □ **EVT-C4 — Marca visual de "retorno"** (respeitar o booleano `isReturn`, não só `event_type==='retorno'`). Fecha NC-0016.
- □ **EVT-C5 — Exibir/ordenar por prioridade** na Agenda/Histórico (campo `priority` capturado, nunca exibido). Fecha NC-0017.
- □ **EVT-C6 — EventLink write-side**: popular "Relacionado" ao criar evento a partir de exame/pedido (read-side já existe). Fecha NC-0006 + parte da NC-0018.
- ⏸ **EVT-D1 — Cron de lembretes** → depende de **segredo/URL de produção** (Vault). NC-0015.

## Regra do ciclo (loop)
Cada ciclo: pega o **próximo `□`** (topo→baixo, Exames antes de Eventos por prioridade), implementa até `Done`
(código + teste onde a lógica for extraível + TSC + suíte verde + Compliance Gate + commit), marca `☑` aqui.
Item que se revelar dependente de arquitetura/estratégia/compliance → **trazer à fundadora** (não implementar às cegas).
Ao esvaziar os `□`, encerrar o ciclo → **auditoria de aderência ao SPAGS** + relatório dos 4 pontos.
