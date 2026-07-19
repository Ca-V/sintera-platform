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
**Paleta oficial v2.0 (território teal — valores em `globals.css`; identidade em [[SINTERA_BRANDING]]):** ação/UI = **teal profundo `#0E6E64`** (token `petal`; gradiente `#0E6E64→#57B3AD`) · assinatura = **Lagoa `#57B3AD`** (token `lagoa`; superfícies/acentos, não‑texto) · escuro **pinho `#0A2E2C`/`#0E3B37`** · acento quente **coral‑rosé `#E28C7D`** (token `lavender`, raro) · premium **dourado `#C4A06A`** (restrito) · apoio **sage `#7DAF9E`** (retaguarda) · texto onyx `#1C2321` / mauve `#5B6B67` · fundos creme/ivory. Contraste **WCAG AA** revalidado 10/07 (teal profundo 6,1:1; público = 0 violações). *(Dívida agendada: rename do token `petal`→`primary`.)*
**Espaçamento (escala única):** página `px-4 py-8`; entre seções `space-y-6`; header→conteúdo e dentro de grupo `space-y-3`; título→subtítulo `mt-1`; chips/ações `gap-1.5`.
**Tipografia:** eyebrow `font-body text-xs font-medium uppercase tracking-wider text-petal` · H1 `font-display text-2xl font-semibold text-onyx` · subtítulo `font-body text-sm text-mauve leading-relaxed` · nome do card `text-sm font-semibold text-onyx` · meta `text-[11px] text-mauve` · chip `text-[11px]`.
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

## 8. Descrição Contextual (primitivo transversal)
`@/components/ui/ContextualDescription` (`useContextualDescription` + `ContextualDescriptionCard`). **Conceito
(não é "card de hover" nem específico da navegação):** ajuda o usuário a compreender **imediatamente a
finalidade de qualquer elemento** da interface — responde *"quando eu uso isto?"*, orientando a **ação**.
**Agnóstico de contexto:** serve à barra lateral, menus, dashboards, assistentes, cards, páginas, atalhos. O
**gatilho pode evoluir** (hover, clique, popover, toque no mobile) sem mudar o conceito — o componente é
desacoplado do gatilho e do consumidor (recebe só o texto). Técnico: posição `fixed` (escapa clip de scroll);
dispara em hover **e** foco (acessível ao teclado). 1º consumidor: Sidebar (descrição por categoria).

## 9. Voz da plataforma — BENEFÍCIO antes da funcionalidade (princípio permanente)
Princípio de escrita para **todo texto ao usuário** (fundadora 18/07): comunicar **primeiro o benefício/propósito**
e só depois a funcionalidade. *"Registre e acompanhe toda a sua jornada de saúde…"* é mais forte que *"Registre
consultas, procedimentos…"*. **Padrão das descrições/microcopy:** 1 frase · começa com **verbo** · benefício antes ·
exemplos só quando **agregam** · linguagem simples e natural · máx. 2 linhas · reforçar o posicionamento
**longitudinal / continuidade do cuidado** quando couber. As descrições devem ser revisadas **em conjunto** (mesmo
ritmo/estrutura/voz), para a plataforma inteira soar escrita pela mesma pessoa.

**REGRA LÉXICA OBJETIVA (permanente, fundadora 18/07):** toda ocorrência de **"tratamento", "diagnóstico",
"terapia", "conduta", "prescrição"** (e equivalentes/flexões) em **texto visível ao usuário** é **inadequada por
padrão** — a SINTERA **registra e organiza** informações do cuidado, não trata, não diagnostica, não prescreve.
**Única exceção:** textos **legais, regulatórios ou de consentimento**, onde essas palavras são necessárias
justamente para **delimitar o que a plataforma NÃO faz** (disclaimers RDC 657; "tratamento de dados" da LGPD).
Fora disso, reescreva (ex.: "uso/utilização/acompanhamento/cuidado"; "quem indicou" em vez de "quem prescreveu";
"orientações recebidas / próximos passos" em vez de "conduta"). Regra objetiva por design — não avaliar caso a caso.

As descrições são **semânticas** (finalidade do módulo, agnósticas do componente) — reutilizáveis em busca,
assistente, onboarding e recomendações; SSOT em `@/lib/ui/navDescriptions`.

## 10. Congelamento
Estes são os **únicos** primitivos e padrões visuais oficiais. Novas telas montam-se com eles; qualquer novo componente visual entra por revisão do DS-001. Alterações de tokens/tipografia são globais (aqui), nunca por página.
