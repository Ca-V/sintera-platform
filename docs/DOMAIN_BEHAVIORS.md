# SINTERA — Comportamentos do Domínio (DOMAIN_BEHAVIORS)

**Status:** Etapa 2 do fechamento do Domain Model (fundadora, 02/07/2026). **Conceitual** — descreve *o que acontece*, não *como implementar*. Complementa `SCIENTIFIC_DOMAIN_MODEL.md` (estrutura) com a dimensão de **comportamento** (DDD).
**Referencia:** eventos em `DOMAIN_EVENTS.md`; regras em `DOMAIN_INVARIANTS.md`. Governança Científica: nenhum comportamento conclui/diagnostica/recomenda (RDC 657).
**Notação:** cada fluxo lista gatilho → sequência → *eventos de domínio* emitidos → invariantes preservadas.

---

## B1. Chega um Documento / Exame
Gatilho: paciente adiciona um documento (laudo).
```
Documento recebido → OCR → Parser → Normalização → Identificação no Catálogo (catalog_id)
→ Criação das Medições → Atualização da Timeline → Atualização das Projeções
→ Notificações → Auditoria
```
Eventos: `DocumentUploaded` → `OCRCompleted` → `ParserCompleted` → `MeasurementsExtracted` → `CatalogMatched` → `TimelineUpdated` → `NotificationGenerated`. Toda etapa gera trilha de auditoria.
Invariantes: nomenclatura/painel/material vêm do Catálogo; cada Medição pertence a 1 Biomarcador e 1 Exame; a IA **não altera o documento original**; nada de juízo clínico. Biomarcador sem match de catálogo → **registrado como pendência de cobertura** (não silencioso), cai em "Outros" com nome cru até curadoria.

## B2. O Catálogo muda (curadoria / Catalog v2)
Gatilho: alias/painel/material/nome/ordenação de um `catalog_id` é atualizado.
```
CatalogUpdated → identificar Medições/Exames afetados → RE-projetar (Evolução, Dashboards,
Comparações, Índice) → invalidar caches dessas projeções → NÃO recriar Medições (o dado bruto
do laudo é imutável) → Auditoria da mudança de catálogo
```
Regra-chave: **muda a APRESENTAÇÃO/agrupamento, nunca o valor medido**. Recalcular = reprojetar, não reescrever o laudo.

## B3. Um Biomarcador muda de Painel/Material
Gatilho: curadoria reclassifica um `catalog_id` (ex.: move para outro painel).
Impacto: **Evolução** (segmentação), **Dashboards** e **Comparações** re-agrupam; **Timeline/Histórico** não muda (eventos são por data, não por painel). Emite `CatalogUpdated`. Séries permanecem íntegras porque a chave é `catalog_id` (não o nome/painel).

## B4. Uma Diretriz / Protocolo científico muda
Gatilho: nova versão de diretriz/protocolo no Knowledge.
Comportamento: cria **nova versão** (versionamento), marca a anterior como superada, e — se ligada a biomarcadores do paciente — gera aviso **factual**: "há atualização de diretriz relacionada ao biomarcador X". Eventos: `ProtocolUpdated`/`KnowledgeUpdated` → `NotificationGenerated`. **Nunca** recomenda conduta; só sinaliza a existência/atualização.

## B5. Chega um Documento duplicado
Gatilho: documento idêntico/já existente.
Comportamento: detectar por identidade do conteúdo; **não** criar Exame/Medições novos; informar "documento já adicionado". Evento: `DocumentDuplicateDetected`. Auditoria registra a tentativa.

## B6. Um Exame é excluído
Gatilho: paciente exclui um exame.
Comportamento: remover o Exame e suas Medições → **reprojetar** séries/Dashboards/Índice → atualizar Timeline → Auditoria (quem/quando). Eventos: `ExamDeleted` → `TimelineUpdated`. Séries que dependiam dele são recompostas; nada de resíduo em projeções.

## B7. Um Documento é substituído
Gatilho: paciente troca o anexo/laudo de um exame.
Comportamento: versionar o documento (o original **nunca** é apagado da trilha de auditoria); reprocessar (B1) gerando novas Medições **como nova versão**; projeções passam a refletir a versão corrente. Eventos: `DocumentReplaced` → reprocessamento (B1). Invariante: original preservado para auditoria.

## B8. Uma Diretriz é revisada / aprovada (governança do conhecimento)
Gatilho: revisão/aprovação de conteúdo científico.
Comportamento: `DocumentReviewed` → `DocumentApproved`; muda `approval_status`/`version`; consumidores passam a exibir a versão aprovada. Auditoria completa (autor/data/versão/aprovação).

---
## Princípios transversais dos comportamentos
1. **Dado bruto do laudo é imutável** — mudanças de catálogo/curadoria reprojetam, nunca reescrevem a Medição.
2. **Tudo gera auditoria** — nenhum comportamento crítico sem trilha.
3. **A IA nunca altera o documento original** nem conclui clinicamente.
4. **Projeções são deriváveis e recomputáveis** a partir de Medições + Catálogo — nunca a fonte da verdade.
5. **Séries e agrupamentos usam `catalog_id`** — mudança de nome/painel não fragmenta nem quebra histórico.

---
**Fechamento:** estes comportamentos descrevem corretamente a dinâmica do domínio? Faltou algum cenário? (ex.: exame sem data, unidade divergente entre laudos, biomarcador novo não catalogado.)
