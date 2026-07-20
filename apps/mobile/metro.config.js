// Metro do app móvel — CIENTE DO MONOREPO (resolve @sintera/* dos packages/*).
// Observa a raiz do workspace e procura node_modules do app e da raiz.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// 1) observar todo o monorepo (para pegar mudanças em packages/*)
config.watchFolders = [workspaceRoot]

// 2) resolver módulos do app e da raiz do workspace
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// 3) evitar duplicação de dependências (React, etc.) numa árvore hoisted
config.resolver.disableHierarchicalLookup = true

module.exports = config
