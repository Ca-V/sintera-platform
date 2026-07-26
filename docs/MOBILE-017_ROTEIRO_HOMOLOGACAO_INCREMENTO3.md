# MOBILE-017 — Roteiro de Homologação do Incremento 3 (Home Shell)

- **Status:** Pronto para execução (2026-07-24). Executar **após** o upgrade de RAM (Fase 2) ou quando o
  emulador estiver acessível. Objetivo: validação rápida e **reproduzível** do Incremento 3.
- **Relaciona-se com:** [MOBILE-014](MOBILE-014_PLANEJAMENTO_INCREMENTO3_HOME.md) (critérios) · [ADR-018](adr/ADR-018_HOME_COMPOSICAO_DE_SLOTS.md) · [MOBILE-011](MOBILE-011_ESTABILIDADE_AMBIENTE_VALIDACAO_ANDROID.md) (ambiente).
- **Divisão de papéis:** a **fundadora digita as credenciais** (o agente não digita senhas para autenticar); o **agente conduz** o resto via `adb` e coleta evidências.

## 1. Pré-requisitos

- [ ] (Fase 2) 16 GB instalados; AVD `Pixel_8` com `hw.ramSize=4096`; cold boot — ou o AVD atual (3072), aceitando ruído de ANR do host.
- [ ] Emulador `emulator-5554` com boot completo (`sys.boot_completed=1`).
- [ ] Metro rodando na 8081 (`curl localhost:8081/status` → `packager-status:running`).
- [ ] **`adb reverse tcp:8081 tcp:8081` ativo** (some a cada cold boot — refazer; ver [MOBILE-003 §0.1]).
- [ ] Dev build `health.sintera.app` instalado; app na `MainActivity` (não `DevLauncherErrorActivity`).
- [ ] Uma conta válida no Supabase (há 3 confirmadas).

## 2. Ambiente esperado

Expo SDK 54 · RN 0.81.5 · CMake 4.1.2/Ninja 1.12.1 · AVD API 35 (Pixel 8) · Metro 8081. Baseline: [MOBILE-003].

## 3. Sequência de execução + casos de teste

Cada caso mapeia um critério de aceite do [MOBILE-014 §5](MOBILE-014_PLANEJAMENTO_INCREMENTO3_HOME.md).

| # | Caso | Ação | Resultado esperado | Critério |
|---|------|------|--------------------|----------|
| T1 | **Gate sem sessão** | app aberto sem sessão | mostra **Login** (`AuthStack`), não as abas | 4 |
| T2 | **Login válido** | fundadora digita e-mail+senha → Entrar | abre as **abas**; aba **Início = HomeShell** | 4 |
| T3 | **WelcomeSlot** | observar topo da Home | "Olá" + e-mail da sessão | 2, 7(desempenho) |
| T4 | **QuickActions navega** | tocar cada card (Acompanhamento·Documentos·Minha Saúde·Mais) | navega para a aba correspondente; volta a Início | 5 (só navegação) |
| T5 | **Slots reservados** | rolar a Home | Resumo·Linha do tempo·Insights com "Reservado — em breve"; **sem** dado de domínio | 4 (§3.4) |
| T6 | **Tabs preservadas** | navegar pelas 5 abas | cada aba abre; sem crash | 10 (Inc. 2) |
| T7 | **Logout** | na Início, tocar **Sair** (FooterSlot) | volta ao **Login**; SecureStore limpo | 7 (Inc. 2) |
| T8 | **Restauração de sessão** | novo login → `adb am force-stop` → reabrir | reabre **direto nas abas** (HomeShell), não no Login | 6, 11 |

## 4. Critérios de aprovação

- **T1–T8 todos PASS.**
- **Sem regressão** do fluxo autenticado homologado no Incremento 2.
- **Sem crashes** de app: `logcat` sem `FATAL EXCEPTION`/`SIGSEGV`/`UnsatisfiedLinkError`/`Cannot find native module`. (ANR de `com.android.systemui` por memória do host **não** é regressão — ver MOBILE-011/012.)
- **Arquitetural já garantido por CI** (não precisa reverificar na tela): `home-is-composition` + contrato de slots + `tsc` + testes.

## 5. Evidências a coletar (por caso)

- **Screenshots:** T2 (Home/abas), T3 (saudação), T4 (uma navegação, ex.: Documentos), T5 (slots reservados), T7 (volta ao Login), T8 (restauração nas abas).
- **SecureStore:** presente após T2 (`ls shared_prefs/SecureStore.xml` ~5 KB) · **removido/vazio** após T7 (65 bytes) · presente antes do kill em T8.
- **logcat:** varredura de `FATAL/SIGSEGV/UnsatisfiedLink/Cannot find native module` = **0** (o ANR de SystemUI é registrado à parte como ruído de host).
- **PIDs:** T8 — PID morto no `force-stop` e PID **novo** na reabertura (prova de processo fresco).

## 6. Após aprovação

Registrar o aceite (tipo MOBILE-013) + tag `mobile-inc3-accepted`; então criar `feat/mobile-inc4-perfil` de
`mobile-inc3-accepted` e iniciar o **Incremento 4 (Perfil)** pela sequência do [MOBILE-016 §9](MOBILE-016_PLANEJAMENTO_INCREMENTO4_PERFIL.md).

## 7. Se algum caso FALHAR

Não seguir para o aceite. Registrar o caso, capturar evidência, e abrir investigação (a Home é código novo;
distinguir de ruído de ambiente). Nenhuma etapa estrutural da Home deve ser reaberta sem uma falha concreta.
