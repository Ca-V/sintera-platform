# MOBILE-010 — Toolchain Windows / New Architecture: limitação de comprimento de caminho

- **Status:** **INVESTIGAÇÃO ABERTA** (2026-07-23)
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

**Componente identificado como limitante (fortemente evidenciado):** o **`ninja` 1.10.2**.
Fundamento: a mensagem *"Filename longer than 260 characters"* é emitida **pelo próprio ninja** (guarda interna
de `MAX_PATH` nas versões antigas), **não** pelo sistema operacional. Evidência de controle decisiva: o SO já
está com `LongPathsEnabled=1` (caminhos longos permitidos, verificado pós-reboot) e **ainda assim** o erro
persiste com a mensagem autoral do ninja — ou seja, o limite é imposto **dentro** da ferramenta, independente
da configuração do SO. Versões modernas do ninja (≥1.11) removeram/relaxaram essa guarda.

**Fator agravante (não causa):** o codegen C++ da New Architecture espelha o caminho absoluto da fonte dentro
do caminho do objeto (`.../react_codegen_safeareacontext.dir/C_/<caminho absoluto da fonte>/...`), o que
duplica o caminho do projeto e leva o total a **378 chars**.

## 3. Hipóteses de solução — OPERACIONAIS (a avaliar nesta ordem)

Nenhuma delas altera a arquitetura da aplicação.

| # | Solução | Efeito | Custo/risco |
|---|---------|--------|-------------|
| **S1** | **Atualizar o CMake do Android SDK** para versão que empacote **ninja ≥ 1.11** (ex.: CMake 3.31.x via SDK Manager) e apontar o AGP para ela | Remove a guarda artificial — o SO já permite caminhos longos | **Recomendada.** Instalação de componente first-party via SDK Manager; permanente; sem alterar workflow nem arquitetura |
| **S2** | Encurtar os caminhos: `subst` de uma letra de unidade para a raiz do projeto **+** relocar o `.cxx` (`externalNativeBuild.cmake.buildStagingDirectory`) | Reduz o total de ~378 → ~239 (< 260) | Funciona sem instalar nada, mas **frágil**: o `subst` precisa ser reaplicado/persistido e muda o caminho de trabalho dos builds; vira uma verruga permanente no runbook |
| S3 | Fornecer um `ninja` moderno via `CMAKE_MAKE_PROGRAM` | Mesmo efeito de S1 | Exige baixar binário avulso; menos rastreável que S1 |

**Critério de encerramento do MOBILE-010:** `assembleDebug` conclui sem o erro de MAX_PATH, com a New
Architecture mantida e sem alteração arquitetural.

## 4. Contingência arquitetural (NÃO é próximo passo)

> Caso esta investigação demonstre que a limitação decorre da cadeia de ferramentas **e** não exista solução
> operacional compatível com a arquitetura atual, será submetida uma **análise de impacto** para eventual
> alteração arquitetural (ex.: `newArchEnabled`). **Não** é o próximo passo e **não** está autorizada:
> as hipóteses operacionais S1–S3 devem ser esgotadas antes.
