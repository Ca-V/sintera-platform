# Domínio Exames — modelo de leitura (regra de data efetiva + row→domínio)

**Status:** fundação consolidada. Proprietário: domínio **Exames** (`src/lib/exams/`).

## Proprietário e conceito
A auditoria (propriedade primeiro) encontrou o domínio Exames com dono de *apresentação*
(`lib/exams/presentation.ts`) e de *nome* (`lib/exams/nameMatch.ts`), mas **sem dono de
leitura/modelo** — ao contrário da Agenda, que tem `rowToHealthEvent` + regras puras
(`lib/agenda/event.ts`). Consequência: a **regra de domínio "data efetiva do exame"**
(`exam_date ?? created_at`) estava reimplementada inline em ~9 pontos (páginas, adapters,
biomarcadores), e um domínio vizinho lia a tabela alheia re-derivando a regra sozinho.

## Conceito superior (regra 3)
"Cada domínio possui seu modelo de leitura (row→domínio) e suas regras" — instância
Exames, espelhando o gabarito já encerrado da Agenda. Não há conceito mais alto que o
bloqueie.

## Fundação
`src/lib/exams/model.ts` (puro, testado):
- **`effectiveExamDate(row)`** — a REGRA de domínio: `exam_date ?? created_at`. Dono único.
- **`rowToExam(row): Exam`** — mapeador row→domínio (`{ id, type, status, date, fileUrl }`),
  com a data já resolvida pela regra.
- Tipos `ExamRow`/`Exam`.

## Propagação
`effectiveExamDate` passou a ser a fonte única em todos os pontos de derivação: páginas
`dashboard`, `exams` (lista + `[id]`), `agenda`, `timeline`; adapters `ui/adapters/report`
e o read-model `communication/reportDataset`; e `biomarkers/grouping`. Nenhum reimplementa
mais a regra.

## Critério de encerramento (por CONCEITO)
Reauditoria: **nenhuma** reimplementação inline da regra de data efetiva permanece fora de
`effectiveExamDate`. A regra tem dono único.

## Escopo deliberado (estabilidade, não perfeição)
- **Projeções de coluna por superfície** (`ExamSummary` no dashboard com contagens de
  status; `Row` completo na página de exames; `ReportExam` no relatório) **não** foram
  unificadas: são projeções legítimas por necessidade, não duplicação comprovada de uma
  forma única. `rowToExam` fica disponível como forma canônica para quem couber
  (labs/FHIR futuros, novos consumidores), sem forçar migração das projeções atuais.
- **Leitura client-direct da tabela `exams`** (cada superfície com seu `select`) permanece:
  não há um `select` byte-idêntico duplicado (ao contrário dos eventos) — são projeções
  distintas. Um `ExamQueryService` só se justifica se uma auditoria futura comprovar
  leitura idêntica repetida.

## Preparação para as próximas fases
Uma nova origem de laudo (laboratórios, FHIR, Health Connect) entra por `rowToExam`/
`effectiveExamDate` e todas as superfícies herdam a mesma regra — sem re-derivar a data
efetiva em cada página.
