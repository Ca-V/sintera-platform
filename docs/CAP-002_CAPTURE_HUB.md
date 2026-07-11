# CAP-002 — Capture Hub & Caixa de Entrada (Health Inbox)

> Documento de arquitetura funcional e técnica. Evolução estratégica do **CAP-001**
> (Captura Documental) para um **hub universal de ingestão clínica**. Camada de
> execução (código CAP-*); consome DOC-001 (repositório único de documentos) e a
> Camada de Comunicação/Proveniência (`@/lib/provenance`). Enquadramento RDC 657/2022
> e LGPD Art. 11. Status: **spec para aprovação da fundadora (10/07/2026).**

---

## 0. Tese e propósito

O SINTERA não deve apenas "importar laudos". O objetivo é ser a plataforma com a
**maior eficiência e praticidade** para **enviar, incorporar, processar e analisar**
informação clínica — **independentemente da origem do documento**.

O **Capture Hub** é o **moat operacional**: reduz drasticamente a fricção de entrada
de dados. Ele NÃO é o produto (o produto é a inteligência longitudinal + proveniência
+ estruturação); é o diferencial que alimenta esse produto com o menor esforço possível
do usuário. Princípio-guia: **"qualquer forma de compartilhar meu exame funciona"** —
não **"como envio meu exame?"**.

**Regra de ouro:** toda forma de captura **converge para um único fluxo de ingestão**.
Arquivo, foto, scanner, colar link, e-mail, WhatsApp, compartilhamento nativo do
celular e (futuro) integrações de laboratório/RNDS → **o mesmo pipeline**, mantendo
**proveniência**, passando por **revisão humana** quando aplicável e sendo
**distribuído automaticamente** ao módulo correto (Exames, Medicamentos, Condições,
Vacinas, Recursos, Documento administrativo).

---

## 1. Visão de produto

- **Capture Hub** = porta ÚNICA de entrada (no Dashboard: "Adicionar documento" →
  "Como deseja enviar?"). Já materializado em embrião pelo `CreateRecordMenu` (DS-001).
- **Caixa de Entrada (Health Inbox)** = fila única onde TODA captura pousa, processa em
  segundo plano e aguarda revisão. É o que torna as origens **assíncronas**
  (e-mail/WhatsApp/link) possíveis — o documento chega sozinho e precisa de um lugar
  para ser processado e revisado. Ex. de estado visível ao usuário:

  ```
  Recebidos
  ─────────────────────────────
  ✓ 3 processados
  ⏳ 1 aguardando IA
  ⚠ 1 precisa de revisão
  ❌ 1 ilegível
  ```

- **Menor nº de etapas**: o alvo de UX é incorporar qualquer documento com o mínimo de
  passos. Origens assíncronas tendem a ZERO etapas na hora do envio (o doc chega e é
  processado; a revisão é opcional/posterior).
- **Identidade própria**: o módulo ganha nome de produto (ex.: "Caixa de Entrada" /
  "Central de Documentos"), não um rótulo técnico.
- **Atalhos contextuais**: entradas por módulo ("Novo exame", "Nova condição") continuam
  existindo como atalhos que **pré-escopam** o classificador; o Hub é a porta universal.

---

## 2. Arquitetura (camadas)

```
ORIGENS (adaptadores)                    →  CAPTURE ENGINE          →  INBOX (fila async)
 arquivo · foto · scanner · link ·          normaliza qualquer          capture_inbox:
 e-mail · WhatsApp · share nativo ·         entrada em                  status por doc,
 API lab/RNDS (futuro) · voz                CapturedDocument            proveniência

  →  PIPELINE ÚNICO                       →  ROUTING ENGINE          →  REVISÃO HUMANA  →  PERSISTÊNCIA
     OCR/visão → ContentClassifier            distribui ao módulo         (gate quando         DOC-001 (doc único)
     (tipo) → extractor por tipo →            correto (registry)          aplicável)           + módulos +
     needs_review                                                                              Linha do Tempo
```

- **Adaptadores de ingestão (Camada 1):** cada origem é um adaptador ISOLADO que só
  sabe receber daquela origem e produzir o contrato comum. Nova origem = novo adaptador,
  **sem tocar** no pipeline. (Alinha ao CAP-001: "Futuras origens = adaptadores no
  Capture Engine, sem tocar a tela.")
- **Capture Engine (Camada 2):** produz o **`CapturedDocument`** (contrato oficial):
  `documentId · originalFile · mimeType · checksum · **origin** · captureMethod ·
  capturedAt · uploader · metadata`. (`origin` novo: `file|camera|scanner|link|email|
  whatsapp|native_share|lab_api|rnds|voice`.)
- **Inbox / Fila (Camada 3):** entidade `capture_inbox` — persiste o documento recebido,
  seu estado e eventos. Processamento **assíncrono** (job/worker), para não bloquear e
  para suportar chegada espontânea.
- **Pipeline único (Camada 4):** OCR/visão → **ContentClassifier** (decide o TIPO) →
  **extractor específico** do tipo → marca `needs_review`. Idempotente; **dedup por
  checksum** (não reprocessa/duplica o mesmo documento).
- **Routing Engine (Camada 5):** por **registry** (mesmo padrão dos processadores),
  encaminha ao módulo destino. Novo módulo = registrar destino.
- **Revisão humana (Camada 6):** gate de confirmação quando aplicável (a IA transcreve;
  a pessoa confirma antes de gravar em definitivo). Pode ser em LOTE na Inbox.
- **Persistência (Camada 7):** documento original no **DOC-001** (repositório único);
  o registro estruturado no módulo; tudo referencia o `documentId` (sem duplicar arquivo).

---

## 3. Origens de captura por onda

| Onda | Origem | Natureza | Depende de |
|---|---|---|---|
| **A** | Arquivo · Foto · Scanner (câmera) · **Colar link** (público) · Voz | Síncrona | `CreateRecordMenu` (existe); allowlist/SSRF p/ link |
| **B** | **E-mail exclusivo por usuário** · **WhatsApp** | Assíncrona | **Backbone da Inbox** (fila+worker); infra e-mail de entrada; API Meta (existe) |
| **C** | **Compartilhamento nativo Android/iOS (Share Sheet)** | Assíncrona | **App móvel** (ver Plano de Maturidade Pré-Mobile) |
| **D** | **Integrações**: labs BR (Fleury/Dasa/Hermes Pardini/Sabin), **RNDS/Meu SUS Digital**, FHIR/APIs | Pull | Acordos/APIs externas; longo prazo — NÃO virar dependência |

**Ordem de BUILD recomendada** (não de valor): **1) Backbone da Inbox** (fila + worker
assíncrono + classificador de rota + superfície de revisão) → **2) E-mail exclusivo**
(1ª origem assíncrona, prova o modelo ponta a ponta) → **3) Link público + WhatsApp** →
**4) Share nativo (com o app móvel)** → **5) Integrações**. A Onda A já existe em parte
(upload/foto/voz) e conecta ao Hub assim que o backbone existir.

---

## 4. Contrato e pipeline

- **`CapturedDocument`** (Capture Engine → resto): estende o contrato do CAP-001 com
  `origin`. É o único acoplamento entre camadas; troca de OCR/IA no futuro não invalida
  documentos nem quebra proveniência (`documentId`/`checksum` estáveis — backward
  compatibility, CAP-001 Princípio 8).
- **ContentClassifier** (transversal, TEMA C): classifica por CONTEÚDO o TIPO do
  documento → `exame | medicamento | condicao | vacina | recurso | administrativo`.
  Já previsto como infraestrutura. **Factual** — classifica, não interpreta clinicamente.
- **Extractors por tipo:** reusam o que já existe (visão de exames/biomarcadores,
  medicamentos/scan, `/api/vision/condition`, bioimpedância). Cada tipo → seu extractor.
- **`needs_review`:** todo registro de origem-IA nasce pendente de confirmação humana;
  a gravação definitiva só ocorre após revisão (na Inbox ou no formulário do módulo).
- **Dedup:** `checksum` (SHA-256) do arquivo evita reprocessar/duplicar o mesmo
  documento (ex.: laudo enviado por e-mail E por WhatsApp).

---

## 5. Proveniência, auditoria e rastreabilidade

- **Princípio da Rastreabilidade Documental** (decisão permanente): havendo documento de
  origem, o consumidor privilegia o documento original como fonte primária; "Ver
  documento original" acessível em qualquer consumidor pela MESMA lógica.
- Cada item incorporado guarda: **origin** (de onde veio) + **documentId/checksum** +
  **linha de eventos** (recebido → processado → revisado → persistido, com timestamps).
- **DOC-001** = repositório único do arquivo; módulos referenciam `documentId` (sem
  duplicar). Um mesmo documento pode alimentar mais de um módulo (ex.: laudo que gera
  Exame + Condição), sem cópia.
- **Auditoria:** a Inbox é o log natural de ingestão (o que entrou, por qual origem,
  quando, com que resultado de classificação/revisão).

---

## 6. Experiência do usuário (fricção mínima)

- **Uma porta:** "Adicionar documento" → "Como deseja enviar?" (ordem fixa DS-001:
  Arquivo · Foto · Colar link · Encaminhar por e-mail · WhatsApp · Compartilhar do
  celular · Ditar). Regra 1×2+ (`CreateRecordMenu`): 2+ métodos → menu; 1 → aciona direto.
- **Inbox:** área única "Recebidos" com status por documento + ação de **revisar em lote**.
- **Assíncrono = zero etapa no envio:** e-mail/WhatsApp/share chegam sozinhos; a pessoa
  só revisa quando quiser (ou confia na auto-classificação para itens de alta confiança).
- **Atalhos por módulo** pré-escopam o classificador, reduzindo passos quando o contexto
  já é conhecido.

---

## 7. LGPD e segurança (por origem)

- **E-mail exclusivo:** endereço por usuário com token não-adivinhável (ex.:
  `carina.8F4K2@inbox.sinteramais.com.br`); validar **remetente/assunto**, rejeitar
  spam, limitar tipo/tamanho de anexo. Infra de e-mail de ENTRADA (SendGrid Inbound /
  Mailgun / Cloudflare Email Workers) — o Resend atual é só de saída.
- **WhatsApp:** casar o **telefone confirmado** (`profiles.phone`) com a conta; opt-in
  explícito; download de mídia via API Meta.
- **Colar link:** **allowlist de domínios** de laboratórios + guarda **anti-SSRF**;
  funciona só para links **públicos/de compartilhamento** que apontem a um arquivo
  (Caso A). Página com login (Casos B/C) NÃO é acessível pelo servidor — orientar download.
- **Transversal:** dado sensível (LGPD Art. 11) → consentimento, minimização, política de
  retenção/apagamento, tudo referenciado ao Princípio da Rastreabilidade.
- **RDC 657:** o Hub **organiza, transcreve e classifica de forma factual** — não infere
  diagnóstico nem dá orientação clínica; a revisão humana é o gate.

---

## 8. Faseamento no roadmap e dependências

- **Depende de:** DOC-001 (repositório único — backbone de storage) para a forma final;
  backbone da Inbox (fila+worker) para as origens assíncronas; app móvel para o share nativo.
- **Destrava:** ingestão de fricção mínima → mais dados no prontuário longitudinal →
  reforço do moat (continuidade do cuidado).
- **Posição:** iniciativa **multi-onda** (Onda 2+). NÃO implementar oportunisticamente;
  entra como frente estruturante APÓS o fechamento de Condições (que já é o 1º adaptador
  "módulo").

---

## 9. Métricas de sucesso

- **Tempo até incorporar** um documento (mediana) — meta: menor da categoria.
- **Nº de etapas** por origem (meta: assíncronas ≈ 0 no envio).
- **% auto-classificado corretamente** (ContentClassifier) e **taxa de revisão** necessária.
- **% de documentos que chegam por origens de baixa fricção** (e-mail/WhatsApp/share).
- **Taxa de ilegível / falha de extração** (qualidade da captura).

---

## 10. Reconciliação com o que já existe

- **`CreateRecordMenu` (DS-001)** já É o "escolha como enviar" — vira o front-end do Hub.
- **Centro de Captura / `CaptureCenter`** = embrião do Hub (evolui para a Inbox).
- **CAP-001** (3 camadas: Presentation → Capture Engine → Routing Engine; contrato
  `CapturedDocument`; registry de destinos) = a fundação; CAP-002 acrescenta **Inbox
  assíncrona**, **origens externas** e **classificador de rota** por cima.
- **Adaptador de Condições** (`feat/condicoes-captura`) = 1º exemplo de módulo alimentado
  pelo pipeline; ao existir o Hub, vira mais uma entrada contextual.
- **DOC-001** = repositório único de documentos (backbone de storage + proveniência).
- **TEMA C** (inteligência transversal) = o ContentClassifier é a peça de classificação.

Ver [[req_captura_documental]], [[principio_rastreabilidade_documental]],
[[roadmap_ondas_core]], [[plano_maturidade_pre_mobile]], [[estrategia_master_v21]].
