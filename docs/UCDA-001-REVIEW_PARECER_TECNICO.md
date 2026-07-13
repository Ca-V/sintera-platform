# UCDA-001 — Parecer técnico de revisão (insumo externo)

> **Documento de REVISÃO (Nível 2 — Referência).** Papel: revisor técnico, não arquiteto. Não
> reprojeta a UCDA; traz evidência de padrões internacionais, mapeia conceito a conceito, e aponta
> convergências, lacunas, conflitos e oportunidades para a promoção da UCDA-001 v0.9 → v1.0.

## 0. Nota de método (honestidade sobre a fonte)

A varredura multi-fonte automatizada (deep-research) **rodou por completo mas o passo final de
síntese falhou** (erro de ferramenta, não dos dados). Para não entregar algo frágil, este parecer
é ancorado em **especificações oficiais** dos padrões (fontes primárias citadas) + conhecimento
consolidado de domínio. **Distinção explícita:** ✔️ **fato** verificável em fonte oficial ·
🔮 **projeção** (tendência 10–20 anos, menos certa). Fontes primárias: `hl7.org/fhir`,
`dicomstandard.org`, `loinc.org` (Regenstrief), `snomed.org`, `openehr.org`, `ohdsi.org` (OMOP),
`unitsofmeasure.org` (UCUM), `ga4gh.org`, RNDS (`saude.gov.br`).

---

## 1. Grandes famílias de evidência clínica (mapa) ✔️

Laboratório/patologia clínica · microbiologia (cultura/antibiograma) · anatomia patológica ·
imagem/radiologia · medicina nuclear/PET · neurofisiologia (EEG/ENMG/potenciais) · cardiologia
gráfica (ECG/Holter/MAPA/ergometria/eco) · oftalmologia (Pentacam/OCT/campimetria) · funcional/
pneumologia (espirometria) · endoscopia · genética/genômica e demais ômicas (proteômica,
metabolômica, transcriptômica, microbioma) · citometria · sinais vitais/monitorização contínua ·
wearables/digital biomarkers · point-of-care/home testing · dispositivos médicos · procedimentos
diagnósticos · imunização · medicações · **PROs/questionários** (frequentemente esquecido como
família de evidência). A taxonomia da UCDA cobre a maioria — ver §7 (lacunas) para os que faltam.

## 2. Modalidades emergentes / tendências 10–20 anos 🔮

Multiômica e **single-cell**; **biópsia líquida** (ctDNA/cfDNA); **digital pathology** (whole-slide
imaging) + IA; IA em imagem/laudo; **sensores contínuos** e wearables de grau clínico
(ECG/SpO₂/glicose contínua); telemonitoramento domiciliar; **digital biomarkers**; ultrassom
point-of-care; espectrometria/POC molecular. Implicação para a UCDA: crescerão sobretudo os
resultados **de alta densidade** (streams, waveforms, imagens gigantes, milhares de marcadores) —
o modelo precisa acomodar **referência a artefato**, não só valor (§6, §7).

## 3. Padrões internacionais — propósito · força · limite ✔️

| Padrão | Propósito | Força | Limite p/ a UCDA |
|---|---|---|---|
| **FHIR** (R4/R5) | Interoperabilidade de recursos clínicos (API/JSON) | `Observation` cobre quase qualquer observação; ecossistema e adoção crescentes; **base da RNDS (BR)** | Recursos separados p/ imagem/genômica/documento; waveforms de alta densidade fracos |
| **DICOM** | Imagem médica + **waveforms** (ECG/EEG) + SR + PDF encapsulado | Único que representa bem sinal/imagem/segmentação; DICOMweb (WADO) | Pesado; fora do mundo lab/texto |
| **HL7 v2** | Mensageria (ORU=resultado lab, ORM=pedido) | Onipresente em labs/HIS | Legado, sintaxe frágil; sendo sucedido por FHIR |
| **LOINC** | **O quê** foi medido (código universal de teste/observação) | Cobre lab + muitos clínicos; casa com FHIR/`Observation.code` | Cobertura desigual fora de lab |
| **SNOMED CT** | Terminologia clínica (achados, anatomia, método, procedimento) | Semântica rica e relacional | Licenciamento; curva de adoção |
| **UCUM** | Unidades de medida | Interoperabilidade numérica correta | — (é obrigatório usar) |
| **OMOP CDM** (OHDSI) | Padronização p/ **análise/pesquisa** populacional | Excelente p/ analytics longitudinal | Não é modelo de captura/troca |
| **openEHR** | Modelagem clínica por **archetypes/templates** (2 níveis) | Rico p/ dados estruturados profundos | Complexidade; menor footprint de troca |
| **ICD-11** | Classificação de **doenças** | Codificação de condições | **Não** é evidence — é diagnóstico (fora do escopo factual/RDC 657) |
| **GA4GH / VCF / Phenopackets** | Genômica | Padrões de fato em variantes | Ecossistema à parte do FHIR |
| **IHE** (XDS…) | Perfis de compartilhamento de documentos | Integração institucional | Infra, não modelo de dado |

**Composição (não competem, se somam):** FHIR como **troca**; DICOM para **imagem/sinal**; LOINC
(o quê) + UCUM (unidade) + SNOMED (semântica) como **vocabulário**; OMOP para **análise**; openEHR
como alternativa de **modelagem interna**; GA4GH para **genômica**.

## 4. Formatos de entrada (hoje → futuro) ✔️/🔮

Documento (PDF/imagem escaneada) · imagens (**DICOM**) · estruturados (CSV/JSON/**HL7**/**FHIR**/
**VCF**) · streams/séries temporais (wearables/monitorização) 🔮 · APIs (labs, **RNDS** no Brasil) ·
dispositivos médicos/IoT 🔮. Convergente com o princípio da UCDA: todos são **representações
físicas** que convergem ao mesmo modelo lógico.

## 5. Tipos de resultado por família (heterogeneidade a acomodar) ✔️

Biomarcador (valor+unidade+referência) · parâmetro · medida · **sinal/waveform** (ECG/EEG) ·
**curva** (espirometria) · **imagem/volume/segmentação** · série temporal · achado textual/laudo ·
**score/índice** (Glasgow, APGAR, BAD-D) · variante genômica · medida por região/olho/órgão ·
observação estruturada. **Conclusão:** nenhuma arquitetura representa tudo como "valor" — daí a
necessidade de **categorias de referência a artefato** (imagem, waveform, arquivo) além de valores.

---

## 6. MAPA CONCEITO-A-CONCEITO — UCDA ↔ FHIR/padrões (a espinha) ✔️

O **FHIR `Observation`** ("measurements and simple assertions about a patient/device/subject" —
`hl7.org/fhir/observation.html`) cobre: sinais vitais, lab, **resultados derivados de imagem**
(densidade óssea), **medidas de dispositivo (EKG, oximetria)**, **escores** (APGAR/Glasgow),
características pessoais (cor dos olhos), história social. **NÃO** cobre: diagnóstico (`Condition`),
alergia (`AllergyIntolerance`), medicação (`MedicationStatement`), procedimento (`Procedure`),
questionário (`QuestionnaireResponse`), e delega imagem/genômica a recursos próprios.

| Conceito UCDA | Recurso/padrão | Convergência / lacuna |
|---|---|---|
| **Evidência Clínica** (unidade) | FHIR `Observation` (âncora) + `DiagnosticReport` (agrupa com contexto) | ✅ forte. "Evidência" ≈ Observation; o **laudo** ≈ DiagnosticReport + `DocumentReference` |
| biomarcador · parâmetro · medida · score · índice | `Observation.value[x]` (Quantity/CodeableConcept/Ratio/integer), `interpretation`, `referenceRange`, `component` (painéis: PA sist/diast) | ✅ direto. Usar LOINC (`.code`) + UCUM (unidade) + SNOMED |
| **painel/múltiplos exames** | `Observation.hasMember` / `DiagnosticReport` | ✅ valida o "documento = conjunto" da SINTERA |
| **sinal/curva/waveform** (ECG/EEG) | `Observation.value=SampledData` (baixa densidade) **ou DICOM Waveform** | ⚠️ **lacuna**: FHIR não guarda waveform de alta densidade → **referência a artefato DICOM/arquivo** |
| **imagem/volume/segmentação** | `ImagingStudy` + **DICOM** (SEG) ; `Media` **descontinuado no R5** → `DocumentReference`/Observation+Attachment | ⚠️ imagem **não** é Observation → referência |
| **achado textual/conclusão documentada** | `DiagnosticReport.conclusion` + `Observation` (achados de imagem) + SNOMED | ✅ mas é **transcrição** (RDC 657), não geração |
| **variante genômica** | `MolecularSequence` (R4; **descontinuado no R5** → perfis Genomics/`GenomicStudy`) + **GA4GH/VCF/Phenopackets** | ⚠️ área **imatura** no FHIR → não forçar em Observation |
| **série temporal** (wearables/monitorização) | `Observation` repetidas / `SampledData` | ⚠️ **stream contínuo** de alta frequência não cabe bem → referência/agregação |
| **atributos universais** (origem, método, data, profissional, instituição, equipamento, documento original, versão, proveniência, contexto, rastreabilidade) | `Observation`.{method, effective[x], performer, device, subject} + **`Provenance`** + `DocumentReference` (documento original) + `meta.versionId` + `AuditEvent` | ✅ quase tudo tem campo nativo |
| **confiança estrutural** (HIGH/MEDIUM/LOW, do CEF) | *(sem campo nativo)* — `Observation.status` (preliminary/final) e `dataAbsentReason` são parciais | ❗ **lacuna real** → **extensão FHIR própria** (bom diferencial SINTERA, marcar como extensão) |
| **datas** (realização/assinatura/coleta) | `effective[x]` (tempo clinicamente relevante) × `issued` (emissão) | ✅ alinhar a semântica de datas do CEF a esses campos |
| **taxonomia de famílias** | `Observation.category` + LOINC/SNOMED | ✅ |

---

## 7. Lacunas, riscos e oportunidades (o payload acionável)

**Lacunas / pontos de atenção**
1. **Nem tudo é "valor".** Observation cobre muito, mas **imagem, waveform de alta densidade,
   genômica e streams** exigem **referência a artefato** (DICOM/arquivo/serviço), não valor. A UCDA
   deve ter, explicitamente, **categorias de referência** — coerente com a camada "física".
2. **Confiança estrutural não é padrão.** Não há campo FHIR nativo. Modelar como **extensão**
   documentada (diferencial auditável da SINTERA), sem fingir que é FHIR-core.
3. **Genômica é o elo mais imaturo.** FHIR mudou (`MolecularSequence` descontinuado no R5). Ancorar
   em **GA4GH/VCF/Phenopackets** e tratar genômica como família com pipeline próprio (já previsto).
4. **Semântica temporal.** Mapear o "data de realização vs assinatura vs coleta" do CEF aos campos
   FHIR `effective[x]` (clínico) vs `issued` (emissão) — evita o bug "2002" de forma padronizada.
5. **Famílias possivelmente sub-representadas** como *evidência*: **PROs/questionários**
   (`QuestionnaireResponse`), **imunização** (`Immunization`), **medicação** (`MedicationStatement`)
   — hoje domínios separados no app; decidir se entram na taxonomia de evidência da UCDA.

**Riscos**
- **Forçar tudo em um único modelo** (o risco que você mesma levantou): Observation é tentador,
  mas imagem/genômica/waveform/documento **não** são Observation. Mitiga-se com as categorias de
  referência (#1) e a fronteira UCDA (representação) × KG (relações) já definida.
- **Reinventar vocabulário.** Usar LOINC+UCUM+SNOMED em vez de códigos próprios (o KG/SRL já é a
  camada científica) — reduz retrabalho e destrava interoperabilidade.

**Oportunidades**
- **Standards-first = RNDS-ready.** A RNDS brasileira é **FHIR-based**; nascer alinhada ao FHIR
  facilita integração nacional futura (labs, RNDS) quase de graça.
- **UCDA como linguagem interna + FHIR como fronteira de troca/exportação** — exatamente a sua
  formulação (Princípio 5). O modelo interno pode ser mais rico; a exportação fala FHIR.
- **RDC 657 combina com o modelo:** Observation **transcreve** valores/achados escritos; **não**
  gera `Condition`/diagnóstico — o que reforça o enquadramento factual da SINTERA.

## 8. Síntese para a promoção v0.9 → v1.0

A UCDA está **conceitualmente sólida** e a decisão *standards-first* a torna muito mais robusta.
Antes do v1.0, recomendo à revisão da arquitetura (sem reprojetar): (a) tornar explícitas as
**categorias de referência a artefato** (imagem/waveform/genômica/stream); (b) declarar a
**confiança estrutural** como extensão; (c) fixar o **vocabulário** (LOINC/UCUM/SNOMED) e o
**mapa de exportação FHIR** (`Observation`/`DiagnosticReport`/`ImagingStudy`/`DocumentReference`/
Genomics); (d) alinhar a **semântica de datas** a `effective[x]`/`issued`; (e) decidir a fronteira
das famílias PRO/imunização/medicação como evidência. Nada disso reprojeta a UCDA — apenas a
ancora nos padrões e fecha as lacunas de alto impacto.

Ver `docs/UCDA-001_UNIVERSAL_CLINICAL_DATA_ARCHITECTURE.md`, `docs/CEF-001…`, `docs/CAP-002…`.
