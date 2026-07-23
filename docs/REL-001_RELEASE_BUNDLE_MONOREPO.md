# REL-001 — Android Release Bundle em Monorepo (gate de distribuição)

> **Natureza:** pendência de **pipeline de build/distribuição** — **não** é bug do aplicativo. Continuidade ([[ADR-012]]).
> **Status: GATE PENDENTE** — **não bloqueia o desenvolvimento** (debug builds OK); **obrigatório resolver antes da
> primeira versão destinada às lojas** (release build). Investigação detalhada **adiada** até a fase de distribuição.

## Contexto
Durante a Release Review da migração SDK 54 ([[UPG-001]]), o **debug build** foi validado (app roda), mas o
**`gradlew :app:assembleRelease`** **falhou**.

## Sintoma (evidência)
```
BUILD FAILED
Error: Unable to resolve module ./index.ts from C:\...\sintera-platform/.
None of these files exist:
  * ..\..\index.ts
```
O bundle **release** (que embute o JS no APK) resolve o entry (`index.ts`) a partir da **raiz do workspace**
(`sintera-platform/`) em vez de `apps/mobile/` → não encontra. O **debug funciona** porque o Metro dev server usa o
`projectRoot` correto.

## Domínio (o que NÃO é)
- **Não** é `ExpoAsset`/`ExpoConstants` (já presentes no runtime — MOBILE-006 resolvido).
- **Não** é autolinking (resolvido pelo SDK 54).
- **Não** é SDK 54 nem dependências.
É outro domínio: **configuração do processo de bundle de Release em monorepo** — provavelmente `entryFile` /
`projectRoot` / `root` no `react { }` do `android/app/build.gradle`, ou o CWD do bundle task.

## Hipóteses (a testar quando a investigação for aberta — não agora)
- `entryFile`/`root` do bundle release apontando para o workspace root em vez de `apps/mobile`.
- CWD do task `createBundleReleaseJsAndAssets` no monorepo.
- Necessidade de config específica de monorepo para o bundle embutido (distinta do Metro dev server).

## Plano
1. **Adiado** — não investigar agora (só afeta distribuição, não desenvolvimento).
2. Resolver **antes da primeira versão destinada às lojas** (fim/pós Onda 1), com protocolo de diagnóstico como os
   anteriores (evidência → hipótese → correção mínima → validação).
3. Critério de fechamento: `assembleRelease` produz APK release funcional (bundle embutido resolve o entry).

## Relação com a governança
Coerente com a decisão da fundadora de configurar **distribuição/contas de loja somente após a 1ª versão navegável**
(fim da Onda 1). O release build é pré-requisito de **loja**, não de **desenvolvimento**.
