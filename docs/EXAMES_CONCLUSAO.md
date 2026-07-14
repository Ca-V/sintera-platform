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

## Definição de "módulo Exames CONCLUÍDO" — 4 dimensões (fundadora 14/07)
Uma capacidade só é CONCLUÍDA quando atende SIMULTANEAMENTE: **(1) Infraestrutura** (arquitetura+testes+
auditorias+Certificação) · **(2) Funcionalidade** (todos os requisitos funcionais registrados) · **(3)
Experiência de uso** (fluxo/nomenclatura/organização/usabilidade; sem contradições) · **(4) Integrações
transversais** (notificações, financeiro, recorrência, compartilhamento, histórico, evolução, reúso).
Não declarar concluído só porque a infra técnica existe.

## Estado (14/07/2026) — E1–E8 = Infra + Funcionalidade (em grande parte). Módulo NÃO concluído.
As oito sub-capacidades técnicas foram fechadas (implementação ou reúso certificado), sem regressão (tsc +
eslint limpos; suíte 192 verdes). Decisões da fundadora: E5 (ômicas = categoria, capacidade preservada) e
E6 (entrada única + continuação especializada). **Mas pela definição de 4 dimensões o módulo Exames ainda
NÃO está concluído** — faltam itens de Funcionalidade/Experiência/Integrações abaixo.

### Backlog de conclusão do módulo Exames (registrado — fundadora 14/07)
| Item | Dimensão | Estado |
|---|---|---|
| Médico solicitante na identificação | 2 Func | ✅ E1 |
| Nomenclatura padronizada | 2 Func | ✅ E2 |
| Política binária de estruturação | 2/3 | ✅ E3 |
| Categorias de exame | 2 Func | ✅ E5 |
| Valor pago | 2/4 | ✅ E7 |
| Nota fiscal ou recibo | 2/4 | ✅ E7 |
| Agendamento | 4 Integr | ✅ E8 |
| Recorrência | 4 Integr | ✅ E8 |
| **Confirmação automática de exame duplicado** | 2/3 | ✅ **feito** (`src/lib/exams/duplicates.ts` + teste `FUNC-exam-duplicates`: fingerprint OU paciente+data+emissor+título; marca só o mais novo). UI: chip "Possível duplicado" + aviso acionável no card — **Ver original** (comparar, não-destrutivo), excluir (controle existente) ou manter os dois (ignorar). Nunca duplica em silêncio |
| **Upload de imagens além do PDF** | 2/3 | ✅ (fluxo único E6: imagens únicas/múltiplas montam bundle→1 PDF→1 registro, com reordenar/Galeria) |
| **Notificações (e-mail/WhatsApp) por evento** | 4 Integr | ⬜ depende de **NOTIF-001** (infra única) |
| **Compartilhamento futuro pelo Care Space** | 4 Integr | ⬜ depende de CARE-001 (fase 4) |
| Melhorias visuais | 3 UX | ⬜ (homologação visual) |

### Pendências de arquitetura (NÃO bloqueiam; limpeza separada)
- `health_events` × `agenda_events` (duas tabelas de evento) — convergir antes de AMPLIAR o wiring de eventos.
- Vínculo duro exame ↔ evento (hoje por título/nota) — avaliar `exam_id` se a convergência for resolvida.

**Próximo:** a dimensão 4 (Integrações) de Exames depende de **NOTIF-001** (Central de Notificações única) —
que é também dependência transversal de todos os módulos com item agendado. Execução autônoma segue para
NOTIF-001; Exames só será declarado CONCLUÍDO quando as 4 dimensões fecharem (dedup + imagens + notificações
+ UX; compartilhamento fica com CARE-001).
