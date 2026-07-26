# QA-002 — Débito de lint (Web) — backlog

- **Status:** **BACKLOG** (registrado 2026-07-24). **Não bloqueante** (lint é `continue-on-error` no CI — [ci.yml](../.github/workflows/ci.yml)).
- **Decisão de tratamento:** **da fundadora** — é código de **produto Web congelado** e comportamentalmente sensível; não deve ser "consertado como preenchimento". A ser saneado num item próprio, quando ela decidir.

## Fatos

`npm run lint` (eslint) reporta **30 problemas: 13 erros + 17 avisos** (verificado 2026-07-24). **Nenhum** é do
trabalho mobile — são débito **pré-existente** da Web (referência congelada) + alguns arquivos de teste.

## Erros por natureza

| Regra | Onde (amostra) | Observação |
|-------|----------------|------------|
| **`react-hooks` — "Calling setState synchronously within an effect"** | `src/app/dashboard/{agenda,condicoes,conexoes,configuracoes,habitos,medidas}/page.tsx` | Regra mais estrita (React 19) sobre páginas existentes. Corrigir exige entender cada efeito → **risco de mudar comportamento** de produto congelado. |
| **`react-hooks` — "Cannot access refs during render"** | `src/lib/novelty/useNovelty.ts`, `src/lib/ui/useModalA11y.ts` | Idem — hooks de produto. |
| **`@typescript-eslint/no-explicit-any`** | `src/app/dashboard/gastos/page.tsx` (2×) | Tipagem a estreitar. |
| **`@typescript-eslint/no-require-imports`** | arquivo de config/teste | `require()` proibido. |
| **empty interface** | `src/auth/types.ts` | Interface vazia. |

## Por que NÃO tratar agora

1. Concentra-se em **produto Web congelado** (SSOT/referência) — mexer contraria o congelamento.
2. Os erros de `react-hooks` (`setState` em effect, refs em render) podem **alterar comportamento** se
   "corrigidos" sem análise cuidadosa de cada caso.
3. Não é caminho crítico nem tem relação com o trabalho mobile em andamento.

## Recomendação

Tratar como **item de saneamento próprio da Web**, priorizado pela fundadora, com validação funcional
(não é um ajuste mecânico). Até lá, o CI **expõe** o débito continuamente (lint informativo) sem bloquear o
desenvolvimento. Ao sanear, tornar o job de lint **bloqueante** no [ci.yml](../.github/workflows/ci.yml).
