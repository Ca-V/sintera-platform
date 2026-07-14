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

## Lotes de execução — STATUS
- **L1 ✅** · `window.confirm` → `ConfirmDialog` (13 páginas).
- **L2 ✅ + L2b ✅** · `PageHeader` + back-link + CTA + wrapper — todos os módulos-lista (relatorio pulado: h1
  vive no bloco imprimível do PDF; home/perfil/config/insights/prevenção fora do padrão de módulo).
- **L3a ✅** · `ErrorBanner` compartilhado (4 módulos). **L3b ✅** · `EmptyState` (4 módulos).
- **L4a ✅** · `downscaleImageToPayload` compartilhado (dedup).
- **L4b ⏸️** · dedup de formatação de data — *baixo ROI, risco de mudar formatos*; não executar sem necessidade.
- **L5 → backlog C1** · duplo ponto de entrada de Exames = item **2.5 / C1 (fluxo único de inclusão)**, Fase C
  (nova funcionalidade + decisão de produto). Não é desta passada.
- **L6 ⏸️ ADIADO** · unificar Medidas + Sinais Vitais (`MetricSeriesPage`) — **evidência: `Medidas` será
  reformada no backlog C4** (avaliação corporal geral + scan próprio); unificar agora criaria abstração
  errada = retrabalho. Fazer **junto/depois do C4**. (Idem convergir as 3 capturas multipágina em
  `useDocumentBundle` — refactor grande, faseado.)

**Passada de consistência da Fase 1: substancialmente COMPLETA** (comportamento + apresentação padronizados nos
módulos). Estados de loading já eram consistentes (Card+spinner). Restante = completude FUNCIONAL de módulos
(ex.: Cirurgias/Procedimentos sem página própria) + backlog, na ordem da governança.

Detalhe dos achados (categorias 1–6, com file:line) no histórico do commit desta auditoria.
