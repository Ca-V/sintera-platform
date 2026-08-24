# Runbook do preview FHIR (Nível C) — NÃO EXECUTAR sem gate material

> Roteiro do preview com **dados reais**. **NÃO** executar contra banco/dados reais sem autorização explícita
> (gate C). Este runbook é read-only; o **adaptador de fonte real NÃO está implementado** (é o 1º passo do gate C).

## Pré-condições (gate C — exigem autorização)
1. Ambiente de **preview/staging** separado de produção.
2. Migrações **137→143** aplicadas no preview (Fase 0 incluída) — **gate material**.
3. Adaptador `CanonicalSource` sobre Supabase **read-only**, aplicando **RLS** e **minimização** (só colunas de projeção), a implementar no gate.

## Execução (quando autorizado)
```ts
// Pseudo-roteiro (o adaptador real de fonte é gated e NÃO acompanha este runbook):
import { runCanonicalPreview } from '@/lib/fhir/canonical/preview'
// const source = createSupabaseCanonicalSource(client)   // ← implementar no gate C (read-only, RLS)
// const report = await runCanonicalPreview(source, { userId })
// Aprovação estrutural: report.approved === true && report.structural.unresolved.length === 0
```
Amostragem: contas de teste/sintéticas ou **consentidas**; cobrir lab, imagem, pedido e bilateral (se houver).

## Critérios objetivos (espelham EXDOC-020 §9)
- **APROVA:** migrações aplicam sem erro · leitura sem erro · `report.approved` (grafo estrutural OK, 0 refs não resolvidas, ids únicos, sem RNDS, coding honesto) · **nenhum** coding/identificador inventado · **zero** escrita/mutação · RLS isola.
- **REPROVA:** erro de migração/leitura · referência não resolvida · coding inventado · qualquer escrita · violação de RLS · divergência semântica.

## Salvaguardas
- **Somente leitura**; nenhum backfill; nenhum bundle real exportado; evidências agregadas.
- Registrar leituras em `audit_events` (finalidade/escopo).
- Nível C **não** é evidência de Nível D (RNDS/OpenCare).
