// Metro do app móvel — CONFIGURAÇÃO OFICIAL do Expo SDK 52+ (ver ADR-014) + guard de INSTÂNCIA ÚNICA de React.
// No SDK 52+, o `expo/metro-config` configura o Metro AUTOMATICAMENTE para monorepos —
// nenhuma configuração manual (watchFolders / resolver.nodeModulesPaths /
// resolver.disableHierarchicalLookup) é necessária nem recomendada.
// Ref: https://docs.expo.dev/guides/monorepos/
//
// GUARD DE REACT ÚNICO (ADR-016) — SOLUÇÃO TEMPORÁRIA, não arquitetura definitiva.
// Válida ENQUANTO coexistirem React 19.2.x (Web/Next) e 19.1.x (Mobile/RN). Reavaliar/remover na
// convergência de versões ou evolução do monorepo (gatilho: qualquer bump de React). É um alias de
// resolução, não um princípio.
// Este monorepo fixa versões DIFERENTES de react POR PLATAFORMA —
//   • web  → react 19.2.4 (Next 16), na RAIZ node_modules;
//   • mobile → react 19.1.0 (RN 0.81.5 exige ESSA versão no react-native-renderer), em apps/mobile/node_modules.
// Pacotes RN hasteados para a raiz (expo-linear-gradient, @expo-google-fonts, expo-*) importam `react`
// e, por estarem na raiz, resolveriam a cópia 19.2.4 — carregando DUAS instâncias de React
// ("Invalid hook call" / "Incompatible React versions"). Forçamos TODA importação de `react`/`react/*`
// a resolver para a cópia do app (19.1.0) → uma única instância. Não altera hierarquia nem versões.
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

const upstreamResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    return { type: 'sourceFile', filePath: require.resolve(moduleName, { paths: [__dirname] }) }
  }
  return (upstreamResolveRequest ?? context.resolveRequest)(context, moduleName, platform)
}

module.exports = config
