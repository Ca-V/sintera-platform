# CEF-001 — Clinical Extraction Framework

> **Nível 1 (Constituição).** Domínio transversal, par do Capture Hub (CAP-002).
> Criado 12/07/2026 a partir de avaliação da fundadora. **Especificação v1.0** — princípios
> a congelar após revisão (ARG). Complementar, não sobreposto:
>
> - **Capture Hub (CAP-002)** resolve **COMO o documento ENTRA** (origens → pipeline → roteamento).
> - **Clinical Extraction Framework (CEF)** resolve **COMO cada tipo de documento é COMPREENDIDO**
>   (estrutura → leitura → resultado estruturado).
>
> São responsabilidades diferentes e complementares — tendem a ser os **dois pilares** da plataforma.

---

## Mudança de paradigma (a tese do CEF)

A plataforma evolui a pergunta que sabe responder:
1. **"Como armazenar um exame?"** — armazenamento (estado anterior).
2. **"Como representar corretamente um documento clínico?"** — modelagem de domínio (nomenclatura/classificação/bundle — em curso).
3. **"Como estruturar corretamente o conteúdo de cada categoria de documento clínico SEM
   extrapolar o que está escrito no laudo?"** — o **CEF**.

O CEF é um diferencial técnico porque **não depende só de IA**: combina **taxonomia clínica +
protocolos por categoria + regras determinísticas de domínio** — resultado mais **consistente e
auditável** que um extrator genérico aplicado indistintamente a todos os tipos.

## 0. Enquadramento regulatório (inviolável)

O CEF **EXTRAI e ESTRUTURA o que está ESCRITO** no documento pelo profissional. **NÃO
interpreta clinicamente, NÃO diagnostica, NÃO infere** (RDC 657/2022; LGPD Art. 11). Campos
como "achados", "impressão diagnóstica" e "conclusão" são **transcrições fiéis** do que o laudo
declara — nunca gerados pela SINTERA. Por isso o nome é *Extraction* (não *Interpretation*).
Vale o [[principio_rastreabilidade_documental]]: havendo documento de origem, ele é a fonte primária.

---

## 1. O problema (modelagem de domínio)

Hoje a plataforma assume implicitamente que **todo exame = conjunto de biomarcadores**. Isso
funciona para laboratório, mas falha para a maior parte da medicina. "Biomarcador" é apenas
**um dos tipos possíveis de resultado clínico**. O EEG tem *achados*; a ressonância tem
*achados radiológicos*; o Pentacam tem *parâmetros tomográficos* — nenhum é biomarcador.

Sintomas observados: nomenclatura "biomarcador" forçada em todos os tipos; data errada (um EEG
lido como "2002" — pegou protocolo/nascimento em vez da realização); um mesmo exame em duas
imagens virando dois registros.

---

## 2. Taxonomia — Documento Clínico → Tipo documental

```
Documento Clínico
        │
        ▼
   Tipo documental
        ├── Laboratorial
        ├── Imagem
        ├── Neurofisiológico
        ├── Oftalmológico
        ├── Anatomopatológico
        ├── Genético
        ├── Ômico
        ├── Funcional
        └── Outros (relatório, pedido, guia, atestado…)
```

Cada categoria possui um **protocolo próprio de leitura** e um **modelo de resultado próprio**.

**Terminologia que escala (fundadora):** o classificador **classifica a CATEGORIA DOCUMENTAL** —
que é distinta de **especialidade**, **modalidade**, **protocolo** e **extractor**. Ex.: categoria
`imaging` → modalidade "ressonância" → especialidade "neurorradiologia" → protocolo/extractor
específicos. Manter esses eixos separados evita acoplamento à medida que o CEF cresce.

---

## 3. Arquitetura — de um extractor único para um registro de leitores

**Hoje (implícito):** `Document → Extractor → Biomarkers`

**CEF:**
```
Document (Bundle)
      ↓
Content Classifier        (identifica o TIPO — já existe no Capture Hub)
      ↓
Document Validator        (qualidade ANTES de extrair — ver §5.1)
      ↓
Exam Type Registry        (resolve o leitor da família do exame)
      ↓
Specific Extractor        (protocolo + terminologia + referência do tipo)
      ↓
Structured Result + Confidence   (resultado próprio do tipo + confiança estrutural — §5.2)
```

Cada **família de exame tem seu próprio extrator**. O laboratorial atual passa a ser **um**
leitor do registro, não o único caminho.

### 3.0 Como identificar o exame — ensemble de evidências → Clinical Identity Registry (fundadora, 13/07/2026)

**Não existe mecanismo único confiável** para identificar qualquer exame (o laudo diz "Mamografia", não
"exame de mamografia"). O estado da arte (Document AI) é **ensemble de evidências**: várias funções de
sinal independentes combinadas num **score**, com **conflito → revisão**. Vantagem decisiva: **é
auditável** (mostra *por que* classificou) — um LLM sozinho respondendo "que exame é esse?" é caixa-preta
que não se audita (crítico p/ RDC 657). Ordem: **Extração documental (OCR+layout, reconstrói, não
interpreta) → Segmentação → identificação por evidências → CEF**.

O **Exam Type Registry evolui para um CLINICAL IDENTITY REGISTRY** — por modalidade: nomes oficiais ·
sinônimos (Mamografia/Mastografia/Digital Mammography) · **evidências fortes** (BI-RADS · Lorad · Selenia
· CC · MLO · Eklund) e **moderadas** (calcificações · parênquima mamário) com **pesos** · fabricantes
(Hologic/GE/Siemens) · terminologia típica · **estrutura documental esperada** (indicação·técnica·achados·
conclusão) · unidades · **padrões** (LOINC/DICOM/FHIR/SNOMED) · **extrator correspondente** · regras de
validação. Produz um **score de identidade** (ex.: Mamografia 97% · Pentacam 99% · Desconhecido 42%) — o
score importa **mais que a classificação**. Ex.: Pentacam nunca escreve "tomografia de córnea", mas
OCULUS·Pentacam·K1·K2·BAD-D·Pachymetry·Belin identificam; EEG por ritmo alfa·hiperventilação·
fotoestimulação. **Como um médico: olha o conjunto, nunca um termo só.**

**O LLM é UMA evidência, não o juiz** (Validação entre Camadas): regras dizem Mamografia + LLM diz
Mamografia → alta confiança; regras dizem Mamografia + LLM diz Ultrassom → **conflito** → revisão / baixa
confiança. **Score → `identity_status`** (certifica / draft / desconhecido); limiar = parâmetro
**governado**. **Multi-match ≠ ambiguidade:** casar forte com 3 modalidades distintas geralmente = **3
documentos** → conversa direto com a **Segmentação** (CAP-002). **Ativo GOVERNADO** (versionado, RC,
alimenta o CRC), como o Modelo Clínico. **Escala por CONTEÚDO, não código** (exame novo = novo registro;
ex.: OCT → Macular·RNFL·Ganglion Cell·Cirrus·Spectralis·Topcon — pipeline idêntico). Começar pelas
modalidades com **evidência real** (laboratório·mamografia·ultrassom·Pentacam·EEG) e crescer **puxado
pelo CRC**. É o **HUB** que liga evidência documental → identidade clínica → extrator (CEF) → padrões
(UCDA). Design do **ciclo de execução** (pós-RI-001).

---

## 3.1 Cada tipo traz sua própria REFERÊNCIA CIENTÍFICA (via SRL) — a "inteligência própria" por exame

**Requisito (fundadora, 13/07/2026):** cada exame tem **parâmetros e forma de análise diferentes**
(laboratório × imagem × onda × coleta; com laudo × sem laudo). A plataforma precisa de um **PADRÃO**
(representação) + uma **INTELIGÊNCIA PRÓPRIA por tipo** que, **ao entrar um exame, saiba buscar a
REFERÊNCIA CIENTÍFICA adequada daquele tipo e como incorporá-lo**.

A arquitetura já responde — é a razão de ser do **CEF + SRL**:
```
Exame entra → Content Classifier (categoria) → Exam Type Registry (reader do tipo) →
   o reader do tipo:
   (a) conhece a ESTRUTURA/parâmetros da modalidade (protocolo §7)
   (b) BUSCA a referência científica do tipo no Scientific Retrieval Layer / KG
       (padrões, valores de referência, semântica) — FACTUAL (o que a ciência/norma diz),
       NÃO interpretação clínica (RDC 657)
   (c) estrutura o resultado no modelo da modalidade (§4)
   (d) representa na UCDA (universal)
```
- **Padrão** = **UCDA** (representação universal). **Inteligência própria por tipo** = **Exam Type
  Registry + reader + SRL**. A "referência científica adequada" é a §7 elemento 7, servida pelo **SRL**.
- **Tipo AINDA sem reader** → interim (`document_only`/`partial` + nota → documento) e o exame vira
  **caso do CRC** → evidência → **novo reader** (aprendizado governado). Assim a "inteligência própria"
  **cresce por tipo**, sem novo domínio — cada extrator do CEF nasce trazendo a referência científica
  da sua modalidade.

## 4. Modelos de resultado por tipo (nomenclatura própria)

O resultado NÃO é sempre "biomarcador". Exemplos (campos = transcrição factual do laudo):

| Tipo | Tipo de resultado | Campos (exemplos) |
|---|---|---|
| **Laboratorial** | Biomarcadores | glicose · HDL · LDL · ferritina (valor, unidade, referência) |
| **Neurofisiológico (EEG)** | Achados | ritmo de base · frequência dominante · assimetrias · descargas epileptiformes · conclusão |
| **Imagem (Ressonância/TC/US)** | Achados radiológicos | localização · estruturas · alterações · impressão diagnóstica |
| **Oftalmológico (Pentacam)** | Parâmetros tomográficos | K1 · K2 · Kmax · espessura mínima · BAD-D · elevação anterior · elevação posterior |
| **Anatomopatológico** | Achados | material · descrição macro/micro · conclusão |
| **Genético/Ômico** | Variantes/marcadores | fluxo próprio (catálogo, versionamento) |
| **Funcional** | Medidas funcionais | ex.: espirometria (VEF1, CVF, VEF1/CVF) |

A UI e o Relatório adaptam a **terminologia** ao tipo (1ª casca já entregue: exames não-lab
deixam de mostrar "biomarcadores" e apontam o laudo).

### 4.0 Laudo/narrativo → `document_only` por DESIGN (fundadora, 13/07/2026)
Para documentos do tipo **laudo/narrativo** (imagem e afins), o comportamento correto é **NÃO extrair
campos** — **o laudo já É o resultado** (o texto de achados/conclusão é a informação). Fragmentá-lo em
"campos" não acrescenta e arrisca distorcer. Então: **registrar o exame + apontar o documento original,
sem forçar extração** (`extraction_completeness = document_only`). É o **Princípio da Rastreabilidade
Documental** — a plataforma dá **acesso** ao original, não o substitui. Confirmado em produção: mamografia
única → "Mamografia • Axial" + "Documento disponível para consulta".

> **Confiabilidade:** hoje isso acontece de forma robusta **quando o documento é classificado como
> imagem**; garantir para todo laudo (mesmo os que trazem números que o extrator de laboratório poderia
> raspar) depende da **classificação-primeiro** (Clinical Identity Registry §3.0) — ciclo de execução.
> **Futuro (só se houver evidência de valor):** extrair uns poucos **metadados** (modalidade · data ·
> categoria BI-RADS · conclusão) para timeline/busca **sem** substituir nem fragmentar o laudo.

---

## 4.1 Modelo Clínico de Referência + completude CERTIFICADA por grupo (revisão cruzada, aprovado 13/07/2026)

Detalhamento do §4 — **não é domínio novo**: é o modelo de resultado do tipo, tornado explícito.
Cada modalidade possui um **Modelo Clínico de Referência**: os **grupos clínicos** que o exame pode
conter, seus **parâmetros obrigatórios/opcionais**, e **regras de integridade e de completude**. O
extrator passa a responder **contra esse modelo** — não "quais campos achei?", mas **"quais grupos
clínicos consegui estruturar integralmente?"**.

*(Ex.: Pentacam → Dados administrativos · Qualidade · Ceratometria (K1/K2/Kmax/eixo) · Paquimetria ·
Elevação · Índices ectásicos · Aberrações · Imagens · Conclusão — por olho. Espirometria → Volumes
(VEF1/CVF/VEF1-CVF) etc.)*

**É um ATIVO GOVERNADO, não só código:** o Modelo Clínico é conteúdo clínico → exige **Responsável
Clínico + versionamento** (mesmo aprendizado governado do CRC). **Começa mínimo** (1 grupo) e cresce.

### Regra da Completude Certificada — com o denominador correto
A plataforma **nunca apresenta uma estrutura clínica incompleta como se fosse completa**. Mas a
completude é certificada **por grupo**, e o **denominador é o DOCUMENTO, não o modelo cheio da
modalidade**. Cada grupo tem **três estados** (nunca dois):

| Estado | Significado | Na tela |
|---|---|---|
| `estruturado` | grupo presente no documento e estruturado integralmente | ✔ grupo exibido/certificado |
| `presente_nao_estruturado` | grupo **está no documento**, ainda não estruturado | ⬜ + "ver documento original" |
| `nao_consta_neste_documento` | grupo **não existe neste documento** | **não aparece** (não é lacuna) |

> **Correção nº 1 (crítica) — não repetir a desonestidade inversa.** Um "22%" calculado contra o
> modelo cheio comunicaria que a plataforma **falhou no que nunca esteve no documento** (se o laudo só
> trazia Ceratometria, isso é 100% do que havia, não 22%). O denominador é **o que este documento
> contém** (detectado). Coerente com o princípio da fundadora: **completude é relativa ao que existe,
> nunca a um ideal absoluto** (ver §5.4). O `⬜` só aparece para grupos **detectados** no documento.

### Regra da Integridade Estrutural — ROTULA, não OCULTA
Integridade governa **(a)** certificar um grupo como **completo** e **(b)** **computar valores
derivados/relacionais** (índice VEF1/CVF, índices ectásicos) — que **nunca** se calculam a partir de
conjunto incompleto. Integridade **não** governa a exibição do **dado bruto** já extraído.

> **Correção nº 2 (crítica) — não apagar sinal.** "Se só há K1, esconda o grupo inteiro" **apagaria
> dado que está no documento e foi extraído** — contra a missão de continuidade (não perder
> informação) e com risco de ocultar grupo **completo** por cegueira do nosso modelo a um rótulo de
> aparelho. Regra correta: **exibe o K1**, marca o grupo *"incompleto — conferir no documento
> original"*, **nunca o apresenta como completo e nunca dele deriva**. A justificativa clínica
> sustenta *"não derivar do incompleto"*; **não** sustenta *"esconder o bruto"*.

### Apresentação
Liderar pelo **positivo** — os grupos estruturados + o checklist — com o documento original sempre
acessível para o restante. O **percentual é secundário/qualitativo**; nunca em destaque nem legível
como *score* do exame (a North Star proíbe "score de saúde" proprietário; a mensagem é **neutra e
orientada a ação**, nunca "limitação da plataforma").

### 4ª camada — Representation Validator (fundadora, 13/07/2026)
Existe uma camada além da representação: a **validação da representação** — *"posso confiar nesta
estrutura?"*. NÃO é confiança do OCR nem do LLM; é confiança da **estrutura produzida**. É um **validador
separado do extrator** (Princípio da Validação entre Camadas — o extrator não certifica a própria saída).
Não é máquina nova: seus **outputs já existem** — completude (`partial`/`structured`, abaixo) +
`structural_confidence` (migração 104). A camada apenas os **produz num passo separado** de quem extraiu.

**O CEF passa a responder 4 perguntas (distintas):**
1. **O que é este documento?** (identidade clínica — Exam Type Registry)
2. **Como deve ser estruturado?** (protocolo/modelo do tipo)
3. **Quanto consegui estruturar?** (completude — mínimo estrutural)
4. **Posso considerar esta representação certificada?** (Representation Validator → certifica ou não)

Ex.: Pentacam com fabricante·data·OD·OE·K1·K2 mas sem BAD-D/elevações/mapas → *representação existe,
validação: parcial*. Hemograma completo com referências → *validação: completa*.

### Duas garantias ortogonais — Reprodutibilidade × Completude estrutural (fundadora, 13/07/2026)
A certificação tem **dois critérios independentes**; um não substitui o outro:
1. **Reprodutibilidade** (Princípio da Reprodutibilidade, GOVERNANCA) — a representação **não muda**
   entre reextrações de mesma versão. Guarda: `representation_fingerprint` (conteúdo, inclui valores).
2. **Completude estrutural** — a representação atende ao **mínimo estrutural esperado** do tipo (este
   §4.1). Um exame pode ser **`reproducible=true` E `complete=false`** — *reprodutivelmente incompleto* —
   e esse estado fica **explícito** (não passa por completo).

O **Modelo Clínico de Referência** define o **mínimo estrutural esperado** por tipo — o **esqueleto**,
não todo micro-parâmetro. Ex.: Pentacam → dois olhos (OD/OE) · parâmetros por olho · imagens · data ·
fabricante · modalidade. **Isto resolve o denominador (§4.1 acima):** medir contra o **esqueleto** (o
que o tipo SEMPRE tem) é honesto — faltar o esqueleto (ex.: só um olho) = incompletude real; faltar um
micro-parâmetro que não estava no laudo ≠ falha. Reprodutibilidade do CONTEÚDO (fingerprint com
valores) e completude da ESTRUTURA (esqueleto) são medidas **separadas**; se útil, o CEF pode manter
também uma assinatura **só-estrutura**.

### Efeito no CRC (GS-004 etc.)
O CRC passa a validar **integridade clínica por grupo** (Ceratometria ✔ completa · Paquimetria ✔
completa …), não campos soltos ("K1 encontrado"). **Dois testes por caso GS:** (a) **reprodutibilidade**
— reextrair N vezes → representação idêntica (já em `FUNC-reproducibility`); (b) **mínimo estrutural** —
a representação atende ao esqueleto esperado do tipo (ex.: GS-004 → dois olhos · parâmetros por olho ·
imagens · data · fabricante · modalidade). **Importa a estrutura, não os valores.**

### Enquadramento regulatório
A plataforma afirma **"estes grupos clínicos foram estruturados integralmente"**, nunca "este exame
foi extraído". Reforça a separação fatos/derivações e a leveza regulatória (RDC 657).

### Execução (freeze)
**Adotar o princípio agora; construir os Modelos Clínicos por modalidade no ciclo do CEF**
(pós-HUB-001, junto de GS-003/GS-004) — **não nesta janela** (prioridade RI-001). **Evitar** um
conjunto-obrigatório rígido que oculte grupos de fato presentes por limitação do nosso modelo (recria
o "a plataforma esqueceu" que esta regra existe para eliminar). É a **exposição progressiva** do §5.4,
agora com unidade = **grupo clínico íntegro**.

---

## 5. Semântica de datas (por tipo)

Hoje: "encontre uma data". Deveria ser:
```
1. identifique o TIPO do documento
2. procure o campo "DATA DE REALIZAÇÃO" daquele tipo
3. se houver múltiplas datas, CLASSIFIQUE cada uma:
   realização · assinatura · liberação · coleta · nascimento · protocolo
4. use a de realização (fallback explícito e auditável)
```
Cada tipo documental tem semântica de data diferente — o leitor do tipo sabe qual campo é a
realização e ignora protocolo/nascimento (bug do EEG "2002").

---

## 5.1 Document Validator (estágio antes da extração — fundadora)

Entre o Classifier e o Extractor entra um **Document Validator**, que verifica a QUALIDADE
antes de extrair (evita extrair de material ruim):

- documento completo? · páginas faltando? · orientação correta? · resolução suficiente?
- **datas plausíveis?** · conflito entre páginas? · são múltiplos documentos (não 1 bundle)?

Só depois de validado o extrator específico roda. Melhora muito a qualidade da extração e
alimenta a confiança (§5.2).

**Recoverable × Non-Recoverable** (fundadora): o Validator classifica o defeito.
- **Recoverable** (imagem torta, resolução média, brilho ruim, OCR parcial) → a IA **continua**
  (com confiança rebaixada).
- **Non-Recoverable** (metade da página ausente, PDF corrompido, documento vazio, páginas
  trocadas) → **NÃO extrair** → **solicitar novo documento**. Evita gerar dado de baixa qualidade.

## 5.2 Confiança estrutural (a regra do caso EEG "2002")

O CEF produz não só um resultado, mas um **nível de confiança estrutural** por campo:
`HIGH | MEDIUM | LOW`. **Regra:** um campo de **baixa confiança NÃO substitui automaticamente**
um valor existente — em especial a **data de realização**. Isso teria evitado o EEG virar "2002".
Baixa confiança → mantém o valor anterior e/ou sinaliza para revisão humana (gate).

## 5.3 Desenvolvimento orientado por casos (Gold Standard)

O CEF **nasce a partir de casos reais difíceis**, não de exemplos simples. Ordem:
**reunir os casos difíceis → definir o protocolo de leitura → implementar** (não desenvolver e
depois procurar exemplos). O acervo oficial de regressão está em
`docs/QA/GOLD_STANDARD_CASES.md` (GS-001..GS-009 + casos reais já capturados: EEG e Pentacam =
GS-003/GS-004). Cada leitor do CEF é validado contra o caso GS correspondente.

## 5.4 Metadados de extração + completude RELATIVA AO EXTRATOR (fundadora, 13/07/2026)

Cada extração produz um **bloco de metadados** (não é novo domínio — organiza metadados que
crescerão): `extractor_family` · `extractor_version` · `extraction_completeness` ·
`structural_confidence` · `processed_at` (migration 104).

**Princípio — a completude é relativa ao EXTRATOR, não a um ideal absoluto.** Evita "FULL" absoluto
(nunca verificável — até um hemograma pode ganhar parâmetros). *(Refinado em §4.1: quando houver Modelo
Clínico, o **denominador visível é o que ESTE documento contém**, certificado por grupo — nunca o modelo
cheio da modalidade, que comunicaria falha no que nunca esteve no laudo.)* Estados:
- **`structured`** — tudo o que o extrator suporta HOJE foi estruturado.
- **`partial`** — parte estruturada; o resto está no documento.
- **`document_only`** — nada estruturado com segurança → o documento é a fonte.

O mesmo exame muda de estado conforme o **conhecimento da plataforma** evolui (não o documento):
`Pentacam → document_only/partial (hoje) → structured (extrator oftalmológico v1+)`. Mesma
filosofia do CRC. O `extractor_version` habilita o **reprocessamento automático**: quando um
extrator evolui, os exames processados por versão inferior são candidatos a reprocessar. Hoje o
setter é **heurístico** (cobertura de faixa de referência, type-agnostic); cada extrator
especializado passará a computar completude/confiança **propriamente**.

**UI reage ao ATRIBUTO, não ao tipo** (a interface nada sabe de Pentacam/EEG/hemograma):
`structured` → mostra normal · `partial` → "Resultados estruturados" + nota neutra ("informações
adicionais no documento original") · `document_only` → "Documento disponível para consulta". O
cabeçalho passa de "Biomarcadores extraídos" para **"Resultados estruturados"** (biomarcador é 1 tipo).

**UI-alvo dos extratores (end-state):** **exposição progressiva** — resumo navegável → expandir por
seção/olho/região → documento original sempre acessível. A SINTERA **não reproduz visualmente** o
documento; **estrutura integralmente** a informação preservando a **lógica clínica da modalidade**,
mantendo o documento como **fonte primária de conferência**. Saídas do CEF (§4): **medidas** ·
**achados** · **conclusão documentada** (quando existir — nunca inventada).

**Refinamentos FUTUROS (registrados; NÃO agora — evidência ainda não pede):**
1. **Completude derivada** — no futuro, estudar calcular `extraction_completeness` a partir de
   (extrator atual + resultado atual) em vez de persistir, evitando inconsistência quando um
   extrator evoluir. Otimização futura.
2. **Estado `needs_review`** (4º estado) — extrator estruturou mas NÃO confia (OCR ruim, página
   cortada, conflito entre páginas, datas incompatíveis). Hoje coberto por `structural_confidence`
   → não adicionar agora; deixar registrado.
3. **Fluxo de reprocessamento** — com `extractor_version`, desenhar cedo: novo extrator publicado →
   quais exames em versões anteriores → reprocessar automaticamente ou sugerir. Capacidade poderosa;
   pensar desde já, implementar depois.

## 6. Document Bundle (pertence ao Capture Hub, consumido pelo CEF)

Dois PDFs/imagens podem ser **1 documento com N páginas**, não 2 exames. A captura multipágina
(imagens → 1 PDF) é o **1º passo**, mas o conceito formal é o **Document Bundle** no Capture Hub:
```
Documento (Bundle)
 ├── Página 1
 ├── Página 2
 └── Página N
```
**A extração só ocorre após a montagem do bundle.** Resolve laudos longos, anexos, frente/verso,
gráficos em páginas separadas. Ver CAP-002 §Document Bundle.

---

## 7. O que o Framework define, por categoria

Para CADA tipo de exame, o CEF é a "gramática" da leitura. Define:

1. **Estrutura documental** — como o laudo daquele tipo é organizado.
2. **Protocolo de leitura** — o que ler e em que ordem.
3. **Terminologia** — nomes de resultado próprios (achados, parâmetros, medidas…).
4. **Campos obrigatórios** — o mínimo esperado.
5. **Tipos de resultado** — modelo de dados do resultado.
6. **Validações** — coerência factual (sem juízo clínico).
7. **Referências científicas** — padrões do tipo (via KG v2 / SRL).
8. **Algoritmo de extração** — o extrator específico.
9. **Estratégia de classificação** — como o Content Classifier reconhece o tipo.
10. **Tratamento de múltiplas páginas** — leitura sobre o Bundle.
11. **Resolução de conflitos** — datas/valores/páginas divergentes.

---

## 8. Conexões

- **Content Classifier (CAP-002)** — identifica o tipo; é a porta do Exam Type Registry.
- **KG v2 / Scientific Retrieval Layer** — a base de referência científica por tipo.
- **Capture Hub (CAP-002)** — fornece o Document Bundle; roteia por tipo.
- **Rastreabilidade Documental** — sem dado estruturado, o laudo é a fonte primária.
- **Relatório (REL-001)** — consome o resultado estruturado com a terminologia do tipo.

---

## 9. Sequenciamento (recomendação da fundadora, endossada)

1. **Finalizar o RI-001** (Condições) — NÃO atrasar.
2. **Criar a especificação do CEF** — este documento (feito).
3. **Executar o CEF como a próxima grande iniciativa arquitetural APÓS o HUB-001.**

O CEF será tão estruturante quanto o Capture Hub. **Status atual:** especificação v1.0 (a
congelar após ARG). Implementado até aqui: apenas a 1ª casca (nomenclatura não-laboratorial na
tela de detalhe + reconhecimento de tipos no Content Classifier). O registro de leitores, os
modelos de resultado por tipo, a semântica de datas e o Document Bundle são o corpo do CEF.

## 10. Métricas de maturidade (o sucesso passa a ser medido, não especificado)

A partir daqui, o progresso é medido por indicadores concretos do mecanismo de captura+extração:
- **Tipos documentais suportados** pelo CEF (cobertura).
- **Gold Standard Cases que passam automaticamente** (contra `expected.json`).
- **Taxa de confiança estrutural ALTA**.
- **Redução de correções manuais**.
- **Precisão das datas de realização**.
- **Taxa de documentos corretamente agrupados em bundles**.

**Ciclo Bug → Corpus (permanente):** todo bug real de produção vira caso do CRC + `expected.json`
+ teste de regressão — nunca mais retorna (ver `docs/QA/GOLD_STANDARD_CASES.md` §2.1).

**Painel de qualidade contínua (futuro, na massa crítica — centenas/milhares de casos):**
| Indicador | Ex. |
|---|---|
| Casos no CRC | 412 |
| Especialidades cobertas | 18 |
| Casos passando automaticamente | 96,8% |
| Datas corretamente extraídas | 99,2% |
| Bundles corretamente montados | 98,5% |
| Regressões introduzidas na última versão | 0 |

A partir daí, a evolução deixa de ser guiada por percepção e passa a ser guiada por **evidência mensurável**.

## 11. Encerramento da especificação (fundadora, 12/07/2026)

A fase de especificação está **encerrada**. Capture Hub + CEF + ADL + ARG + RI-001 + Clinical
Reference Corpus + Document Validator formam um conjunto suficiente para orientar a
implementação. **O próximo grande salto NÃO é escrever mais spec** — é fazer o **primeiro
extrator especializado** (provavelmente **neurofisiologia** ou **oftalmologia**) passar
**integralmente GS-003 e GS-004**, provando o CEF na prática. Sequência: **RI-001 → HUB-001 →
1º leitor do CEF validado contra o CRC**.

Ver `docs/CAP-002_CAPTURE_HUB.md`, `docs/GOVERNANCA.md`, `docs/QA/GOLD_STANDARD_CASES.md`, [[modelo_canonico_plataforma]].
