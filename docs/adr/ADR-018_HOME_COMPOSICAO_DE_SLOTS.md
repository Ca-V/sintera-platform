# ADR-018 — Telas de agregação são composição de slots (a Home não é dona de lógica de domínio)

- **Status:** Aceito
- **Data:** 2026-07-24
- **Contexto de origem:** Incremento 3 (Home Shell) — generaliza o princípio do [MOBILE-014](../MOBILE-014_PLANEJAMENTO_INCREMENTO3_HOME.md) para uma decisão transversal.
- **Relaciona-se com:** [ADR-011](ADR-011_ARQUITETURA_COMPONENTES_CROSSPLATFORM.md) · [ADR-001](ADR-001_PROJECAO_SEM_DUPLICACAO_SSOT.md) · [ADR-009](ADR-009_ARQUITETURA_BASEADA_EM_DOMINIO.md)

## Contexto

A Home (Painel Inicial) e, no futuro, outras telas de **agregação** (ex.: Perfil, dashboards) tendem a
concentrar dados de muitos domínios. Sem uma regra, viram um ponto de acúmulo de consultas ao Supabase,
regras de negócio e priorizações — acoplando a tela a todos os domínios e dificultando a evolução.

## Decisão

> **Telas de agregação (a começar pela Home) são COMPOSIÇÕES de _slots_. Nunca são donas de lógica de
> domínio. Elas apenas ORGANIZAM componentes; a lógica pertence aos módulos de domínio.**

Regras derivadas:

1. **Slot** = região **estável** da tela destinada a receber um componente de domínio, mantendo **contrato
   visual e estrutural**, **sem exigir alteração do layout** da tela hospedeira.
2. **Sem lógica de domínio na camada de composição:** nenhuma chamada ao SDK do Supabase, nenhum
   `@sintera/api-client` para dados de domínio, nenhuma regra de negócio, nenhuma priorização vivem na
   tela de agregação. Ela pode consumir apenas estado **local** já disponível (ex.: sessão).
3. **Slots como componentes reais e nomeados** desde o primeiro incremento — mesmo vazios/reservados —
   para preservar o contrato e reduzir retrabalho.
4. **Independência:** cada slot pode ser implementado, removido ou evoluído **independentemente** dos demais.
5. **Evolução sem redesenho:** adicionar o widget de um domínio é **preencher um slot já contratado**; o
   widget se adapta ao slot, **não** o slot ao widget. Alterar o layout-base para acomodar um widget exige
   ADR próprio.
6. **Pontos de entrada** dentro da composição são **apenas navegação** para funcionalidades existentes —
   sem decisão/priorização por regra de negócio (não se confundem com o RegistrationHub/HUB-001).

## Consequências

- **Positivas:** a tela de agregação permanece desacoplada dos domínios; cada domínio evolui seu widget de
  forma isolada; baixo risco de regressão; a Home nasce estável e cresce por preenchimento.
- **Atenção:** exige disciplina para não "puxar" dados de domínio para a composição por conveniência.
- **Invariante (INV-HOME-001):** *nenhum arquivo da camada de composição da Home importa o SDK do Supabase
  ou o `@sintera/api-client`.* Regressão é detectada pelo CI — ver `tests/mobile/home-is-composition.test.ts`.

## Aplicação atual (Incremento 3)

`apps/mobile/src/presentation/home/` — `HomeShell` compõe `WelcomeSlot`, `QuickActionsSlot`, `SummarySlot`,
`TimelineSlot`, `InsightsSlot`, `FooterSlot`. Reservados renderizam estado neutro; Welcome usa só a sessão;
QuickActions só navega; Footer dispara logout. Auditoria e testes de contrato: verdes.
