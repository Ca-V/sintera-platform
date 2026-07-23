# ADR-016 — Instância Única de React no bundle do app móvel

- **Status:** Aceito
- **Data:** 2026-07-23
- **Contexto de origem:** Onda 1 · Incremento 1 (Autenticação) — validação funcional no emulador
- **Relaciona-se com:** [ADR-014](ADR-014_ADERENCIA_CONFIG_METRO.md) (config oficial do Metro), [ADR-015](ADR-015_MIGRACAO_EXPO_SDK54.md) (SDK 54), [ARCH-001](../ARCH-001_ARQUITETURA_DEPENDENCIAS_WORKSPACE.md) (topologia de dependências do monorepo)

## Contexto (FATOS observados)

Ao carregar a primeira tela real do app (login, que consome `expo-linear-gradient` e
`@expo-google-fonts/*`), o bundle compilou, mas o runtime falhou com:

```
ERROR  Invalid hook call. Hooks can only be called inside of the body of a function component.
ERROR  [TypeError: Cannot read property 'useState' of null]
ERROR  [Error: Incompatible React versions: The "react" and "react-native-renderer"
        packages must have the exact same version.]
```

Diagnóstico factual (verificado, não hipótese):

| Fato | Evidência |
|------|-----------|
| O monorepo fixa versões de React **diferentes por plataforma** | `package.json` (raiz) → `react: 19.2.4` (Next 16.2.6); `apps/mobile/package.json` → `react: 19.1.0` (RN 0.81.5) |
| As duas versões são **intencionais e commitadas** | `git show HEAD:package.json` já registra `19.2.4`; RN 0.81.5 exige exatamente `19.1.0` no `react-native-renderer` |
| Pacotes RN que importam React foram **hasteados para a RAIZ** | `node_modules/expo-linear-gradient`, `node_modules/@expo-google-fonts/*`, `node_modules/expo-secure-store` (não em `apps/mobile/node_modules`) |
| `expo-linear-gradient` importa `react` | `node_modules/expo-linear-gradient/build/LinearGradient.js` |
| Por estarem na raiz, esses pacotes resolvem o React **19.2.4** da raiz | resolução Node/Metro sobe do módulo até `node_modules/react` mais próximo = raiz |

**Causa raiz:** o app carrega `react-native` (19.1.0, de `apps/mobile`) **e** componentes hasteados
que resolvem `react` 19.2.4 (da raiz) → **duas instâncias de React** no mesmo bundle. O React detecta
o descasamento com o `react-native-renderer` e recusa executar hooks.

Por que não apareceu na validação do SDK 54 (ADR-015): o App daquela etapa era um placeholder trivial
(`View`/`Text`), sem hooks nem pacotes hasteados que importassem React. O problema é latente e só se
manifesta quando o bundle carrega um componente React vindo da raiz.

## Decisão

Adicionar ao `apps/mobile/metro.config.js` um **guard de instância única de React**: um
`resolver.resolveRequest` que força **toda** importação de `react` e `react/*` a resolver para a cópia
do app (`apps/mobile/node_modules/react`, 19.1.0 — a exigida pelo `react-native-renderer`),
independentemente de onde o módulo importador esteja fisicamente.

```js
const upstreamResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    return { type: 'sourceFile', filePath: require.resolve(moduleName, { paths: [__dirname] }) }
  }
  return (upstreamResolveRequest ?? context.resolveRequest)(context, moduleName, platform)
}
```

### O que a decisão NÃO faz (limites)

- **Não** altera versões de React de nenhum lado (web permanece 19.2.4; mobile permanece 19.1.0).
- **Não** reintroduz `disableHierarchicalLookup` (que a ADR-014 comprovou quebrar a resolução de
  módulos nativos aninhados). O guard é ortogonal à hierarquia.
- **Não** mexe em `watchFolders`/`nodeModulesPaths` — mantém a config oficial do Expo (ADR-014) intacta,
  apenas sobrepõe a resolução de um único pacote (`react`).
- **Não** afeta a Web: o guard vive só no `metro.config.js` do app móvel.

## Alternativas consideradas e rejeitadas

1. **Alinhar as versões (mono-React 19.1.0 ou 19.2.4).** Rejeitada: quebra um dos lados — RN 0.81.5 exige
   19.1.0 no renderer; Next 16 traz 19.2.4. Versões divergentes por plataforma são legítimas.
2. **`extraNodeModules`.** Rejeitada: é *fallback* (só atua quando a resolução normal falha); aqui a
   resolução normal SUCEDE apontando para a cópia errada — precisa de override, não de fallback.
3. **`disableHierarchicalLookup = true`.** Rejeitada por ADR-014 (quebra módulos nativos aninhados).

## Consequências

- **Positivas:** instância única de React garantida no bundle; hooks executam; a topologia de hoisting
  do npm deixa de ser um risco para o React. Correção localizada e reversível.
- **Atenção (custo):** qualquer novo pacote hasteado que dependa de React passa a usar 19.1.0 no mobile
  automaticamente (desejado). Se um dia o mobile precisar de `react-dom` (não é o caso em RN), o guard
  deve ser estendido conscientemente.
- **Invariante (INV-REACT-001):** *o bundle do app móvel DEVE conter exatamente uma instância de `react`,
  a de `apps/mobile/node_modules/react`.* Regressão se manifesta como "Invalid hook call" /
  "Incompatible React versions".

## Validação

- `npx tsc --noEmit` (mobile) verde.
- `npx expo start --clear` + build nativo: bundle de 821 módulos **sem** erro de React; a tela de login
  renderiza (wordmark Fraunces, painel aqua, campos, botão) — evidência em
  `scratchpad/login6.png` da sessão de validação.
