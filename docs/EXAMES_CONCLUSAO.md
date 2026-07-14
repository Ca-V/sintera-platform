# Módulo Exames — plano de CONCLUSÃO integral (prioridade atual)

> Fundadora (14/07/2026): concluir **integralmente** o módulo Exames antes de qualquer nova modalidade/módulo.
> **Uma capacidade completa por vez** — ponta a ponta, validada e encerrada antes da próxima; sem frentes
> paralelas. **Reutilizar o que já existe** (localizar → estender → só criar se necessário). Cada entrega
> declara: **item do backlog · dependências · critério objetivo de encerramento**.

## Sub-capacidades (ordem de execução)

| # | Capacidade | Backlog | Dependências | Critério de encerramento | Estado |
|---|---|---|---|---|---|
| E1 | **Identificação padronizada** (tipo · lab/clínica · **solicitante**) | A1 / §2.1 | captura do solicitante | card mostra os 3 campos; solicitante capturado (best-effort) e write-once | ✅ **feito** |
| E2 | **Nomenclatura única** (identidade documental fiel, consistente) | A2 / §2.2 | Identidade Documental (existe) | nomes consistentes entre exames equivalentes; sem variação | ✅ **feito** (nome determinístico no domínio + fiado em todo caminho do analyze; consistência travada por `FUNC-nomenclature-consistency` — invariância a ordem/valores/idempotência) |
| E3 | **Política definitiva de estruturação** (completa \| documento; **nunca parcial**) | A3 / §2.3 | `extraction_completeness` (existe) | UI só mostra 2 estados; `partial` não aparece como estado | ✅ **feito** (selo binário; `partial`→"Resultados estruturados" sem esconder dado; badge "parcial" removido) |
| E4 | **Quantitativos × Qualitativos** | B1 / §2.4 | representação (existe) | quantitativo→estrutura/evolução/gráficos; qualitativo→documento/laudo, sem virar dado | ✅ **já certificado** (3 camadas: `toResultType` classifica · UCDA `biomarkerToUcdaItem` numérico→measure+valueNum / qualitativo→parameter+valueNum null, teste `FUNC-laboratory-adapter` · gráfico exclui não-numérico, teste `grouping` · UI mostra qualitativo via value_text) |
| E5 | **Categorias de exame** (incl. **ômicas como categorias**) | A4 / §2.6 | classificação aberta (Modelo Aberto) | categorias abertas/escaláveis; ômicas = categoria (sem fluxo próprio) | ✅ **núcleo feito** (decisão fundadora: categoria + capacidade preservada) — taxonomia ABERTA `exam-categories` (ômicas = 1 categoria, fallback nunca quebra; teste ARCH), chip de categoria no card, copy reenquadrada (sem "fluxo próprio"). **Remoção física do fork `/dashboard/omics` fica com E6** (fluxo único), para não quebrar a entrada de ômicas |
| E6 | **Fluxo único de upload** (PDF/foto/scan/imagem única/múltiplas/multipágina) | C1 / §2.5 | Bundle→CDU (existe) · `useDocumentBundle` | um só ponto de entrada; sem dropzone duplicada; usa Bundle→CDU | ✅ **feito** — parte 1: exames adota `useDocumentBundle`+`DocumentBundleStaging` (reordenar/Galeria; sem staging duplicado). Parte 2 (decisão fundadora: entrada única + continuação especializada): ômica vira ramo de continuação do menu "Novo exame"; fork co-equal `/dashboard/omics` removido; link enxuto de categoria mantido; capacidade de ômicas intacta |
| E7 | **Informações financeiras** (valor pago · NF/recibo) | C2 / §2.7 | **`health_events`** (`amount_cents`, `attachment_url`) — REUTILIZAR | exame vincula valor pago + NF/recibo; alimenta Despesas | ✅ **feito** (reúso do Evento Assistencial: `AgendarModal`→`saveEvent`→health_events já tem valor + "NF/comprovante"; detalhe do exame ganha botão **"Registrar custo / NF"** em modo despesa — `realizado`+`directExpense`, data do exame → Gastos) |
| E8 | **Agendamento/reagendamento/recorrência** | C3 / §2.8 | **`health_events`** (`recurrence_rule`, `series_id`, lineage) — REUTILIZAR | agendar/reagendar/recorrência do exame via Eventos Assistenciais | ✅ **feito** (reúso: `AgendarModal` no detalhe — "Criar lembrete" com `recurrence_rule`/frequência+até; reagendar = editar o evento na Agenda) |

## Reúso confirmado (não construir duplicata)
- **E7/E8** reutilizam `health_events` (já tem `amount_cents`, `attachment_url`, `recurrence_rule`,
  `series_id`, `parent_event_id`, `root_event_id`, `reminder_enabled`). O trabalho é **wiring de UI** + lacunas
  pequenas (ex.: NF/recibo hoje é `attachment_url` único). **Pendência de arquitetura registrada:** relação
  `health_events` × `agenda_events` (duas tabelas de evento) — decidir convergência antes de ampliar o wiring
  de eventos (Convergência Progressiva).
- **E3** já é regra (`regra_estruturacao_binaria`); a lacuna é só o **mapeamento de UI** (2 estados).

## Definição de "módulo Exames concluído"
E1–E8 fechados (cada um com seu critério), sem regressão (tsc + suíte verdes), padrão de módulo do AUD-002
aplicado. Só então avança-se para a próxima capacidade transversal.

## Estado (14/07/2026) — E1–E8 ✅ concluídos
Todas as oito sub-capacidades fechadas por implementação ou reúso certificado, sem regressão (tsc + eslint
limpos; suíte 192 verdes). Decisões da fundadora tomadas no caminho: E5 (ômicas = categoria, capacidade
preservada) e E6 (entrada única + continuação especializada).

**Pendências de arquitetura registradas (NÃO bloqueiam o módulo; limpeza separada):**
- `health_events` × `agenda_events` (duas tabelas de evento) — convergência a decidir antes de AMPLIAR o
  wiring de eventos (Convergência Progressiva). E7/E8 já funcionam sobre a infra atual.
- Vínculo duro exame ↔ evento (hoje o evento referencia o exame por título/nota) — avaliar `exam_id` se/quando
  a convergência for resolvida.

**Próximo:** homologação do módulo (tripé técnica/estrutural/visual) e, aprovado, seguir para a próxima
capacidade transversal do backlog (Eventos · Notificações · Billing).
