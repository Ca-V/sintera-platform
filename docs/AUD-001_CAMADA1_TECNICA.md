# AUD-001 · Camada 1 — Relatório Executivo (Auditoria Técnica)

> Contra a baseline `sintera-v1-baseline` (commit 464145f, `sinteramais.com.br`). **Nada foi
> implementado** — só registro (disciplina AUD-001). Alimenta a Camada 3 (consolidação) após a Camada 2.
> Fontes: 4 auditores técnicos paralelos + QA automatizado (crawl de produção).

## Veredito geral
**Nenhum P0. Nenhum bug crítico. Nenhum risco regulatório crítico.** A saúde técnica de base é
forte: **44/44 páginas HTTP 200 · 0 overflow horizontal · 0 erros de console** (desktop+mobile).
A conformidade RDC 657 é **arquitetada no código**, não só na cópia. Os achados são de
**consistência, dívida técnica, acessibilidade e itens regulatórios latentes** — nada bloqueia a
plataforma hoje, mas vários afetam a percepção de qualidade/premium e a manutenção.

## Top-5 (maior impacto técnico)
1. **[P1] Altura duplicada (SSOT)** — `body_metrics.altura` **e** `profiles.height_cm` são ambos
   lidos/escritos em runtime (Medidas grava num, Relatório/`r/[token]` leem o outro) → risco de
   **dois valores divergentes** para a mesma usuária. Único achado com risco de **dado incorreto
   hoje**, independente de flags. `medidas/page.tsx:208,340`, migrations 048/054/062.
2. **[P1] Dois Design Systems paralelos + adoção parcial** — `premium` (usado) vs `ui/` (órfão:
   `ui/Button` 0/19, `ui/ItemCard`/`StateView` 0/19). Componentes compartilhados existem mas mal
   adotados: `PageHeader` **2/19**, `EmptyState` **2/19**. É a **causa-raiz** da maioria das
   inconsistências visuais. É o que mais afeta a percepção premium.
3. **[P1] Criação de registro fragmentada** — **4 paradigmas + 5 rótulos** para a mesma intenção
   (`<CreateRecordMenu>` só em Exames/Medicamentos; Recursos "Escanear+Adicionar"; Condições/Medidas/
   Sinais/Ciclo/Ômica "Adicionar"; Despesas "Adicionar despesa"; Agenda/Timeline modal). Já é o alvo
   do CAP-001 futuro. (Ver `docs/BACKLOG_AUDITORIA.md`.)
4. **[P1] Acessibilidade — padrão certo existe, adoção incompleta** — botões-ícone (editar/excluir/
   fechar) sem `aria-label` em ~10 páginas; `<label>` de formulário **não associado** (login,
   AgendarModal, medicamentos); **modais sem foco/Escape** (AgendarModal, CreateRecordMenu);
   **contraste** provável < AA (petal/mauve-60/gold, textos 10-11px). Fundações boas (`lang=pt-BR`,
   helper `clickable.ts`, `ConfirmDialog role=dialog`).
5. **[P1] Constantes de upload divergentes** — `MAX_BYTES` 10 MB × 50 MB e `ACCEPTED` repetidos em
   ≥6 arquivos → limite/mensagem inconsistentes por módulo. Sem fonte única.

## Achados por dimensão

### A. Design System & Consistência (P1: estruturais · P2: cosméticos)
- **P1** PageHeader 2/19 · EmptyState 2/19 · CTA primário duplicado inline (0/19 usam `ui/Button`) ·
  confirmação de exclusão em 3 mecanismos (`window.confirm` × `ConfirmDialog` × modal custom; Timeline
  usa **dois ao mesmo tempo**) · dois DS concorrentes a reconciliar.
- **P2** eyebrow redundante/inconsistente (repete o h1 em alguns, genérico/ausente em outros) · ordem
  das pills invertida entre módulos (`[tipo,situacao]` × `[situacao,tipo]`) · empty-states com padding/
  estrutura variados · ações de card (Pencil/Trash2) duplicadas inline · filtros divergentes por módulo ·
  link "← Painel Inicial" inconsistente · Exames com card de edição de nome próprio.

### B. Regulatório (RDC 657) — nenhum P0
- **Forte:** rotas de IA = transcrição factual com anti-interpretação (`temp 0`, "não dar orientação");
  motor de Insights com `CLINICAL_RULESET` **vazio por design** (exige CRM/aprovação); disclaimers
  presentes e consistentes; camada educacional não usa dado individual; zero links fictícios.
- **P1 (latente / gate):** rótulos de Insights `FLAG_CONFIG` ("Dentro do esperado"/"normal") e
  `SOURCE_LABEL` ("Gerado por IA") — hoje não renderizam (ruleset vazio) mas devem ser **pré-condição
  do gate de ativação** do ruleset clínico. `insights/page.tsx:25-35`.
- **Decisão da fundadora:** **Prevenção** — acompanhamentos proativos por fase da vida (hoje restrito
  ao admin, com hedge e exigência de CRM). É o FLAG RDC 657 já conhecido. Sem ação técnica.
- **P2:** cor semafórica no índice experimental de Exames (bem mitigado por disclaimer); micro-orientação
  em texto de demo (walled-off).

### C. Acessibilidade
- **P1** botões-ícone sem nome acessível (A1) · `<label>` sem `htmlFor` (A5) · modais sem focus-trap/
  Escape (A3) · contraste < AA em petal/mauve-60/gold e fontes 10-11px (A4).
- **P2** ícones decorativos sem `aria-hidden` (A2) · `<img>` de prévia `alt=""` borderline (A6) ·
  login usa `<p>` no lugar de `<h1>` (A7) · toggle de senha sem `aria-label`/`aria-pressed` (A8).
- **Positivos:** `lang=pt-BR`, `clickable.ts` (semântica de teclado em cards), `ConfirmDialog` com `role=dialog`.

### D. Arquitetura & Dívida técnica
- **P1** altura SSOT (Top-1) · V1/V2 com botões mortos (**P1-condicional** — só com flip de flag;
  Relatório V2 é read-only → **não promover** sem paridade de share/templates) · constantes de upload
  divergentes.
- **P2** `omicsProcessor` órfão (código morto intencional) · data-fetching inconsistente (`supabase as any`
  × camada de domínio; 72 ocorrências) · **112 `any`/`as any`** em 51 arquivos · tratamento de erro sem
  convenção (catch silencioso × genérico × específico) · `<input type=file>` duplicado em 8 lugares.
- **Positivos:** sem `console.log` de debug em produção · zero TODO/FIXME · `eslint-disable` disciplinado
  (todos justificados) · V1/V2 é estratégia de transição **documentada** (`renderVersion.ts`).

## Classificação (para a Camada 3)
- **P0:** nenhum.
- **P1 (funcional/estrutural):** altura SSOT · dois DS + adoção parcial · criação de registro · a11y
  (rótulos/labels/foco/contraste) · constantes de upload · V1/V2 (condicional) · regulatório latente (gate Insights).
- **P2 (cosmético/dívida):** eyebrow · pills · empty-states · ações de card · filtros · `any`/data-fetching ·
  omics órfão · erro inconsistente · a11y incrementais · cor de Exames.
- **Decisão da fundadora (não-técnico):** Prevenção proativa (RDC 657).

## Regra mantida
Tudo acima é **registro** — nenhuma implementação nesta fase. Os itens entram na **consolidação da
Camada 3** (com os achados da Camada 2 de produto), priorizados por criticidade × impacto × esforço ×
roadmap. Exceção da disciplina AUD-001 (bug crítico/regulatório) **não foi acionada** — não há P0.
