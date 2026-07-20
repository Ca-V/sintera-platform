# ARCH-004 — Arquitetura de Integrações (consolidada)

**Objetivo:** consolidar a estratégia de integrações — capacidades nativas, conectores externos, agregadores, dispositivos
médicos e evolução futura.
**Escopo:** todas as fontes automáticas de dados; **não** a camada de dados (essa é [[HIP-007]]).
**Status:** Approved · **Versão:** 1.0 · **Histórico:** v1.0 (2026-07-20) — consolida HIP-001/003/006.
**Princípios:** [[hip_001_plataforma_integracoes]] (vendor-neutral) · [[ARCH-002]]. **Dependências:** HIP-007 (Observação),
HIP-009 (sincronização). **Impacto:** define como novas fontes entram sem redesenho.

## 1. Princípio
Toda fonte → **Observação** ([[HIP-007]]) → mesma persistência/sincronização. **Novo conector = novo adaptador, zero
mudança estrutural.** Nenhuma categoria (inclusive agregador) substitui a arquitetura.

## 2. Categorias
| Categoria | O que é | Exemplos | Papel |
|---|---|---|---|
| **Capacidades nativas** (app) | dado on-device via app SINTERA | **Apple Health · Health Connect** | espinha dorsal de cobertura; agregam Garmin/Oura/WHOOP/Fitbit do celular |
| **Conectores externos — fabricantes** | nuvem OAuth backend | **Withings** (pronto) · Oura · WHOOP | profundidade/independência por fonte |
| **Agregadores** | uma integração → dezenas de fontes | **Terra · Rook** | acelerador de largura (por gatilho) |
| **Dispositivos médicos / parceiros / padrões** | CGM/MAPA/Holter · FHIR/RNDS | — | evolução futura |

## 3. Estado por fonte (resumo — detalhe em [[HIP-003]])
- **Apple Health / Health Connect:** capacidades **nativas** (Onda 3); sem API de nuvem → dependem do app.
- **Withings:** conector web **construído** (referência — [[HIP-002]]).
- **Oura / WHOOP:** nuvem OAuth, mas **exigem possuir o dispositivo** para desenvolver → 2ª leva.
- **Garmin:** programa de desenvolvedores **fechado** → só via agregador/parceria.
- **Strava:** domínio **futuro** de Atividade Física; termos **proíbem IA/ML** → só exibição, pós sign-off jurídico.
- **Terra / Rook:** agregadores; adotar por **gatilho** (cobertura + escala + caso de negócio — [[HIP-006]] §5).

## 4. Estratégia futura
1. Capacidades nativas (cobertura ampla via celular).
2. Fabricantes diretos de alto valor (conforme device/termos).
3. Agregador para cauda longa/Garmin/streaming (por gatilho).
4. Dispositivos médicos + padrões (FHIR/RNDS) como Observações.
Sequência e prioridades: [[IMPLEMENTATION_ROADMAP]] (fonte única). Governança vendor-neutral: [[HIP-001]].
