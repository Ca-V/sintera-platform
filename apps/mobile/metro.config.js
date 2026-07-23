// Metro do app móvel — CONFIGURAÇÃO OFICIAL do Expo SDK 52+ (ver ADR-014).
// No SDK 52+, o `expo/metro-config` configura o Metro AUTOMATICAMENTE para monorepos —
// nenhuma configuração manual (watchFolders / resolver.nodeModulesPaths /
// resolver.disableHierarchicalLookup) é necessária nem recomendada.
// Ref: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

module.exports = config
