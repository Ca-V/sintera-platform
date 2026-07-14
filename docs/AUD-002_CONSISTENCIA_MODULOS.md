# AUD-002 — Auditoria de Consistência entre Módulos (plano da Fase 1)

> Fundadora (14/07/2026): novo foco de auditoria = **experiência/consistência**, não arquitetura. Este é o
> plano de execução da **Fase 1 (consolidação dos módulos existentes)** — padronizar comportamento entre todos
> os módulos reutilizando componentes que **já existem** no Design System. Autonomia máxima; implementar →
> testar → auditar.

## Diagnóstico central
A base compartilhada **já existe** (`ListCard`, `PageHeader`, `EmptyState`, `StateView`, `ConfirmDialog`,
`CreateRecordMenu`, `Disclaimer`, `ViewModeSwitcher`) e é usada de forma **desigual**. O `ListCard` (linha de
lista) já é universal; a inconsistência está **em volta** dele: cabeçalho, adicionar, estados, confirmação, erro.

Módulos existentes: Exames · Medicamentos(+Suplementos como `kind`) · Condições · Agenda(Eventos) · Medidas
Corporais · Sinais Vitais · Relatório · Despesas · Recursos. *(Cirurgias/Procedimentos ainda são só
`event_type` da Agenda — sem página própria; entra no backlog de módulos.)* Mais maduros no DS: **Despesas** e
**Recursos**; melhor confirmação: **Agenda**.

## Padrão de módulo canônico (alvo)
1. Wrapper único (`max-w-2xl mx-auto px-4 py-8 space-y-6`). 2. `PageHeader` (eyebrow+h1+subtítulo+ação+back-link).
3. CTA de adicionar sempre via `CreateRecordMenu` (rounded-full; scan/foto como *método*, nunca botão irmão).
4. Um paradigma de criação/edição (form inline p/ registro factual; modal só p/ evento compartilhado). 5.
`ListCard` (mantém). 6. Estados: `EmptyState` · `StateView`(loading/erro) · `ErrorBanner`. 7. Destrutivo:
`ConfirmDialog` (nunca `window.confirm`). 8. `Section` p/ títulos internos. 9. `Disclaimer` no rodapé.

## Lotes de execução (maior consistência / menor esforço primeiro)
- **L1 · Confirmação destrutiva** — `window.confirm` → `ConfirmDialog` em todos (Agenda já é o padrão). *[comportamento; ROI alto]*
- **L2 · Cabeçalho** — adotar `PageHeader` + back-link + geometria do CTA + wrapper único.
- **L3 · Estados** — `EmptyState` (vazio) · `StateView`/`LoadingCard` (loading) · `ErrorBanner` (erro) em todos.
- **L4 · Utils compartilhados** — `downscaleImage` único; formatação de data única.
- **L5 · UX Exames** — remover o duplo ponto de entrada (dropzone + CreateRecordMenu → um só).
- **L6 · Dedup grande** — unificar Medidas + Sinais Vitais (`MetricSeriesPage`); convergir as 3 capturas
  multipágina em `useDocumentBundle`. *[maior, faseado]*

Detalhe dos achados (categorias 1–6, com file:line) no histórico do commit desta auditoria.
