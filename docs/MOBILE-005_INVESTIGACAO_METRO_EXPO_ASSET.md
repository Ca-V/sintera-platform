# MOBILE-005 — Investigação JS-001: Metro não resolve `expo-asset`

> **Natureza:** log de investigação (diagnóstico por evidência). Continuidade operacional ([[ADR-012]]).
> **Independente de [[MOBILE-004]]** — não assumir "mesmo root cause" (é hipótese até prova).
> **Branch:** `investig/mobile-lockfile-hoisting`. **Status:** cadeia causal **demonstrada**; **nenhuma alteração feita** (aguardando autorização).

## Sintoma
Após resolvido o problema do autolinking (MOBILE-004), o app **passa da inicialização nativa** e falha no bundle JS:
```
Android Bundling failed — Unable to resolve "expo-asset" from "node_modules/expo/src/Expo.fx.tsx"
```

## Perguntas JS-001 (respondidas com evidência)

**1. Onde `expo-asset` está instalado?**
`node_modules/expo/node_modules/expo-asset` — **aninhado dentro do `expo`** (cópia única). *(find)*

**2. Quem depende dele?**
`expo@53.0.27` declara `expo-asset: ~11.1.7`. *(npm explain)*

**3. O Metro deveria encontrá-lo nessa localização?**
Pela **resolução hierárquica padrão do Node**, **sim**: a partir de `node_modules/expo/src/Expo.fx.tsx`, o Node procura em `node_modules/expo/node_modules/expo-asset` → **encontra**. Um Metro com lookup hierárquico ativo o acharia.

**4. Qual config do `metro.config.js` impede isso?**
A linha **`config.resolver.disableHierarchicalLookup = true`**. Com ela, o Metro **só** procura nos `nodeModulesPaths` explícitos (`apps/mobile/node_modules` + raiz) e **não** faz lookup hierárquico/aninhado — logo, **não acha** o `expo-asset` aninhado em `expo/node_modules`. (O comentário do próprio arquivo assume "árvore hoisted" — premissa que não se sustenta aqui.)

**5. Essa config segue a doc oficial do Expo para SDK 53?**
**NÃO.** A [doc oficial de monorepos](https://docs.expo.dev/guides/monorepos/) afirma que **no SDK 52+ o Metro é configurado automaticamente** ("You don't have to manually configure Metro when using monorepos if you use `expo/metro-config`"). Nosso arquivo é uma config **manual estilo SDK ≤51** — e ainda **acrescenta** `disableHierarchicalLookup`, que **não existe** em nenhum exemplo oficial.

**6. A doc oficial prevê `disableHierarchicalLookup=true` nesse cenário?**
**NÃO.** Não aparece nem no exemplo manual (SDK ≤51). Para **SDK 52+**, a orientação oficial é **DELETAR** `watchFolders`, `resolver.nodeModulesPaths`, `resolver.extraNodeModules` **e** `resolver.disableHierarchicalLookup`, e rodar `npx expo start --clear`.

**7. Existe config oficial diferente para npm workspaces?**
**SIM:** para SDK 52+, a config oficial é **NENHUMA config manual** — `getDefaultConfig()` do `expo/metro-config` já trata o monorepo automaticamente.

## Cadeia causal (demonstrada)
```
Metro não resolve expo-asset
  ↓ expo-asset está aninhado em node_modules/expo/node_modules/expo-asset  (find)
  ↓ resolução hierárquica padrão do Node o acharia a partir de expo/src
  ↓ MAS metro.config.js define disableHierarchicalLookup = true
  ↓ → Metro só varre nodeModulesPaths explícitos (app + raiz), ignora aninhados
  ↓ disableHierarchicalLookup NÃO faz parte da config oficial do Expo (nem SDK ≤51)
  ↓ para SDK 52+, a orientação oficial é REMOVER toda a config manual de Metro
```

## Classificação
**Configuração do projeto em desacordo com a documentação oficial.** O `metro.config.js` manual (em especial `disableHierarchicalLookup = true`) **contradiz** a configuração oficial do Expo SDK 53 para monorepos e é a **causa direta** da falha de resolução do `expo-asset`. Não é bug do Expo nem do Metro.

## Correção canônica recomendada (aguardando autorização)
Alinhar à orientação oficial do SDK 52+: **remover a configuração manual de Metro** (`watchFolders`, `resolver.nodeModulesPaths`, `resolver.disableHierarchicalLookup`), deixando `getDefaultConfig()` tratar o monorepo; então `npx expo start --clear` e revalidar o bundle.
- Alternativa mínima (se quiser mudança cirúrgica): remover **apenas** `disableHierarchicalLookup = true`.
- **Critério de sucesso:** o Metro resolve `expo-asset`, o bundle conclui, o app renderiza e permanece rodando (fechando também o critério pendente de V-001).

## Relação com MOBILE-004 (hipótese, não conclusão)
Ambos envolvem topologia aninhada, mas as **causas imediatas são distintas**: MOBILE-004 = autolinking do Gradle (SDK 53 só varre node_modules de topo); MOBILE-005 = config manual do Metro (`disableHierarchicalLookup`). Se um dia se provar que a **origem** (por que o npm aninha) é comum, isso será registrado — por ora, tratadas como independentes.
