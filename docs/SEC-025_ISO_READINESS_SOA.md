# SEC-025 — ISO 27001 / 27701 / 27799 Readiness + Statement of Applicability (SoA) · v0.1 (rascunho)

> **Estado:** E1 (documento). Roadmap de readiness e **esqueleto de SoA** ancorado nos controles internos
> SEC-001…025. **Escopo do Lote S0-A:** documentação. Não é certificação nem auditoria formal.
> Complementa `docs/COMPLIANCE-001_GOVERNANCA.md` (que já traz mapeamento de governança).

## 1. Normas no escopo
- **ISO/IEC 27001** — SGSI (gestão de segurança da informação).
- **ISO/IEC 27701** — extensão de privacidade (PIMS) — alinhado à LGPD.
- **ISO 27799** — segurança da informação em **saúde** (específico do domínio SINTERA; **ausente** hoje — gap).

## 2. Roadmap de readiness (fases)
1. **Escopo e contexto** do SGSI (fronteiras, partes interessadas, ativos, classificação C0–C5). — *pendente*
2. **Análise de risco** (metodologia + risco tratado) — usar `RISK_REGISTER.md` como base. — *parcial*
3. **SoA** (este documento, §4) — mapeia controles aplicáveis e justifica exclusões. — *rascunho*
4. **Controles operacionais** — implementação SEC-001…024 (gates S0–S3). — *em diagnóstico (EXDOC-026)*
5. **Evidência e auditoria interna** — antes de auditoria externa. — *pendente*
6. **27701 (privacidade)** — RIPD/DPIA (SEC-021), direitos do titular (SEC-022). — *pendente*
7. **27799 (saúde)** — controles específicos de dado de saúde. — *ausente (gap explícito)*

## 3. Regra de "pronto" (evita falso VERDE)
Um controle só é **VERDE** com implementação + teste + resultado + evidência + owner. Coerente com o método do
EXDOC-026 (níveis E0–E5). Readiness ≠ certificação.

## 4. Statement of Applicability (SoA) — esqueleto ancorado em SEC-001…025
| Ref. interna | Tema | Aplicável? | Estado (EXDOC-026) | Gate |
|---|---|---|---|---|
| SEC-001 | MFA/identidade | Sim | 🔴 | S1 |
| SEC-002 | RBAC/ABAC | Sim | 🔴 | S1 |
| SEC-003 | PAM/JIT | Sim | 🔴 | S1 |
| SEC-004 | Isolamento por tenant | Sim | 🟡 | S1 |
| SEC-005 | Object-level authz (BOLA) | Sim | 🟡→(S0-A: guarda+testes) | S1 |
| SEC-006 | API gateway/rate/schema | Sim | 🟡→(S0-A: validação) | S1 |
| SEC-007 | KMS/secrets/rotação | Sim | 🟡 | S0 |
| SEC-008 | Rede/egress | Sim | 🔴 | S0 |
| SEC-009 | Auditoria de acesso | Sim | 🟡 | S1 |
| SEC-010 | SIEM/detecção | Sim | 🟡 | S3 |
| SEC-011 | AI Gateway | Sim | 🟡 | S2 |
| SEC-012 | Tool Gateway | Condicional | 🔵 | S2 |
| SEC-013 | Sandbox/egress de IA | Sim | 🔴 | S2 |
| SEC-014 | Validação FHIR | Sim | 🟡 | S2 |
| SEC-015 | Adaptador RNDS | Diferido | 🔵 | gate RNDS |
| SEC-016 | SAST/SCA/secret/IaC | Sim | 🔴→(S0-A: workflow) | S1 |
| SEC-017 | DAST | Sim | 🔴 | S3 |
| SEC-018 | Incident Response | Sim | 🔴→(S0-A: playbook) | S3 |
| SEC-019 | Backup/DR/RPO/RTO | Sim | 🟡→(S0-A: objetivos+procedimento) | S3 |
| SEC-020 | Pentest independente | Sim | 🔴 | S3 |
| SEC-021 | DPIA/RIPD (27701) | Sim | 🔴 | S3 |
| SEC-022 | Retenção/direitos (27701) | Sim | 🟡 | S2 |
| SEC-023 | Due diligence terceiros | Sim | 🔴 | S3 |
| SEC-024 | SBOM/provenance | Sim | 🔴→(S0-A: SBOM no CI) | S1 |
| SEC-025 | ISO readiness (este doc) | Sim | 🟡 | S3 |
| **27799** | Controles de saúde | Sim | **ausente** | S3 |

## 5. Limitações / residual
- SoA é **esqueleto**; a versão formal exige escopo do SGSI aprovado e owner (Compliance).
- **ISO 27799 ausente** — mapear controles de saúde é trabalho dedicado (S3).
- Nenhuma auditoria/readiness formal executada (E-doc apenas).
