# ADR-019 — Governança do ciclo de incrementos (estados · baseline · gates · rastreabilidade)

- **Status:** Aceito (fundadora, 2026-07-31).
- **Contexto:** o projeto será transferido entre equipes (ADR-012). Precisamos de um processo **previsível e
  auditável**, sem ambiguidade entre "documentação, código e estado real". Decisões de **processo** relevantes
  merecem registro formal (ADR) para preservar o contexto a novos integrantes.

## Decisão

Adotam-se, como governança permanente da execução (aplica-se ao Mobile agora; extensível à plataforma):

1. **Cinco estados formais** do incremento, sequenciais (um só é atingido quando todos os anteriores foram):
   **Planejado** (escopo + Readiness) → **Implementado** (código versionado) → **Verificado** (typecheck +
   testes + CI) → **Homologado** (dispositivo físico c/ roteiro) → **Aceito** (evidências + doc + tag).
   Proíbe-se "concluído" ambíguo. "Planejar ≠ iniciar": planejamento pode anteceder o aceite do anterior; a
   **implementação funcional** ("Em Implementação") só começa após o anterior **Aceito** + baseline atualizada.
2. **Gates explícitos** entre incrementos (coluna no roadmap): nenhum incremento funcional novo começa antes do
   **aceite** do anterior. Exceção de antecipação restrita (só UI-independente/navegação-independente/
   test-verificável) permanece por [MOBILE-015 §Governança](../MOBILE-015_ROADMAP_INCREMENTOS.md).
3. **Baseline obrigatória após cada Aceito** ([BASELINE_PROJETO.md](../../BASELINE_PROJETO.md)): consolida
   roadmap · ADRs · contratos · backlog · riscos · versões Web/Mobile.
4. **Rastreabilidade:** matriz requisito↔incremento↔evidência↔estado ([TRACEABILITY_MATRIX.md](../../TRACEABILITY_MATRIX.md));
   **bloco de rastreabilidade** em cada doc de aceite e **evidência ≠ registro** (toda afirmação técnica aponta
   para artefato verificável — commit/run/build) — padrão em [MOBILE-022](../MOBILE-022_TEMPLATE_EVIDENCIAS_INCREMENTO.md).
5. **Registro de riscos** permanente por categoria ([RISK_REGISTER.md](../../RISK_REGISTER.md)).
6. **Versionamento de contratos de API** compartilhados ([API_CONTRACTS.md](../API_CONTRACTS.md)) — Web e Mobile
   evoluem em paralelo consumindo os mesmos contratos; mudanças controladas por versão.

## Consequências

- **Positivas:** processo previsível/auditável; estado real inequívoco; retomada por qualquer dev; análise de
  impacto facilitada; contexto de processo preservado para novos integrantes.
- **Custo:** pequena sobrecarga documental por incremento (aceita como investimento de continuidade — ADR-012).
- **Redação precisa** obrigatória: descrever comportamento "na configuração atual"; distinguir **intenção**
  (não verificada) de **fato** (verificado por artefato); corrigir doc imprecisa > preservar formulação forte.

*Relaciona: ADR-012 (continuidade) · MOBILE-022 (template/estados) · BASELINE_PROJETO · RISK_REGISTER · TRACEABILITY_MATRIX · API_CONTRACTS.*
