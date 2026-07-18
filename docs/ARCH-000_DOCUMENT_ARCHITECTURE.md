# ARCH-000 — Document Architecture (índice oficial da documentação)

**Status:** normativo · vivo. **Versão:** 1.0 (17/07/2026). **Responsável:** Fundadora (direção) · Claude (curadoria).
**Objetivo:** ser o **mapa único** da documentação da SINTERA — o que existe, o que prevalece, quem depende de
quem — para que qualquer pessoa (equipe atual ou novos desenvolvedores) saiba **qual documento consultar** sem
depender do histórico de conversas. Criado quando o acervo passou de ~85 documentos (17/07/2026).

> **Regra de ouro:** todo documento arquitetural novo entra neste índice **no mesmo commit** em que é criado.
> Documento fora do ARCH-000 é considerado rascunho, não normativo.

---

## 1. Precedência (ordem de prevalência em caso de conflito)

```
ADR-000  (Constituição — princípios e invariantes inegociáveis)
   ↓ prevalece sobre
SPAGS    (Especificação Institucional — documento MESTRE da arquitetura)
   ↓ prevalece sobre
ARCH-000 (este índice) + documentos de DOMÍNIO (HIP-001, FIN-001, CAP-001, DATA-001, …)
   ↓ prevalece sobre
Backlogs / checklists / planos operacionais (BACKLOG_BETA, *_CHECKLIST_FUNCIONAL, …)
```

Em conflito, o documento de camada superior vence. Um documento de domínio **nunca** contraria o ADR-000 ou o
SPAGS; se precisar, o superior é emendado PRIMEIRO (mudança de arquitetura permanente = SPAGS/ADR antes do código).

## 2. Hierarquia da documentação

```
                         SPAGS  (mestre — a fornecer/consolidar)
                           │
                        ARCH-000  (este índice)
        ┌──────────────────┼───────────────────────────────┐
   CONSTITUIÇÃO         DOMÍNIOS                        GOVERNANÇA TRANSVERSAL
   ADR-000              DATA-001  · CAP-001  · HIP-001   COMPLIANCE-001 · GOV-001
   (invariantes)        UCDA-001  · CEF-001  · FIN-001   DATA-002 · API-001 · AI-001
                        EVENTS-001· CARE-001 · WEA-001   OPS-001 · TENANT-001 · SEC-001
                        NOTIF-001 · BILLING-001·DOC-001   ARCH-FEATURE-FLAGS
                        REL-001(RPT) · HOM-001 · SHR-001
                           │
                        OPERACIONAL (não-normativo)
                        BACKLOG_BETA · RELEASE-1.0 · *_CHECKLIST_FUNCIONAL · planos/QA
```

## 3. Registro canônico — documentos principais

Metadados por documento: **Objetivo · Escopo · Responsável · Dependências · Relacionado · Versão**.
(Documentos operacionais/históricos ficam na §5, sem metadados completos.)

### Constituição
| Doc | Objetivo | Escopo | Depende de | Relacionado | Versão |
|---|---|---|---|---|---|
| **ADR-000** | Princípios arquiteturais + invariantes constitucionais | Toda a plataforma | — (raiz) | SPAGS, todos | 🔒 |
| **ADR-001** | Projeção sem duplicação + ponto único de edição (SSOT) | Toda a plataforma | ADR-000 | FIN-001, BOD-001, CTC-001 | ativo (18/07) |

### Domínios (cada um ganha doc próprio quando trabalhado — §4 define a estrutura)
| Doc | Objetivo | Escopo | Depende de | Relacionado | Versão |
|---|---|---|---|---|---|
| **DATA-001** | Modelo Canônico de dados de saúde | Representação canônica | ADR-000 | UCDA-001, CEF-001 | ativo |
| **UCDA-001** | Arquitetura Universal de Dados Clínicos (contrato de saída) | Evidência clínica | DATA-001 | CEF-001, CPE | ativo |
| **CEF-001** | Clinical Extraction Framework (leitor por tipo de doc) | Extração | UCDA-001 | CAP-001 | ativo |
| **CAP-001** | Captura documental institucional (componente único) | Entrada de registros | ADR-000, DATA-001 | DS-001, DOC-001 | 🔒 |
| **HIP-001** | Connector Layer — integração corporativa (vendor+domain-neutral) | Aquisição externa | UCDA-001 | WEA-001, DATA-001 | ativo |
| **WEA-001** | Wearables Domain (1ª implementação sobre HIP-001) | Wearables | HIP-001, DATA-001 | Sinais Vitais, Timeline | ativo (17/07) |
| **BOD-001** | Composição Corporal (painel longitudinal) + princípio **Fato × Visualização** (3 domínios sem sobreposição) | Indicadores corporais | ADR-000, DATA-001, EVENTS-001 | Histórico de Exames, HIP-001 | ativo (17/07) |
| **FIN-001** | Financial Domain (valor·NF·recibo·comprovante → Despesas) | Financeiro | ADR-000, EVENTS-001 | Evento Assistencial, `/gastos`, REL-001 | ativo (17/07) |
| **CTC-001** | Contracepção + arquitetura de Planejamento (vínculo por referência) | Contracepção/Planejamento | ADR-000, ADR-001 | Ciclo, Medicamentos, Recursos, NOTIF-001 | ativo (18/07) |
| **EVENTS-001** | Domain Events / Evento Assistencial | Eventos assistenciais | DATA-001 | FIN-001, CARE-001 | ativo |
| **CARE-001** | Care Space (continuidade do cuidado) | Episódio de cuidado | EVENTS-001 | — | ativo |
| **NOTIF-001** | Central de Notificações (infra única) | Notificações | ADR-000 | — | ativo |
| **BILLING-001** | Assinaturas/Billing (SaaS) | Comercial | ADR-000 | TENANT-001 | ativo |
| **DOC-001** | Repositório de Documentos | Documentos-fonte | CAP-001 | — | ativo |
| **REL-001** | Central de Relatórios (Reporting = RPT-001) | Relatórios | DATA-001 | FIN-001 | ativo |
| **HOM-001** | Home Experience (institucional) | 1ª tela | ADR-000 | DS-001 | a criar (BETA-9) |
| **SHR-001** | Sharing Domain (compartilhamento) | Compartilhamento | DATA-001 | REL-001 | a criar |
| **MOB-001** | Mobile Domain (app nativo) | App nativo | ADR-000 | HIP-001 | a criar (futuro) |

### Governança transversal
| Doc | Objetivo | Depende de | Versão |
|---|---|---|---|
| **COMPLIANCE-001** | Conformidade estrutural + Gate de Conformidade (9 eixos) | ADR-000 | ativo |
| **GOV-001** | Matriz de cobertura de governança | ADR-000 | ativo |
| **DATA-002** | Data Governance | DATA-001 | ativo |
| **DATE-001** | Infraestrutura Temporal Única (SSOT de datas: primitivos + regras) | ADR-000 · ADR-001 | ativo (18/07) |
| **API-001** | API Governance | ADR-000 | ativo |
| **AI-001** | AI Governance | ADR-000 | ativo |
| **OPS-001** | Observability Governance | ADR-000 | ativo |
| **OPS-002** | Runbook de Release, Backup e Restauração | ADR-000 · COMPLIANCE-001 · OPS-001 | ativo |
| **TENANT-001** | Tenant Governance | ADR-000 | ativo |
| **SEC-001** | Projeto Shield (Segurança) | ADR-000 | ativo |
| **ARCH-FEATURE-FLAGS** | Feature Flags | ADR-000 | ativo |
| **DS-001** | Design System | ADR-000 | ativo |
| **UX-001** | Arquitetura de Experiência | ADR-000 | ativo |

## 4. Estrutura ÚNICA dos documentos de domínio (convenção obrigatória)

Todo documento de domínio segue **exatamente** esta ordem de seções (facilita manutenção e onboarding):

```
1. Objetivo          — o que o domínio resolve
2. Escopo            — o que está dentro / fora
3. Modelo de Dados   — entidades, tabelas, contrato canônico
4. Componentes       — módulos/serviços que o compõem
5. Fluxos            — jornadas ponta a ponta
6. APIs              — contratos de entrada/saída
7. Segurança         — LGPD, autorização, tokens, RLS
8. Governança        — decisões, precedência, quem decide
9. Auditoria         — rastreabilidade, versionamento, evidência
10. Evolução         — roadmap do domínio, itens adiados
```

**Cabeçalho padrão** (todo doc): `Status · Versão · Responsável · Objetivo` + linha de metadados
(Escopo · Dependências · Relacionado a). Docs anteriores a esta convenção migram ao serem revisitados.

## 5. Demais documentos (operacionais/históricos — não-normativos)
Backlogs (`BACKLOG_BETA`, `BACKLOG_CONCLUSAO`, `BACKLOG_EVOLUCOES`), definição de release (`RELEASE-1.0`),
checklists funcionais (`EXAMES_/EVENTOS_CHECKLIST_FUNCIONAL`), planos e QA (`HOMOLOGATION_PLAN`, `QA-001`,
`PROCESSO_HOMOLOGACAO`), auditorias datadas, modelos de domínio/glossário, catálogos científicos e specs de
Knowledge Graph. Consultáveis, mas **subordinados** às camadas superiores.

## 6. Convenção de nomenclatura
`XXX-NNN_TITULO` — prefixo de 3 letras por área (`ADR`, `DATA`, `CAP`, `HIP`, `FIN`, `WEA`, `RPT`, `HOM`,
`SHR`, `MOB`, `API`, `AI`, `OPS`, `SEC`, `GOV`, `DS`, `UX`, `NOTIF`, `BILLING`, `CARE`, `EVENTS`, `TENANT`,
`COMPLIANCE`). Número sequencial por área. Um domínio = um prefixo.

## 7. Ciclo de vida de um documento
`rascunho → ativo → 🔒 congelado (concepção encerrada) → emendado (só por revisão explícita)`. Congelamento
sinaliza que o aprendizado passa a vir da implementação, não de nova documentação. Toda emenda registra data.

---
**Relaciona:** SPAGS (mestre) · ADR-000 (constituição) · GOV-001 (cobertura) · todos os documentos de domínio.
