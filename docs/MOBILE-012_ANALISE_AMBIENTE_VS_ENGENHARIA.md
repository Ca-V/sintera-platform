# MOBILE-012 — Análise: memória do host × problemas de engenharia

- **Status:** Registro de análise (2026-07-24). Não é investigação aberta.
- **Objetivo:** separar formalmente **ruído de ambiente** de **estado da engenharia**, evitando que "falta de RAM" vire explicação guarda-chuva e que investigações já concluídas sejam reabertas.
- **Relaciona-se com:** [MOBILE-004..007], [ADR-016], [MOBILE-010](MOBILE-010_TOOLCHAIN_WINDOWS_NEW_ARCH.md), [ADR-017](adr/ADR-017_GUARDA_REENTRANCIA_LOGOUT.md), [MOBILE-011](MOBILE-011_ESTABILIDADE_AMBIENTE_VALIDACAO_ANDROID.md), [REL-001](REL-001_RELEASE_BUNDLE_MONOREPO.md).

## Conclusão oficial

> **A memória física do notebook explica o ruído ambiental do processo de desenvolvimento e validação, mas
> não explica os problemas de implementação, arquitetura ou toolchain, que tiveram causas raiz específicas
> identificadas e corrigidas por meio de investigação experimental.**

## Classificação por problema (causa raiz × é memória?)

| Problema | Causa raiz **provada** | É memória? | Evidência |
|----------|------------------------|:----------:|-----------|
| Autolinking perdia módulos aninhados (SDK 53) | Hoisting do npm + limite do autolinking SDK 53 | **Não** | `Cannot find native module`; resolvido pela migração SDK 54 |
| "Invalid hook call" (ADR-016) | Monorepo fixa React 19.2.4 (web) × 19.1.0 (mobile); pacote hasteado resolvia a cópia errada | **Não** | versões medidas; guard de instância única no Metro resolveu |
| Build `Filename longer than 260 characters` (MOBILE-010) | **Toolchain**: CMake 3.22.1 / ninja 1.10.2 + codegen New Arch + caminho profundo | **Não** | trocar **só** o CMake (→ 4.1.2 / ninja 1.12.1) resolveu com todo o resto constante; corroborado por fonte oficial (expo#36274) |
| Correção sumia no `prebuild` | Projeto **Expo CNG** (`android/` gerado/gitignored) | **Não** | `prebuild --clean` provou; config plugin resolveu |
| `assembleRelease` não resolve `./index.ts` (REL-001) | Config de bundle release em monorepo | **Não** | adiado por decisão |
| Anomalia de logout (ADR-017) | Concorrência/timing em `signOut` (causa raiz inconclusiva) | **Não** (ver ressalva) | guarda de reentrância cobre a classe |
| Tela de erro do dev-launcher (`ConnectException :8081`) | `adb reverse` perdido no cold boot | **Não** | Metro estava **vivo** (`packager-status:running`); refazer `adb reverse` resolveu |
| ANRs (`lowmemorykiller`, Messages/SystemUI) | **Memória** — guest a 2 GB; depois host a 7,7 GB | **Sim** | `lowmemorykiller` no log; sumiu com 3 GB no guest; ANR residual **hipótese** de swap do host |
| Lentidão geral do emulador | Parcialmente swap do host | **Parcial** | host de 7,7 GB rodando qemu + Metro + Windows |

## O que a memória REALMENTE causou (delimitado)

1. `lowmemorykiller` no guest com AVD de 2 GB → ANRs de processos do sistema. **Corrigido** (3 GB).
2. ANR residual do SystemUI — **hipótese mais consistente**: swap do host (7,7 GB). **Pendente de confirmação
   após a revalidação com 16 GB** (experimento que isola a variável "RAM do host").
3. Lentidão de boot/UI do emulador sob pressão.

**Escopo:** exclusivamente o **ambiente de validação (emulador)**. Nada disso tocou o binário, o bundle ou a
lógica do app.

## O que a memória NÃO causou (a maioria)

- **Todos** os problemas de toolchain e arquitetura da tabela. O maior (MOBILE-010) é 100% toolchain — a prova
  é o experimento controlado: trocar **apenas** o CMake resolveu, com a RAM inalterada.
- A **corretude da implementação**: `tsc` verde em cada etapa; **BUILD SUCCESSFUL** repetidos (inclusive Cold
  Provisioning e `prebuild --clean`); telas renderizando (login, tabs, projeção SSOT). Falta de memória não
  produz "compilar errado" — ou compila, ou falta memória para compilar; aqui compilou limpo, várias vezes.
- A **tela de erro do dev-launcher**: era rede (`adb reverse`), não memória (Metro não caiu).

**Ressalva (única ligação indireta possível):** a anomalia de logout dependeu de uma janela de timing entre
dois toques; a lentidão do host **pode ter ampliado** essa janela (facilitando a manifestação), mas **não é a
causa** do comportamento (concorrência em `signOut`). "Ampliar a manifestação" ≠ "causar o defeito".

## O bloqueio remanescente NÃO é memória

A única pendência real — a **homologação autenticada do Incremento 2** (Login → Home → Logout) — está bloqueada
por **acesso/credenciais**, não por RAM: o agente não pode digitar senhas para autenticar (regra de segurança)
e a fundadora não alcança o emulador remotamente. **Mesmo com RAM abundante, esse bloqueio permaneceria.**

## Cuidado metodológico

"Memória insuficiente" é uma narrativa confortável e frequentemente errada em projetos longos. Cada erro aqui
foi atribuído à sua causa **provada por experimento controlado** (isolar uma variável, medir). A memória só
entra onde o sintoma específico é `lowmemorykiller`/ANR e **desaparece ao adicionar RAM** — em nenhum outro
lugar. Misturar as causas perderia informação e arriscaria reabrir investigações concluídas.
