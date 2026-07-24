# MOBILE-010 — Toolchain Windows / New Architecture: limitação de comprimento de caminho

- **Status:** ✅ **ENCERRADO — VALIDADO** (2026-07-23)

## 0. Escopo da validação (leia primeiro)

> **Esta investigação valida exclusivamente a correção do problema de compilação da toolchain Android
> (CMake/Ninja).** A autenticação foi exercitada **até o fluxo de erro** (credenciais inválidas), confirmando
> a integridade da pilha nativa e de comunicação. O **fluxo autenticado (Login → Home → Logout) permanece
> coberto pelos critérios de aceite do Incremento 2** (critério 11) e será revalidado durante essa etapa.

Declaração deliberada de limite: **não se afirma** que o fluxo autenticado foi testado nesta investigação.

### Critérios de encerramento

| # | Critério | Resultado |
|---|----------|-----------|
| 1 | Build limpo (*cold build*) concluído com sucesso | ✅ 3 builds independentes: 3m20s · **Cold Provisioning** 3m32s · **`prebuild --clean`** 2m37s |
| 2 | Nenhuma ocorrência de `Filename longer than 260 characters` | ✅ **0 ocorrências** em todos os logs |
| 3 | Aplicativo inicia normalmente | ✅ inicia e renderiza; **sem crashes nativos** |
| 4 | Sem regressão funcional vs. Incremento 1 | ✅ **no escopo validado** (§0): gate de sessão operante, `expo-secure-store` funcional, comunicação com o Supabase e tratamento de erro na UI íntegros. Fluxo autenticado → Incremento 2, critério 11 |

**Evidência do critério 4 (teste negativo de autenticação, sem credenciais reais):** credencial inexistente →
erro real retornado pelo Supabase → *"Credenciais inválidas. Verifique e tente novamente."* exibido na UI.
Isso demonstra que, após a troca da toolchain, o app inicializa, o **gate de autenticação funciona**, o módulo
nativo **`expo-secure-store` está operacional** (o `getSession()` resolveu — caso contrário o app ficaria preso
no estado de carregamento), a **comunicação com o Supabase ocorre** e o **tratamento de erro na UI permanece
funcional**. A pilha de autenticação está íntegra **até o ramo de erro**.

### Observação ambiental (registrada separadamente — sem relação causal com esta correção)

Durante o teste negativo ocorreu um **ANR** no app. Diagnóstico por log:
`ANR ... Reason: Input dispatching timed out (Waited 5006ms for KeyEvent)` concomitante a
`lowmemorykiller: Kill 'android.process.media' ... reason: low watermark is breached` (e mais 3 processos do
sistema mortos por falta de memória). Verificação explícita: **0** ocorrências de `FATAL EXCEPTION`, `SIGABRT`,
`SIGSEGV`, `UnsatisfiedLinkError`, `NativeModule not found`, `Cannot find native module`, `libc Fatal`. As
entradas de `tombstoned` referentes ao PID do app são do tipo **`kDebuggerdJavaBacktrace`** — mecanismo padrão
de coleta de stack do **ANR**, não um crash. **O processo permaneceu vivo.**
**Classificação: problema do ambiente de teste (AVD com pouca memória), não regressão da correção da
toolchain.** Ação recomendada (fora deste documento): aumentar a RAM do AVD antes da validação do Incremento 2.

### Critério de reabertura

> O MOBILE-010 somente deve ser reaberto se um desenvolvedor conseguir reproduzir o erro
> `Filename longer than 260 characters` **utilizando a baseline oficial da toolchain e seguindo integralmente
> o runbook do projeto**. Falhas decorrentes de desvios da baseline ou de configurações locais **não**
> caracterizam regressão do defeito.
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

### 2.1 Causa raiz identificada (formulação precisa)

> **Causa raiz (formulação oficial):** a combinação da **toolchain Android padrão (CMake 3.22.1 / Ninja 1.10.2)**
> com a **geração de código da React Native New Architecture** em um **projeto Expo CNG** produzia caminhos de
> compilação incompatíveis com essa toolchain. A atualização para **CMake 4.1.2 / Ninja 1.12.1**, aplicada de
> forma **persistente por meio de um Config Plugin do Expo**, eliminou o problema e foi **validada em builds
> limpos e reproduzíveis**.

O defeito **emerge da interação** de quatro fatores — toolchain padrão · Windows · codegen da New
Architecture · profundidade do caminho do projeto — e **não** de um único componente isolado. Não é correto
afirmar "o Ninja 1.10 é a causa raiz": ele é o ponto onde a falha se manifesta e o elemento cuja atualização
é apontada como remédio, mas isoladamente não explica o fenômeno.

Declaração do mantenedor do Expo (**@zoontek**) ao encerrar a issue oficial
[expo/expo#36274](https://github.com/expo/expo/issues/36274):

- O Expo **não controla** qual versão de ninja/CMake o desenvolvedor recebe;
- **CMake 3.22.1 (default do AGP) empacota ninja 1.10, que contém o bug**;
- **CMake 3.30.x, 3.31.x e 4.x** (disponíveis no Android SDK) trazem **ninja 1.12+ com a correção**;
- Conclusão do time: *"There's nothing we can change on our side"* → a correção é **atualizar o CMake do Android SDK**.

> ✅ **VALIDAÇÃO EXPERIMENTAL (2026-07-23) — hipótese confirmada, agora é fato.**
> A substituição da toolchain baseada em **CMake 3.22.1 / Ninja 1.10.2** por **CMake 4.1.2 / Ninja 1.12.1**
> **eliminou o erro `Filename longer than 260 characters`** em builds limpos, **mantendo inalterados o projeto
> e a arquitetura** (New Architecture ativa, nenhuma dependência removida, nenhum workaround de caminho).
>
> Evidência direta medida neste ambiente:
> - `Sdk/cmake/3.22.1/bin/ninja.exe --version` → **1.10.2** (build FALHA)
> - `Sdk/cmake/4.1.2/bin/ninja.exe --version` → **1.12.1** (build PASSA)
> - Build limpo com CMake 4.1.2: **BUILD SUCCESSFUL in 3m 20s**, **0 ocorrências** de "260 characters" no log;
>   `react-native-safe-area-context` e `react-native-screens` compilaram; APK instalado e app executando.

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

### ✅ Solução oficial ADOTADA (única)

**Atualizar o CMake do Android SDK** para uma versão oficialmente disponibilizada pelo SDK Manager que
empacote **ninja 1.12+**, e **persistir a configuração via Config Plugin do Expo** (obrigatório em projeto
CNG — ver §3.2). Componente **first-party**, sustentado por fonte oficial (§2.1), permanente e reprodutível.
**Versão validada: CMake 4.1.2 / Ninja 1.12.1.**

### ❌ Alternativas avaliadas e REJEITADAS — não fazem parte da solução oficial

Registradas apenas como histórico da investigação. **Nenhuma deve ser adotada**; não constam do runbook.

| Alternativa | Por que foi rejeitada |
|---|---|
| `subst` de unidade + relocar o `.cxx` | Workaround operacional frágil: exigiria reaplicação a cada reboot e mudaria o caminho de trabalho dos builds — verruga permanente no processo |
| Substituir manualmente o `ninja.exe` | Binário avulso fora do SDK Manager; não rastreável nem reprodutível |
| Mover o repositório para caminho curto | **Não resolve** — rejeitado por cálculo (§2.1): a estrutura fixa soma 262 chars, logo o total excede 260 mesmo em caminho mínimo |
| Desabilitar a New Architecture | Alterar decisão **arquitetural** para contornar limitação de **infraestrutura**. Não autorizado (§4) |

### Definição da solução (formulação correta)

> **Atualizar a toolchain Android para uma versão oficialmente suportada cuja combinação CMake/Ninja elimine
> este defeito, validando experimentalmente o resultado.**

O que interessa ao projeto **não é o número da versão**, e sim a **combinação validada**. Por isso o
procedimento termina em medição, não em pressuposto.

**Procedimento executado:**
1. ✅ Android Studio → `SDK Tools` → *Show Package Details* → **CMake 4.1.2** instalado.
2. ✅ AGP apontado para ela — **via Config Plugin** (§3.2), não por edição manual.
3. ✅ **Validado experimentalmente** (3 builds, incl. `prebuild --clean`).
4. ✅ Baseline registrada no runbook [MOBILE-003](MOBILE-003_PROVISIONAMENTO_EXPO_EAS.md).

### 3.2 Persistência da configuração — Config Plugin (mecanismo oficial)

**Descoberta crítica:** `apps/mobile/android/` é **gerado por `expo prebuild`** e está no `.gitignore`
(projeto **Expo CNG**). Uma edição manual em `android/app/build.gradle`:
- **não é versionada** (outro desenvolvedor não a recebe);
- é **destruída no próximo `prebuild`**.

Ou seja, funcionaria na máquina e **desapareceria no projeto** — falha de continuidade operacional.

**Mecanismo oficial adotado:** config plugin próprio e versionado
[`apps/mobile/plugins/withAndroidCmakeVersion.js`](../apps/mobile/plugins/withAndroidCmakeVersion.js),
registrado em `app.json` → `plugins`. Ele injeta
`android { externalNativeBuild { cmake { version "4.1.2" } } }` no `build.gradle` **a cada prebuild**
(idempotente; falha explicitamente se a âncora `android {` mudar de forma).

*Nota:* `expo-build-properties` **não** possui opção de CMake nem aceita gradle properties arbitrárias
(confirmado na documentação oficial) — daí o plugin próprio.

**Prova de reprodutibilidade:** `expo prebuild --clean` apagou e regenerou `android/` do zero; o
`app/build.gradle` gerado veio com `version "4.1.2"` injetado, e o build subsequente passou (2m37s).

### Baseline de toolchain — tabela completa

> O build Android **não depende só do CMake**. Sem registrar a cadeia inteira, daqui a alguns meses outro
> desenvolvedor pode instalar um NDK ou um AGP diferente e **reproduzir o defeito**. Por isso a baseline
> oficial é a **combinação**, não um componente.

*(coluna "Validada" preenchida SOMENTE após o build passar + Cold Provisioning Validation)*

| Componente | Ambiente que FALHA | **Baseline VALIDADA** |
|---|---|---|
| Android Studio | AI-261.25134.95.2612.15822958 | **AI-261.25134.95.2612.15822958** |
| Android Gradle Plugin (AGP) | 8.11.0 | **8.11.0** *(verificado via `gradlew buildEnvironment`)* |
| Gradle | 8.14.3 | **8.14.3** |
| JDK | OpenJDK 21.0.10 (JBR do Android Studio) | **OpenJDK 21.0.10 (JBR)** |
| Android SDK Build Tools | 35.0.0 / 36.0.0 | **36.0.0** |
| Android Platform SDK | android-35, android-36 | **android-36** (compileSdk/targetSdk 36 · minSdk 24) |
| NDK | 27.1.12297006 | **27.1.12297006** |
| **CMake** | **3.22.1 — DEFEITUOSA** (default do AGP) | **4.1.2** ✅ |
| **Ninja** | **1.10.2 — DEFEITUOSA** | **1.12.1** ✅ |
| Expo SDK | 54 (`expo ^54.0.0`) | **54** |
| React Native | 0.81.5 (New Architecture **ativa**) | **0.81.5 (New Arch ativa)** |
| Kotlin | 2.1.20 | **2.1.20** |
| Windows `LongPathsEnabled` | 1 (necessário, **não suficiente** isoladamente) | **1** |
| **Validado em** | — | **2026-07-23** · build limpo + Cold Provisioning · 0 erros de MAX_PATH |

> **Única variável alterada entre o ambiente que falha e a baseline validada: CMake 3.22.1 → 4.1.2
> (e, por consequência, ninja 1.10.2 → 1.12.1).** Todo o resto permaneceu idêntico — o que isola
> experimentalmente o fator determinante.
>
> **Como fixar no projeto:** `apps/mobile/android/app/build.gradle` →
> `android { externalNativeBuild { cmake { version "4.1.2" } } }`. Sem isso, o AGP volta ao default 3.22.1
> e o defeito reaparece.

### Cold Provisioning Validation (obrigatória antes de encerrar)

Passar o build **não basta**: pode haver dependência de cache ou estado residual. Antes do encerramento,
executar um build **do zero**:

1. Apagar completamente: `apps/mobile/android/.gradle`, `apps/mobile/android/app/.cxx`,
   `apps/mobile/android/build`, `apps/mobile/android/app/build` e os caches de build relevantes.
2. Rodar o build limpo.
3. **Critério:** compila normalmente do zero.

Isso valida que **(a)** não há dependência de cache, **(b)** não há estado residual, **(c)** a baseline é
**realmente reproduzível** por outro desenvolvedor.

### Critério de encerramento do MOBILE-010

Todos obrigatórios: `assembleDebug` sem erro de MAX_PATH · New Architecture mantida · sem alteração
arquitetural · **Cold Provisioning Validation aprovada** · **baseline completa registrada** no runbook
[MOBILE-003](MOBILE-003_PROVISIONAMENTO_EXPO_EAS.md) · **§5 (as cinco perguntas) respondida**.

## 5. Encerramento — as cinco perguntas

**1. Qual era o problema?**
O build nativo Android falhava em `:app:buildCMakeDebug` com
`ninja: error: Stat(...): Filename longer than 260 characters`, ao compilar os módulos nativos
`react-native-safe-area-context` e `react-native-screens` (introduzidos no Incremento 2 — Navegação).
O build **nem chegava** ao código de navegação: a falha era na cadeia Gradle → CMake → Ninja → codegen C++.

**2. Qual era a causa raiz?**
A **combinação** da toolchain Android distribuída por padrão (**CMake 3.22.1 + Ninja 1.10.2**, default do AGP)
com o **padrão de geração de caminhos do codegen da New Architecture**, em um projeto cujo caminho total
excede 260 caracteres. O codegen espelha o caminho absoluto da fonte **dentro** do caminho do objeto,
contando o caminho do projeto **duas vezes** (378 chars no total). Nenhum componente isolado explica o
fenômeno — ele emerge da interação de: toolchain padrão · Windows · codegen da New Arch · profundidade do
caminho do projeto.

**3. Como foi comprovada?**
Por **eliminação controlada de variáveis** + **evidência externa** + **validação experimental**:
- Rejeitada "daemon Gradle obsoleto" → daemons zerados (0 processos), erro idêntico.
- Rejeitada "`LongPathsEnabled=0`" → habilitado e **reboot completo**, erro idêntico (logo o limite não é do SO).
- Rejeitada "mover o repositório" → **por cálculo**: a estrutura fixa do caminho soma 262 chars, então o total
  excede 260 mesmo num caminho de projeto mínimo.
- Corroboração externa: relatos independentes com o mesmo padrão de falha
  ([expo#36274](https://github.com/expo/expo/issues/36274), [screens#3471](https://github.com/software-mansion/react-native-screens/issues/3471),
  [safe-area-context#424](https://github.com/AppAndFlow/react-native-safe-area-context/issues/424)) e declaração
  do mantenedor do Expo atribuindo o defeito ao ninja 1.10 do CMake 3.22.1.
- **Validação experimental decisiva:** trocando **apenas** o CMake (3.22.1 → 4.1.2, ninja 1.10.2 → 1.12.1),
  com todo o resto idêntico, o build passou (**BUILD SUCCESSFUL**, 0 ocorrências do erro).

**4. Qual combinação de versões elimina o problema?**
A tabela **Baseline de toolchain** (§3) — em especial **CMake 4.1.2 / Ninja 1.12.1**, mantendo NDK
27.1.12297006, AGP 8.11.0, Gradle 8.14.3, JDK 21, Expo SDK 54, RN 0.81.5 com **New Architecture ativa**.

**5. Como outro desenvolvedor reproduz essa solução?**
1. Habilitar `LongPathsEnabled=1` no Windows + reboot (necessário, não suficiente) — [MOBILE-003 §0.1](MOBILE-003_PROVISIONAMENTO_EXPO_EAS.md).
2. Android Studio → SDK Tools → *Show Package Details* → instalar **CMake 4.1.2** (ou superior validada).
3. O projeto já fixa a versão em `apps/mobile/android/app/build.gradle`
   (`externalNativeBuild { cmake { version "4.1.2" } }`) — **não reduzir sem revalidar**.
4. Build limpo (`.gradle`, `build`, `app/build`, `app/.cxx` apagados) → deve compilar sem erro de MAX_PATH.

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
