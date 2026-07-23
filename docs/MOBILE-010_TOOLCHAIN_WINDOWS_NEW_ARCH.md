# MOBILE-010 — Toolchain Windows / New Architecture: limitação de comprimento de caminho

- **Status:** **CAUSA RAIZ CONFIRMADA** por fonte oficial (§2.1) — aguardando aplicação e **validação experimental** da solução S1 (atualizar o CMake do Android SDK). Investigação encerra quando o build passar.
- **Origem:** Incremento 2 (Navegação) — bloqueio na compilação nativa de `react-native-screens` / `react-native-safe-area-context`.
- **Investigação anterior (ENCERRADA):** hipótese "`LongPathsEnabled` isoladamente resolve" — **REJEITADA** (ver §1).
- **Relaciona-se com:** [MOBILE-009](MOBILE-009_PLANEJAMENTO_INCREMENTO2_NAVEGACAO.md) (R6) · [MOBILE-003 §0.1](MOBILE-003_PROVISIONAMENTO_EXPO_EAS.md) · [ADR-015](adr/ADR-015_MIGRACAO_EXPO_SDK54.md)

## Pergunta desta investigação

> **Qual componente da cadeia de build continua impondo a limitação de caminho de 260 caracteres?**

Não é mais "Long Paths funciona?" — essa pergunta está respondida (não, isoladamente).

## 1. Investigação anterior — encerrada (hipótese rejeitada)

**Hipótese:** habilitar `LongPathsEnabled` (+ reboot) elimina o erro de MAX_PATH. → **REJEITADA.**

| # | Fato verificado | Evidência |
|---|-----------------|-----------|
| 1 | `LongPathsEnabled=1` aplicado e **persistente após reboot** | leitura do registro pré e pós-reboot |
| 2 | Todos os daemons Gradle/Java encerrados (0 processos) antes de rebuildar | contagem de processos = 0 |
| 3 | Build **falha igual** com daemons frescos **sem** reboot | build #2 |
| 4 | Build **falha igual** após **reboot completo** | build #3 (pós-reboot) |
| 5 | Hipótese "daemon obsoleto" | **rejeitada** por (2)+(3) |
| 6 | Hipótese "mover o repositório resolve" | **rejeitada por cálculo**: a estrutura *fixa* do caminho (excluindo as 2 ocorrências do caminho do projeto) já soma **262 chars** > 260 |

**Conclusão da investigação anterior:** a limitação **não** é do sistema operacional (o SO já permite caminhos longos) nem de estado de processo. Encerrada.

## 2. Caracterização atual (fatos)

**Erro observado (constante nas 3 execuções):**
```
ninja: error: Stat(safeareacontext_autolinked_build/CMakeFiles/react_codegen_safeareacontext.dir/
C_/.../RNCSafeAreaViewShadowNode.cpp.o): Filename longer than 260 characters
Task :app:buildCMakeDebug[arm64-v8a] FAILED
```

**Cadeia de build instalada:**

| Componente | Versão | Observação |
|---|---|---|
| **ninja** | **1.10.2** | bundled em `Sdk/cmake/3.22.1/bin/ninja.exe` — **emissor da mensagem de erro** |
| CMake (Android SDK) | 3.22.1 | única versão instalada |
| Android NDK | 27.1.12297006 | |
| Gradle | 8.14.3 | |
| AGP | (padrão do Expo SDK 54) | |
| React Native | 0.81.5 (New Arch / Fabric) | gera o codegen C++ `react_codegen_*` |

### 2.1 Causa raiz — CONFIRMADA por fonte oficial

> **O bug está no `ninja` 1.10, empacotado no CMake 3.22.1 — que é o default do Android Gradle Plugin.**

Declaração do mantenedor do Expo (**@zoontek**) ao encerrar a issue oficial
[expo/expo#36274](https://github.com/expo/expo/issues/36274):

- O Expo **não controla** qual versão de ninja/CMake o desenvolvedor recebe;
- **CMake 3.22.1 (default do AGP) empacota ninja 1.10, que contém o bug**;
- **CMake 3.30.x, 3.31.x e 4.x** (disponíveis no Android SDK) trazem **ninja 1.12+ com a correção**;
- Conclusão do time: *"There's nothing we can change on our side"* → a correção é **atualizar o CMake do Android SDK**.

**Consistência com nossos experimentos:** a mensagem é emitida pelo próprio ninja; o SO já estava com
`LongPathsEnabled=1` (verificado pós-reboot) e o erro persistiu — exatamente o comportamento esperado de um
bug **interno da ferramenta**, não do SO. Nossa evidência local e a fonte oficial convergem.

**Por que ocorre aqui e não em todo projeto (evidência de cálculo):** a estrutura *fixa* do caminho do objeto
soma **262 chars** neste monorepo (≈250 num projeto não-monorepo). Somando o caminho do projeto (58 chars,
`...\OneDrive\Desktop\SINTERA\sintera-platform`, contado **duas vezes** pelo espelhamento do codegen), chega-se
a **378**. Projetos rasos (`C:\a`) ficam perto do limite e às vezes passam; projetos profundos (OneDrive/Desktop
+ monorepo) estouram sempre. Isso explica por que o problema é **recorrente e amplamente reportado** no
ecossistema Windows — há issues abertas em `react-native-screens` (#3471), `react-native-safe-area-context`
(#424), `react-native-keyboard-controller` (#1247, #931), RocketChat (#6923) e Expo (#36274) — **sem ser
universal**.

**Fator agravante (não causa):** o codegen C++ da New Architecture espelha o caminho absoluto da fonte dentro
do caminho do objeto (`.../react_codegen_safeareacontext.dir/C_/<caminho absoluto da fonte>/...`), o que
duplica o caminho do projeto e leva o total a **378 chars**.

## 3. Hipóteses de solução — OPERACIONAIS (a avaliar nesta ordem)

Nenhuma delas altera a arquitetura da aplicação.

| # | Solução | Efeito | Custo/risco |
|---|---------|--------|-------------|
| **S1** | **Atualizar o CMake do Android SDK** para uma versão disponibilizada oficialmente pelo SDK Manager que empacote **ninja 1.12+** (o mantenedor do Expo cita **3.30.x / 3.31.x / 4.x**) e apontar o AGP para ela | Corrige o bug na origem | **ADOTADA.** Componente **first-party**, sustentada por fonte oficial (§2.1); permanente e reprodutível; sem workaround, sem alterar workflow nem arquitetura |
| S2 | Encurtar caminhos: `subst` + relocar o `.cxx` (`buildStagingDirectory`) | ~378 → ~239 | **Apenas contingência.** Frágil: `subst` reaplicado a cada reboot e muda o caminho de trabalho — verruga permanente no runbook |
| S3 | Substituir manualmente o `ninja.exe` na pasta do CMake | Mesmo efeito de S1 | Binário avulso fora do SDK Manager; menos rastreável/reprodutível que S1 |
| — | Mover o repositório | **Não resolve** | Rejeitado por cálculo (§2.1): estrutura fixa 262 chars → total > 260 mesmo em caminho mínimo |
| — | Desabilitar a New Architecture | Contorna | **Não autorizado.** Alterar arquitetura para contornar limitação de infraestrutura (ver §4) |

**Procedimento S1 (a executar):**
1. Android Studio → `Settings` → `Languages & Frameworks` → `Android SDK` → aba **SDK Tools** →
   **"Show Package Details"** → **CMake**: instalar a versão mais recente oferecida oficialmente.
2. Apontar o AGP para ela (`android { externalNativeBuild { cmake { version "<versão>" } } }`).
3. **Validar experimentalmente** que o erro desaparece (não presumir).

**Critério de encerramento do MOBILE-010:** `assembleDebug` conclui sem o erro de MAX_PATH, com a New
Architecture mantida, sem alteração arquitetural e **com a versão da toolchain validada e registrada** no
runbook ([MOBILE-003](MOBILE-003_PROVISIONAMENTO_EXPO_EAS.md)) como versão mínima.

## 3.1 Fontes

- [expo/expo#36274](https://github.com/expo/expo/issues/36274) — **fonte primária**: resposta do mantenedor
  (@zoontek) atribuindo o bug ao ninja 1.10 do CMake 3.22.1 (default do AGP) e indicando CMake 3.30.x/3.31.x/4.x
  (ninja 1.12+) como correção.
- [software-mansion/react-native-screens#3471](https://github.com/software-mansion/react-native-screens/issues/3471) — mesmo erro, RN 0.81 / CMake 3.22.x / NDK 27.x.
- [AppAndFlow/react-native-safe-area-context#424](https://github.com/AppAndFlow/react-native-safe-area-context/issues/424) — mesmo erro no pacote exato que falha aqui.
- [react-native-keyboard-controller — Troubleshooting](https://kirillzyusko.github.io/react-native-keyboard-controller/docs/troubleshooting) — procedimento comunitário (ninja atualizado + CMake 3.31.1 no `build.gradle` + Long Paths), consistente com S1.
- [ninja-build/ninja#2359](https://github.com/ninja-build/ninja/issues/2359), [#1900](https://github.com/ninja-build/ninja/issues/1900) — histórico do limite de `MAX_PATH` no ninja.

## 4. Contingência arquitetural (NÃO é próximo passo)

> Caso esta investigação demonstre que a limitação decorre da cadeia de ferramentas **e** não exista solução
> operacional compatível com a arquitetura atual, será submetida uma **análise de impacto** para eventual
> alteração arquitetural (ex.: `newArchEnabled`). **Não** é o próximo passo e **não** está autorizada:
> as hipóteses operacionais S1–S3 devem ser esgotadas antes.
