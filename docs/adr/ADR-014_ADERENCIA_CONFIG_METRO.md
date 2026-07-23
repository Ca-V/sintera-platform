# ADR-014 — Aderência à configuração oficial do Metro (Expo SDK 52+)

**Status:** Accepted · 2026-07-23 · **Ref:** [[ADR-012]] (Continuidade Operacional) · [[adr_006_react_native_expo|ADR-006]] · MOBILE-005 (JS-001)

## Contexto
O `apps/mobile/metro.config.js` usava uma **configuração manual estilo SDK ≤51** — `watchFolders`,
`resolver.nodeModulesPaths` e, adicionalmente, `resolver.disableHierarchicalLookup = true`. A investigação
**MOBILE-005 (JS-001)** demonstrou, com evidência + documentação oficial, que:
- `expo-asset` é instalado **aninhado** em `node_modules/expo/node_modules/expo-asset` (dep de `expo@53.0.27`);
- a resolução hierárquica padrão do Node o encontraria a partir de `node_modules/expo/src/...`;
- mas `disableHierarchicalLookup = true` faz o **Metro ignorar node_modules aninhados** → `Unable to resolve "expo-asset"`;
- a [documentação oficial](https://docs.expo.dev/guides/monorepos/) afirma que **no SDK 52+ o Metro é configurado
  automaticamente** por `expo/metro-config`, e que a config manual (incl. `disableHierarchicalLookup`) deve ser **removida**.

Ou seja, a config manual **contradizia** a configuração oficial suportada, sendo a causa direta da falha do bundle.

## Decisão
O projeto **abandona a configuração manual do Metro** e passa a seguir **integralmente a configuração oficial do
Expo SDK 52+**: o `metro.config.js` do app apenas obtém e exporta `getDefaultConfig(__dirname)`, deixando o
`expo/metro-config` tratar o monorepo automaticamente.

```js
const { getDefaultConfig } = require('expo/metro-config')
const config = getDefaultConfig(__dirname)
module.exports = config
```

Princípio orientador (recorrente na investigação): **eliminar a divergência com a documentação oficial, em vez de
mascarar o efeito.** Correções intermediárias (ex.: remover só `disableHierarchicalLookup` e manter o resto manual)
são rejeitadas por deixarem uma config **híbrida** (metade manual, metade automática), difícil de manter.

## Alternativas consideradas
- **Remover apenas `disableHierarchicalLookup`** (cirúrgico): rejeitada — mantém `watchFolders`/`nodeModulesPaths`
  manuais, config híbrida, divergente da oficial.
- **Manter a config manual e forçar hoisting de `expo-asset`**: rejeitada — trata o sintoma, mantém a divergência.
- **Adotar a config oficial (escolhida):** conformidade total com o ecossistema suportado, menor superfície de manutenção.

## Consequências
- Reduz divergência com o Expo SDK 52+; menos manutenção e menor risco de regressões futuras no bundle.
- A resolução de módulos aninhados (ex.: `expo-asset`) volta a funcionar via o resolver padrão do `getDefaultConfig`.
- Alinha-se a [[ADR-013]] (padrão oficial de versão do Node) e à diretriz de **seguir a documentação oficial** quando
  houver divergência demonstrada.
- Validação: ver **C-001** em MOBILE-005 (bundle JS · resolução de `expo-asset` · Dev Client · app carregando).
