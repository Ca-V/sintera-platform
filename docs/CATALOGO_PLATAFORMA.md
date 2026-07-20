# CATÁLOGO GERAL DA PLATAFORMA — SINTERA

**Objetivo:** descrever **todos os módulos previstos** da SINTERA — mesmo os que não entram no MVP — para visão única do
produto.
**Escopo:** módulos de produto + pilares transversais; não descreve implementação (ver HIPs).
**Status:** Approved · **Versão:** 1.0 · **Histórico:** v1.0 (2026-07-20) — criação.
**Dependências:** [[ARCH-003]] · [[HIP-011]] (produto mobile) · [[sidebar_ssot_taxonomia]] (taxonomia). **Impacto:** mapa
de referência para Produto/UX/Eng.

## Módulos de produto
| Módulo | Descrição | Onda ([[IMPLEMENTATION_ROADMAP]]) |
|---|---|---|
| **Timeline de Saúde** | história longitudinal unificada (Observações, eventos, documentos) | O2 |
| **Observações / Monitoramento** | sinais contínuos (FC, HRV, sono, SpO₂…) como Observações | O3 |
| **Composição Corporal** | peso/gordura/massas (manual + bioimpedância; wearable depois) | existe (web) / O3 |
| **Exames e Documentos** | repositório documental + estruturação + ver original | O2 |
| **Agenda** | consultas, lembretes, próximas ações | O2 |
| **Medicamentos** | uso, recompra, lembretes | O2/O4 |
| **Suplementos** | análogo a Medicamentos | O2/O4 |
| **Indicadores** | derivados das Observações (médias, variabilidade, tendências) — V3 | pós-O3 |
| **Integrações** | capacidades nativas + conectores externos ([[ARCH-004]]) | O3/O4 |
| **IA contextual** | assistência factual sobre a história (LLM=interface) — V3 | futuro |
| **Compartilhamento / Rede de Cuidado** | profissionais/familiares, permissões, auditoria ([[care_001_espaco_colaborativo]]) | futuro |
| **Perfil** | dados da pessoa, preferências | O1/O2 |
| **Configurações** | conta, conexões/dispositivos, notificações, privacidade | O1/O2 |
| **Planejamento** | ações futuras de saúde (reprodutivo/exames periódicos/metas) | futuro |
| **Relatórios** | seleção espelhando o domínio; compartilhável | existe (web) |

## Pilares transversais (infra reutilizada por vários módulos)
| Pilar | Papel |
|---|---|
| **NOV-001 — Novidade** | "o usuário já viu?"; banner + selos + notificações; fonte única |
| **NOTIF-001 — Notificações** | canal por categoria (push/email/WhatsApp); Sidebar como taxonomia |
| **HUB-001 — Captura** | ponto único de registro; intenção antes do mecanismo |
| **Observação ([[HIP-007]])** | substrato único de todo dado objetivo |
| **CARE-001 — Rede de Cuidado** | compartilhamento governado |
| **BILLING-001 — Assinaturas** | monetização desacoplada |

## Notas
- Taxonomia e nomes seguem a **Sidebar** ([[sidebar_ssot_taxonomia]]) — sem taxonomias paralelas.
- Módulos "futuro/V3" já têm lugar na arquitetura (Observação/API-first/monorepo) → entram **sem redesenho**.
