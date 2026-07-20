# ADR-007 — Monorepo com compartilhamento web↔mobile

**Status:** Accepted · **Architectural Baseline** · 2026-07-20 · **Ref:** [[ARCH-002]] · [[HIP-012]] §4

## Contexto
Web e mobile precisam compartilhar modelo de domínio (Observação), contratos de API, validações e regras de negócio para
evitar divergência (reforço do API-first).

## Decisão
Adotar um **monorepo** (npm workspaces) com **estratégia EVOLUTIVA de baixo risco** (a web já está em produção):
- **A:** criar workspaces + `packages/*` mantendo a web onde está (nada quebra);
- **B:** criar `apps/mobile` consumindo os pacotes;
- **C:** extrair progressivamente o compartilhável (`lib/*` → `packages/*`);
- **D:** mover a web para `apps/web` só quando ~70–80% do compartilhado estiver estável.
**Pacotes com fronteira clara:** `core` (domínio: entidades/casos de uso/regras) · `api-client` (HTTP) · `types`
(contratos) · `validation` (Zod) · `design-system` (tokens+UI) · `config` (constantes) · `utils` (só genéricos).
`core` **nunca** vira depósito de utilitários.

## Alternativas consideradas
- **Repositórios separados:** rejeitada — divergência de contrato e duplicação de regra.
- **Converter tudo agora (web → apps/web imediatamente):** rejeitada **neste momento** — risco desnecessário a um app em
  produção (caminhos/CI/Vercel/aliases). Adiada para a Etapa D.
- **Copiar código entre projetos:** rejeitada — insustentável, propenso a drift.

## Consequências
Fonte única de tipos/regras; evolução sincronizada e **segura**; risco mínimo à web; `core` com responsabilidade única.
Governa a Onda 1 ([[HIP-010]]/[[HIP-012]] §4).
