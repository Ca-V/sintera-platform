# UCDA-001 — Universal Clinical Data Architecture

> **Nível 1 (Constituição) — DRAFT v0.9 (PROPOSTA, NÃO congelada).** Autoria conceitual:
> fundadora (12/07/2026). Diferentemente do Capture Hub e do CEF, a UCDA nasce num nível de
> abstração muito mais alto e influencia praticamente toda a plataforma — por isso entra como
> **proposta** e só será promovida a **v1.0** após a revisão técnica (evidências + padrões
> internacionais + tendências) e a incorporação dos refinamentos fundamentados.

---

## Missão

A UCDA define como **qualquer evidência clínica**, produzida por **qualquer tecnologia
diagnóstica, presente ou futura**, será **representada, estruturada, armazenada, rastreada e
relacionada** na SINTERA.

- A UCDA **não é uma arquitetura de exames** — é uma **arquitetura de evidências clínicas**.
- O **exame** é apenas um **mecanismo de aquisição**.
- A **evidência clínica** é o **ativo permanente** do prontuário longitudinal.

## Mudança de paradigma

Arquiteturas tradicionais perguntam: *"Que exame foi realizado?"*.
A UCDA pergunta: **"Que evidências clínicas esse exame produziu?"**. A diferença parece sutil —
muda completamente a arquitetura.

---

## Princípios fundamentais

1. **A unidade permanente da SINTERA não é o exame — é a evidência clínica.** Um exame pode
   desaparecer; uma tecnologia pode ser substituída; uma modalidade pode evoluir. A evidência
   clínica continua existindo.
2. **Toda tecnologia diagnóstica deve poder ser representada SEM alterar a arquitetura.** Se
   surgir amanhã um equipamento baseado em IA quântica, cria-se apenas um **novo adaptador** —
   nunca um novo modelo de dados.
3. **O documento nunca é o conhecimento** — é apenas uma das representações possíveis (PDF, foto,
   scanner, DICOM, CSV, JSON, XML, HL7, FHIR, streams, APIs, wearables, equipamentos, dados
   contínuos). Todas convergem para o **mesmo modelo lógico**.
4. **Toda informação diagnóstica passa por TRÊS camadas:**
   - **Física** — o que chegou (PDF, imagem, CSV, VCF, DICOM, HL7…).
   - **Estrutural** — como foi organizada (Document Bundle, CapturedDocument, Structured Import).
   - **Semântica** — o significado clínico produzido (biomarcadores, achados, parâmetros, curvas,
     sinais, imagens, volumes, segmentações, scores, medidas, séries temporais, conclusões documentadas).

---

## O Modelo Universal de Evidência

Toda informação diagnóstica produz **uma ou mais Evidências Clínicas**. Cada Evidência possui
**atributos universais** (independentes da tecnologia): origem · método de aquisição · data de
realização · profissional responsável · instituição · equipamento · documento original · versão
· proveniência · confiança estrutural · unidade clínica produzida · contexto clínico ·
rastreabilidade completa.

**Categorias universais de evidência** (toda evidência pertence a uma destas — novas categorias
podem surgir sem quebrar a arquitetura): biomarcador · parâmetro · medida · sinal · curva ·
imagem · volume · segmento · score · índice · achado · anotação · conclusão documentada · série
temporal · observação estruturada.

## Taxonomia universal (organiza FAMÍLIAS de evidência, não exames)

Laboratoriais · Imagem · Neurofisiologia · Cardiologia Funcional · Pneumologia Funcional ·
Oftalmologia · Patologia · Microbiologia · Genética · Genômica · Proteômica · Metabolômica ·
Transcriptômica · Microbioma · Citometria · Monitorização Contínua · Wearables · Digital
Biomarkers · Point-of-Care · Home Testing · Dispositivos Médicos · Medicina Nuclear · Endoscopia
· Procedimentos Diagnósticos · Tecnologias Futuras. *A lista cresce; a arquitetura não muda.*

---

## Fluxo universal (nenhuma tecnologia pula etapas)

```
Aquisição → Capture Hub → Input Classifier → Pipeline adequado → Normalização →
Universal Evidence Model → Knowledge Graph → Prontuário Longitudinal → Linha do Tempo →
Motor Analítico → Aplicações Clínicas
```

## Separação entre aquisição e compreensão (responsabilidade única por domínio)

- **Capture Hub** — resolve **como a informação chega**.
- **CEF (Clinical Extraction Framework)** — resolve **como documentos clínicos são estruturados**.
- **Structured Import Framework** — resolve **como arquivos estruturados são importados** (novo domínio).
- **UCDA** — resolve **como qualquer evidência clínica passa a existir dentro da plataforma**.

---

## Evolução permanente

Ao surgir uma nova tecnologia diagnóstica, **não** se cria novo modelo nem nova arquitetura.
Executa-se apenas: (1) novo **adaptador** de entrada; (2) novo **extractor** especializado
(quando necessário); (3) nova **taxonomia** da família; (4) novos **casos no Clinical Reference
Corpus**. Todo o restante permanece igual.

## O verdadeiro ativo da SINTERA

Ao longo do tempo, o maior ativo não será o OCR, os prompts ou os modelos de IA — será a
**combinação de UCDA + Capture Hub + CEF + CRC + Knowledge Graph + Scientific Retrieval Layer**:
uma infraestrutura capaz de representar praticamente **qualquer** informação diagnóstica da
medicina contemporânea e das tecnologias que ainda surgirão.

---

## Estado e revisão

**Estado:** Draft v0.9 (proposta constitucional; NÃO congelar ainda). **Papel do Claude
(revisor técnico, não arquiteto):** revisar a UCDA-001 à luz da medicina atual, dos padrões
internacionais (FHIR, DICOM, HL7, LOINC, SNOMED CT, OMOP, openEHR…) e das tendências para os
próximos 20 anos; identificar **lacunas, famílias diagnósticas ausentes, padrões relevantes e
oportunidades de refinamento** — **sem reprojetar**. Após incorporar os refinamentos
fundamentados, promover a **UCDA-001 v1.0** como pilar constitucional.

Ver `docs/CAP-002_CAPTURE_HUB.md`, `docs/CEF-001_CLINICAL_EXTRACTION_FRAMEWORK.md`,
`docs/GOVERNANCA.md`, [[modelo_canonico_plataforma]].
