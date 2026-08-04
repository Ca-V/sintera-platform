# PARIDADE — Detalhe do Exame (Web × Mobile)

Auditoria sistemática do detalhe do exame, conforme diretriz de **paridade total** (04/08).
Referência funcional = Web (`src/app/dashboard/exams/[id]/page.tsx`). Mobile = `apps/mobile/.../exams/ExamDetailScreen.tsx`.

Legenda: ✅ paridade · 🟡 parcial · ❌ ausente no Mobile · (L) diferença aceitável de layout.

## Inventário

| # | Recurso (Web) | Mobile | Classe | Observação |
|---|---|---|---|---|
| 1 | Voltar para Exames | ✅ (L) | layout | back nativo do stack |
| 2 | Conferência de identidade (nome do laudo × perfil; alerta "parece ser de outra pessoa") | ❌ | funcional/segurança | `compareNames`; reutilizável |
| 3 | Fluxo assistencial (Pedido→Agendamento→Realização→Resultado) — CareFlowStepper | ❌ | funcional | `careStageFor` (domínio) |
| 4 | Pedido de origem — vincular/desvincular (Q1) | ❌ | funcional | `fulfills_order_id` |
| 5 | Financeiro e acompanhamento (FB-008: valor pago + doc fiscal + editar; lembrete de repetição) | ❌ | funcional (negócio) | atributos `expense_*` no exame |
| 6 | Nome do exame + **renomear** | 🟡 | funcional | exibe `display_title`; falta editar (`type`) |
| 7 | Emissor (laboratório) + Solicitante | ✅ | — | recém-validado |
| 8 | Data **editável** | 🟡 | funcional | exibe; falta editar (`exam_date`) |
| 9 | Nº de páginas | ❌ | info | `page_count` |
| 10 | Resumo de contagens (total · acima · abaixo · dentro) | ❌ | funcional | derivado dos biomarcadores |
| 11 | Última extração (data · reparado · leitura nativa) | ❌ | info | `ai_processing_log` |
| 12 | Reportar problema (modal → POST /api/events) | ❌ | funcional | contrato `/api/events` |
| 13 | Baixar/abrir PDF original | ✅ | — | |
| 14 | Exportar (CSV · Imprimir/PDF) | ❌ | funcional | avaliar equivalente mobile (compartilhar) |
| 15 | Extrair novamente + estado "Extraindo…" + banner de erro + aviso "certificado" | 🟡 | funcional | botão existe; faltam feedback/erro/aviso |
| 16 | Banner "Documento parcialmente processado" (`text_truncated`) | ❌ | funcional/aviso | |
| 17 | Índice Experimental (proporção dentro da referência) | ❌ | funcional | `calcExperimentalIndex` |
| 18 | **Resultados estruturados (tabela de biomarcadores)** — material→exame, status, referência, link à Evolução | ❌ | **funcional CORE** | **maior lacuna**: Mobile não exibe nenhum resultado |
| 19 | Rodapé (contagem · fonte · nota regulatória de referência) | ❌ | funcional/regulatório | copy obrigatória |
| 20 | Estado "Analisando seu exame…" (processing) | 🟡 | funcional | Mobile faz polling; falta card dedicado |
| 21 | Estado `document_only` ("Documento disponível para consulta") | ❌ | funcional | `extraction_completeness` |
| 22 | Estado "Nenhum resultado estruturado" + `error_reason` | 🟡 | funcional | rótulo genérico só |
| 23 | Resultados clínicos não-laboratoriais (UCDA/CPE — Pentacam etc.) — ClinicalResultsCard | ❌ | funcional | `clinical_results`→UCDA |
| 24 | Excluir exame + confirmação + explicação | ✅ | — | via Alert |

## Diagnóstico

O detalhe do exame no Mobile hoje é **somente metadados** (nome, data, emissor, solicitante, situação, abrir/excluir).
Falta o essencial do domínio: **os resultados** (biomarcadores #18 + clínicos #23), o financeiro (#5), o fluxo
assistencial (#3/#4), edição de nome/data (#6/#8), reportar (#12), índice (#17) e diversos estados/avisos.

## Plano de eliminação (ordem por valor, reutilizando contrato compartilhado)

Cada item = incremento verificável (typecheck+suíte+commit); nenhum reimplementa regra que já existe na Web.

1. **Resultados estruturados (#18)** — buscar biomarcadores (`current_biomarkers`) via api-client + renderizar lista/tabela DS (material→exame, status, referência, rodapé regulatório #19). CORE.
2. **Resumo de contagens (#10)** + **estados** de resultado/processing/document_only/nenhum (#20/#21/#22).
3. **Resultados clínicos UCDA (#23)** — reutiliza `clinicalResultsToUcda`.
4. **Editar nome (#6) e data (#8)** — writes `type`/`exam_date` (novos métodos no contrato exams).
5. **Extrair novamente completo (#15)** — feedback "Extraindo…", banner de erro, aviso "certificado".
6. **Financeiro do exame (#5, FB-008)** — valor + tipo fiscal + anexo (atributos `expense_*`). *Decisão de negócio: confirmar escopo mobile do upload fiscal.*
7. **Reportar problema (#12)** — modal + `/api/events`.
8. **Fluxo assistencial (#3) + Pedido de origem (#4)** — CareFlowStepper + vínculo Q1.
9. **Índice Experimental (#17)** + **avisos** (#16 truncated, #11 última extração, #9 páginas).
10. **Exportar (#14)** — avaliar "compartilhar" nativo em vez de imprimir.

## Decisões de negócio (fundadora, 04/08)

- **#5 Financeiro** → **paridade total AGORA, com upload do anexo fiscal** (NF/recibo via câmera/arquivo no celular). Reproduzir a seção inteira da Web (valor pago + tipo de documento fiscal `EXPENSE_DOC_TYPES` + anexo + recorrência/lembrete). Atributos `expense_*` no próprio exame (FB-008).
- **#14 Exportar** → **compartilhar nativo** (share sheet do device com CSV/arquivo), em vez de imprimir/PDF. Mais natural no mobile.

Demais itens = reprodução direta com contratos compartilhados → execução autônoma.

## STATUS FINAL (04/08) — detalhe do exame em paridade

Implementado no Mobile, reutilizando contratos/lógica do @sintera/core + api-client (fonte única com a Web):
resultados estruturados (biomarcadores agrupados, situação/referência, índice experimental, rodapé regulatório),
resultados clínicos (UCDA), estados (processando/document_only/vazio/erro), contagens, editar nome/data,
extrair novamente com feedback (extraindo/erro/aviso "certificado"), aviso de truncado, conferência de
identidade (compareNames — aviso de exame de outra pessoa), financeiro completo (valor+tipo fiscal+upload+ver),
pedido de origem (vincular/desvincular), reportar problema (usage_events), compartilhar nativo, abrir documento,
excluir, fluxo assistencial (stepper). typecheck raiz+mobile+pacotes verde; suíte verde; build Web verde.

### Dependência arquitetural CONFIRMADA por código (04/08)
Evidência: `src/components/eventForm.ts:82` `saveEvent` → `services.command.create` → `src/lib/agenda/repository.ts:65`
`upsert('health_events')` + `event_links`. O "Lembrete de repetição" é um **Evento Assistencial** (health_events,
entidade central ADR-001), NÃO um atributo do exame — modelá-lo em Exames violaria FB-008 (recorrência = 1 evento).
A Web reutiliza o DOMÍNIO Agenda (services/repository), não só um componente; o Mobile não tem contrato de
health_events. → Acoplamento de arquitetura, não de implementação. Decisão: homologar Exames agora; Agenda = próximo domínio.

### Dependência cross-domain remanescente (para decisão de sequência)
- **Criar lembrete de repetição** (recorrência) e **progressão do fluxo assistencial por eventos vinculados**
  (agendado/realizado) dependem do domínio **Agenda / health_events**, que ainda NÃO tem superfície no Mobile
  (api-client + UI equivalente ao AgendarModal). Isso é um DOMÍNIO próprio, não uma lacuna do detalhe do exame.
  O stepper já exibe as etapas com os fatos disponíveis (pedido/resultado); a progressão via eventos entra quando
  a Agenda chegar ao Mobile.
- Menor: "última extração" (ai_processing_log) — informação secundária, não implementada.
