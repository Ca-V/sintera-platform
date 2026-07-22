# ADR-013 — Padrão de versão do Node.js (22 LTS)

**Status:** Accepted · 2026-07-22 · **Ref:** [[ADR-012]] (Continuidade Operacional) · [[adr_006_react_native_expo|ADR-006]] (Expo) · GOV-002 §4

## Contexto
O projeto não possuía referência de versão do Node (sem `.nvmrc`, `.node-version` ou `engines`), o que gerou
ambiguidade real durante o provisionamento Mobile — a máquina de desenvolvimento estava em **Node 24**, fora da faixa
oficialmente suportada pelo **Expo SDK 53** (testado até Node 22). Sem um padrão explícito, cada máquina/dev pode usar
uma versão diferente ("funcionou na minha máquina"), violando a reprodutibilidade exigida por [[ADR-012]].

## Decisão
- O **padrão oficial de desenvolvimento é o Node.js 22 LTS**.
- A **referência oficial** da versão está no arquivo **`.nvmrc`** (raiz do repositório) = `22`.
- **Mudanças de versão são deliberadas e documentadas**: alterar o padrão exige atualizar o `.nvmrc` **e** registrar
  a decisão (novo ADR ou emenda a este), nunca por conveniência local.
- A verificação (`node -v` → `v22.x.x`) e o padrão ficam documentados em **GOV-002 §4** e no **README** (porta de entrada).

## Alternativas consideradas
- **Node 24 (Current)**: rejeitada — fora da faixa testada pelo Expo 53; risco em builds nativos.
- **Node 20 LTS**: aceitável (amplamente suportado), mas 22 é a LTS mais recente dentro da faixa do Expo 53 → escolhida.
- **Não pinar**: rejeitada — mantém a ambiguidade que motivou este ADR.

## Consequências
- Reprodutibilidade entre máquinas e na futura transferência do projeto (ADR-012).
- Ferramentas compatíveis com `.nvmrc` (nvm/nvm-windows/fnm) selecionam a versão automaticamente.
- O campo `engines` no `package.json` (afeta `npm`/deploy) **não** foi adicionado aqui; fica como decisão separada,
  a ser tomada explicitamente se/quando desejado (para não alterar comportamento de deploy sem deliberação).
