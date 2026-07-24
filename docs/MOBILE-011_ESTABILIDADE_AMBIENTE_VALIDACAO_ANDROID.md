# MOBILE-011 — Estabilidade do ambiente de validação Android (AVD)

- **Status:** **ABERTO — backlog** (não bloqueante). Prioridade: **antes da fase de validação funcional do Incremento 2**.
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

## Critério de encerramento

Testes funcionais do Incremento 2 executados sem ANRs por pressão de memória, e a configuração recomendada
do AVD registrada no runbook.
