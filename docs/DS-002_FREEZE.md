# DS-002 — Architectural Freeze (Marco do Projeto)

**Data:** 2026-07-21 · **Status:** FROZEN (Baseline) · **Autoridade:** fundadora.
**Ref:** [[COLOR-001]] · [[BRAND-002]] · [[DS-002_ARTEFATOS_GERADOS]] · [[ADR-011]].

## O que está congelado a partir deste marco
- **Identidade visual** (cores A·E, gradientes, sombras, tipografia Fraunces/Hanken/IBM Plex Mono, neutros Almond).
- **Arquitetura do Design System** (tokens → papéis → theme → adaptadores; recipes headless; contratos ARCH).
- **Modelo de compartilhamento Web/Mobile** (DS = fonte única; Web e Mobile CONSOMEM; pipeline de geração único).
- **Fonte única de verdade** definida em `packages/design-system`.

## Estado de estabilidade (regras)
O DS-002 deixa de ser o foco e passa a ser **infraestrutura estável**:
- **Não** criar novos tokens sem necessidade recorrente comprovada.
- **Não** ampliar APIs por antecipação.
- **Não** introduzir novos componentes sem justificativa forte.
- **Não** revisitar decisões consolidadas sem evidência concreta obtida na migração do produto.

## Ciclo oficial de evolução (motivado pelo produto)
```
migração → identificação de lacuna → evolução MÍNIMA do DS → contratos → continuação da migração
```
Sem evoluções preventivas.

## Critério para qualquer mudança no DS (responder objetivamente)
1. Qual **tela** revelou a necessidade?
2. Qual **duplicação** ela elimina?
3. Qual **capacidade recorrente** ela adiciona?
4. Qual **componente** passa a reutilizá-la?

Se as respostas não forem claras, a mudança **não pertence** ao Design System.

## Sequência de execução (sem frentes paralelas de arquitetura)
1. Concluir a **migração da Web**.
2. Eliminar completamente o **DS-001**.
3. **Auditoria arquitetural final** (inclui seção "Artefatos Gerados" + "Evoluções adiadas deliberadamente").
4. **Estabilizar** a base compartilhada.
5. Iniciar a implementação **React Native** consumindo exatamente esta arquitetura.

A partir deste marco, mudanças são **evoluções incrementais motivadas pelo produto**, não redefinições de arquitetura.
