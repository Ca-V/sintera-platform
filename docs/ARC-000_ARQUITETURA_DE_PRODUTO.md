# ARC-000 — Arquitetura de Produto (índice + rastreabilidade)

> **Mapa de navegação** da visão de produto expandida (2026-07-27). Não é doc técnico — é o **índice** que amarra
> os documentos da visão e mostra como se reutilizam. Complementa o [ARCH-000](ARCH-000_DOCUMENT_ARCHITECTURE.md)
> (arquitetura **documental**/precedência); aqui o foco é o **produto**. Governado por [REG-001](REG-001_GUARDRAIL_REGULATORIO.md) (normativo).

## 1. Índice por área

```
Regulação / Guardrail
    └── REG-001   (NORMATIVO — verbos da IA, fronteira factual, conformidade)
Jornada de Saúde
    └── JOR-001   (SSOT — lente por fase; taxonomia; navegação; §8 consolidação)
Modelo de dados (multi-sujeito)
    └── MUL-001   (Pessoa · Titular · Dependente · Responsável legal · Rede)
Rede de Cuidado
    ├── CARE-001  (base — Care Space, snapshot, auditoria, fronteira factual)
    └── CARE-002  (participantes · matriz de permissões · ciclo de vínculo · alertas)
Wearables / Observação
    ├── HIP-007   (canônico — Observação, universal)   [baseline]
    ├── HIP-009   (sincronização/conflitos)             [baseline]
    ├── WEA-001   (connector layer)                      [baseline]
    └── WEA-002   (consolidação: matriz vendors + integração sujeito/fase)
Rotinas e Lembretes
    └── ROT-001   (amplia Hábitos; reusa Evento + NOTIF-001)
Eventos / Fluxo
    └── MAP-001   (mapa único Origem→…→Timeline)
Catálogo
    └── MOD-001   (matriz de capacidades dos módulos)
Comunicação
    └── VID-001   (roteiro + storyboard do vídeo institucional)
Descoberta / UX
    └── SID-001   (copy da Sidebar; 4 campos + Frequência)
```

## 2. Matriz de rastreabilidade (conceito → fonte → reuso)

| Conceito | Documento fonte | Reutilizado por |
|---|---|---|
| Fronteira factual / verbos da IA | **REG-001** | **todos** |
| Jornada / fase de vida | **JOR-001** | CARE-002 · WEA-002 · MOD-001 · MAP-001 · SID-001 · VID-001 |
| Multi-sujeito / Dependente | **MUL-001** | CARE-002 · WEA-002 · MOD-001 · MAP-001 · JOR-001 |
| Rede de Cuidado / permissões / alertas | **CARE-001 → CARE-002** | MUL-001 · MOD-001 · MAP-001 · NOTIF-001 |
| Observação / wearables | **HIP-007/009 · WEA-001 → WEA-002** | JOR-001 · MOD-001 · MAP-001 |
| Rotinas / recorrência / lembrete | **ROT-001** (+ Evento Assistencial · NOTIF-001) | SID-001 · MOD-001 · MAP-001 |
| Projeção sem duplicação | **ADR-001** | JOR-001 · MAP-001 · WEA-002 · ROT-001 |
| Fluxo de eventos | **MAP-001** | (consolida os demais) |

## 3. Estado de conformidade (doc × princípios)

| Doc | REG-001 | LGPD | ADR-001 | RDC 657 |
|---|:--:|:--:|:--:|:--:|
| REG-001 | ✔ | ✔ | ✔ | ✔ |
| JOR-001 | ✔ | ✔ | ✔ | ✔ |
| MUL-001 | ✔ | ✔ | ✔ | ✔ |
| CARE-002 | ✔ | ✔ | ✔ | ✔ |
| WEA-002 | ✔ | ✔ | ✔ | ✔ |
| ROT-001 | ✔ | — | ✔ | ✔ |
| MOD-001 | ✔ | — | ✔ | ✔ |
| MAP-001 | ✔ | ✔ | ✔ | ✔ |
| SID-001 | ✔ | — | ✔ | ✔ |
| VID-001 | ✔ | — | — | ✔ |

## 4. Auditoria de consistência (2026-07-27)

- **Terminologia verificada:** "Jornada de Saúde", "Dependente", "Responsável legal / Tutor" — **consistentes**.
- **"Hábitos" × "Rotinas":** nos docs de modelo, "Hábitos" aparece sempre **enquadrado** (ROT-001 "amplia Hábitos";
  MOD-001 "ex-Hábitos"). **Correção aplicada:** o fio condutor do VID-001 dizia "Hábitos" → **"Rotinas"** (coerência
  com o modelo). *(No estado ATUAL da plataforma — Sidebar/backlog — "Hábitos" permanece correto até a ratificação de D-ROT-1.)*
- **Verbos da IA:** padronizados na lista oficial fechada (REG-001 §5); a revisão P8 já corrigiu "interpreta/prevê risco" no JOR-001 §5.
- **REG-001** promovido a **normativo**; seção de **Conformidade** padrão adotada.

## 5. Decisões abertas (aguardando ratificação)

`D-JOR-1..4 · D-RC-1..4 · D-MUL-1..4 · D-ROT-1..4 · D-WEA-1..3`. Enquanto **provisórias**, ficam marcadas nos docs
de origem (§ decisões). Ao ratificar, **consolido** a taxonomia definitiva e removo o caráter provisório (item 5 da fila de consolidação).

---
**Conformidade:** ✔ REG-001 · ✔ LGPD · ✔ ADR-001 · ✔ RDC 657
*Relaciona: ARCH-000 (arquitetura documental) · REG-001 (normativo) · todos os docs da visão expandida.*
