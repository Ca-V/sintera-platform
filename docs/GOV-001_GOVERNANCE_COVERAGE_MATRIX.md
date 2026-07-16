# GOV-001 — Governance Coverage Matrix (mensurável · auditável · verificável)

> **Decisão da fundadora (15/07/2026):** o próximo ganho não é ter mais regras, e sim **demonstrar
> continuamente que estão sendo cumpridas**. GOV-001 agrega a cobertura da governança, versiona a própria
> governança, define quando exigir revisão arquitetural formal e mede a maturidade. Raiz: `ADR-000`.
> **Postura conservadora (COMPLIANCE-001):** status só `✅` com evidência verificável.

## Governance Version — **1.0** (baseline 15/07/2026)
Versiona a PRÓPRIA governança (além de APIs `API-001` e modelo `DATA-001`).
- **v1.0** — baseline: `ADR-000` (14 princípios + 7 invariantes + capacidades) · Fase 0 `COMPLIANCE-001`
  (13 COMP, Gate de 9 eixos em 2 partes, Exception Register, Impact Assessment) · camada transversal
  (DATA-001/002, API-001, AI-001, EVENTS-001, ARCH-FEATURE-FLAGS, TENANT-001, OPS-001).

Cada mudança relevante de governança registra: **princípio alterado · impacto · compatibilidade · migrações**.
```
| Versão | Data | Princípio/área | Impacto | Compat. | Migração |
| v1.0   | 15/07| baseline       | —       | —       | —        |
```
MAJOR = altera/remove um invariante ou princípio (raro, exige ADR). MINOR = novo doc/COMP/eixo aditivo. PATCH = correção.

## Matriz de Cobertura (princípio → documento → evidência → status)
`✅` evidenciado · `🟡` parcial · `⬜` sem evidência ainda. (Testes/evidências crescem com a execução.)

| Princípio (ADR-000) | Doc responsável | Requisitos | Testes/Evidência | Status |
|---|---|---|---|---|
| Open Architecture | UCDA-001 | CPE/adaptadores | `ARCH-processor-decoupling` | ✅ |
| Canonical Data Model | DATA-001 | COMP-13, invariante 1 | `write_canonical_extraction`/view | 🟡 |
| Vendor Neutrality | ADR-000/COMP-13 | 9º eixo do Gate | (Gate; teste a criar) | 🟡 |
| Privacy by Design | COMPLIANCE-001 COMP-01 | LGPD | RLS por titular | 🟡 |
| Security by Design | SEC-001/COMP-02 | segredos/menor privilégio | EXC-02 (parcial) | 🟡 |
| Compliance by Design | COMPLIANCE-001 COMP-12 | Gate = DoD | doc + Lifecycle | ✅ |
| Human-in-the-loop | GOVERNANCA.md/AI-001 | não substitui profissional | princípio + Disclaimer | ✅ |
| Document-first | ADR-000/EXA-F006 | estruturado deriva do doc | `FUNC-exam-structuring` | ✅ |
| Original Preservation | GOVERNANCA.md | original imutável/acessível | "Ver original" (REL-001) | ✅ |
| Explainability | principio_ui_rastreavel | UI = consequência do pipeline | (revisão) | 🟡 |
| Traceability | COMPLIANCE-001 COMP-04/DATA-002 | proveniência/lineage | proveniência de extração | 🟡 |
| Backward Compatibility | DATA-001/API-001 | aditivo por padrão | política + versão | 🟡 |
| Evolution w/o Breaking | DATA-001 | depreciar-não-apagar | política | 🟡 |
| Não-SaMD | GOVERNANCA.md/COMP-06/11 | não interpreta/diagnostica | RDC 657 + Gate | ✅ |

## Processo de Revisão Arquitetural (além do Compliance Gate)
O fluxo normal (`Implementação → Testes → Review → Compliance Review → Merge`) basta para a maioria. Mas **exigem
REVISÃO ARQUITETURAL FORMAL (ADR + citação de princípios afetados)** as mudanças que:
- criem **novo domínio**; · alterem o **modelo canônico** (`DATA-001`); · introduzam **novo tipo de dado**;
- integrem **novo fornecedor/conector** (`HIP-001`); · modifiquem **regras de compartilhamento** (COMP-05);
- alterem o **posicionamento regulatório** (não-SaMD → SaMD).
Sem essa revisão, decisões estruturais não passam pelo fluxo normal como se fossem features comuns.

## Indicadores de Governança (medir a maturidade — snapshot honesto 15/07/2026)
| Indicador | Valor atual | Nota |
|---|---|---|
| % requisitos COMP evidenciados (`✅`) | ~15% (2/13); 8 🟡 parciais | baseline recém-criado |
| Cobertura do Compliance Gate | ativo p/ features novas; **0** features com matriz de 9 eixos preenchida formalmente | aplicar retroativo a Exames = pendente |
| % funcionalidades com auditoria completa (COMP-04) | 0% | trilha append-only ainda não implementada |
| Cobertura de testes de requisitos regulatórios | parcial (RDC 657/não-produção via `ARCH-*`/`FUNC-*`); auditoria/segurança ⬜ | — |
| NCs — exceções abertas | **2** (EXC-02, EXC-07) | registradas, não implícitas |
| MTTR de NCs (engenharia) | mesmo ciclo (NC-0008/0019/0020/0021/0022 encerradas no dia) | comportamentais aguardam ambiente executável |

## Internacionalização (reserva de espaço — evita reorganização futura)
Sem i18n imediato, mas a governança reserva **eixo por jurisdição**: **BR** (ativo — LGPD, RDC 657/751, CFM, RNDS) ·
**UE** (reservado — GDPR, MDR/EU) · **US** (reservado — HIPAA, FDA). Requisitos específicos de jurisdição entram
como sub-itens dos COMP correspondentes sem reestruturar a Fase 0.

## Estado
GOV-001 é o **hub de verificabilidade**: à medida que testes/migrations/ADRs surgem, a Matriz de Cobertura e os
Indicadores são atualizados. Meta operacional: mover 🟡→✅ com evidência, reduzir exceções e elevar a cobertura do Gate.
