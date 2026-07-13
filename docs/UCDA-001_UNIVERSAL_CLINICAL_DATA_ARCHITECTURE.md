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
5. **Standards-first — padrões consolidados como base, não modelo paralelo (fundadora 13/07/2026).**
   *A UCDA utiliza padrões internacionais consolidados como modelo de interoperabilidade sempre
   que estes representarem adequadamente a informação clínica. A arquitetura interna da SINTERA
   pode estender esses modelos quando necessário, preservando compatibilidade semântica.* A UCDA
   **não copia** o FHIR nem cria um modelo paralelo desnecessário. O recurso **FHIR `Observation`**
   já representa quase **qualquer** observação clínica (biomarcador, PA, FC, parâmetro de
   espirometria, valor de Pentacam, achado de EEG, saturação contínua…) — é a **âncora primária**
   do Modelo Universal de Evidência. A UCDA é a **linguagem interna** da SINTERA, mas uma linguagem
   que **conversa naturalmente** com FHIR, DICOM, HL7 e os demais padrões.

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

## Quatro estágios conceituais (fronteiras explícitas — a UCDA NÃO invade o Knowledge Graph)

```
Aquisição  →  Estruturação  →  Representação Clínica  →  Conhecimento Longitudinal
```
| Estágio | Domínio | Responsabilidade |
|---|---|---|
| **Aquisição** | **Capture Hub** | como a informação **chega** |
| **Estruturação** | **CEF** (documentos) · **SIF** (arquivos estruturados) | como a informação é **organizada** |
| **Representação clínica** | **UCDA** | como uma evidência clínica **passa a existir** |
| **Conhecimento longitudinal** | **Knowledge Graph (KG)** | **relações** longitudinais entre evidências |

**Fronteira crítica:** a UCDA define **como uma evidência EXISTE** (representação); o **KG** cuida
das **relações** entre evidências ao longo do tempo. A UCDA **não** assume responsabilidades do KG.

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

**Estado:** Draft v0.9 (proposta constitucional; NÃO congelar ainda). Após incorporar os
refinamentos fundamentados em padrões e literatura, promover a **UCDA-001 v1.0** como pilar.

**Papel do Claude (revisor técnico, NÃO arquiteto) — instrução refinada (fundadora):**
> Mapeie **cada conceito da UCDA** aos recursos e padrões internacionais existentes — **FHIR,
> especialmente `Observation`**, `DiagnosticReport`, `ImagingStudy`, `Media`, `DocumentReference`,
> `MolecularSequence` (quando aplicável); além de **DICOM, HL7, LOINC, SNOMED CT, OMOP e openEHR**.
> Identifique **convergências, lacunas, conflitos e oportunidades de alinhamento**, **preservando a
> arquitetura da SINTERA**. Não reprojetar.

Perguntas-guia (a partir do FHIR `Observation` como âncora): quais conceitos do Observation já
resolvem nosso problema? quais **extensões** a SINTERA realmente precisa? quais categorias clínicas
o FHIR já contempla? **onde a UCDA precisa ir além?** Objetivo: alinhar a linguagem interna da
SINTERA aos padrões (menos retrabalho, integrações futuras mais fáceis) sem abrir mão das abstrações.

Ver `docs/CAP-002_CAPTURE_HUB.md`, `docs/CEF-001_CLINICAL_EXTRACTION_FRAMEWORK.md`,
`docs/GOVERNANCA.md`, [[modelo_canonico_plataforma]].
