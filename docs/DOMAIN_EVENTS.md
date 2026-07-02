# SINTERA — Eventos de Domínio (DOMAIN_EVENTS)

**Status:** Etapa 3 do fechamento do Domain Model (fundadora, 02/07/2026). Catálogo **oficial** dos eventos de domínio da plataforma. Base para a arquitetura orientada a eventos (`ADR-003`) e para integrações/notificações.
**Convenção:** nome no passado (fato ocorrido), PascalCase. Cada evento tem: contexto emissor, significado, carga conceitual (não schema). Nenhum evento carrega juízo clínico.

---

## Ingestão / Clinical Data + AI + Documents
| Evento | Emissor | Significado | Carga (conceitual) |
|---|---|---|---|
| `DocumentUploaded` | Documents | Documento adicionado pelo paciente | documento, tipo, paciente, origem |
| `DocumentDuplicateDetected` | Documents | Conteúdo já existente | documento, referência ao existente |
| `OCRCompleted` | AI | Texto extraído do documento | documento, texto/estruturas |
| `ParserCompleted` | AI | Estruturação do conteúdo | documento, campos candidatos |
| `MeasurementsExtracted` | AI/Clinical Data | Medições identificadas | exame, lista de medições (valor/unidade/data) |
| `CatalogMatched` | Catalog | Medições associadas a `catalog_id` | medições, cobertura (matched/unmatched) |
| `CatalogMatchMissing` | Catalog | Biomarcador sem `catalog_id` (pendência de cobertura) | medição, nome cru |
| `ExamCreated` | Clinical Data | Exame consolidado a partir das medições | exame, evento |
| `DocumentReplaced` | Documents | Anexo/laudo substituído (versão nova; original preservado) | exame, documento novo/antigo |
| `ExamDeleted` | Clinical Data | Exame e medições removidos | exame |

## Timeline / Projeções
| Evento | Emissor | Significado |
|---|---|---|
| `TimelineUpdated` | Timeline | Linha do tempo recomposta após criação/edição/exclusão de evento |
| `ProjectionsRecomputed` | Clinical Data | Séries/Dashboards/Índice reprojetados (após mudança de dado ou catálogo) |

## Catálogo / Conhecimento
| Evento | Emissor | Significado |
|---|---|---|
| `CatalogUpdated` | Catalog | Metadado de um `catalog_id` mudou (nome/painel/material/aliases/ordem) → dispara reprojeção (nunca reescreve medição) |
| `ProtocolUpdated` | Knowledge | Nova versão de protocolo |
| `GuidelineRevised` | Knowledge | Diretriz revisada (nova versão) |
| `KnowledgeUpdated` | Knowledge | Conteúdo científico relacionado a um biomarcador atualizado |
| `DocumentReviewed` | Knowledge/Users | Conteúdo revisado (governança) |
| `DocumentApproved` | Knowledge/Users | Conteúdo aprovado (`approval_status`) |

## Usuários / Dispositivos / Produtos
| Evento | Emissor | Significado |
|---|---|---|
| `UserInvited` | Users | Convite a um perfil (RBAC) |
| `DeviceConnected` | Products/Devices | Dispositivo/wearable conectado (integração) |
| `MedicationAdded` | Products | Medicamento cadastrado (projeta p/ Agenda/Histórico/Gastos) |
| `SupplementAdded` | Products | Suplemento cadastrado |

## Notificações / Auditoria (transversais)
| Evento | Emissor | Significado |
|---|---|---|
| `NotificationGenerated` | Notifications | Aviso factual gerado (ex.: "exame novo", "diretriz atualizada") — nunca clínico |
| `AuditRecorded` | (todos) | Toda operação crítica registra autor/data/versão/ação |

---
**Regras:** (1) eventos descrevem fatos, não conclusões; (2) `CatalogUpdated` reprojeta, nunca reescreve `MeasurementsExtracted`; (3) toda cadeia crítica termina em `AuditRecorded`. Novo evento entra aqui **antes** de virar código.
