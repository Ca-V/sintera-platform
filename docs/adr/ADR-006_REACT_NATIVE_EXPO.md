# ADR-006 — React Native + Expo (stack do app móvel)

**Status:** Accepted · **Architectural Baseline** · 2026-07-20 · **Ref:** [[HIP-008]]

## Contexto
O app precisa iOS + Android, integrar Apple HealthKit e Health Connect, sincronizar em background, notificar, e ser
mantível por 5 anos. O time domina JavaScript/TypeScript/React/Next.js e o backend é TS.

## Decisão
Adotar **React Native + Expo** (Development Client + EAS Build/Update/Submit) como padrão do projeto.

## Alternativas consideradas
- **Flutter (Dart):** rejeitada — zero reúso com a web (linguagem diferente), pool de contratação menor.
- **Nativo (Swift + Kotlin):** rejeitada — duas bases, evolução/manutenção/contratação caras, sem reúso.
- **React Native "puro":** rejeitada — perde os ganhos de build/OTA gerenciados do EAS sem vantagem estratégica.

## Consequências
Reúso máximo de TS/contratos/regras via monorepo; contratação ampla; módulos de saúde exigem dev build (padrão via EAS);
trade-off de desempenho bruto aceito (irrelevante p/ app de dados). Governa [[HIP-012]] §5.
