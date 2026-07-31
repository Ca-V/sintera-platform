# ADR-019 — Governança do Ciclo de Desenvolvimento Mobile

- **Status:** Aceito (fundadora, 2026-07-31). Decisão **unificada** (estados, gates, evidências, baseline e
  rastreabilidade são acoplados — separá-los aumentaria o risco de evolução divergente).

## Objetivo
Definir um ciclo de desenvolvimento **previsível e auditável**, sem ambiguidade entre "documentação, código e
estado real", que permita a **retomada por qualquer equipe** e a evolução paralela Web/Mobile.

## Contexto
O projeto será transferido entre equipes ([ADR-012](ADR-012_CONTINUIDADE_OPERACIONAL.md)). Decisões de
**processo** relevantes merecem registro formal para preservar o **porquê** a novos integrantes.

## Decisão

### Estados
Cinco estados formais, sequenciais (um só é atingido quando todos os anteriores foram):
**Planejado** (escopo + Readiness) → **Implementado** (código versionado) → **Verificado** (typecheck + testes +
CI) → **Homologado** (dispositivo físico c/ roteiro) → **Aceito** (evidências + doc + tag). Proíbe-se "concluído"
ambíguo. "Planejar ≠ iniciar": a **implementação funcional** ("Em Implementação") só começa após o anterior
**Aceito** + baseline atualizada.

### Gates
Nenhum incremento funcional novo começa antes do **aceite** do anterior (coluna "Gate" no roadmap).

### Evidências
**Evidência ≠ registro:** toda afirmação técnica aponta para artefato verificável (commit/run do Actions/build).
**Redação precisa:** descrever "na configuração atual"; distinguir **intenção** (não verificada) de **fato**;
corrigir doc imprecisa > preservar formulação forte. Template + bloco de rastreabilidade em [MOBILE-022](../MOBILE-022_TEMPLATE_EVIDENCIAS_INCREMENTO.md).
**Regra de artefato (obrigatória):** *antes de criar um documento de governança, verificar se já existe um
equivalente e, quando aplicável, EVOLUÍ-LO em vez de duplicá-lo* — reduz redundância e preserva o histórico.

### Baseline
Após **cada Aceito**: atualizar a [BASELINE_PROJETO.md](../../BASELINE_PROJETO.md) (roadmap · ADRs · contratos ·
backlog · riscos · versões) e o [RISK_REGISTER.md](../../RISK_REGISTER.md).

### Rastreabilidade
[TRACEABILITY_MATRIX.md](../../TRACEABILITY_MATRIX.md): requisito↔**origem**↔contrato↔ADR↔incremento↔evidência↔estado.
Contratos versionados: [API_CONTRACTS.md](../API_CONTRACTS.md). Evolução funcional: [CHANGELOG.md](../../CHANGELOG.md).

## Consequências
- **Positivas:** estado real inequívoco; retomada por qualquer dev; análise de impacto (via matriz); contexto de
  processo preservado.
- **Custo:** pequena sobrecarga documental por incremento (investimento de continuidade — ADR-012). **O
  arcabouço está fechado — evitar novos artefatos de governança sem necessidade concreta; foco em execução.**

## Exceções
**Antecipação restrita** (planejar/implementar antes do aceite do anterior) só quando **simultaneamente**:
UI-independente · navegação-independente · independente da homologação anterior · totalmente test-verificável
([MOBILE-015 §Governança](../MOBILE-015_ROADMAP_INCREMENTOS.md)).

## Relação com outros ADRs
[ADR-012](ADR-012_CONTINUIDADE_OPERACIONAL.md) (continuidade) · MOBILE-022 (template/estados) · BASELINE_PROJETO ·
RISK_REGISTER · TRACEABILITY_MATRIX · API_CONTRACTS · CHANGELOG.
