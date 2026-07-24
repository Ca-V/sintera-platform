# MOBILE-011 — Estabilidade do ambiente de validação Android (AVD)

- **Status:** **ABERTO** — sintoma-alvo (`lowmemorykiller`) eliminado com `hw.ramSize=3072`; ANR residual do SystemUI é **hipótese** (pressão de memória do host) a confirmar na revalidação pós-upgrade (7,7 GB → 16 GB, `hw.ramSize=4096`). Não bloqueante.
- **Ver também:** [MOBILE-012](MOBILE-012_ANALISE_AMBIENTE_VS_ENGENHARIA.md) — análise formal separando ruído de ambiente × estado da engenharia.
- **Origem:** observação ambiental separada do [MOBILE-010](MOBILE-010_TOOLCHAIN_WINDOWS_NEW_ARCH.md) (que ficou restrito à toolchain).
- **Natureza:** qualidade do ambiente de homologação — **não** é defeito da aplicação.

## Contexto

Durante testes funcionais no emulador **Pixel_8 (API 35)**, ocorreram **ANRs esporádicos** do app e de
processos do sistema. Diagnóstico por log (23/07/2026):

```
ANR ... Reason: Input dispatching timed out (Waited 5006ms for KeyEvent)
lowmemorykiller: Kill 'android.process.media' ... reason: low watermark is breached
lowmemorykiller: Kill 'com.google.android.documentsui' ... low watermark is breached
(+ outros processos do sistema mortos por falta de memória)
```

**Causa provável:** o AVD está com **memória insuficiente** — sob pressão, o `lowmemorykiller` derruba
processos e o despacho de input estoura o timeout, gerando ANR. Verificação explícita **descartou** crash da
aplicação: 0 ocorrências de `FATAL EXCEPTION` / `SIGABRT` / `SIGSEGV` / `UnsatisfiedLinkError` /
`NativeModule not found`; o processo do app permaneceu vivo. **Sem relação causal com a correção de toolchain
do MOBILE-010.**

## Escopo (a fazer)

- [ ] Aumentar a **RAM** do AVD Pixel_8 (Android Studio → Device Manager → Edit → *Show Advanced Settings*).
- [ ] Revisar **heap da VM** e armazenamento interno do emulador.
- [ ] Avaliar uso de **snapshots** (cold boot × quick boot) para estabilidade/reprodutibilidade dos testes.
- [ ] Medir o **desempenho** durante os testes do Incremento 2 (navegação) e confirmar ausência de ANRs.
- [ ] **Documentar a configuração recomendada do AVD** no runbook [MOBILE-003](MOBILE-003_PROVISIONAMENTO_EXPO_EAS.md).

## Investigação (2026-07-24) — achados

**Fatos (host de ~7,7 GB, ainda antes do upgrade):**

| Item | Antes | Depois do ajuste |
|------|-------|------------------|
| `hw.ramSize` do AVD | 2048 MB | **3072 MB** |
| `MemTotal` (guest) | ~2 GB | **~3,0 GB** |
| `MemAvailable` (guest, em uso) | (esgotava) | **~1,7 GB** (folga) |
| `lowmemorykiller` (sintoma-alvo) | matando processos do sistema | **0 ocorrências** ✅ |
| App inicia e renderiza login | — | ✅ |

**Conclusão parcial:** o aumento de `hw.ramSize` de 2048 → 3072 MB **eliminou a pressão de memória do GUEST**
(`lowmemorykiller`), que era o sintoma que motivou esta investigação.

**Ressalva — ANR do SystemUI persiste; hipótese mais consistente = pressão de memória do HOST (a confirmar).**
Mesmo após o ajuste, aparece `ANR ... com.android.systemui` esporádico. Análise: com `lowmemorykiller` zerado e
`MemAvailable` folgado no guest, a explicação **mais consistente** é a **RAM física do host (7,7 GB)** — rodar
`qemu` (3 GB) + Metro (node) + Windows + tooling nesse host provavelmente provoca **swap**, o guest perde tempo
de CPU e o SystemUI estoura o deadline de input. **Ainda falta o experimento que isola a variável "RAM do
host"**; portanto é **hipótese**, não fato. Será **confirmada ou rejeitada** na revalidação com 16 GB (mesmo
projeto/AVD/toolchain/Windows, mudando só a RAM do host). Não há evidência de que seja do AVD nem do aplicativo.

**Gotcha de ambiente (não é bug):** após um **cold boot** do emulador, o túnel **`adb reverse tcp:8081 tcp:8081`
se perde** → o dev-client falha com `java.net.ConnectException: Failed to connect to /127.0.0.1:8081`
(`DevLauncherErrorActivity`). **Correção:** re-executar `adb reverse tcp:8081 tcp:8081` (ou lançar via
`npx expo run:android`, que o refaz). Documentar no runbook.

## Recomendação (baseada em evidência, por classe de hardware)

| Host RAM | `hw.ramSize` do AVD recomendado | Status |
|----------|--------------------------------|--------|
| ~8 GB | **3072 MB** | ✅ validado: elimina `lowmemorykiller` |
| 16 GB | **4096 MB** | ⏳ a validar após o upgrade físico |

Demais parâmetros do AVD **inalterados** (heap 228, GPU auto, API 35, x86_64, snapshots) — fora do escopo.

## Critério de encerramento (revisado)

MOBILE-011 permanece **ABERTO** até a revalidação pós-upgrade de 16 GB:
1. Instalada a memória física (16 GB), ajustar `hw.ramSize` do AVD para **4096 MB**.
2. **Cold boot** + `adb reverse tcp:8081 tcp:8081`.
3. Sessão básica (sem autenticação) em steady-state.
4. Confirmar: **0** `lowmemorykiller` **e** ausência de ANR do SystemUI por pressão de memória.
Satisfeito isto, registrar 4096 MB como config oficial para hosts de 16 GB e **encerrar**.

> Estado atual (2026-07-24): sintoma-alvo (`lowmemorykiller`) **eliminado**; ANR residual **mais
> consistentemente explicado** pela pressão de memória do host de 7,7 GB — **hipótese** a confirmar ou
> rejeitar na revalidação com 16 GB.
