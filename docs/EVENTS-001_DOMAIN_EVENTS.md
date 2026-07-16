# EVENTS-001 — Domain Events (catálogo de eventos de domínio)

> Referencia `ADR-000`. Documentar eventos de domínio **desacopla componentes** e simplifica integrações
> futuras (conectores, notificações, auditoria, timeline). Já existe o seam `EventBus` (`src/lib/agenda/bus.ts`);
> este catálogo o formaliza e amplia para toda a plataforma.

## Convenções
- Nome no passado, `PascalCase` (o evento é um FATO que ocorreu): `ExamImported`, `BiomarkerExtracted`.
- Evento é **imutável** e carrega: `type` · `occurredAt` (UTC) · `actor` (usuário/sistema) · `payload` canônico ·
  `correlationId`. Consumidores reagem; não mutam o evento.
- Publicar evento **não** pode quebrar produtores existentes (Backward Compatibility — ADR-000 §12).

## Catálogo (inicial — cresce com os domínios)
```
ExamImported → ExamApproved → BiomarkerExtracted → DocumentShared →
PermissionGranted → WearableSynced → MedicationAdded
```
- **Exames:** `ExamImported` · `ExamAnalyzed` · `BiomarkerExtracted` · `ExamDeduplicated` · `ExamSplitIntoParts`.
- **Compartilhamento/acesso:** `DocumentShared` · `ShareRevoked` · `ShareAccessed` · `PermissionGranted` · `PermissionRevoked`.
- **Eventos assistenciais:** `EventCreated` · `EventCompleted` · `EventCancelled` (já emitidos pelo EventBus).
- **Integrações (futuro, HIP-001):** `ConnectorAuthorized` · `WearableSynced` · `SyncFailed` · `ConnectorRevoked`.
- **Medicamentos/suplementos (futuro):** `MedicationAdded` · `SupplementAdded`.

## Usos
Auditoria (COMP-04) · notificações (NOTIF-001) · timeline/correlação · integrações. Um mesmo evento pode ter
vários assinantes sem acoplamento. Mudança de contrato de evento → ADR + Compliance Gate (Arquitetura · Auditoria).

## Estado
`EventBus` existe como seam (sem múltiplos assinantes ainda — latência de arquitetura conhecida, baixa prioridade).
Catálogo formalizado aqui; eventos novos entram por este documento antes de serem emitidos.
