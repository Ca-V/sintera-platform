# MOBILE-004 — Investigação: `:expo-dev-menu-interface` ausente do grafo Gradle

> **Natureza:** log de investigação (diagnóstico por evidência). Continuidade operacional ([[ADR-012]]).
> **Branch:** `investig/mobile-lockfile-hoisting` · snapshot de retorno: commit `476b21d`.
> **Status: ENCERRADO.** H3 **confirmada**; **V-001 validou o propósito** (Problema A resolvido). O erro
> `:expo-dev-menu-interface could not be found` e a `ClassNotFoundException` nativa **não ocorrem mais**.
> Um problema **novo e independente** (Metro não resolve `expo-asset`) foi separado em **[MOBILE-005]** — não é o mesmo root até prova.

## Sintoma
Primeiro Development Build (Android, monorepo npm, SDK 53) falha/instala incompleto; app crasha no início.
`gradlew clean`/`projects` falham com:
```
Project with path ':expo-dev-menu-interface' could not be found in project ':expo-dev-client'.
```

## Cadeia causal (provada)
```
Erro Gradle (:expo-dev-menu-interface could not be found)
  ↓ o projeto não existe no grafo Gradle            (gradlew projects falha)
  ↓ o autolinking do SDK 53 só varre node_modules de TOPO, não aninhados   (docs Expo)
  ↓ expo-dev-menu-interface estava ANINHADO em expo-dev-client/node_modules  (find + npm ls)
  ↓ a topologia aninhada estava CONGELADA no package-lock.json               (git)
  ↓ introduzida pela resolução INCREMENTAL do `expo install --fix` (5.0.0→5.2.4)  (git: hoisted antes, aninhado depois)
  ↓ e NÃO se auto-corrigia: o override `$@types/react` BLOQUEAVA a re-resolução limpa  (M-004)
```

## Hipóteses testadas
- **H1 — "ExpoModulesPackageList não é gerado".** **REFUTADA** por evidência (a classe é gerada e compilada no build do pacote `expo`).
- **H2 — "o override causa o aninhamento".** **REFUTADA** por git: em `f442d0d` o override já existia **e** os pacotes estavam hoisted.
- **H3 — "o lockfile congelou a topologia; uma re-resolução livre re-hoista".** **FORTEMENTE SUSTENTADA** (ver Experimento).

## Marco **M-004 — Bloqueador Experimental**
A hipótese **H3 não pôde ser testada** porque um fator independente — o **override `"@types/react": "$@types/react"`** — impedia a resolução completa do npm:
```
npm error Unable to resolve reference $@types/react   (npm install SEM lockfile falha; npm dedupe também)
```
O override foi introduzido por nós para deduplicar `@types/react` no tsc do app móvel. A sintaxe de referência `$name` é frágil e quebra a resolução livre. **Antes de prosseguir, foi metodologicamente necessário remover esse bloqueador** para restaurar a capacidade de executar o experimento. (Remoção temporária, na branch de investigação — não é "tentar uma correção", é destravar o experimento.)

## Experimento controlado (H3)
**Protocolo:** registrar `overrides` atual → remover **apenas** o override de `@types/react` → **nenhuma** outra dep alterada → remover `node_modules` + `package-lock.json` → `npm install` → registrar topologia → comparar com `f442d0d` e com o estado atual → **parar antes de qualquer build**.

**Resultado — Cenário A:** o `npm install` **concluiu** e o resolvedor **hoistou os quatro** `expo-dev-*` para a **RAIZ**.

| Pacote | `f442d0d` (antes do fix) | Estado atual (c/ override, lockfile) | **Experimento (sem override)** |
|---|---|---|---|
| expo-dev-client | RAIZ | apps/mobile | **RAIZ** |
| expo-dev-menu | RAIZ | ANINHADO | **RAIZ** |
| expo-dev-menu-interface | RAIZ | ANINHADO | **RAIZ** |
| expo-dev-launcher | RAIZ | ANINHADO | **RAIZ** |

**Confirmação end-to-end:** com a topologia hoisted, o autolinking passou de **5** para **10** módulos e **agora inclui `expo-dev-menu-interface`** (+ dev-menu, dev-launcher, manifests, updates-interface). Logo, `:expo-dev-menu-interface` passará a existir no grafo Gradle.

## Conclusão (evidência)
A topologia aninhada **não é** a saída natural do resolvedor npm nem o shape esperado pelo Expo — é um **artefato congelado no lockfile** (originado no update incremental do `expo install --fix`), cuja **auto-correção estava bloqueada** pelo override quebrado. Uma **re-resolução livre reconstrói a árvore corretamente (hoisted)**, e o autolinking passa a enxergar o módulo.

Nota honesta: isto **não prova** que o `expo install --fix` esteja "errado" — prova que a árvore **pode** ser reconstruída corretamente quando o resolvedor opera livremente.

## Efeito colateral registrado
Remover o override **reintroduz a duplicação de `@types/react`** (19.0.14 + 19.2.17) — o problema que o override resolvia no tsc do app móvel. **A re-solução correta** (sem a sintaxe `$name` frágil) fica como item a tratar (ex.: alinhar a versão no `apps/mobile` ou usar override concreto compatível).

## Validação V-001 (executada) — RESULTADO
Protocolo de validação da fundadora. Resultado:
- ✅ `npm install` concluiu · autolinking 10 módulos · **`gradlew projects` inclui `:expo-dev-menu-interface`** (BUILD SUCCESSFUL 32s)
- ✅ **build limpo OK** (BUILD SUCCESSFUL 9m15s) · **APK instala** · **sem `ClassNotFoundException`/crash nativo**
- ⚠️ app **não permanece** rodando — mas por **falha independente na camada JS** (Metro não resolve `expo-asset`), **não** pelo problema original.

**Conclusão:** V-001 **cumpriu seu propósito** (validar H3 no nível do produto). O Problema A está **resolvido**. A falha do Metro é tratada em **[MOBILE-005]** como investigação separada (JS-001) — sem assumir mesma origem.

## Pendências herdadas (não bloqueiam o encerramento de A)
1. **Re-solver `@types/react`** de forma robusta (substituir o override `$name`, que quebra `npm install`/`dedupe`) — investigação própria.
2. Consolidar a correção de dependências (topologia hoisted) e **portar para a branch de trabalho** — somente após MOBILE-005 e a solução de `@types/react`.

[MOBILE-005]: ./MOBILE-005_INVESTIGACAO_METRO_EXPO_ASSET.md
