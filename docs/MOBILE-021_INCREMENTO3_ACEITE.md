# MOBILE-021 — Incremento 3 (Home Shell) ACCEPTED

- **Status:** ✅ **ACCEPTED** (fundadora, 2026-07-30) — homologação funcional em **dispositivo Android físico**.
- **Marco:** **primeira homologação pelo fluxo NUVEM‑FIRST** (EAS Build → APK → aparelho), política oficial
  registrada em [MOBILE-015 §Política de Validação](MOBILE-015_ROADMAP_INCREMENTOS.md) e no runbook
  [MOBILE-003 §3.1](MOBILE-003_PROVISIONAMENTO_EXPO_EAS.md). Ratifica [ADR-012](adr/ADR-012_CONTINUIDADE_OPERACIONAL.md).
- **Planejamento:** [MOBILE-014](MOBILE-014_PLANEJAMENTO_INCREMENTO3_HOME.md) · **Roteiro:** [MOBILE-017](MOBILE-017_ROTEIRO_HOMOLOGACAO_INCREMENTO3.md).
- **Binário homologado:** build EAS `d67268a7-6ad5-4d44-96c1-1197638c54f0` (perfil `preview`, APK release),
  a partir do commit `227e91e`. O commit `95479a8` (após o build) só ajustou o **empacotamento do artefato**
  no EAS (coletar só o APK release) — **não altera o app**.

## 1. Resultado da homologação (dispositivo físico)

| Caso | Verificação | Resultado |
|------|-------------|-----------|
| T1 | Gate sem sessão → Login | ✅ |
| T2 | **Login válido** → abas; aba Início = HomeShell | ✅ (**valida as env vars `EXPO_PUBLIC_SUPABASE_*` no EAS** — conexão real) |
| T3 | WelcomeSlot → "Olá" + e-mail da sessão | ✅ |
| T4 | QuickActions navegam (Acompanhamento/Documentos/Minha Saúde/Mais) | ✅ |
| T5 | Slots reservados (Resumo/Linha do tempo/Insights = "Reservado — em breve") | ✅ |
| T6 | 5 abas abrem sem crash | ✅ |
| T7 | Logout (FooterSlot "Sair") → volta ao Login | ✅ |
| T8 | Restauração de sessão (login → force-stop → reabrir → abre direto nas abas) | ✅ |

**Sem regressão** do fluxo autenticado (Inc2). App standalone (APK release, sem Metro). Arquitetura
já garantida por CI (`home-is-composition`, contrato de slots, `tsc`, testes — 13/13 verdes).

## 2. Achados resolvidos durante a homologação nuvem-first

Esta foi a primeira vez que o produto passou pelo pipeline de nuvem ponta a ponta; três correções reais
saíram daqui (todas documentadas e versionadas):

1. **CMake pin quebrava o EAS (Linux)** — o plugin `withAndroidCmakeVersion` forçava CMake 4.1.2 (workaround
   de Windows, MOBILE-010) em toda plataforma; o EAS Linux não tem o 4.1.2. Corrigido: pin **só no Windows** +
   **remoção ativa** no Linux (neutraliza cache do EAS). Ver [MOBILE-010 §3.3](MOBILE-010_TOOLCHAIN_WINDOWS_NEW_ARCH.md).
2. **Variáveis de ambiente ausentes no EAS** — `.env` local não sobe para a nuvem; sem `EXPO_PUBLIC_SUPABASE_*`
   o app trava no início. Configuradas via `eas env:set` no ambiente `preview`. Runbook em MOBILE-003 §3.1.
3. **Artefato vinha como `.tar.gz` (debug+release)** — o EAS empacotou os dois APKs; instalou-se extraindo o
   `release/app-release.apk` do tar. **Correção (com ressalva):** uma 1ª tentativa (`applicationArchivePath`)
   era **campo inválido** no eas-cli 21.4.0 e quebrou o eas.json (corrigido no commit `8dd0d5b`); adotou-se
   `android.gradleCommand: ":app:assembleRelease"` no perfil `preview` — o que, **na configuração atual do
   projeto**, deve produzir o APK esperado (instalação direta). **Ainda a verificar** no próximo build EAS
   (não afirmar como fato até a evidência do artefato).

**Nota operacional:** antivírus (ex.: AVG) marcam o APK como `APK:CloudRep [Susp]` — **falso positivo** por ser
app novo/sem reputação (sideload), não malware. Ação: **Ignorar** (nunca "Solucionar", que remove o app).

## 3. Encerramento

Tag **`mobile-inc3-accepted`** criada sobre o commit de aceite. O **Incremento 4 (Perfil)** nasce dessa tag,
pela sequência do [MOBILE-016 §9](MOBILE-016_PLANEJAMENTO_INCREMENTO4_PERFIL.md). Gate mantido: nenhum
incremento funcional novo antes do aceite do anterior — **cumprido**.
