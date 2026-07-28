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

**Relatório de correções (consolidação final · 2026-07-27):**
- **Núcleo arquitetural e taxonomia CONGELADOS** (§5/§6); JOR-001/SID-001 atualizados (removido "proposta/a ratificar" → "definitiva/congelada").
- **Auditoria de linguagem (verbos da IA):** varredura completa dos 11 docs da visão — **0 usos indevidos**; todas as
  ocorrências de "interpreta/diagnostica/prevê risco" estão em **contexto seguro** (negação · tabela do guardrail ·
  "quem interpreta é o profissional"). Únicas correções reais do ciclo: JOR-001 §5 (P8) e fio condutor do VID-001.
- **Duplicação:** nenhuma — WEA-002 consolida (não reescreve) os baselines; CARE-002 estende CARE-001; MAP-001/MOD-001 referenciam as fontes.
- **Checklist de governança** (§7) padronizado como canônico; **Conformidade** presente nos 11 docs (§3).
- **Sem novos documentos de domínio** nesta fase (só ARC-000 como hub) — objetivo de consolidação cumprido.
- **Item 5 (governança documental) — completo:** além da Conformidade, o **checklist de governança (§7)** foi
  adicionado **literalmente a cada documento** da visão (JOR/MUL/CARE-002/WEA-002/ROT/MOD/MAP/SID/VID; ARC-000 e
  REG-001 já o mantêm no §7). Fonte canônica = ARC-000 §7; cópia por doc = verificação rápida em revisão.

## 5. Núcleo arquitetural CONGELADO (só muda por ADR)

Ratificado pela fundadora (2026-07-27). **Estes itens só podem ser alterados por um ADR** — não por edição de doc:

`Jornada de Saúde` (domínio principal) · `Modelo Multi-Sujeito` · `Dependente` · `Responsável Legal` ·
`Rede de Cuidado` · `princípio do menor privilégio` · `Evento Assistencial` · `Projeções (ADR-001)` ·
`REG-001 (guardrail)` · `LGPD` · `fronteira factual (RDC 657)`.

## 6. Decisões — CONGELADAS × Estável para MVP

**Congeladas (definitivas; mudança só por ADR):**

| Decisão | Congelada |
|---|---|
| D-JOR-4 · Jornada de Saúde = domínio de 1º nível | ✔ |
| D-JOR-1 · Ciclo/Contracepção sob Saúde Feminina | ✔ |
| D-JOR-2 / D-ROT-2 · Exames e Vacinação = **projeções** (não duplicam) | ✔ |
| D-MUL-1/2 · entidade **Dependente** + dimensão `sujeito` nos fatos | ✔ |
| D-RC-1 · perfis de **menor privilégio** (sobrescritíveis) | ✔ |
| D-RC-2/3/4 · rede pessoal no modelo · alertas só via NOTIF-001 · consentimento de dependente pela titular/tutor | ✔ |
| D-WEA-2/3 · atribuição de `sujeito` na Observação · contexto de fase | ✔ |

**Estável para MVP (revisável por UX — não exige ADR):**

| Item | Estável p/ MVP |
|---|---|
| D-ROT-1 · "Hábitos" → "Rotinas" (rename/ampliação) | ✔ (revisável por UX) |
| Organização **visual** da Sidebar | ✔ |
| Agrupamento **visual** dos módulos | ✔ |
| D-MUL-3 · "graduação" do dependente (modelada agora, implementada depois) | ✔ |
| D-MUL-4 · escopo inicial de dependente = filhos | ✔ |
| D-WEA-1 · matriz de cobertura de vendors (ajustável por HIP-003) | ✔ |

## 7. Checklist de governança (obrigatório por documento)

Todo documento novo/alterado declara (junto à Conformidade):

- [ ] **não duplica** outro documento;
- [ ] **reutiliza conceitos do ARC-000** (fontes canônicas);
- [ ] **respeita REG-001** (verbos oficiais · fronteira factual);
- [ ] **não altera o núcleo arquitetural** (§5) — se alterar, exige **ADR**;
- [ ] **referencia os documentos-fonte**;
- [ ] **novos conceitos exigem ADR**.

---
**Conformidade:** ✔ REG-001 · ✔ LGPD · ✔ ADR-001 · ✔ RDC 657
*Relaciona: ARCH-000 (arquitetura documental) · REG-001 (normativo) · todos os docs da visão expandida.*
