# WEA-002 — Wearables: consolidação (matriz de vendors + integração multi-sujeito/fase)

> Prioridade 4/5 da visão expandida. **A arquitetura de wearables JÁ está em baseline** — este doc **NÃO a
> reescreve** (evita duplicação, ADR-001). Ele **consolida** (matriz de vendors × campos) e **integra** os dois
> eixos novos que os baselines predatam: **multi-sujeito** ([MUL-001](MUL-001_MODELO_MULTISSUJEITO.md)) e **fase**
> ([JOR-001](JOR-001_JORNADA_DE_SAUDE.md)). Guardrail [REG-001](REG-001_GUARDRAIL_REGULATORIO.md) aplicado. Sem integração/código.

## 1. O que já é baseline (índice — NÃO reabrir)

| Tema pedido | Onde já está congelado |
|---|---|
| **Modelo canônico** (Observação, universal; Observação≠Indicador; tiers de confiabilidade) | **HIP-007** (Approved · v2.0) |
| **Sincronização · conflitos · histórico** (SSOT bruto imutável + idempotente; reconciliação na projeção; recompute) | **HIP-009** (Approved · v1.0) · ADR-005/008 |
| **Connector Layer** (vendor+domain-neutral; novos conectores sem mudar o núcleo; Withings implementado) | **WEA-001** · **HIP-001** |
| **Permissões** (usuário autoriza/revoga cada conector) | **HIP-001** · WEA-001 |
| **Estudo de ecossistema** (vendors, APIs, cobertura) | **HIP-003** |

> Pilares confirmados (memória Fase 2): **Health Connect (Google)** + **Apple Health**; Withings = conector de
> referência. Demais vendors entram como **novos conectores**, sem tocar o núcleo.

## 2. Matriz vendor × campo canônico × confiabilidade (consolidação)

Campos = classes canônicas de Observação (HIP-007). Confiabilidade = tier da fonte (não do campo). "○" = via
agregador (Health Connect/Apple Health) quando o vendor não expõe API direta. Preencher/ajustar conforme HIP-003.

| Vendor | Sono | Atividade/passos | FC | HRV | SpO₂ | Recuperação/prontidão | Temp. pele | Acesso |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|---|
| **Apple Health** (agregador) | ✅ | ✅ | ✅ | ✅ | ✅ | — | ○ | HealthKit (no dispositivo) |
| **Google Health Connect** (agregador) | ✅ | ✅ | ✅ | ✅ | ✅ | — | ○ | Health Connect (Android) |
| **Garmin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Body Battery) | ○ | Cloud API (OAuth) |
| **Oura** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Readiness) | ✅ | Cloud API (OAuth) |
| **Whoop** | ✅ | ✅ | ✅ | ✅ | — | ✅ (Recovery/Strain) | ✅ | Cloud API (OAuth) |
| **Fitbit** | ✅ | ✅ | ✅ | ✅ | ✅ | — | ○ | Cloud API (OAuth) |

> A matriz é **descritiva** (cobertura de origem), não um julgamento clínico. Cada Observação carrega
> **proveniência** (vendor, dispositivo, método) e **tier de confiabilidade** — REG-001: dado, não diagnóstico.

## 3. Integração — eixo MULTI-SUJEITO (novo)

- Toda Observação de wearable é atribuída a um **sujeito** (MUL-001): de quem é o dispositivo (titular ou
  dependente). Um filho pode ter dispositivo próprio → Observações do **sujeito dependente**.
- **Isolamento:** os sinais de cada sujeito ficam no seu contexto; nunca se misturam (regra MUL-001 §3).
- **Permissão por sujeito:** conectar/desconectar um dispositivo de um dependente é ato da **titular/tutor**.
- A sincronização (HIP-009) **não muda** — ganha só o campo de atribuição `sujeito` na proveniência.

## 4. Integração — eixo FASE (novo)

- A Observação passa a ter **endereço na jornada** (JOR-001): sono na **gestação**, atividade na **menopausa**,
  crescimento/sono na **infância** — apenas **contexto de leitura**, sem novo pipeline.
- A **IA** usa esse contexto para **organizar e priorizar** (REG-001) sinais relevantes à fase — **nunca**
  interpretar clinicamente nem recomendar conduta.

## 5. O que NÃO fazer

- Não reabrir HIP-007/009/WEA-001 (baseline). Não implementar conector/integração (Fase 2, deferida).
- Não inferir condição/risco a partir de sinais (REG-001) — a plataforma **apresenta a série**; quem interpreta é a pessoa/profissional.

## 6. Decisões a ratificar

- **D-WEA-1** — A matriz §2 (rascunho de cobertura) serve de base? Ajustar campos/vendors conforme HIP-003.
- **D-WEA-2** — Atribuição de `sujeito` na proveniência da Observação (multi-sujeito) confirmada como o caminho?
- **D-WEA-3** — Contexto de **fase** na leitura das Observações (sem tocar HIP-009) confirmado?

---
*Relaciona: HIP-007 (Observação/canônico) · HIP-009 (sync/conflitos) · WEA-001 (connectors) · HIP-001 (permissões) ·
HIP-003 (estudo) · MUL-001 (sujeito) · JOR-001 (fase) · REG-001 (guardrail).*
