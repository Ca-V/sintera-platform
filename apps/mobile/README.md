# @sintera/mobile — Plataforma móvel SINTERA (produto principal)

App **React Native + Expo (Development Client)**, dentro do monorepo, consumindo `@sintera/*`. Nasce como **plataforma**
(infra/arquitetura/DS/navegação/estado/sincronização/observabilidade **antes** das funcionalidades) — [[ARCH-002]] · HIP-011/012.

## Estrutura de módulos (por DOMÍNIO, não por telas)
```
src/
  app/            raiz e provedores (estado, navegação, DS)
  presentation/   telas e componentes ORGANIZADOS POR DOMÍNIO (Passo 2)
  navigation/     navegação principal (Passo 4)
  domain/         regras/entidades do app; consome @sintera/core
  infrastructure/ http, armazenamento seguro, config, observabilidade
  state/          estado global — estratégia oficial (Passo 5)
  sync/           fila offline, cursores, ingestão de Observações (HIP-009)
  integrations/   capacidades nativas (Apple Health/Health Connect) e conectores — futuro
  design-system/  tokens/componentes-base; consome @sintera/design-system (Passo 3)
  shared/         componentes/utilidades reutilizáveis entre domínios
```

## Integração com o monorepo
- Depende de `@sintera/{core,api-client,types,validation,design-system,config,utils}` (workspace).
- `metro.config.js` é ciente do monorepo (observa a raiz; resolve os pacotes).
- `tsconfig.json` mapeia os pacotes (`paths`).

## Como rodar (ambiente de desenvolvimento — requer SDKs móveis)
> **Este app NÃO roda no ambiente de CI/documentação (Windows sem Xcode/Android SDK).** Rodar exige uma máquina de dev.
1. Ativar o app no workspace: incluir `"apps/*"` em `workspaces` (raiz) — mantido **fora** por segurança até validar deps.
2. `npm install` na raiz (instala Expo/RN; validar alinhamento do React com a web — React 19).
3. `npm --workspace @sintera/mobile run start` (Expo Dev Client) · `run android` / `run ios` (ou EAS Build).

## Estado (Passo 1)
Scaffold para revisão. Sem funcionalidade de negócio. **Deps do Expo/RN ainda não instaladas no workspace** (proteção do
deploy web em produção) — ativação e validação no ambiente de dev após aprovação do Passo 1.
