# CAP-002 — Capture Hub & Caixa de Entrada (Health Inbox) — v1.0

> **Domínio arquitetural transversal** da SINTERA — ao lado da Knowledge Layer, da
> Scientific Retrieval Layer e do Routing Engine. Evolução estratégica do **CAP-001**
> (Captura Documental). Responsável pela **ingestão, classificação, rastreabilidade e
> distribuição de QUALQUER informação externa** que entre na plataforma. Consome
> DOC-001 (repositório único de documentos) e a Camada de Proveniência
> (`@/lib/provenance`). Enquadramento RDC 657/2022 + LGPD Art. 11.
> **Status: CONGELADO — v1.0 (fundadora, 10/07/2026).**
> **Ressalva de escopo do congelamento:** aplica-se à **arquitetura do domínio e aos seus
> princípios**. NÃO impede a adição de novos **adaptadores de captura, conectores ou
> origens de ingestão** (novos laboratórios, canais, APIs), desde que **respeitem o
> contrato do Capture Hub e não violem os princípios fundamentais**. A partir daqui o
> foco migra da definição conceitual para a **execução incremental do roadmap**.

---

## 0. Tese e propósito

O SINTERA não deve apenas "importar laudos". O objetivo é ser a plataforma com a
**maior eficiência e praticidade** para **enviar, incorporar, processar e analisar**
informação clínica — **independentemente da origem do documento**.

O **Capture Hub** é o **moat operacional**: reduz drasticamente a fricção de entrada de
dados. Ele NÃO é o produto (o produto é a inteligência longitudinal + proveniência +
estruturação); é a **infraestrutura de ingestão** que alimenta esse produto com o menor
esforço possível. Princípio-guia: **"qualquer forma de compartilhar meu exame funciona"**
— não **"como envio meu exame?"**.

---

## 1. Capture Hub é um DOMÍNIO transversal (não um módulo)

Assim como Knowledge Layer, Scientific Retrieval Layer e Routing Engine são domínios, o
Capture Hub é o **domínio responsável por toda a ingestão de dados clínicos externos**,
independentemente da origem. Ele **atende a todos os domínios de destino**:

**Exames · Condições · Medicamentos · Vacinas · Ômicas · Recursos de Saúde · Documentos
administrativos · integrações futuras.**

Consequência de governança: **nenhuma nova forma de captura deve ser desenvolvida de
forma isolada dentro de um módulo** — toda captura passa a nascer como adaptador deste
domínio, convergindo para o pipeline único.

---

## 2. Princípios fundamentais (invioláveis — orientam anos de evolução)

1. **Uma única porta de entrada** para qualquer documento.
2. **Uma única fila** de processamento (a Caixa de Entrada).
3. **Um único pipeline** de classificação e extração.
4. **Um único repositório documental** (DOC-001).
5. **Um documento pode alimentar vários domínios** (ex.: um laudo → Exame + Condição),
   sem duplicar o arquivo.
6. **Proveniência obrigatória** — toda informação incorporada carrega origem + documento.
7. **Revisão humana antes da persistência** sempre que houver extração automática.
8. **Nenhuma origem conhece a lógica de negócio** — adaptadores só entregam o contrato.
9. **Novas origens entram por adaptadores** — sem tocar no pipeline nem nos módulos.
10. **Toda entrada de informação externa é um adaptador do Hub** — QUALQUER nova
    funcionalidade que permita a entrada de informação externa na plataforma DEVE ser um
    adaptador do Capture Hub. É **vedado criar fluxos paralelos de ingestão** que
    contornem o pipeline oficial (protege a arquitetura contra fragmentação à medida que
    o produto cresce — nada de "upload rápido" isolado dentro de um módulo).

---

## 3. Visão de produto

- **Capture Hub** = porta ÚNICA no Dashboard ("Adicionar documento" → "Como deseja
  enviar?"), já em embrião no `CreateRecordMenu` (DS-001).
- **Caixa de Entrada (Health Inbox)** = fila única onde TODA captura pousa, processa em
  2º plano e aguarda revisão — é o que viabiliza origens **assíncronas**
  (e-mail/WhatsApp/link/share). Estado visível ao usuário:

  ```
  Recebidos
  ─────────────────────────────
  ✓ 3 processados
  ⏳ 1 aguardando IA
  ⚠ 1 precisa de revisão
  ❌ 1 ilegível
  ```

- **Fricção mínima**: incorporar qualquer documento com o mínimo de passos; origens
  assíncronas ≈ **zero etapa** no envio (o doc chega e é processado; revisão é posterior).
- **Identidade própria** do módulo (ex.: "Caixa de Entrada"), não um rótulo técnico.
- **Atalhos contextuais por módulo** ("Novo exame", "Nova condição") pré-escopam o
  classificador; o Hub é a porta universal.

---

## 4. Arquitetura — visão geral e responsabilidades

```
              Upload
              Scanner
             WhatsApp
              E-mail
            Share Sheet
          API Laboratório / RNDS
              (origens)
                 │
                 ▼
           ┌─────────────┐
           │ CAPTURE HUB │  recebe (adaptadores → CapturedDocument)
           └─────────────┘
                 │
                 ▼
        ┌───────────────────┐
        │  CAIXA DE ENTRADA │  fila assíncrona + status por documento
        └───────────────────┘
                 │
                 ▼
        OCR / Vision / Parser          }
                 │                      }  PIPELINE ÚNICO
        Content Classifier (tipo)       }  (processa + classifica + extrai;
                 │                      }   marca needs_review; dedup por checksum)
        Extractor por tipo → needs_review
                 │
                 ▼
          ┌──────────────┐
          │ ROUTING ENGINE│  distribui ao domínio (registry)
          └──────────────┘
                 │
   ┌────────┬────────────┬─────────────┬─────────┬─────────┐
   ▼        ▼            ▼             ▼         ▼         ▼
 Exames  Condições  Medicamentos    Vacinas   Ômicas   Documentos
   └────────┴────────────┴─────────────┴─────────┴─────────┘
                 │  (DOC-001 = arquivo único referenciado por documentId)
                 ▼
        LINHA DO TEMPO LONGITUDINAL
```

**Responsabilidades (limites explícitos):**

| Componente | Responsabilidade | NÃO faz |
|---|---|---|
| **Capture Hub** | Recebe de qualquer origem via adaptador; produz o `CapturedDocument`. | Não classifica, não persiste, não conhece módulo. |
| **Caixa de Entrada** | Fila assíncrona; estado/eventos por documento; superfície de revisão. | Não extrai nem roteia. |
| **Pipeline** | OCR/visão → classifica o tipo → extrai campos → marca `needs_review`; dedup por checksum. | Não decide destino final nem grava no módulo. |
| **Routing Engine** | Distribui ao domínio correto (por registry). | Não processa conteúdo. |
| **Módulos de domínio** | Persistem o registro estruturado; referenciam o `documentId`. | Não conhecem origem nem OCR. |

---

## 5. Contrato do adaptador de ingestão (interface)

Cadeia canônica — **todo adaptador segue exatamente este fluxo**:

```
Capture Adapter → CapturedDocument → Capture Pipeline → Classifier
     → Extractor → Needs Review → Routing Engine → Domain Module
```

Contrato (tipado) entre camadas:

```ts
interface CaptureAdapter {
  origin: 'file' | 'camera' | 'scanner' | 'link' | 'email'
        | 'whatsapp' | 'native_share' | 'lab_api' | 'rnds' | 'voice'
  // Recebe da origem e entrega o contrato comum. NÃO conhece lógica de negócio.
  receive(input: unknown): Promise<CapturedDocument>
}

interface CapturedDocument {         // contrato ÚNICO entre camadas (estende CAP-001)
  documentId: string                 // estável — base da proveniência (DOC-001)
  checksum: string                   // SHA-256 — dedup e integridade
  origin: CaptureAdapter['origin']
  captureMethod: string
  mimeType: string
  originalFile: Blob | { url: string }
  uploader: string                   // user_id
  capturedAt: string                 // ISO
  metadata?: Record<string, unknown>
}
```

Trocar OCR/IA no futuro **não** invalida documentos nem quebra proveniência
(`documentId`/`checksum` estáveis — backward compatibility, CAP-001 Princípio 8).

---

## 6. Pipeline único, classificação e dedup

- **OCR / Vision / Parser** — leitura do conteúdo (imagem, PDF, texto).
- **Document Bundle** — o conceito arquitetural correto é: **várias páginas → um Document Bundle
  → um documento clínico**. O **PDF é apenas uma REPRESENTAÇÃO FÍSICA** do Bundle (a captura
  multipágina — imagens → 1 PDF — é o 1º passo). Fontes heterogêneas (HEIC, JPEG, PDF, DICOM,
  anexos de e-mail/WhatsApp) podem compor **um único Bundle**. Dois arquivos do MESMO exame são
  **1 documento, N páginas**, NÃO 2 exames. O Bundle é montado ANTES da extração; o Clinical
  Extraction Framework (CEF-001) consome o Bundle já montado. Resolve laudos longos, anexos,
  frente/verso, gráficos em páginas separadas.
- **Document Segmentation** (novo estágio — fundadora, 13/07/2026; evidência: laudo AXIAL com 3
  exames de imagem em 3 páginas foi mesclado num só). O Bundle resolveu "N páginas = MESMO exame",
  mas não "N exames no MESMO documento". **Regra segura (princípio): nunca assumir `1 PDF = 1 exame`
  nem `N páginas = 1 exame`. Um bundle representa 1+ documentos clínicos; a SEGMENTAÇÃO determina
  quantos registros existem nele.** Estágio **anterior** à identidade e à classificação: decide se o
  bundle é **1 ou N documentos** por sinais **documentais** (cabeçalho por página, títulos, datas,
  "página X de Y", modalidades/solicitantes diferentes) — é **engenharia da INFORMAÇÃO, não clínica**
  (mora no Capture Hub, não no CEF). Identificados N exames → cria **um registro por exame**,
  **preservando o vínculo com o Bundle de origem** (proveniência); **cada registro segue o pipeline
  individualmente** (identidade → classificação → representação). **Governada** (Validação entre
  Camadas): a segmentação **propõe**, um passo valida; pode errar para os DOIS lados — sub-segmentar
  (juntar distintos) ou super-segmentar (partir um só). **Baixa confiança → não decide sozinha:**
  mantém 1 registro e **sinaliza/pergunta** ("este documento parece conter 3 exames — confirmar?"),
  nunca parte/junta errado e congela. **PRIORIDADE** (fundadora): **é pré-requisito de todo o
  pipeline** — sem segmentar certo, qualquer extrator recebe páginas que não são do mesmo exame e
  produz representação errada. **Mais prioritário que o extrator de imagem.** Novo estágio no pipeline:
  `Bundle → Segmentação → [por documento] Identidade → Classificação → Representação`.
- **Captura de EVIDÊNCIA COMPLETA — exames com imagem (fundadora, 13/07/2026).** Muitos exames NÃO são
  só o laudo: US · mamografia · TC · RM · OCT · retinografia · Pentacam · ecocardiograma · endoscopia ·
  colonoscopia têm um **conjunto inseparável** (laudo + imagens + eventualmente vídeos + futuramente
  DICOM). Objetivo: **preservar o exame completo**, não só o PDF. **Fluxo (reusa o componente
  multipágina/DocumentBundle já existente — acomodar-antes-de-criar):** 1) upload do PDF do laudo (já
  existe); 2) se for exame de imagem, perguntar **"Este exame possui imagens diagnósticas?"**; 3) **Não**
  → fluxo atual; **Sim** → **assistente de captura** das imagens → tudo vira **um único Document Bundle**
  (laudo + imagens + sequência + origem). **Conectores de aquisição (futuro, sem mudar arquitetura — são
  adaptadores de ingestão, modelo "Open Finance para evidência diagnóstica"):** extensão de navegador ·
  DICOM/ZIP · PACS · RNDS · API do laboratório. A **extensão é UM conector, não o produto** — e **não é o
  MVP** (barreira de adoção); o MVP é a **captura assistida**. Honestidade: imagem por captura de tela ≠
  DICOM diagnóstico (perde resolução/metadados) — fidelidade máxima vem dos conectores DICOM/PACS. A
  imagem passa a ser **evidência clínica primária vinculada ao laudo** (não anexo) → habilita comparação
  longitudinal (mamografias/OCTs no tempo) na camada cognitiva. Design do ciclo de execução.
- **Fronteira Captura × Processamento (fundadora, 13/07/2026).** O Capture Hub produz o **Bundle
  (CONTÊINER)** — a ingestão. A **compreensão documental** (Análise Estrutural → Segmentação → **CDU**) é a
  **camada de PROCESSAMENTO, posterior** ao Bundle — **não é captura**. A **CDU (Clinical Document Unit)**
  independe da origem (Bundle · FHIR · DICOM · HL7 · API · integração hospitalar) → é objeto do
  processamento (vizinho da UCDA), não do Capture Hub. Definição autoritativa em `GOVERNANCA.md` (pipeline
  de 9 etapas) e `UCDA-001`.
- **Content Classifier** (transversal, TEMA C) — **classifica corretamente a CATEGORIA
  DOCUMENTAL** por CONTEÚDO →
  `exame | medicamento | condicao | vacina | omica | recurso | administrativo`.
  **Factual** — classifica, não interpreta clinicamente.
- **Convenção de nomenclatura documental (REGRA DE DOMÍNIO):** o nome do registro
  representa o **DOCUMENTO**, NUNCA um dos seus resultados internos. É **vedado** nomear
  um painel pelo primeiro biomarcador (bug real: painel Hermes Pardini nomeado "IgE
  látex"). Algoritmo: **classificar → identificar CATEGORIA documental → aplicar
  convenção** (não apenas "contar exames"). **A IA NÃO inventa o título** — descreve a
  estrutura; a **aplicação** aplica um nome **DETERMINÍSTICO** (`deriveDisplayTitle`).
  Conceitos SEPARADOS (para não misturar categorias):
  - **`document_type`** (categoria/mídia): `laboratory | imaging | anatomopathology | medical_report | prescription | vaccination | omics | attestation | unknown`
  - **`document_scope`** (abrangência): `single | panel | mixed`
  - **`clinical_category`** (agrupamento clínico do painel, ex. "hormonal") — **reservado**: só populado quando identificável com segurança.
  - **`display_title`** — nome de exibição derivado dos anteriores.

  Tabela de nomenclatura: laboratory·single → **nome do exame** (Hemograma, TSH) · urina isolada → **"Urina tipo I"** ·
  laboratory·panel/mixed → **"Exames laboratoriais"** (ou **"Painel {categoria}"** quando `clinical_category` conhecida) ·
  imaging → **modalidade canônica** (Ressonância magnética · Tomografia computadorizada · Ultrassonografia…) ·
  anatomopathology → "Anatomopatológico" · prescription → "Receita médica" · medical_report → "Relatório médico" ·
  vaccination → "Comprovante de vacinação" · attestation → "Atestado médico" · omics → "Análise ômica".
  Contagem por **exames DISTINTOS** (`source_exam_name`), não por biomarcadores (um hemograma = 1 exame).
  Enriquecimento opcional: `Exames laboratoriais • Hermes Pardini • 12/07/2026`.
  Regra vale para TODO documento (não só Exames/Condições) — mora no Content Classifier
  (`@/lib/capture/document-naming`).
- **Extractor por tipo** — reusa o que já existe (visão de exames/biomarcadores,
  medicamentos/scan, `/api/vision/condition`, bioimpedância). Novo tipo = novo extractor.
- **`needs_review`** — registro de origem-IA nasce pendente; gravação definitiva só após
  revisão humana (na Inbox ou no formulário do módulo).
- **Dedup por checksum** — o mesmo arquivo (ex.: laudo enviado por e-mail E por WhatsApp)
  não é reprocessado nem duplicado.

---

## 7. Origens de captura por onda

| Onda | Origem | Natureza | Depende de |
|---|---|---|---|
| **A** | Arquivo · Foto · Scanner · **Colar link** (público) · Voz | Síncrona | `CreateRecordMenu` (existe); allowlist/anti-SSRF p/ link |
| **B** | **E-mail exclusivo por usuário** · **WhatsApp** | Assíncrona | Backbone da Inbox; infra e-mail de entrada; API Meta (existe) |
| **C** | **Share nativo Android/iOS (Share Sheet)** | Assíncrona | **App móvel** (Plano de Maturidade Pré-Mobile) |
| **D** | **Integrações**: labs BR (Fleury/Dasa/Hermes Pardini/Sabin) · **RNDS/Meu SUS Digital** · FHIR/APIs | Pull | Acordos/APIs externas; longo prazo — NÃO virar dependência |

---

## 8. Proveniência, auditoria e DOC-001

- **Princípio da Rastreabilidade Documental**: havendo documento de origem, o consumidor
  privilegia o original como fonte primária; "Ver documento original" em qualquer
  consumidor pela MESMA lógica.
- Cada item incorporado guarda **origin** + **documentId/checksum** + **linha de eventos**
  (recebido → processado → revisado → persistido, com timestamps).
- **DOC-001** = repositório único do arquivo; módulos referenciam `documentId` (sem
  duplicar). Um doc pode alimentar vários domínios (Princípio 5).
- A **Caixa de Entrada é o log natural de auditoria** da ingestão.

---

## 9. Experiência do usuário (fricção mínima)

- **Uma porta** ("Adicionar documento" → ordem fixa DS-001: Arquivo · Foto · Colar link ·
  Encaminhar por e-mail · WhatsApp · Compartilhar do celular · Ditar). Regra 1×2+.
- **Inbox** "Recebidos" com status por documento + **revisão em lote**.
- **Assíncrono = zero etapa no envio**; a pessoa só revisa quando quiser.
- Atalhos por módulo reduzem passos quando o contexto já é conhecido.

---

## 10. LGPD e segurança (por origem)

- **E-mail exclusivo**: endereço por usuário com token não-adivinhável
  (`carina.8F4K2@inbox.sinteramais.com.br`); validar remetente/assunto; anti-spam;
  limite de tipo/tamanho. Infra de e-mail de **ENTRADA** (SendGrid Inbound / Mailgun /
  Cloudflare Email) — o Resend atual é só de saída.
- **WhatsApp**: casar **telefone confirmado** (`profiles.phone`); opt-in explícito.
- **Colar link**: **allowlist de domínios** + guarda **anti-SSRF**; só links públicos que
  apontem a um arquivo (Caso A). Páginas com login (Casos B/C) não são acessíveis pelo
  servidor — orientar download.
- **Transversal**: dado sensível (LGPD Art. 11) → consentimento, minimização, retenção/
  apagamento. **RDC 657**: organiza/transcreve/classifica de forma factual; revisão
  humana é o gate; não interpreta.

---

## 11. Métricas / KPIs do Capture Hub

- **Tempo médio recebimento → processamento**.
- **Tempo médio até incorporação** ao prontuário.
- **% classificado automaticamente** (sem intervenção).
- **Precisão da classificação** (tipo correto).
- **Precisão da extração** (campos corretos).
- **Taxa de revisão manual** necessária.
- **Taxa de documentos ilegíveis / falha de extração**.
- **% de documentos duplicados** (evitados pelo checksum).
- **% de documentos por origem de baixa fricção** (e-mail/WhatsApp/share).

---

## 12. Roadmap e faseamento

```
1. Condições — concluir + testes reais no preview + merge após aprovação
        ↓
2. Backbone da Inbox — fila única de entrada (fila + worker assíncrono)
        ↓
3. DOC-001 — repositório documental único, integrado DESDE O INÍCIO ao backbone da Inbox
        ↓
4. Adaptador E-MAIL exclusivo — maior abrangência, menor dependência de terceiros
        ↓
5. Adaptador WHATSAPP — comportamento já consolidado no usuário brasileiro
        ↓
6. Adaptador LINK — critérios de segurança (allowlist de domínios; tratar links com login)
        ↓
7. Share NATIVO (Android/iOS) — quando houver maturidade do app móvel
        ↓
8. INTEGRAÇÕES diretas (labs BR / RNDS / ecossistemas) — conforme acordos e viabilidade

[ Benchmark verificado roda EM PARALELO por todo o processo — valida/identifica
  oportunidades, sem bloquear a execução ]
```

**Dependências:** DOC-001 (storage comum) e backbone da Inbox (fila+worker) sustentam as
origens assíncronas; app móvel sustenta o share nativo. **Posição:** iniciativa
multi-onda (Onda 2+); NÃO implementar oportunisticamente; entra APÓS o fechamento de
Condições (1º adaptador "módulo").

---

## 13. Reconciliação com o que já existe

- **`CreateRecordMenu` (DS-001)** já É o "escolha como enviar" → front-end do Hub.
- **Centro de Captura / `CaptureCenter`** = embrião da Inbox.
- **CAP-001** (Presentation → Capture Engine → Routing Engine; contrato `CapturedDocument`;
  registry de destinos) = fundação; CAP-002 acrescenta **Inbox assíncrona**, **origens
  externas** e **classificador de rota**.
- **Adaptador de Condições** (`feat/condicoes-captura`) = 1º módulo alimentado pelo
  pipeline; vira uma entrada contextual do Hub.
- **DOC-001** = repositório único de documentos. **TEMA C** = o ContentClassifier.

Ver [[req_captura_documental]], [[principio_rastreabilidade_documental]],
[[roadmap_ondas_core]], [[plano_maturidade_pre_mobile]], [[estrategia_master_v21]].
