# TRACEABILITY_MATRIX — Rastreabilidade (requisito ↔ incremento ↔ evidência ↔ estado)

Documento **vivo** (fundadora, 2026-07-31; [ADR-019](docs/adr/ADR-019_GOVERNANCA_CICLO_INCREMENTOS.md)). Relaciona
cada requisito ao incremento que o entrega, à evidência e ao **estado formal** ([MOBILE-022](docs/MOBILE-022_TEMPLATE_EVIDENCIAS_INCREMENTO.md):
Planejado→Implementado→Verificado→Homologado→Aceito). Facilita auditoria e análise de impacto. Fonte dos
requisitos: [MOBILE-015](docs/MOBILE-015_ROADMAP_INCREMENTOS.md) (roadmap) + taxonomia SSOT.

- **Última atualização:** 2026-07-31 · **Mobile:** Onda 1

Uma alteração num **contrato** ou **ADR** permite identificar imediatamente os incrementos impactados (colunas
Contrato/ADR). Contratos: [API_CONTRACTS](docs/API_CONTRACTS.md). ADRs: `docs/adr/`.

**Origem:** Negócio · Regulatório · Arquitetural · Técnico · Defeito · Produto (permite responder "quais funções
existem por exigência regulatória / evolução de produto / eliminação de dívida técnica").

| Requisito | Origem | Inc | Contrato | ADR | Evidência (doc + tag/commit) | Estado |
|-----------|--------|-----|----------|-----|------------------------------|--------|
| Autenticação | Arquitetural | Inc1 | `auth` v1 | ADR-016 · ADR-017 | [MOBILE-008](docs/MOBILE-008_INCREMENTO1_ACEITE.md) + tag `mobile-inc1-accepted` | ✅ **Aceito** |
| Navegação (Bottom Tabs, projeção SSOT) | Arquitetural | Inc2 | — | — (MOBILE-009) | [MOBILE-013](docs/MOBILE-013_INCREMENTO2_ACEITE.md) + tag `mobile-inc2-accepted` | ✅ **Aceito** |
| Home Shell (composição de slots) | Arquitetural | Inc3 | — | ADR-018 | [MOBILE-021](docs/MOBILE-021_INCREMENTO3_ACEITE.md) + tag `mobile-inc3-accepted` | ✅ **Aceito** |
| **Perfil** (editar nome+telefone; exibir avatar/faixa/objetivos) | Produto | Inc4 | `profile` v1 | ADR-019 | [MOBILE-023](docs/MOBILE-023_ROTEIRO_HOMOLOGACAO_INCREMENTO4.md) · commits `483692c`/`c65b4cb`/`8dd0d5b` · CI ✅ | 🔄 **Verificado** |
| **Histórico de Exames** (lista + documento original) | Negócio + Regulatório (REG-001) | Inc5 | `exams` v1 | — | [MOBILE-024](docs/MOBILE-024_PLANEJAMENTO_INCREMENTO5_EXAMES.md) (plano + Readiness) | 📋 **Planejado** |
| Upload de Exames | Produto | Inc6 | (futuro) | — | — | ⬜ |
| Registro Manual | Produto | Inc7 | (futuro) | — | — | ⬜ |
| RegistrationHub | Arquitetural | Inc8 | — | HUB-001 | — | ⬜ |
| Composição Corporal | Negócio | Inc9 | (futuro) | — | — | ⬜ |
| Agenda | Negócio | Inc10 | (futuro) | — | — | ⬜ |
| Insights | Negócio | Inc11 | (futuro) | — | — | ⬜ |

> Atualizar a cada mudança de estado. O estado **Aceito** exige tag + bloco de rastreabilidade no doc de aceite
> ([MOBILE-022](docs/MOBILE-022_TEMPLATE_EVIDENCIAS_INCREMENTO.md)). Cada célula de "Evidência" deve ser um link
> verificável (não apenas um número de doc).
