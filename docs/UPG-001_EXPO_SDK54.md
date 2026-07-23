# UPG-001 — Protocolo de migração para Expo SDK 54

> **Natureza:** protocolo de execução + validação da decisão [[ADR-015]]. Continuidade operacional ([[ADR-012]]).
> **Branch:** `upg/expo-sdk-54` (a partir da branch de investigação: override removido + [[ADR-014|metro oficial]]).
> **Princípio:** não é upgrade "direto" — é experimento com validação por etapas, para saber **exatamente** em que
> fase algo mudar, caso haja regressão.

## Fases
1. **Snapshot** do estado atual (commit/branch de retorno).
2. **Branch exclusiva** (`upg/expo-sdk-54`).
3. **Upgrade do SDK** (`expo@^54`).
4. **`expo install --fix`** (alinhar RN + módulos ao SDK 54).
5. **Regeneração do Android** (`prebuild --clean`).
6. **Rebuild completo** (limpo).
7. **Validação** — cada item registrado (pass/fail + evidência):
   - Metro (bundle conclui, sem `Unable to resolve`)
   - Autolinking (módulos esperados presentes, incl. asset/constants)
   - Gradle (`gradlew projects` sem "could not be found")
   - APK (instala)
   - Runtime (app inicia e **permanece**; sem `ClassNotFound`/`Cannot find native module`)
   - Hermes (engine JS OK)
   - **ExpoAsset** (módulo nativo presente)
   - **ExpoConstants** (módulo nativo presente)
8. **Encerramento** (atualizar ADR-015 com o resultado prático).

## Critério de sucesso
Todos os itens da fase 7 verdes. Em especial: a **topologia** deixa de aninhar módulos nativos **OU** o autolinking do
SDK 54 passa a encontrá-los mesmo aninhados (qualquer dos dois satisfaz [[ARCH-001|INV-DEP-001]] no nível do produto).

## Registro de execução
*(preenchido durante a execução — versões antes/depois, localização de `expo-asset`/`expo-constants`, resultado de
cada item da fase 7.)*

- **Baseline (fase 1):** expo `53.0.27` · react-native `0.79.6` · `expo-asset`/`expo-constants` **ANINHADOS** em `node_modules/expo/node_modules`.
