# DS-001 — Design System (Componentes e Padrões de Interface)

**Status:** Especificação — documenta o Design System **já implementado** e o declara padrão oficial.
**Escopo:** **componentes visuais e padrões de interface** — tokens, tipografia, cores/tons, componentes reutilizáveis, padrões de lista/formulário/estado-vazio e responsividade. **NÃO** trata de organização funcional/módulos/navegação — isso é o **[[UX-001]]**.
**Relação:** o UX-001 define *o que* existe e *como se organiza*; o DS-001 define *como se apresenta*. Toda página é montada com os primitivos aqui.

---

## 1. Princípios visuais
- **Mobile-first**, breakpoint único `sm` (640px); o mesmo componente é responsivo.
- **Consistência:** um problema visual, uma solução. Vocabulário de primitivos fechado.
- **Nome nunca quebra palavra** (`break-words` + `line-clamp-2`, nunca `break-all`); nada estoura o card; nenhuma coluna fixa espreme o conteúdo.
- **Hierarquia:** nome dominante · detalhes secundários · ações discretas.

## 2. Tokens
**Espaçamento (escala única):** página `px-4 py-8`; entre seções `space-y-6`; header→conteúdo e dentro de grupo `space-y-3`; título→subtítulo `mt-1`; chips/ações `gap-1.5`.
**Tipografia:** eyebrow `font-body text-xs font-medium uppercase tracking-wider text-petal` · H1 `font-display text-2xl font-semibold text-onyx` · subtítulo `font-body text-sm text-mauve leading-relaxed` · nome do card `text-sm font-semibold text-onyx` · meta `text-[11px] text-mauve/60` · chip `text-[10px]`.
**Tons (chips/badges):** `sage` (positivo/valor) · `petal` (destaque/recompra) · `gold` (atenção/programado) · `mauve` (neutro-info) · `neutral` (cinza discreto).

## 3. Componentes (primitivos)
| Componente | Papel | API (resumo) |
|---|---|---|
| `PageHeader` | Cabeçalho padrão | `icon? · eyebrow? · title · subtitle? · action?` — subtítulo em largura total; empilha no mobile, lado a lado no desktop |
| `ListCard` | Card de item (2 camadas) | `leading? · title · titleHref?/onTitleClick? · trailing? · meta? · chips? · actions? · dim?` |
| `CardChip` | Chip/badge compacto | `tone` (sage/petal/gold/mauve/neutral) |
| `ViewModeSwitcher` | Seletor de segmentação (único) | `modes[{value,label}] · active · onChange` |
| `EmptyState` | Estado vazio padrão | `icon · title · message? · action?` |
| `useStickyView` | Persistência da visão por módulo | `(key, initial) → [view, setView]` (localStorage) |

## 4. Padrão de Lista (ListCard — 2 camadas)
- **Linha 1:** [ícone] **Nome** (dominante, `break-words` + `line-clamp-2`) · trailing (valor/status badge).
- **Linha 2:** meta (categoria • data • detalhe) — secundária.
- **Linha 3:** chips compactos (`CardChip`).
- **Linha 4:** ações discretas à direita — botões `w-6 h-6 rounded-lg`, ícones 12px, `text-mauve/40` (destrutivo `hover:text-red-400 hover:bg-red-50`).
- **Segmentação:** `ViewModeSwitcher` (Por data/tipo/situação/ano conforme o módulo), padrão inicial por módulo, preferência **persistida** (`useStickyView`).
- **Agrupamento:** ordem **fixa** (não alfabética). Ex.: Por tipo = Consultas · Exames · Procedimentos · Medicamentos · Suplementos · Vacinas · Outros.
- Listagem mostra **só o essencial**; detalhes completos só na edição.

## 5. Padrão de Formulário
- Pares de campos: `grid-cols-1 sm:grid-cols-2` (empilham no mobile; nada sobreposto/comprimido).
- Campo com botão ao lado (ex.: "Falar"): input `flex-1 min-w-0`.
- Rótulo `text-xs text-mauve/70` acima; campo `rounded-xl bg-ivory`; `space-y-3` entre campos.
- Estado/situação editável **no formulário** (na lista é badge, não seletor).
- Voz (`VoiceInput`) só onde acrescenta valor; com feedback de permissão/indisponibilidade.

## 6. Estado Vazio (`EmptyState`)
Mesmo layout em todas as páginas: ícone em caixa `gradient-sintera-soft` · título · mensagem · ação opcional. Sem variações por página.

## 7. Responsividade
- **Mobile:** compacto/vertical — cabeçalho empilha (subtítulo full-width), cards baixos, ações discretas, formulário em 1 coluna.
- **Desktop:** aproveita a largura — cabeçalho lado a lado, cards mais largos (nome em 1 linha), formulário em 2 colunas, chips na mesma linha.
- Um único componente atende os dois; sem telas separadas.

## 8. Congelamento
Estes são os **únicos** primitivos e padrões visuais oficiais. Novas telas montam-se com eles; qualquer novo componente visual entra por revisão do DS-001. Alterações de tokens/tipografia são globais (aqui), nunca por página.
