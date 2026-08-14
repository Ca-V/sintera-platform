# SINTERA — V2 Architecture Gap Analysis (conceitual)

**Status:** análise de **prontidão arquitetural**. **NÃO é implementação, NÃO é backlog.** Nenhuma conclusão vira tarefa de construção.
**Pergunta central:** *a V1 atual consegue evoluir para a arquitetura estratégica (`V2_STRATEGIC_PRODUCT_ARCHITECTURE.md`) sem criar dívida arquitetural?*
**Método:** cada conclusão é **fundamentada no código atual citado** (arquivo/símbolo), não em opinião.
**Classificações usadas:** **PRESERVAR** (alinhado ao futuro) · **PROTEGER** (correto, mas precisa de restrição para não ser destruído por features futuras) · **REFORMULAR** (a capacidade existe, a abstração pode não suportar a evolução) · **SUBSTITUIR** (decisão atual que provavelmente mudará) · **NÃO TOCAR AGORA** (construível, mas depende do wedge).

**Âncora do indivíduo (premissa que atravessa tudo):** `[FATO — código]` todo fato é escopado por `user_id` (RLS em Supabase; `exams`, `biomarkers`, `body_metrics`, `clinical_results`, `health_events`, `consent_records` etc.). **O "mesmo indivíduo" já existe como âncora** = o `user_id`. A pergunta de multi-fonte não é "temos um indivíduo?", e sim "conseguimos **resolver a identidade de uma fonte externa** para esse `user_id`?".

---

## 1. UCDA / Canonical Model → capacidade de mapeamento FHIR/BR-Core

**Código atual:** `src/lib/capture/ucda.ts` — `UcdaItem` já carrega `code` + `codeSystem` (sistema ABERTO: LOINC/SNOMED/local), `valueCode`, `valueText`/`valueNum`/`unit`, `region` (lateralidade), `anatomy`, `specimen`, `method`, `context`, `referenceText`, e proveniência por elemento (`page`, `excerpt`). `UcdaProvenance` (source/engineVersion/processorVersion/exam_id). `ucdaItemToRow`/`clinicalResultsToUcda` fazem a ponte com `clinical_results`.
**V2 estratégica:** o canônico deve ser **mapeável** a FHIR R4/BR-Core (Observation, DiagnosticReport, etc.) — *compatibility*, não FHIR server.
**Gap (justificado):** **BAIXO.** Os campos que o FHIR exige já existem: `code/codeSystem` → `Observation.code.coding.system/code`; `valueNum/valueText/valueCode` → `value[x]`; `region/anatomy` → `bodySite`; `specimen` → `Specimen`; `method` → `Observation.method`; `referenceText` → `referenceRange`; `page/excerpt` → proveniência/`derivedFrom`. Um projetor FHIR seria **aditivo** (como `ucdaItemToRow` ou `toClinicalContext` já são), sem alterar o domínio.
**Classificação:** **PROTEGER.** *Restrição:* manter a **pureza do domínio UCDA** — nenhuma feature futura pode mutar `UcdaItem` para o formato de uma fonte específica (FHIR/HL7/vendor). O mapeamento FHIR entra como **projeção**, nunca no domínio.

## 2. Clinical Identity → capacidade multi-fonte

**Código atual:** `src/lib/clinical-pipeline/contracts.ts` — `ClinicalIdentity` (`resolutionId`, `name`, `codes: TerminologyRef[]`, `aliases`, `equipment`, `examDate`, `patientName`, `confidence`) é **por documento**; `resolveClinicalIdentity` produz a identidade **do exame**. O paciente é `patientName` (string) + `user_id` (âncora). Casamento com o perfil via `compareNames`.
**V2 estratégica:** resolver a **identidade de uma fonte externa → mesmo `user_id`** (envelope N-identidades → 1 indivíduo), sem reconstruir a V1.
**Gap (justificado):** **MÉDIO.** A âncora do indivíduo existe (`user_id`); a **identidade documental** existe (`ClinicalIdentity`). O que **não** existe é uma **costura de resolução de identidade externa** (patient-matching de uma fonte automática → `user_id`). Hoje isso é implícito (o próprio titular faz upload/autoriza). Não há acoplamento que **impeça** a costura futura — mas ela precisa de um ponto de extensão reservado.
**Classificação:** **PROTEGER (+ pequena REFORMULAR do seam).** *Restrição:* preservar o `user_id` como âncora e reservar um **ponto único de resolução de identidade** (fonte externa → indivíduo); nenhuma feature pode assumir "identidade = string do documento" nem hardcodar fonte única. **MPI completo: NÃO agora.**

## 3. Provenance → transversalidade

**Código atual:** proveniência é **pervasiva e por atributo/elemento**: `Sourced`/`SourceRef`/`consensus` (Clinical Knowledge C6); `understanding_report`/`PipelineAudit` (Decision Log, `ResolvedFact` com `considered`/`rejected` + código); `UcdaProvenance` + `page/excerpt` por elemento; `biomarkers.source`/`source_material`/`source_exam_name`; `body_metrics.source`; `clinical_results.source`/`engine_version`; `connector` `SampleProvenance`; UI `examProvenance`/`ProvenanceLine`.
**V2 estratégica:** proveniência suficientemente transversal para suportar **fontes externas** (cada fato sabe de onde veio).
**Gap (justificado):** **BAIXO.** A disciplina já é transversal — o desafio não é criar proveniência, é **não perdê-la**. Observação: hoje ela é implementada **por subsistema** (não um único envelope), o que é aceitável, mas exige vigilância.
**Classificação:** **PRESERVAR (+ PROTEGER como invariante).** *Restrição:* **nenhum fato sem fonte** — qualquer novo caminho de ingestão (conector/RNDS/OpenCare) deve carregar `source`/proveniência; um fato sem origem é defeito arquitetural.

## 4. health_events → capacidade de relacionamento (sem Event Graph prematuro)

**Código atual:** `src/lib/agenda/` — canônico `health_events` (`repository.ts`); `DomainEvent` com `correlationId` (encadeia causas), `parentEventId`/`rootEventId` (séries) em `service.ts`; e relações no domínio de exames: `fulfills_order_id` (pedido↔resultado), `source_bundle_exam_id` (bundle/CDUs).
**V2 estratégica:** relacionar eventos posteriormente (exame→consulta→internação→procedimento→resultado) **sem** exigir um Event Graph agora.
**Gap (justificado):** **MÉDIO.** As **primitivas de relação já existem** (`correlationId`, `parent/root`, `fulfills_order_id`, bundle) — não é uma "lista plana de documentos". Falta um modelo de relação **geral** entre tipos de evento, mas isso é construção futura, não dívida presente.
**Classificação:** **PROTEGER.** *Restrição:* preservar as primitivas relacionais (`correlationId`/`parent`/`fulfills`); nenhuma feature pode colapsar eventos numa lista sem relação. **Event Graph: NÃO agora.**

## 5. AI / Evidence → separação fato × fonte × evidência × interpretação

**Código atual:** a separação é **nativa**. DUE emite **observações cruas** (`understanding_report.observations`); `contracts.ts` define `Evidence` (normalizada: `raw`/`normalized`/`source`/`label`/`region`/`confidence`) e `ResolvedFact` (`considered`/`rejected` com `reasonCode`, `outcome`) — a **decisão** é separada da **observação**; Clinical Knowledge separa **fato** (valor) de **fonte** (`SourceRef`) de **interpretação** (curada, citada); IA **não-diagnóstica** (fronteira RDC-657) é invariante.
**V2 estratégica:** IA contextual sobre a trajetória, **ancorada em evidência** (afirmação → evidência → fonte).
**Gap (justificado):** **BAIXO.** Esta é provavelmente a **maior força** da V1 para o futuro: o grounding é arquitetural, não um verniz. A cadeia observação→evidência→decisão→interpretação já existe.
**Classificação:** **PRESERVAR.** *Restrição:* manter a fronteira **não-diagnóstica** (RDC-657) como invariante e nunca fundir interpretação com fato/fonte.

## 6. Connectors / Source abstraction → consumir RNDS/OpenCare/HIS/lab

**Código atual:** `src/lib/connectors/` — **HIP-001/WEA-001 Connector Layer** "núcleo puro, VENDOR-NEUTRAL e DOMAIN-NEUTRAL" (`connector.ts`): `ConnectorDescriptor`, `AcquisitionMode` (`oauth|api|webhook|file|ble`), `CanonicalSample` + `SampleProvenance`, `SyncRun`/`SyncStatus`; `connections.ts` com `ConnectionStatus` (`connected|expired|revoked|error`); `mock.ts` implementa os **mesmos contratos** que o Withings (troca por adapter); persistência idempotente (`unique(user_id,provider,metric,recorded_at)`).
**V2 estratégica:** adicionar RNDS/OpenCare/HIS/laboratório **como novos adapters**, sem acoplamento estrutural.
**Gap (justificado):** **BAIXO-MÉDIO.** A **costura adapter → CanonicalSample (com proveniência)** já existe e foi provada com Withings/mock. Adicionar uma fonte = **novo adapter**, não mudança estrutural. O gap é só de **cobertura** (o canônico de conector hoje mira wearable/`body_metrics`; fontes clínicas exigirão mapear para UCDA/clinical facts — mas pela mesma costura).
**Classificação:** **PRESERVAR (+ PROTEGER a costura).** *Restrição:* toda nova fonte entra **pelo adapter → canônico**; nenhuma ingestão pode escrever direto no domínio contornando a proveniência/idempotência. **Conectores RNDS/OpenCare/HIS: NÃO agora (dependem do wedge).**

## 7. Consentimento / Acesso / Compartilhamento / Auditoria

**Código atual:** **parcialmente pronto.** `consent_records` (migration 015 — consentimento auditável: tipo, versão, `accepted_at`, `user_agent`, RLS própria); `report_shares` (043) com `token`, `expires_at`, `revoked` + **granularidade**: `sections` (049), `period` (097), `excluded` (135) — compartilhamento por seção/período/item, revogável; conexões com estado `revoked`; RLS por `user_id`; `account_deletion_log`.
**V2 estratégica (a mais importante da proposta):** representar **quem pode acessar · qual informação · por quanto tempo · quem autorizou · quem acessou · quem compartilhou · revogação · origem**.
**Gap (justificado):** **MÉDIO-ALTO.** Já existem: consentimento auditável, compartilhamento **granular** (seção/período/item), expiração e revogação. **Faltam** dois elementos que o código **não** tem hoje: (a) **log de acesso / read-receipt** ("quem acessou o quê e quando" — grep não encontrou `access_log`/`read receipt`); (b) consentimento **por destinatário/finalidade** (hoje `consent_type` é grosso: `terms`/`health_data`). Não há acoplamento que **impeça** adicioná-los, mas o modelo precisa ser **protegido/estendível**.
**Classificação:** **PROTEGER + REFORMULAR (parcial).** *Restrição:* preservar o modelo `report_shares`/`consent_records` como base extensível; **reservar espaço** para (a) um **audit de acesso** e (b) consentimento **por destinatário/finalidade** — sem reconstrução. **Não implementar agora**, mas **não tomar decisão que feche essa porta** (ex.: compartilhamento que não passe por `report_shares`).

---

## 8. Teste de cenário (a propriedade arquitetural, sem antecipar solução)

### Cenário A — duas fontes independentes → mesmo indivíduo → proveniência → trajetória
> *"Hospital via OpenCare + resultado via RNDS → o código atual representa ambos como fatos do MESMO indivíduo, preserva a origem de cada fato e mantém a capacidade de reconstruir a trajetória — sem reescrever a V1?"*

**Resposta:** `[INFERÊNCIA fundamentada]` **Majoritariamente SIM, com uma costura a proteger.**
- **Mesmo indivíduo:** SIM — âncora `user_id` (todos os fatos são escopados por ele).
- **Preservar origem:** SIM — cada fato carrega `source`/proveniência (§3), e conectores produzem `CanonicalSample` + `SampleProvenance` (§6).
- **Reconstruir trajetória:** SIM em potencial — `health_events` + relações (`correlationId`/`fulfills`) + fatos datados (§4).
- **Costura a proteger (o "porém"):** (1) **resolver a identidade da fonte externa → `user_id`** (§2 — hoje implícito via titular; para ingestão automática, precisa da costura de identidade); (2) **cobertura do canônico** para tipos clínicos além de biomarcador/`body_metric` (Encounter/Condition/Procedure) — extensão do UCDA, não reescrita.
**Conclusão:** o cenário é **alcançável sem reconstruir a V1**, **se** protegermos (a) a âncora `user_id`, (b) a invariante de proveniência, (c) a costura de identidade externa e (d) o adapter→canônico. O risco não é o que existe — é uma **feature futura que assuma fonte única ou introduza fato sem origem**.

### Cenário B — mesmo exame em formato interno + FHIR/BR-Core, sem alterar o domínio
> *"O UCDA atual permite mapear o mesmo exame para FHIR/BR-Core sem alterar o domínio?"*

**Resposta:** `[INFERÊNCIA fundamentada]` **SIM.** `UcdaItem` já tem `code/codeSystem/valueCode/region/anatomy/specimen/method/referenceText/page` — os campos que o FHIR exige. Uma projeção FHIR é **aditiva** (padrão `ucdaItemToRow`/`toClinicalContext`). **Logo, não há dívida arquitetural de FHIR mapping** — desde que a §1 (pureza do domínio UCDA) seja protegida. **Não precisamos implementar FHIR agora.**

---

## 9. Matriz de prontidão (fundamentada, não opinativa)

| Componente | V1 atual (código) | V2 estratégica | Gap | Ação agora |
|---|---|---|---|---|
| **UCDA / Canonical** | `ucda.ts`: code/codeSystem/value/region/anatomy/specimen/method/ref/page | FHIR/BR-Core-mapeável | **Baixo** | **PROTEGER** (pureza do domínio) |
| **Clinical Identity** | `contracts.ts` por documento; âncora `user_id` | multi-fonte (fonte→user_id) | **Médio** | **PROTEGER** (costura de identidade) |
| **Provenance** | `Sourced`/`PipelineAudit`/`UcdaProvenance`/`source` em todo fato | transversal a fontes externas | **Baixo** | **PRESERVAR** (invariante: sem fato sem fonte) |
| **health_events** | `correlationId`/`parent`/`fulfills_order_id`/bundle | relações futuras | **Médio** | **PROTEGER** (primitivas relacionais) |
| **AI / Evidence** | observação→`Evidence`→`ResolvedFact`→interpretação; RDC-657 | IA contextual ancorada | **Baixo** | **PRESERVAR** (fronteira não-diagnóstica) |
| **Connectors / Source abstraction** | HIP-001 `connector.ts` (CanonicalSample+provenance, adapter) | RNDS/OpenCare/HIS/lab como adapters | **Baixo-Médio** | **PRESERVAR** (proteger a costura adapter→canônico) |
| **Consentimento / Acesso** | `consent_records` + `report_shares` (seção/período/excl./revogação); **sem log de acesso** | quem/o quê/quanto tempo/quem autorizou/**quem acessou**/revogação/origem | **Médio-Alto** | **PROTEGER + REFORMULAR** (reservar audit de acesso + consent por destinatário) |
| **FHIR** | não implementado | compatibilidade necessária | **Arquitetural (resolvido)** | **NÃO IMPLEMENTAR** (mapeamento aditivo; §1/§8B) |
| **MPI** | não implementado; âncora `user_id` existe | futuro multi-fonte | **Alto potencial** | **NÃO IMPLEMENTAR** (proteger costura §2) |
| **Event Graph** | não implementado; primitivas existem | futuro | **Alto potencial** | **NÃO IMPLEMENTAR** (proteger §4) |
| **RNDS** | não conectado | possível fonte | **Desconhecido/wedge** | **NÃO IMPLEMENTAR** |
| **OpenCare** | não conectado | fonte/parceiro/concorrente | **Desconhecido/wedge** | **NÃO IMPLEMENTAR** |

---

## 10. Decisões AGORA (proteções) × Decisões que ESPERAM o wedge

### AGORA — proteções arquiteturais (critérios de revisão, **não tarefas de código**)
Estas são **guardas** para não criar dívida; aplicam-se a qualquer mudança futura da V1/V2:
1. **Pureza do domínio UCDA** — FHIR/HL7/vendor entram como **projeção**, nunca mutam `UcdaItem`.
2. **Invariante de proveniência** — nenhum fato sem `source`/origem, em qualquer caminho de ingestão.
3. **Âncora `user_id` + costura única de identidade externa** — nada assume "identidade = string do documento" nem fonte única.
4. **Primitivas relacionais de evento preservadas** — não colapsar eventos em lista sem relação.
5. **Separação fato/fonte/evidência/interpretação + fronteira não-diagnóstica (RDC-657)** — invariante.
6. **Toda nova fonte entra pelo adapter→canônico** — sem bypass no domínio.
7. **Modelo de consentimento/compartilhamento extensível** — reservar espaço para **audit de acesso** e **consent por destinatário/finalidade**, sem reconstrução.

> Estas sete proteções **não geram implementação**. São o "checklist de não-dívida" que qualquer PR futuro deve respeitar.

### ESPERAM o wedge — não decidir nem construir agora
FHIR server/endpoints · integração RNDS · integração/parceria OpenCare · conectores HIS/lab reais · **MPI** · **Event Graph** · **Evidence Engine** · audit de acesso / consent granular **em código** · nova camada de IA. Cada um só entra com um **caso de uso do wedge** que o justifique.

---

## 11. Conclusão

`[INFERÊNCIA fundamentada no código]` **A V1 atual consegue evoluir para a arquitetura estratégica sem reconstrução** — os fundamentos certos já existem (UCDA FHIR-mapeável, proveniência pervasiva, separação evidência/interpretação, camada de conector vendor-neutral, primitivas relacionais de evento, âncora `user_id`, base de consentimento/compartilhamento). **Não há dívida arquitetural bloqueante hoje.** O maior gap real é o **consentimento/acesso** (falta audit de acesso + consent por destinatário) — coerentemente, a dimensão que a própria estratégia identifica como central.

**O risco não está no que existe — está no que uma feature futura poderia destruir.** Por isso a ação de "agora" é **proteger**, não construir: as sete guardas da §10.1. Nada aqui é backlog; nada aqui autoriza implementação.

**As quatro peças agora completas:** Competitive Assessment (ambiente/risco) · V2 Strategic Product Architecture (posição a ocupar) · **Architecture Gap Analysis (a V1 chega lá sem ruptura — este doc)** · e falta a decisiva, do mundo real: **Wedge Validation (alguém paga por essa posição?)**. Só com as quatro juntas é racional autorizar a implementação da V2.

**Bloqueios mantidos:** implementação FHIR/FHIR-server · integração RNDS/OpenCare · MPI completo · Event Graph · novos conectores · PHR completo · reconstrução da V1. **Única exceção:** defeito real da V1 **ou** dívida arquitetural demonstrada que comprometa a evolução segura. Homologação **congela** a arquitetura; a funcionalidade evolui **sobre** o baseline aprovado.
