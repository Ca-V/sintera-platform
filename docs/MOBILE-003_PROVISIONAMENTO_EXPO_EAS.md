# MOBILE-003 — Guia de Provisionamento do Ambiente Expo/EAS

> **Natureza:** documento **operacional** (runbook). Não é implementação de produto nem evolução arquitetural.
> **Objetivo:** deixar o ambiente 100% pronto e **validado** para iniciar a **Onda 1 — Autenticação** (MOBILE-001)
> sem perda de tempo com configuração durante o desenvolvimento.
> **Fonte dos valores abaixo:** o próprio repositório (`apps/mobile/package.json`, `app.json`, `metro.config.js`,
> `tsconfig.json`, `.env.example`). Onde algo só existe após provisionar (ex.: `projectId` do EAS), está marcado.
> **Referências:** [MOBILE-001] (plano por ondas) · [MOBILE-002] (adaptador DS→RN) · [checkpoint_mobile_v1].
> **Ordem-alvo desta fase: Android primeiro** (gratuito, sem depender da conta Apple). iOS entra depois.

---

## 0. Pré-requisitos do ambiente

| Item | Versão/observação | Por quê |
|---|---|---|
| **Node.js** | **20.x LTS** | Expo SDK 53 exige Node 18+; usamos 20 LTS. |
| **Gerenciador de pacotes** | **npm** (workspaces) | O repo usa `package-lock.json` + `workspaces` na raiz. **Não** é pnpm/yarn. |
| **JDK** | **17** (Temurin/Adoptium) | React Native 0.79 exige JDK 17. |
| **Android Studio** | Última estável + **Android SDK Platform 35** (Android 15) e Platform 34 | Compilar/rodar o dev build e o emulador. |
| **Git** | qualquer recente | Já em uso. |
| **CMake (Android SDK)** | **4.1.2** (traz **ninja 1.12.1**) | **Obrigatório no Windows.** O default do AGP (CMake 3.22.1 / ninja 1.10.2) quebra o build da New Architecture com *"Filename longer than 260 characters"*. Instalar pelo SDK Manager; o projeto fixa a versão via Config Plugin. Ver §0.1. |
| **Long Paths (somente Windows)** | **`LongPathsEnabled=1`** + `git config core.longpaths true` | **Obrigatório** — porém **não suficiente sozinho** (precisa do CMake acima). Ver §0.1. |
| **Conta Expo** | criar em https://expo.dev | Dá acesso a EAS Build/Update/Submit. |
| **Conta Apple Developer** | https://developer.apple.com/programs/ — **só quando for testar em iPhone** | Provisionamento de device iOS. Criar já pela demora de aprovação. |
| **Conta Google Play Console** | https://play.google.com/console — criar já | Publicação Android futura. |

> **Importante:** NÃO instalar o `expo-cli` global (descontinuado). O Expo já é dependência **local** do app —
> use sempre **`npx expo …`** a partir de `apps/mobile`. Apenas o **`eas-cli`** é global.

### 0.1 Pré-requisito Windows — habilitar Long Paths (obrigatório antes de compilar)

**Sintoma sem esta configuração:** `Task :app:buildCMakeDebug[...] FAILED` → `ninja: error: Stat(...): Filename
longer than 260 characters`. **Causa:** a New Architecture (Fabric) do React Native gera caminhos de object
file C++ que, somados ao caminho do projeto no monorepo, ultrapassam o limite padrão de 260 caracteres do
Windows. Afeta módulos nativos com componentes Fabric (ex.: `react-native-screens`,
`react-native-safe-area-context`, introduzidos no Incremento 2 de Navegação).

**Passo 1 — habilitar caminhos longos no SO (necessário, porém NÃO suficiente sozinho):**
1. PowerShell **como Administrador**:
   ```
   reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f
   ```
2. **Reiniciar o Windows** (para todos os processos herdarem a mudança).
3. Git (por repositório, não exige admin): `git config core.longpaths true`.

**Passo 2 — instalar o CMake da baseline (OBRIGATÓRIO):**
Android Studio → `Settings` → `Languages & Frameworks` → `Android SDK` → aba **SDK Tools** →
marcar **"Show Package Details"** → em **CMake**, instalar **4.1.2** (ou superior **revalidada**) → **Apply**.

> O projeto **fixa** essa versão automaticamente via Config Plugin (ver §0.2) — você só precisa **instalá-la**.

### Baseline oficial da toolchain — versões mínimas suportadas

Combinação **validada experimentalmente** em 2026-07-23 (builds limpos e reproduzíveis, incl. `prebuild --clean`).
**Não reduzir nenhuma destas versões sem revalidar o build no Windows.**

| Componente | Versão validada |
|---|---|
| Android Studio | AI-261.25134.95.2612.15822958 |
| Android Gradle Plugin (AGP) | 8.11.0 |
| Gradle | 8.14.3 |
| JDK | OpenJDK 21.0.10 (JBR do Android Studio) |
| Android SDK Build Tools | 36.0.0 |
| Android Platform SDK | android-36 (compileSdk/targetSdk 36 · minSdk 24) |
| NDK | 27.1.12297006 |
| **CMake** | **4.1.2** ← mínimo suportado |
| **Ninja** | **1.12.1** (vem com o CMake 4.1.2) ← mínimo suportado |
| Expo SDK | 54 |
| React Native | 0.81.5 (New Architecture **ativa**) |
| Kotlin | 2.1.20 |
| Windows `LongPathsEnabled` | 1 |

**Por que o CMake é crítico:** o default do AGP (**CMake 3.22.1**) empacota **ninja 1.10.2**, cuja combinação
com o codegen da New Architecture em projeto Expo CNG produz caminhos de compilação incompatíveis, quebrando o
build no Windows com `ninja: error: Stat(...): Filename longer than 260 characters`. Habilitar `LongPathsEnabled`
**não** basta. Diagnóstico completo: [MOBILE-010](MOBILE-010_TOOLCHAIN_WINDOWS_NEW_ARCH.md).

### 0.2 Princípio operacional — NÃO editar `apps/mobile/android/` manualmente

> **Não editar manualmente arquivos dentro de `apps/mobile/android/`.** Em projetos **Expo CNG**, alterações
> persistentes na configuração nativa devem ser implementadas por **Config Plugins** ou por mecanismos
> oficialmente suportados pelo `expo prebuild`. Alterações diretas na pasta `android/` são **transitórias** e
> serão **sobrescritas** no próximo prebuild (a pasta é gerada e está no `.gitignore`).

Aplicação concreta: a versão do CMake é fixada pelo config plugin versionado
[`apps/mobile/plugins/withAndroidCmakeVersion.js`](../apps/mobile/plugins/withAndroidCmakeVersion.js),
registrado em `app.json` → `plugins`. Ele reaplica a configuração a cada prebuild — por isso a correção
**acompanha o repositório** e vale para qualquer desenvolvedor.

**Não** desabilitar a New Architecture: o problema é de **cadeia de ferramentas**, não de arquitetura — a
New Arch faz parte da baseline aceita (Incremento 1). Ver [[ADR-015]] (SDK 54) e
[MOBILE-010](MOBILE-010_TOOLCHAIN_WINDOWS_NEW_ARCH.md).

---

## 1. Softwares e versões usadas pelo projeto (já declaradas no repo)

- **Expo SDK** `~53.0.0` · **React Native** `0.79.0` · **React** `19.0.0`
- **New Architecture ATIVADA** (`app.json` → `newArchEnabled: true`)
- Módulos nativos já presentes: `expo-dev-client ~5.0.0`, `expo-secure-store ~14.0.0`, `expo-status-bar ~2.0.0`
- Identidade do app (`app.json`): `name: SINTERA` · `slug: sintera` · `scheme: sintera` ·
  **bundleIdentifier/package: `health.sintera.app`** · plugins `[expo-dev-client, expo-secure-store]`
- Pacotes compartilhados consumidos (workspace): `@sintera/{core, api-client, types, validation, design-system, config, utils}`
- **Runtime = Development Build (dev client)**, **não Expo Go** (o app tem módulos nativos que o Expo Go não carrega).

---

## 2. Instalação das dependências

Tudo a partir da **raiz do monorepo** (`sintera-platform`), por causa dos workspaces:

```bash
node -v          # esperado: v20.x
npm install      # na RAIZ — instala apps/mobile + packages/* de uma vez
```

Instalar o EAS CLI (global) e confirmar as CLIs:

```bash
npm install -g eas-cli
eas --version
npx expo --version   # roda o Expo LOCAL do projeto (não precisa instalar global)
```

---

## 3. Configuração do Expo e do EAS

```bash
# 1) Autenticar (uma vez por máquina)
eas login
eas whoami           # deve mostrar seu usuário Expo

# 2) A partir de apps/mobile, vincular o projeto ao EAS (gera o projectId)
cd apps/mobile
eas init             # cria/associa o projeto e grava extra.eas.projectId no app.json
```

Criar/ajustar o **`apps/mobile/eas.json`** com um perfil de **development build** (dev client, distribuição interna):

```jsonc
{
  "cli": { "version": ">= 12.0.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview":     { "distribution": "internal", "android": { "buildType": "apk" } },
    "production":  {}
  },
  "submit": { "production": {} }
}
```

> Se o `eas init`/`eas build:configure` já criar um `eas.json`, apenas garanta que o perfil **`development`**
> tenha `developmentClient: true` e `distribution: internal`.

---

## 4. Android Studio e emulador

1. Instalar **Android Studio** → no *SDK Manager*, marcar **Android SDK Platform 35** (e 34), **Android SDK
   Build-Tools**, **Platform-Tools** e **Android Emulator**.
2. Variáveis de ambiente (Windows — *Editar variáveis de ambiente do sistema*):
   - `ANDROID_HOME` = `C:\Users\<voce>\AppData\Local\Android\Sdk`
   - Adicionar ao `Path`: `%ANDROID_HOME%\platform-tools` e `%ANDROID_HOME%\emulator`
3. Instalar/confirmar o **JDK 17** e apontar `JAVA_HOME` para ele.
4. Criar um **emulador (AVD)**: *Device Manager* → um Pixel recente com **Android 14/15** (imagem do sistema com Google APIs).
5. Validar o ADB com o emulador aberto **ou** um aparelho físico (com *Depuração USB* ligada):

```bash
adb devices          # deve listar o emulador/dispositivo
```

> **Aparelho físico** é uma alternativa válida ao emulador — basta aparecer em `adb devices`.

---

## 5. Development Build (o runtime do app)

Dois caminhos — **escolha um**:

**A) Build local (mais rápido no dia a dia; exige Android Studio/JDK já configurados):**
```bash
cd apps/mobile
npx expo run:android      # compila e instala o dev build no emulador/dispositivo
```

**B) Build em nuvem (EAS; não exige toolchain Android local, mas fica em fila no plano free):**
```bash
cd apps/mobile
eas build --profile development --platform android
# ao terminar, baixe/instale o APK no emulador (arraste p/ a janela) ou no aparelho (link/QR)
```

Depois de instalado o dev build, iniciar o Metro e abrir no **dev client** (NÃO no Expo Go):
```bash
cd apps/mobile
npx expo start --dev-client     # ou: npm run start
# abra o app "SINTERA" (dev build) e conecte ao Metro (QR/lista)
```

---

## 6. Variáveis de ambiente

Base já existe em `apps/mobile/.env.example`. Copiar e preencher **apenas chaves públicas**:

```bash
cd apps/mobile
cp .env.example .env
```

`apps/mobile/.env`:
```
EXPO_PUBLIC_API_URL=<URL base da API da plataforma, se usada>
EXPO_PUBLIC_SUPABASE_URL=https://pxiglvrgxooawetboglb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon/public key do projeto Supabase>
```

Onde obter (Supabase → projeto `pxiglvrgxooawetboglb` → *Project Settings → API*): **Project URL** e **anon public key**.

> ⚠️ **Nunca** colocar a *Service Role key* no app nem no repositório. Só `EXPO_PUBLIC_*` (chaves públicas).
> O `.env` **não** é versionado (já coberto pelo `.gitignore` do app).

---

## 7. Critérios objetivos de validação do ambiente

Cada item deve passar **sem erro**:

| # | Comando / ação | Resultado esperado |
|---|---|---|
| 1 | `node -v` | `v20.x` |
| 2 | `npm install` (raiz) | conclui sem erro |
| 3 | `eas whoami` | mostra o usuário logado |
| 4 | `npx expo --version` | imprime a versão (Expo local) |
| 5 | `adb devices` | lista emulador/dispositivo |
| 6 | `apps/mobile` → `npm run typecheck` | `tsc --noEmit` **verde** (1ª vez que o RN type-checa de verdade) |
| 7 | `npx expo start --dev-client` | Metro sobe; resolve `@sintera/*` (monorepo) sem erro |
| 8 | abrir o dev build no device | app **SINTERA** abre (tela placeholder), sem *red screen* |
| 9 | `.env` lido pelo app | `EXPO_PUBLIC_SUPABASE_URL`/`ANON_KEY` acessíveis em runtime |

> O item **6** é o portão-chave: é a primeira validação executável do código RN (impossível no sandbox Windows).

---

## 8. Checklist final — liberar o início da Onda 1

- [ ] Node **20.x** instalado
- [ ] `npm install` na raiz concluído (workspaces OK)
- [ ] `eas-cli` instalado · `eas login`/`eas whoami` OK
- [ ] `eas init` feito (projectId gravado em `app.json`)
- [ ] `eas.json` com perfil **development** (`developmentClient: true`, `distribution: internal`)
- [ ] Android Studio + SDK 35/34 + JDK 17 · `ANDROID_HOME`/`Path` configurados
- [ ] Emulador (AVD) **ou** dispositivo físico aparecendo em `adb devices`
- [ ] **Development build** instalado (via `expo run:android` **ou** `eas build --profile development`)
- [ ] `apps/mobile/.env` preenchido com as chaves **públicas** do Supabase
- [ ] `npx expo start --dev-client` conecta e o app abre a tela placeholder
- [ ] `npm run typecheck` (em `apps/mobile`) **verde**
- [ ] Metro resolve `@sintera/*` sem erro de módulo

**Quando todos os itens estiverem marcados**, peça ao Claude para **validar o ambiente** (ele confere os
critérios da §7 no ambiente real). Só então o Claude **sai do standby** e inicia o **Incremento 1 — Autenticação**,
com o protocolo de sempre: implementação incremental · build verde · testes verdes · auditoria · validação
funcional executável · relatório executivo.

---

## 9. Sequência recomendada (visão da fundadora)

1. Criar a conta no **Expo** (em andamento).
2. Gerar o **MOBILE-003** (este documento). ✅
3. Seguir o documento passo a passo para configurar o ambiente.
4. Ao final, pedir ao Claude para **validar** que o ambiente está correto (§7).
5. Só então **tirar o Claude do standby** e iniciar o **Incremento 1 — Autenticação**.

---

[MOBILE-001]: ./MOBILE-001_PLANO_EXECUTIVO_RN.md
[MOBILE-002]: ./MOBILE-002_ADAPTADOR_DS_RN.md
[checkpoint_mobile_v1]: (memória do projeto — Checkpoint Mobile v1.0)
