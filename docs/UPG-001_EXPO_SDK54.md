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
- **Baseline (fase 1):** expo `53.0.27` · react-native `0.79.6` · `expo-asset`/`expo-constants` **ANINHADOS**.
- **Pós-upgrade (fase 3–4):** expo `54.0.36` · react `19.1.0` · react-native `0.81.5` · dev-client `6.0.21` · secure-store `15.0.8`.
- **Autolinking:** de **10 → 15** módulos; **`expo-asset` e `expo-constants` agora encontrados** (mesmo aninhados) — revamp do SDK 54.
- **Bloqueador intermediário (resolvido):** `Cannot find module 'babel-preset-expo'` — ver [[MOBILE-007]]; corrigido declarando o preset como devDep direta (commit `586dcfb`).

### Fase 7 — Validação (RESULTADO: 8/8 ✅)
| # | Item | Evidência |
|---|---|---|
| 1 | Build Gradle | ✅ BUILD SUCCESSFUL (22m11s inicial; 54s incremental pós-fix) |
| 2 | APK gerado/instalado | ✅ `app-debug.apk` instalado |
| 3 | Metro inicia | ✅ 8081 up |
| 4 | Bundle JS | ✅ `Android Bundled (690 modules)` |
| 5 | ExpoAsset runtime | ✅ sem `Cannot find native module 'ExpoAsset'` |
| 6 | ExpoConstants runtime | ✅ sem `No native ExponentConstants module found` |
| 7 | Hermes | ✅ `libhermes_executor_so` registrado |
| 8 | `main` registra + tela abre | ✅ `Running "main"` · **`MainActivity` em foreground** · app permanece vivo (66s+) |

**Observação não-fatal:** `ClassNotFoundException: expo.modules.splashscreen.SplashScreenManager` — `expo-splash-screen`
**não** é dependência do app; o DevLauncher apenas sonda opcionalmente e segue. Não bloqueia; app roda normalmente.

## Encerramento (fase 8)
**UPG-001 CONCLUÍDO** — 8/8 itens verdes; o app **executa no emulador**. Confirma na prática o [[ADR-015]] e valida o
[[ARCH-001]] (o autolinking do SDK 54 encontra módulos nativos aninhados). Encerra também [[MOBILE-006]] (ExpoAsset/
ExpoConstants presentes no runtime).
