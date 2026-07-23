# MOBILE-006 — Investigação: `expo-asset` e `expo-constants` não autolinkados ao APK

> **Natureza:** log de investigação (diagnóstico por evidência). Continuidade operacional ([[ADR-012]]).
> **Independente** de MOBILE-004/005 — sem assumir mesma origem até prova. **Só leitura; nenhuma correção.**
> **Enunciado:** *por que os módulos nativos `expo-asset` e `expo-constants` não foram autolinkados para o APK?*

## Sintoma (runtime, com o bundle JS já carregado)
```
Cannot find native module 'ExpoAsset'  ·  No native ExponentConstants module found
Invariant Violation: "main" has not been registered
```

## Respostas (com evidência)
1. **Autolinking Android encontrou `expo-asset`?** **NÃO** — ausente da lista de módulos resolvidos (10 módulos; `expo-asset` não está).
2. **Encontrou `expo-constants`?** **NÃO** — também ausente da lista.
3. **Aparecem no JSON do autolinking?** **NÃO** como módulos resolvidos. Ambos **têm `expo-module.config.json`** válido com módulo nativo Android (`expo.modules.asset.AssetModule`; `expo.modules.constants.ConstantsModule`) — ou seja, **são elegíveis**; o que falha é a **localização**. (`expo-asset` é AAR pré-compilado — `publication` em `local-maven-repo`, como `expo-secure-store`.)
4. **Aparecem no `settings.gradle`?** **NÃO** (`grep` vazio).
5. **Aparecem no grafo Gradle?** **NÃO** — `gradlew projects` conclui (BUILD SUCCESSFUL) sem `:expo-asset`/`:expo-constants`.
6. **Aparecem nas deps do `:app`?** **NÃO** — não há como depender de projetos inexistentes no grafo.
7. **Aparecem no APK?** **NÃO** — confirmado pelo runtime (`Cannot find native module 'ExpoAsset'` / `No native ExponentConstants module found`).
8. **Em que etapa desaparecem?** No **primeiro estágio — a resolução do autolinking.** Eles **nunca são resolvidos** (estão aninhados em `node_modules/expo/node_modules/`, e o autolinking do SDK 53 varre **apenas** node_modules de topo). **Não** é "autolinkado e depois removido por outra etapa" — é **nunca linkado**. *(Isto refuta explicitamente a hipótese alternativa.)*

## Causa (demonstrada)
`expo-asset` e `expo-constants` (deps de `expo@53.0.27`) estão **aninhados** em `node_modules/expo/node_modules/`. O autolinking do Expo SDK 53 varre só os node_modules de topo → **não os encontra** → não entram no `settings.gradle` → nem no grafo Gradle → seus **módulos nativos não vão para o APK** → o JS os requer em runtime e falha.

## Convergência — TERCEIRA reprodução do mesmo mecanismo
| Investigação | Pacote | Onde estava aninhado | Camada | Etapa em que some |
|---|---|---|---|---|
| MOBILE-004 | expo-dev-menu-interface | expo-dev-client/node_modules | Gradle nativo | autolinking |
| MOBILE-005 | expo-asset | expo/node_modules | Metro JS *(corrigido por [[ADR-014]])* | resolução Metro |
| **MOBILE-006** | **expo-asset · expo-constants** | **expo/node_modules** | **Gradle nativo** | **autolinking** |

Três famílias independentes, três reproduções, **mesmo mecanismo**: *pacote aninhado → o resolver (Gradle autolinking / Metro) que só varre node_modules de topo não o encontra.* A origem imediata converge para **como o npm posiciona as dependências neste monorepo** — questão de **arquitetura do workspace**, não de Android nem de Metro.

## Recomendação
Aberta a terceira evidência, recomenda-se elevar à **investigação arquitetural ARCH-001 — Estratégia de resolução de dependências do monorepo** (por que o npm produz topologia inconsistente/aninhada, e qual configuração de workspace garante uma árvore plana consistente que Gradle *e* Metro esperam). **Nenhuma correção antes disso.**
