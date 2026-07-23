# ARCH-001 — Arquitetura de Resolução de Dependências do Workspace

> **Natureza:** investigação arquitetural (governança técnica). Continuidade operacional ([[ADR-012]]).
> **Origem:** convergência de três reproduções independentes ([[MOBILE-004]], [[MOBILE-005]], [[MOBILE-006]]) para o
> mesmo mecanismo. **Só leitura; nenhuma alteração.** A decisão final (→ ADR) cabe à fundadora.
> **Escopo:** npm · workspaces · package-lock · hoisting · Expo Autolinking · Metro · Gradle.

## Invariante arquitetural (proposto)
> **INV-DEP-001:** Todo **módulo Expo nativo** deve residir em um `node_modules` de **TOPO** (raiz do workspace ou
> `node_modules` do app), **simultaneamente visível** a **Node · Metro · Expo Autolinking · Gradle**. Um módulo
> nativo **aninhado** (ex.: em `node_modules/expo/node_modules/…`) **viola** o invariante no Expo SDK 53.

Os três incidentes foram **violações deste invariante** por pacotes diferentes.

## Perguntas (respondidas com evidência)

**1. Qual algoritmo de resolução o npm aplica?**
npm 10 (default `install-strategy=hoisted`): achata as deps para o `node_modules` mais alto **sem conflito**, mas com
**resolução ciente de peerDependencies**. **Evidência do mecanismo:** deps de `expo` que **peer-dependem de `expo`**
(`expo-asset`, `expo-constants`) são **aninhadas** sob `expo/node_modules`; deps de `expo` que **não** peer-dependem
(`expo-modules-core`, `expo-json-utils`) são **hoistadas** à raiz. Ou seja, o npm nesta versão **aninha um pacote sob
seu ancestral quando ele peer-depende desse ancestral** (peer circular), para vincular o peer à instância exata do pai.

**2. Essa topologia é correta pelo npm?**
**SIM** — o npm a produz **sem erro**, de forma **determinística**. É uma resolução **válida** pelas regras do npm (peer
resolution), **não** um bug. "Válida para o npm" ≠ "plana/hoisted".

**3. É compatível com o Expo SDK 53?**
**NÃO.** O autolinking do SDK 53 varre **apenas** node_modules de topo; módulos Expo nativos **aninhados** são
**invisíveis** (provado 3×). O **SDK 54 revisou o autolinking** para tratar módulos aninhados/transitivos/isolados em
monorepo — confirmando que **o SDK 53 tem a limitação** e o SDK 54 a corrige na origem.

**4. Quais configs oficiais npm/workspaces alteram a topologia?**
O Expo **não documenta** nenhuma config npm-específica. O npm tem `.npmrc`/`install-strategy`/`legacy-peer-deps`, mas
**não são prescritos** pelo Expo. No nível do autolinking, `expo.autolinking.searchPaths` (no `package.json`) pode
apontar para caminhos aninhados — **contorno**, específico do nativo, não muda a topologia.

**5. O Expo documenta config específica para npm workspaces?**
**NÃO.** npm é "first-class" (junto com Bun/pnpm/Yarn), mas a doc traz só o setup genérico (`workspaces` no
`package.json`) e nota que **npm é hoisted por padrão**. Sem tuning npm-específico.

**6. Existe config canônica para garantir compatibilidade npm ↔ SDK 53?**
**Não há garantia canônica no SDK 53** — o aninhamento por peer circular é comportamento do **npm**, não configurável
pelo Expo. A correção **canônica no nível do ecossistema é o SDK 54** (revamp do autolinking). No SDK 53 existem só
**mitigações parciais** (abaixo).

**7. Qual solução tem menor impacto e maior estabilidade futura?**
Duas rotas (trade-off explícito):
- **Rota A — Upgrade para Expo SDK 54 (correção de RAIZ).** O autolinking do 54 trata monorepo/aninhados/transitivos
  oficialmente. **Máxima estabilidade futura**; elimina a classe inteira do problema. Custo: upgrade de SDK (RN/deps),
  com teste. Maior impacto imediato, menor risco recorrente.
- **Rota B — Mitigar no SDK 53 (tático).** Opções: (b1) declarar os módulos nativos aninhados (`expo-asset`,
  `expo-constants`, …) como **deps DIRETAS do app** (`apps/mobile/package.json`) para forçá-los ao topo — a testar,
  pois o peer circular pode resistir; (b2) `expo.autolinking.searchPaths` apontando para os aninhados. **Menor impacto
  imediato**, mas **frágil**: é por-pacote e precisa **revalidação a cada `npm install`/`expo install --fix`/upgrade**
  (o conjunto de pacotes aninhados muda).

## Política de gestão de dependências (proposta)
1. **Fonte de verdade da topologia = os resolvers reais** (Expo Autolinking + Metro + Gradle), não a intuição.
2. **Nenhum override/config manual** que quebre a resolução do npm (lição do override `$@types/react`) ou que
   contradiga a doc oficial (lição do `disableHierarchicalLookup`, [[ADR-014]]).
3. **Toda atualização de dependências** (`npm install`, `expo install --fix`, upgrade de SDK) **exige revalidação** da
   árvore pelos **critérios objetivos** abaixo antes de ser considerada concluída.
4. Preferir **conformidade com o ecossistema oficial** a contornos locais (princípio recorrente da investigação).

## Critérios objetivos de validação da árvore (após qualquer mudança de deps)
- [ ] **Nenhum** módulo Expo com nativo está aninhado — todos em `node_modules` de topo (raiz/app). *(script de checagem)*
- [ ] `expo-modules-autolinking resolve -p android` lista **todos** os módulos nativos esperados (incl. asset/constants).
- [ ] `gradlew projects` inclui os projetos `:expo-*` nativos esperados (sem "could not be found").
- [ ] Metro: `Android Bundled` conclui, sem `Unable to resolve`.
- [ ] Runtime: app inicia sem `Cannot find native module` / `ClassNotFoundException` e **permanece** rodando.

## Decisão pendente (→ ADR-015)
A escolha **Rota A (SDK 54)** × **Rota B (mitigação SDK 53)** é decisão de **arquitetura/produto** da fundadora.
Recomendação técnica: **Rota A** (corrige a origem, alinha ao ecossistema, encerra a classe MOBILE-004/005/006/…);
Rota B só se houver impedimento a curto prazo para o upgrade. A decisão vira **ADR-015** e este documento é atualizado.
