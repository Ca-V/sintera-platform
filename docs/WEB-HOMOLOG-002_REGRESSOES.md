# WEB-HOMOLOG-002 — Correções de regressão da homologação Web (sidebar + relatórios)

**Status:** IMPLEMENTADO — restauração de comportamento homologado (não são decisões arquiteturais novas). tsc 0 · eslint 0 · suíte completa **1254 verdes**. Congelados/produção/RNDS/#118 intocados. **Item 1 (multi-documento) NÃO entra aqui** (depende do gate da Fase 0 — ver §3).

## 1. Sidebar — regressão restaurada
**Arquivo:** `src/components/layout/Sidebar.tsx` (componente `NavGroup`). A regressão (commit `f8fd527`, "subdivisões recolhíveis") deixou as subdivisões **recolhidas por padrão** e pouco aparentes.

**Restauração mínima (arquitetura/NAV intocados):**
- Subdivisões (Registros / Saúde / Histórico) **abertas por padrão**: `subOpen = openSub[sec.label] ?? true` (era `?? some(isActive)`); `toggleSub` ajustado para o novo default (`?? true`) — o usuário ainda pode recolher no clique.
- **Mais aparentes:** cabeçalho de subdivisão `text-[10px] uppercase tracking-[0.12em] text-onyx/55` → `text-xs tracking-wide text-onyx/80`; chevron `size 11 → 13`.

⚠️ **Nota:** os rótulos reais das subdivisões são **Registros / Saúde / Histórico**. Sua descrição citou "Fonte" — não há esse nó na navegação. Se "Fonte" for uma seção esperada, me diga que trato à parte.

## 2. Relatórios — regressão restaurada
**Arquivo:** `src/app/dashboard/relatorio/page.tsx` (card "Mostrar no relatório"). As opções ficavam **todas expostas** (grupos abertos por padrão + lista sem altura/scroll → crescia a página).

**Restauração mínima (sem redesenhar; reusa toolbar/chevron já existentes):**
- Grupos **recolhidos por padrão**: `open = openGroups[group.title] ?? false` (era `?? true`) — o usuário abre o que precisa.
- **Área rolável:** contêiner dos grupos `space-y-2` → `space-y-2 max-h-[420px] overflow-y-auto pr-1` — abre, rola e seleciona; não fica tudo exposto.

⚠️ **Nota de honestidade:** a história do repo é **squashed** (root único), então não há commit rastreável do "antes". Restaurei conforme a **sua descrição** (área rolável + não tudo exposto + abrir/rolar/selecionar), espelhando o padrão já homologado do card "Configurações de relatório". Confirme na sua revalidação Web se o comportamento bate com o esperado; ajusto se necessário.

## 3. Item 1 — Múltiplos documentos por exame + anexação posterior (frente SEPARADA, opção B)
É a **prioridade**, mas é o **runtime sobre `exam_documents`** (Fase 0/#117 ainda **não aplicada** no Supabase). Decisão tomada: **opção B** — preparar em **código + testes locais**, sem apply de schema, para entrar **junto com a Fase 0**. Vai em **branch/PR próprio** (não neste). **Não** será considerado homologado até #117 estar no Preview.

## Escopo
Só regressões de UI (sidebar + relatórios). Sem tocar arquitetura de navegação, itens congelados, RNDS, produção ou #118.
