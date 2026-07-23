# ADR-015 — Migração para Expo SDK 54

**Status:** Aprovado · 2026-07-23 · **Ref:** [[ARCH-001]] · [[MOBILE-004]] · [[MOBILE-005]] · [[MOBILE-006]] · UPG-001 (protocolo de execução)

## Motivação
Eliminar uma **limitação arquitetural observada no Expo SDK 53** relacionada ao **autolinking em monorepos**:
módulos Expo nativos que o npm posiciona **aninhados** (por peer-dependência circular com `expo`) ficam **invisíveis**
ao autolinking do SDK 53, que varre apenas node_modules de topo. Isso foi **demonstrado experimentalmente 3×**
([[MOBILE-004]] `expo-dev-menu-interface`; [[MOBILE-006]] `expo-asset`/`expo-constants`) — todas violações do invariante
[[ARCH-001|INV-DEP-001]].

## Alternativas avaliadas
- **Permanecer no SDK 53 com mitigação manual** (deps diretas / `expo.autolinking.searchPaths`): frágil, por-pacote,
  exige revalidação a cada mudança de dependências.
- **Migrar para o SDK 54.**

## Decisão
**Migrar para o Expo SDK 54.**

## Justificativa
- elimina divergências em relação ao caminho **oficialmente suportado** pelo Expo;
- reduz configurações específicas do projeto;
- diminui a necessidade de mitigação manual;
- melhora a sustentabilidade da manutenção futura.

## Nível de confiança (calibração explícita)
> A documentação e as mudanças introduzidas no **Expo SDK 54** indicam que o **suporte a monorepos foi aprimorado**
> (revamp do autolinking — unificação da descoberta de módulos Expo/RN, incl. aninhados/transitivos/isolados),
> tornando o SDK 54 a **abordagem arquitetural preferencial** para evitar essa classe de incompatibilidades.
> **A validação definitiva ocorrerá após a migração e os testes.**

Até aqui, foi **demonstrado experimentalmente apenas o comportamento do SDK 53**. Sobre o SDK 54 há **forte evidência
documental**, mas **ainda não** validação prática no projeto SINTERA — que é o objetivo do protocolo **UPG-001**.

## Consequências
- Execução **exclusivamente** via protocolo **UPG-001** (fases + validação), em branch dedicada, para isolar em qual
  etapa uma eventual regressão surgir.
- Este ADR é **atualizado** ao final de UPG-001 com o resultado da validação prática (confirma ou revisa a decisão).
- Aplica os critérios de validação da árvore definidos em [[ARCH-001]].
