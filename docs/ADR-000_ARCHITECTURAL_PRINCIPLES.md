# ADR-000 — Architectural Principles (documento constitucional — raiz de todos os demais)

> **Decisão da fundadora (15/07/2026 — alta prioridade):** acima de COMPLIANCE-001, DATA-001, API-001, UCDA
> etc. existe uma camada de **princípios PERMANENTES**. Todo outro documento referencia o ADR-000. Reduz
> inconsistências futuras. Um princípio só muda por ADR explícito que o supersede (raro, deliberado).

## Princípios permanentes
1. **Open Architecture** — representável por adaptadores; nenhuma modalidade/fornecedor acoplado ao núcleo (UCDA).
2. **Canonical Data Model** — dado interno padronizado, independente da origem (`DATA-001`). O banco nunca depende do formato de um fabricante.
3. **Vendor Neutrality** — sem vendor lock-in; toda dependência de fornecedor fica na borda (conector), nunca no núcleo.
4. **Privacy by Design** — privacidade/minimização desde o desenho (LGPD; `COMPLIANCE-001` COMP-01).
5. **Security by Design** — segurança desde o desenho; sem segredo em código; menor privilégio (COMP-02/03/09).
6. **Compliance by Design** — nenhuma funcionalidade é `Done` sem o Compliance Gate (COMP-12); conformidade é arquitetura, não camada final.
7. **Human-in-the-loop** — a plataforma organiza/apresenta; decisão clínica é do profissional. Não substitui avaliação.
8. **Document-first** — o documento é a unidade primária; resultados estruturados derivam dele, nunca o substituem.
9. **Original Document Preservation** — o documento original é imutável e sempre acessível (Rastreabilidade Documental).
10. **Explainability** — toda informação exibida é consequência rastreável do pipeline, nunca decisão implícita da IA.
11. **Traceability** — origem/autoria/versão íntegras por elemento (documento·página·trecho·quando).
12. **Backward Compatibility** — mudanças aditivas por padrão; consumidores antigos permanecem válidos (`DATA-001`/`API-001`).
13. **Evolution without Breaking Changes** — evoluir sem quebrar: depreciar-não-apagar; quebra só por versão MAJOR + migração + Gate.
14. **Não-SaMD (posicionamento regulatório)** — não interpreta/diagnostica/prognostica/prescreve (RDC 657; `GOVERNANCA.md`; COMP-06/11).

## Constitutional Invariants (NORMATIVOS — obrigatórios, verificáveis)
O ADR-000 não é só referência: impõe regras. Violar um invariante **bloqueia o `Done`** (Compliance Gate) e,
quando possível, é barrado por teste automatizado (`ARCH-*`). Cobertura rastreada em `GOV-001`.
1. **Nenhum componente grava dados fora do Modelo Canônico** (`DATA-001`) — normalização antes de persistir.
2. **Nenhum documento original pode ser alterado** (imutável e sempre acessível).
3. **Toda informação derivada mantém vínculo com a origem** (proveniência/lineage — DATA-002).
4. **Todo dado possui proveniência obrigatória** (sem proveniência → não é dado estruturado).
5. **Toda decisão arquitetural cita os princípios afetados** (ADR referencia os princípios que toca).
6. **Todo novo domínio adere a UCDA + DATA-001 + COMPLIANCE-001** (Gate de Conformidade) antes de existir.
7. **Nenhuma funcionalidade reduz garantias existentes** de privacidade, segurança ou rastreabilidade (só amplia ou mantém).

## Arquitetura orientada por CAPACIDADES (visão permanente, ≠ módulos)
Os módulos (Exames, Eventos, Medicamentos…) são organizações de roadmap; as **capacidades** são permanentes e
atravessam todos eles:
```
Capture → Normalize → Store → Version → Audit → Correlate → Share → Export → Integrate → Observe
```
- **Capture** (`CAP-001`/Capture Hub) · **Normalize** (`DATA-001`/CPE) · **Store** (canônico + backends) ·
  **Version** (Reprodutibilidade/extraction_versions) · **Audit** (`COMPLIANCE-001` COMP-04) ·
  **Correlate** (Timeline/Evento Assistencial) · **Share** (REL-001 + COMP-05) · **Export** (COMP-01) ·
  **Integrate** (`HIP-001`/COMP-13) · **Observe** (`OPS-001`).
Toda funcionalidade nova se encaixa numa capacidade existente antes de justificar uma nova (Estabilidade Arquitetural).

## Governança de princípios
Documentos que referenciam o ADR-000: `COMPLIANCE-001`, `DATA-001`, `DATA-002`, `API-001`, `AI-001`,
`EVENTS-001`, `ARCH-FEATURE-FLAGS`, `TENANT-001`, `OPS-001`, `UCDA-001`, `HIP-001`, `GOVERNANCA.md`.
Conflito entre documentos → o ADR-000 prevalece.
