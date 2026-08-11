# Domínio Exames — dono da apresentação de status

**Status:** fundação consolidada. Proprietário: domínio **Exames** (`src/lib/exams/`).

## Proprietário e conceito
A auditoria perguntou **"quem é o dono deste conceito?"** e encontrou **dono ausente**:
`src/lib/exams/` só tinha `nameMatch.ts` — sem módulo de apresentação/read-model —,
enquanto o vocabulário de status de processamento do exame (`processed/pending/
processing/error` → rótulo + cores + ícone) estava **duplicado verbatim** em
`src/app/dashboard/page.tsx` e `src/app/dashboard/exams/page.tsx`, com **drift** no ícone
de `processing` (`Clock` vs `Loader2`).

O gabarito de dono já existia: `src/lib/agenda/presentation.ts` (apresentação do domínio
Agenda). Replicou-se o padrão para Exames.

## Conceito superior (regra 3)
Acima de "STATUS_CONFIG" está o **vocabulário de apresentação do domínio** — cada domínio
possui o seu. O status de processamento do exame é **distinto** do `STATUS_BADGE` de item
(`lib/ui/item.ts`: active/suspended/pending/archived) e do status de evento (Agenda): não é
"STATUS_BADGE ignorado", é **dono inexistente** para Exames.

## Fundação (duas responsabilidades, dois donos)
- **`src/lib/exams/presentation.ts`** (React-free, como `agenda/presentation.ts`): dono do
  vocabulário — `ExamStatus`, `EXAM_STATUS_META` (rótulo + tokens de cor + **chave** de
  ícone), `examStatusMeta()`. O ícone é uma CHAVE semântica (`check/clock/spinner/alert`)
  para manter `lib/` sem React.
- **`src/components/ui/ExamStatusChip.tsx`**: renderização única do chip — resolve a chave
  de ícone → componente lucide e emite o markup (antes duplicado). Props: `status`, `size`,
  `spinning`.

Drift resolvido: `processing` passa a ser `spinner` (semântica correta) nas duas
superfícies; o `spinning` fica a cargo do consumidor (o painel anima; a lista de exames
anima quando a extração está em curso).

## Propagação
`dashboard/page.tsx` e `exams/page.tsx` deixam de definir `STATUS_CONFIG`/markup e usam
`<ExamStatusChip>`. Os rótulos do filtro de status (`STATUS_FILTER_OPTIONS`) que coincidem
(`processed`/`pending`) passam a derivar de `EXAM_STATUS_META` (evita drift futuro).

## Critério de encerramento (por CONCEITO)
Nenhuma implementação paralela do vocabulário de **status de badge** de exame permanece:
o `STATUS_CONFIG` duplicado verbatim foi eliminado; existe um dono único.

## Residuais classificados
- **`STATUS_FILTER_OPTIONS` — concern de FILTRO (não vocabulário de badge):** mantém
  `'Todos os status'` (só-filtro) e `'Com erro'` (fraseado próprio do filtro, ≠ badge
  `'Erro'`); os rótulos que coincidem derivam do dono.
- **`timeline/page.tsx` (legado) — LIMITAÇÃO TRANSITÓRIA:** a Timeline legada inlina um
  único rótulo (`processed → 'Dados extraídos'`) num subtítulo. Está atrás do cutover v2
  (será substituída por `TimelineNew`); derivá-lo mudaria o comportamento dos demais status
  no legado. Documentado, não alterado.

## Preparação para as próximas fases
O dono de Exames (apresentação de status) é a base para mapear status/resultados de
laboratórios externos, FHIR e Health Connect ao vocabulário canônico, sem redefinir o
status em cada superfície. (A leitura da tabela `exams` e a ausência de exames no
`reportDataset` são concerns distintos — de leitura, não de vocabulário — e ficam para
uma causa própria, se a auditoria as elevar.)
