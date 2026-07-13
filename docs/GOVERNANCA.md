# SINTERA — Sistema de Documentação de Governança

Conjunto formal de documentos que governam a plataforma, com **códigos estáveis**.
Sistema criado 10/07/2026. Objetivo: documentação **organizada, escalável e com peso
explícito** — cada documento tem um **nível** que comunica sua estabilidade.

---

## Classificação da documentação (4 níveis)

O nível indica **quão raramente o documento muda** e **quanto peso ele carrega**.

### Nível 1 — Constituição *(muda muito raramente; define princípios e arquitetura estrutural)*
| Código | Documento |
|---|---|
| **CON-001** | Constituição Estratégica (`docs/estrategia/SINTERA_ESTRATEGIA_MASTER.md`, v2.2) |
| **BRD-001** | Branding (identidade visual **v3.0 "Van Gogh"** — azul-turquesa/terracota/preto-marrom) |
| **UX-001** | Arquitetura funcional / navegação |
| **REL-001** | Camada de Comunicação (Relatório = 1º consumidor) |
| **DS-001** | Design System (tokens, componentes, paleta) |
| **CAP-002** | **Capture Hub** — domínio transversal de ingestão (🧊 congelado v1.0) |
| **CEF-001** | **Clinical Extraction Framework** — como cada tipo de documento é compreendido (spec v1.0, par do Capture Hub) |
| **UCDA-001** | **Universal Clinical Data Architecture** — como QUALQUER evidência clínica é representada (unidade = evidência, não exame). **Draft v0.9 (proposta; não congelada)** — aguarda revisão técnica antes de v1.0 |
| **SIF-001** | **Structured Import Framework** — arquivos estruturados (CSV/JSON/HL7/FHIR/VCF). ⏸️ **ADIADO** (freeze informal) — só criar quando houver caso real que o exija |
| **KG v2** | Knowledge Graph (modelo científico) |
| **SRL** | Scientific Retrieval Layer |
| **SEC-001** | Projeto Shield — Segurança/Governança/Continuidade |
| — | Princípio da Rastreabilidade Documental; ADRs estruturantes |
| **ARC-001·PRD-001·OPS-001·REG-001** | ⏳ a consolidar (hoje dispersos em CON/BRD/SEC) |

### Nível 2 — Referências *(como implementar a Constituição na prática)*
| Código | Documento |
|---|---|
| **CAP-002-REF** | Reference Implementation do Capture Hub (Condições → mapa CAP-002→código) |
| **QA-001** | Processo de homologação (harness, tripé técnica/estrutural/visual) |
| — | Exemplos, fluxos, implementações de referência |

### Nível 3 — Especificações *(funcionalidades específicas)*
| Código | Documento |
|---|---|
| **CAP-001** | Captura documental (5 meios de entrada) |
| **DOC-001** | Repositório único de documentos (spec) |
| — | Condições · Medicamentos · Inbox · Exames · Recursos · etc. |
| **AUD-001** | Diagnóstico de acessibilidade (TEMA G) |

### Nível 4 — Execução *(operação do dia a dia)*
Backlog · issues · sprints · PRs · tarefas · roadmap por ondas (posicionamento).

---

## Architecture Review Gate (ARG)

**Toda nova funcionalidade responde a este checklist ANTES de entrar em desenvolvimento.**
Leva poucos minutos e evita a erosão arquitetural que ocorre à medida que o produto cresce.

1. A funcionalidade **reutiliza um domínio existente**?
2. Ela **introduz uma nova origem de dados**? Se sim, **usa o Capture Hub** (CAP-002)?
3. Respeita os **princípios constitucionais** (CON/BRD/UX/REL/CAP/SEC…)?
4. Existe **componente reutilizável** antes de criar um novo?
5. Ela **aumenta ou reduz** a complexidade arquitetural?
6. Há impacto em **proveniência, auditoria ou LGPD**?
7. Precisa de **ADR** ou **atualização documental**?
8. Há **cobertura de testes** para o fluxo arquitetural afetado?
9. Ela **cria alguma exceção** à arquitetura? Se sim, a **justificativa está documentada**?

> Regra de ouro (CAP-002 §princípio 10): **toda entrada de informação externa é um
> adaptador do Capture Hub** — vedado fluxo paralelo de ingestão.

**Toda revisão ARG termina em EXATAMENTE um resultado** (registrado no ADL):
1. **Aprovado** — pode seguir para implementação.
2. **Aprovado com ressalvas** — segue, mas há pendências registradas.
3. **Requer revisão arquitetural** — precisa de ajustes antes do desenvolvimento.
4. **Requer ADR** — altera princípios ou decisões estruturantes → ADR antes de qualquer código.

O resultado + a decisão entram no **`docs/ADL_ARCHITECTURE_DECISION_LOG.md`** (linha do
tempo cronológica de TODAS as decisões arquiteturais, mesmo as sem ADR próprio).

---

## Regra de ouro da execução (automação × confirmação)

> **Automatizar toda execução técnica repetitiva. Solicitar confirmação apenas para decisões de
> negócio, arquitetura ou operações potencialmente irreversíveis.** (fundadora, 13/07/2026)

Consistente com ARG/ADL/CAP-002/RI-001: a ferramenta não interrompe o raciocínio por questões
operacionais que podem ser executadas com segurança.

| Automático (sem perguntar) | Confirmação explícita |
|---|---|
| ler arquivos · buscar no projeto · **editar código** · **criar arquivos** | **push para a main** |
| testes · build · lint | **deploy em produção** |
| **consultas de leitura** ao banco | **migrations destrutivas** |
| trabalho em **branches de desenvolvimento** | **remoção de dados** |
| **commits locais** (e push em branch de dev) | **alterações de infraestrutura** |
| pesquisa/leitura externa (web) | **mudanças de credenciais/permissões** · decisões de **produto/arquitetura** |

Nota: a allowlist técnica (`.claude/settings.local.json`) é grossa (não distingue conteúdo);
a coluna "confirmação" é garantida por **disciplina de conduta** — ex.: mesmo com `git push`
liberado, confirma-se todo push para a **main**; mesmo com `execute_sql` liberado, confirma-se
DELETE/DROP/TRUNCATE e migrations destrutivas.

## Congelamento e evolução (formulação de governança)

Não se diz "a arquitetura não será mais discutida". A formulação correta:

> **Os princípios arquiteturais estão congelados. A arquitetura continua evoluindo por
> refinamentos COMPATÍVEIS com esses princípios. Alterações que VIOLEM os princípios
> exigem uma revisão arquitetural formal (ARG + ADR).**

Nenhuma arquitetura é definitiva; o que se congela é o conjunto de princípios e o
**processo** para mudanças estruturais. Refinamento compatível → segue. Violação →
revisão formal antes de qualquer código.

---

## Fase atual — Consolidação Arquitetural (a partir de 10/07/2026)

A **Fase de Definição Arquitetural está formalmente ENCERRADA** (fundadora, 12/07/2026):
Capture Hub + CEF + ADL + ARG + RI-001 + Clinical Reference Corpus + Document Validator formam
um conjunto suficiente. **O próximo capítulo não é escrever mais especificação** — é
**demonstrar**, via **RI-001 → HUB-001 → 1º extrator especializado validado contra o CRC**, que
a arquitetura produz software **reutilizável, mensurável e progressivamente mais preciso**.
Esse é o verdadeiro marco de maturidade técnica.

Objetivo agora: **NÃO produzir novos documentos constitucionais**, e sim **comprovar que os
existentes são aplicáveis** via implementações reutilizáveis. A qualidade passa a ser medida por
**evidência** (facilidade de reuso; métricas do CEF §10; painel de qualidade contínua) — não
pela quantidade de documentos. Vale o **Ciclo Bug → Corpus** (todo bug de produção vira caso do
CRC + regressão; `docs/QA/GOLD_STANDARD_CASES.md` §2.1).

**Painel de marcos** (o progresso é medido por marcos de consolidação, não por commits/
docs). Ao concluir um marco: atualiza o **ADL** + registra o **resultado do ARG** +
altera o status aqui.

| Marco | Descrição | Status |
|---|---|---|
| **NAM-001** | Nomenclatura documental determinística (categoria+escopo; substitui nome-de-arquivo/IA). **1ª entrega da Consolidação** — v1.0.1 | ✅ (deploy) |
| **RI-001** | Condições validada e promovida a Reference Implementation (Gate RI-001, CAP-002-REF §4) | ⏳ em teste |
| **HUB-001** | 1º componente reutilizável extraído para o backbone do Capture Hub | ⏳ |
| **DOC-001** | Repositório documental único operacional | ⏳ |
| **MAIL-001** | 1º adaptador assíncrono (e-mail exclusivo) ponta a ponta | ⏳ |
| **AUTO-001** | 1ª ingestão totalmente automática concluída com sucesso | ⏳ |
| **CEF-001** | Clinical Extraction Framework — leitura por tipo de exame (registro de leitores + modelos de resultado + semântica de datas + Document Bundle). **Próxima grande iniciativa após o HUB-001** | 📝 spec |
| **CEF-001A** | **1º extrator especializado** (neuro/oftalmo). Critério de aprovação: passa **GS-003** + **GS-004** · Confidence **HIGH** · **Bundle** correto · **data** correta · **zero regressões**. Prova a arquitetura onde a solução anterior falhava | ⏳ (após RI-001) |

Legenda: ⏳ pendente · 🔧 em andamento · ✅ concluído.

## Freeze arquitetural informal — o próximo ciclo é EXECUÇÃO (fundadora, 13/07/2026)

O conjunto constitucional está **completo o suficiente** (BRD · KG · SRL · Capture Hub · CEF ·
UCDA Draft · CRC · ARG · ADL · GOVERNANÇA · DOC-001 · RI-001). **Freeze informal:** **pausar a
criação de novos documentos constitucionais** até a execução validar os conceitos atuais. Novos
domínios (ex.: SIF-001) ficam **adiados** até haver caso real que os exija.

**Regra "acomodar-antes-de-criar" (permanente):** *toda nova ideia arquitetural deve PRIMEIRO
tentar ser acomodada pelos componentes existentes. Só quando isso não for possível cria-se um
novo domínio constitucional.* Preserva a coerência e mantém a evolução por refinamentos
compatíveis (coerente com o congelamento de princípios).

**Critério do Sistema Cognitivo (permanente — fundadora, 13/07/2026):** a plataforma entra na
fase de **execução / construção da inteligência** (a fundação — Capture Hub · Document Bundle · CEF
· CRC · UCDA · KG · SRL · governança — vira infraestrutura permanente). **A partir do HUB-001, toda
decisão técnica responde também a:** *"esta implementação APROXIMA a SINTERA de um Sistema Cognitivo
Clínico governado, ou cria uma solução ISOLADA que dificulta essa evolução?"* Não é novo domínio —
é critério de decisão, como o Princípio da Evidência Arquitetural. Ver
`docs/VISION_SISTEMA_COGNITIVO_CLINICO.md` (inclui a **IA Governada**: aprende continuamente, mas
auditável/rastreável/versionado; lógica clínica NUNCA evolui sozinha em produção).

**Sequência do próximo ciclo (código, não documentação):**
1. Finalizar **RI-001** → 2. **Merge de Condições** → 3. **HUB-001** (backbone; `Document Bundle →
CapturedDocument → Pipeline`) → 4. **1º extrator especializado do CEF** (GS-003/GS-004) → 5. **validação automática
contra o CRC** → 6. **revisar a UCDA** Draft → 7. **evolução INCREMENTAL da Camada Cognitiva**
(visão de longo prazo — nunca em um único projeto/modelo; emerge conforme cada componente amadurece).

**Após o RI-001 aprovado — `Lessons Learned — RI-001`** (retrospectiva técnica de 1–2 págs, **não
constitucional**): o que a arquitetura **acomodou** naturalmente · o que precisou ser **refinado** ·
quais **componentes se provaram reutilizáveis** · quais **heurísticas** surgiram (ex.: setter de
completude) e deverão ser substituídas pelos extratores do CEF · o que aprendemos para o **HUB-001**.
Transforma a 1ª ref. impl. em conhecimento explícito para os próximos módulos.

**Critério objetivo p/ promover UCDA v0.9 → v1.0** (não congelar cedo): (a) HUB-001 operacional ·
(b) ≥ 2 extratores especializados implementados · (c) GS-003 **e** GS-004 passando automaticamente ·
(d) revisão técnica (FHIR/DICOM/… — `UCDA-001-REVIEW`) concluída e incorporada.

**CRC como ativo VIVO (meta operacional):** todo bug de produção relevante gera um **novo caso no
CRC em até 48h**; **nenhuma correção é "concluída" sem seu caso de regressão** (estende o Ciclo
Bug → Corpus).

**Indicador de reúso** (medir se a arquitetura reduz duplicação — atualizar ao longo do tempo):

| Componente | Módulos que reutilizam |
|---|---|
| **Document Bundle** | Condições · Medicamentos · Exames (Novo exame + caixa) · CaptureCenter · Medidas · Recursos |
| **Capture Hub / Content Classifier** | Exames · Condições · (pontos de captura) |
| **CEF (nomenclatura/classificação)** | Exames · Condições · Pedidos |
| **CRC** | regressão de todo extrator do CEF |

## Princípio da Evidência Arquitetural (permanente — fundadora, 13/07/2026)

> **A arquitetura da SINTERA evolui PRIORITARIAMENTE por evidências produzidas pela implementação,
> não por hipóteses.** Um novo domínio arquitetural não nasce de uma ideia interessante — nasce
> quando a implementação demonstra, de forma **recorrente**, que os componentes existentes já não
> acomodam adequadamente uma necessidade real. **A implementação passa a ser a principal fonte de
> refinamento da arquitetura** (inversão importante).

**Ciclo permanente:**
```
Arquitetura → Implementação → Validação → Evidência → Refinamento (quando necessário) → Arquitetura
```

**Reframe da primeira pergunta** ao surgir uma proposta: não "**é uma boa arquitetura?**", e sim
"**qual evidência prática mostra que a arquitetura atual NÃO acomoda este caso?**". Sem essa
evidência, a resposta padrão é **reutilizar e adaptar** os componentes existentes (regra
acomodar-antes-de-criar).

**Disciplina a preservar — integração, não substituição:** a arquitetura cresceu **encaixando**
camadas complementares (Capture Hub, CEF, CRC, UCDA, KG, SRL) **sem descartar decisões anteriores**.
Cresce por **integração e refinamento**, não por substituição constante — é o que a mantém coerente
e sustentável. **Marcos = entregas verificáveis** (RI-001 aprovado · HUB-001 operacional · 1º
extrator do CEF · GS-003/GS-004 passando · cobertura do CRC · indicador de reúso), não quantidade
de especificações.

---

## Princípio da Identidade Documental (permanente — fundadora, 13/07/2026)

> **Todo atributo proveniente do documento original deve permanecer FIEL ao documento. A plataforma
> pode classificá-lo, estruturá-lo, contextualizá-lo e relacioná-lo — mas nunca substituir ou
> reinterpretar o conteúdo documental original.**

Motivado pela evidência do Pentacam (reextrair mudava nome e dados). O problema não era classificação
instável — era **misturar identidade documental com interpretação da plataforma**. Torna EXPLÍCITA
uma distinção antes implícita: **documento, classificação e representação clínica são entidades
diferentes.** Complementa a Rastreabilidade Documental e a Evidência Arquitetural; não muda a missão.

**1. O documento é a fonte da verdade.** O título principal exibido é o **nome documental** extraído
do próprio documento, preservando ao máximo o texto original (ex.: *OCULUS Pentacam*, *EEG Digital
com Mapeamento Cerebral*, *Hemograma Completo*, *PET-CT*, *Painel Respiratório RT-PCR*). A plataforma
pode corrigir **erros evidentes de OCR** (acentuação, caracteres quebrados) — nunca reinterpretar ou
substituir o título. *(Refinamento: preservar também o texto documental BRUTO ao lado do corrigido —
toda correção de OCR fica rastreável e reversível.)*

**2. Classificação clínica é OUTRO conceito** (uso interno): escolher o extrator · organizar a
Timeline · interoperabilidade (FHIR/UCDA) · pesquisas · filtros · estatísticas · evolução do CEF.
**Nunca** substitui o nome documental.

**3. Nome canônico é OUTRO atributo** (`canonical_title`): padronização interna (ex.: documento diz
*OCULUS Pentacam* → canônico *Tomografia de córnea (Pentacam)*). O usuário vê o documental; o canônico
é interno. *(Refinamento — painéis: quando o documento NÃO tem título único (ex.: Hermes sangue+urina),
o display cai numa regra determinística ("Exames laboratoriais") que vive como `canonical_title`, não
como se fosse o nome documental.)*

**4. A reextração NUNCA altera a identidade documental.** "Extrair novamente" = re-executar o extrator
· atualizar os **resultados estruturados** · usar um extrator mais moderno. **Nunca** altera
`document_title`, `document_type`, `document_family` nem a identidade. **Mecanismo:** identidade
documental é **write-once** — gravada na 1ª extração, **imutável** nas reextrações; só muda por uma
**ação explícita de correção**, nunca por nova chamada da IA.

**5. Hierarquia de confiança** (cada camada deriva da anterior; **nenhuma altera a anterior**):
```
Documento original (fonte da verdade)
  ↓ document_title (transcrição documental, fiel)
  ↓ Classificação clínica (interna)
  ↓ Nome canônico (canonical_title, interno)
  ↓ Resultados estruturados (o que a reextração atualiza)
  ↓ Contextualização clínica
```

**6. Compatível com a arquitetura** — reforça Rastreabilidade Documental · Capture Hub · CEF · UCDA ·
Evidência Arquitetural. Não é domínio novo; explicita uma distinção já implícita.

**7. Critério permanente (vale para TODA a plataforma):** todo atributo vindo do documento original
permanece fiel; a plataforma classifica/estrutura/contextualiza/relaciona, **mas nunca substitui ou
reinterpreta o conteúdo documental**. Aumenta confiabilidade, elimina inconsistência entre
reprocessamentos, fortalece a rastreabilidade regulatória e preserva a confiança do usuário.

**Implementação em 2 passos:**
- **Passo 1 (FEITO, escopo RI-001) — write-once interino:** a identidade é gravada na 1ª extração e
  imutável na reextração. Gatilho interino = `document_type != null` (frágil, **provisório**; será
  substituído pelo `document_identity_status`). Mata o churn e permite concluir o RI-001.
- **Passo 2 (modelo-alvo — APÓS o RI-001, ANTES do HUB-001):** estados de identidade + separação
  documental × clínica (abaixo). Prioridade da fundadora: consolidar a referência primeiro, depois
  fortalecer os fundamentos.

### Modelo-alvo — hierarquia de identidade (fundadora, 13/07/2026)

Falta uma camada, e ela é **semântica**, não interpretativa. Cada camada **adiciona significado; nenhuma
altera a anterior**:
```
Documento original
  ↓ Identidade Documental        (document_title — transcrição fiel)
  ↓ Identidade Semântica Clínica (clinical_family · clinical_type · canonical_title)
  ↓ Resultados Estruturados
  ↓ Contextualização Longitudinal
  ↓ Suporte Cognitivo
```
**"Identidade Semântica Clínica"** (não "Identidade Clínica"): a camada **normaliza semanticamente** um
documento — não interpreta seu conteúdo (fronteira RDC 657). O documento diz *"OCULUS Pentacam"*
(documental); semântico-clinicamente ele pertence à família *Tomografia de córnea* / tipo *Pentacam*.

**5 atributos de identidade + proveniência por atributo:**

| Atributo | Camada | Dono |
|---|---|---|
| `document_title` | documental (transcrição fiel) | documento |
| `document_identity_status` | controle (`draft`/`validated`/`locked`) | plataforma |
| `clinical_family` (ex.: Oftalmologia) | semântica clínica | **CEF · Exam Type Registry** |
| `clinical_type` (ex.: Pentacam) | semântica clínica | **CEF** |
| `canonical_title` (ex.: Tomografia de córnea (Pentacam)) | representação | plataforma |

**6º — `identity_source` (por atributo):** `document` · `classifier` · `user` · `manual_correction`
(+ `confidence`). Diz **quem definiu cada identidade** — auditoria permanente. Ex.: `document_title` ←
`document`; `clinical_type` ← `classifier` (conf. 0,99); mais tarde `clinical_type` ← `manual_correction`.

**Estado × Evento (refinamento fundadora — "corrected é evento, não estado"):**
- **`status`**: `draft` → `validated` → `locked` (o ciclo de vida).
- **`resolution`**: `automatic` · `user_confirmed` · `manual_review` (como chegou ao estado).
- Corrigir **não** cria um estado "corrected": o registro segue `locked`, com `resolution = manual_review`.

**Modelagem (acréscimo Claude — reforça a auditoria):** como `identity_source`/`confidence`/`resolution`
são **por atributo** e correção **é um evento**, o modelo limpo é um **log de eventos de identidade
append-only** (atributo · valor · source · confidence · resolution · timestamp · ator) com os **valores
atuais denormalizados** na linha do exame. A linha guarda o estado atual; o log guarda a história.
Encaixa no CRC e na futura camada cognitiva.

**Regra do `draft` (refinamento Claude — sem isto o churn volta):** em `draft`, a identidade **NÃO muda
por uma reextração do mesmo extrator**. Muda **apenas** por evento explícito: (a) promoção por confiança
na 1ª extração, (b) confirmação do usuário, (c) correção, (d) **extrator mais novo** (`extractor_version`
maior, reprocesso explícito), (e) intervenção administrativa. Nunca por uma simples reextração.

**VALIDAÇÃO da identidade ANTES da certificação (fundadora, 13/07/2026 — evidência: OCULUS Pentacam
mobile gravado como "OCULUS – PANACAN Mastara 2 Exames", data 2005).** O write-once resolveu a
instabilidade, mas **congelou uma identidade incorreta** — porque falta uma etapa entre extração e
certificação. O problema nunca foi "não mudar"; é **quando permitir congelar**. Fluxo correto:
```
OCR → LLM → VALIDAÇÃO da identidade → identidade certificada (validated) → write-once
```
A identidade só é promovida a `validated` (e congelada) quando atinge **critérios mínimos de qualidade**:
confiança do OCR · coerência textual · fabricante reconhecido (lista leve de sanidade) · ausência de
**erros típicos de OCR** · caracteres estranhos · título curto/longo demais · parece mistura de duas
linhas · conflito. Se a confiança for baixa → **não certifica**: permanece `draft`, preservando o
documento original e permitindo certificação futura por extrator mais evoluído ou confirmação do usuário.
**`document_title` de baixa confiança nunca é inventado** — usa um fallback honesto (ex.: *"Documento
oftalmológico (título não identificado com confiança)"*) ou solicita revisão. Objetivo: **erros de
OCR/leitura nunca viram identidades permanentes.**

**CORREÇÃO ARQUITETURAL (fundadora, 13/07 — o Claude havia acoplado errado):** a validação da identidade
**NÃO depende do Exam Type Registry nem do CEF.** A identidade documental é uma camada **anterior e
independente** da compreensão clínica — um documento existe e tem título/data/emissor/paciente **mesmo
sem a plataforma saber o que ele é** (fabricante desconhecido, equipamento novo, hospital estrangeiro).
O **Identity Validator** é **engenharia documental, não clínica**: `existe título? · texto íntegro? ·
houve corrupção? · fabricante reconhecido? · caracteres estranhos? · confiança OCR? · conflito? · título
curto/longo demais? · mistura de duas linhas?`. "Fabricante reconhecido (OCULUS)" = **lista de sanidade
documental**, NÃO o registro clínico (saber que OCULUS é um fabricante real ≠ saber que é tomografia de
córnea). Consequência de sequência: o Identity Validator **não espera o CEF/HUB-001** — pode ser
construído **logo após o RI-001**. Fluxo com o estágio explícito:
```
Documento → OCR → Extração textual → Identity Validator → document_title certificado → (depois) Classificação clínica → CEF
```

**Três camadas bem definidas (reduz acoplamento):**
1. **Identidade documental** — *"o que o documento diz"* (título · data · emissor · número · paciente).
   Simples, estável por décadas, **independente de qualquer extrator**.
2. **Identidade clínica** — *"que tipo de exame isso representa"* (CEF · Exam Type Registry).
3. **Representação clínica estruturada** — *"como organizar o conteúdo desse tipo"* (CEF).

É **genérico** — Pentacam/OCT/Holter/MAPA/Colonoscopia/Ecocardiograma/Ressonância. GS-010 testa o
**comportamento** (certificação de identidade), não um exame.

**Camada de apresentação — não misturar documental × plataforma (evidência: "1 exame" × título "2
Exames"):** o título transcreve o documento (onde "2 Exames" veio como conteúdo/erro); a contagem "1
exame" é o registro da plataforma. As duas não podem coexistir na mesma frase. A apresentação separa
**informação documental** (título) de **informação estrutural da plataforma** (contagem/estado).

**Princípio de IA (permanente, fundadora):** *nenhuma informação produzida por IA substitui a
informação documental original — apenas a complementa com uma representação estruturada e rastreável.*
Forma operacional do "documento é a fonte da verdade": **a IA nunca substitui o documento; só cria
camadas sobre ele.** `clinical_family`/`clinical_type` são a saída do **Exam Type Registry do CEF** —
não é camada nova, é nomear como identidade o que o CEF já produz.

**Princípio-síntese (permanente, fundadora):** *A identidade de um documento é um **ativo permanente**
da plataforma. Nasce do documento, pode ser enriquecida por classificações semânticas e
contextualizações clínicas, mas **jamais** pode ser substituída ou redefinida automaticamente por uma
nova extração. A evolução da identidade ocorre apenas por **eventos governados, auditáveis e
rastreáveis**.* Rege toda a plataforma e conversa com Capture Hub, CEF, UCDA, CRC e a camada cognitiva.
Ver `CEF-001` e `principio_rastreabilidade_documental`.

### Extensão — Representação Estruturada Certificada (fundadora, 13/07/2026)

A imutabilidade **estende-se da identidade para os RESULTADOS**. O problema não é só o nome mudar — a
**representação estruturada** mudava a cada reextração ("cada hora aparecia uma parte do exame"). Num
sistema clínico, **reprodutibilidade é essencial**: o mesmo documento deve produzir a mesma
representação, independentemente de quantas vezes seja processado.

Hierarquia: `Documento → Identidade documental (imutável) → Representação estruturada (certificada) →
Contextualização`. A representação também é **ativo permanente**.

**Como funciona:** 1ª entrada → cria identidade → roda o extrator → gera resultados → **certifica** a
extração → **congela**. "Extrair novamente" **não** substitui automaticamente:
```
Representação CERTIFIED  ×  nova extração (CANDIDATE)
  iguais → descarta a candidata
  diferentes → apresenta a diferença → confirmação do usuário OU extrator mais novo → governa a troca
```

**Estados (espelho do identity_status):** `CERTIFIED` (oficial) · `CANDIDATE` (nova extração aguardando
comparação) · `SUPERSEDED` (antiga substituída após validação) — **histórico append-only** completo.

**Refinamento Claude nº1 — reprodutibilidade por CONGELAMENTO, não por determinismo do LLM:** um LLM
(sobretudo visão) não é bit-a-bit reprodutível nem a `temperature 0`. A garantia vem de **persistir a
representação certificada e não re-derivá-la**. Logo: **reextração com o MESMO `extractor_version` NEM
RODA** (retorna a certificada; rodar de novo só geraria ruído de jitter). O fluxo candidato+comparação
é disparado **apenas por `extractor_version` mais novo** — nunca por um clique de "Extrair novamente".

**Refinamento Claude nº2 — encaixa no existente:** gatilho = `extractor_version` (migração 104, já
existe); casa com a **completude certificada** do CEF §4.1 (completude = *quanto* foi estruturado;
representação certificada = *aquela estrutura, congelada e versionada*). Mensagem ao usuário quando há
diferença real: *"Uma versão mais recente do extrator identificou diferenças neste exame. Deseja revisar
a nova estruturação?"* — transparente, auditável, seguro.

**Orientação (permanente, fundadora):** *a imutabilidade estende-se da identidade documental para a
representação estruturada. A 1ª extração gera uma representação certificada; reextrações não a
substituem automaticamente nem produzem conjuntos diferentes a cada execução. Um extrator novo produz
uma representação **candidata**, comparada com a certificada, que só substitui a anterior por **evento
governado** (nova versão do extrator, confirmação do usuário ou revisão administrativa). Identidade E
resultados tornam-se ativos permanentes, auditáveis e reproduzíveis.*

**Implementação:** *Passo 1b (imediato, escopo RI-001)* — congelar os resultados como a identidade: numa
reextração de exame já certificado, **não sobrescrever** (mesmo `extractor_version`). *Passo 2 (pós-RI-001)*
— máquina completa CERTIFIED/CANDIDATE/SUPERSEDED + diff + troca governada, junto do `identity_status`.

---

## Princípio da Reprodutibilidade (CONSTITUCIONAL — fundadora, 13/07/2026)

> **Para o MESMO documento, usando a MESMA versão do extrator, a plataforma deve produzir exatamente a
> MESMA representação estruturada** — o mesmo nome documental, a mesma classificação, os mesmos
> resultados. **Qualquer diferença é uma REGRESSÃO.** Tão importante quanto a Rastreabilidade Documental
> e a Evidência Arquitetural: a confiança na plataforma depende disto.

Elevado a requisito **constitucional** porque o erro do Pentacam (reextrair mudava nome e resultados)
**já havia sido decidido como proibido e regrediu** — sinal de que o princípio não estava protegido
**pela arquitetura**, só por decisão. Um princípio de confiança precisa de **guarda permanente**.

**Nota técnica (honesta):** reprodutibilidade **não** vem de determinismo do LLM (visão não é bit-a-bit
reprodutível nem a `temperature 0`). Vem de **congelar a representação certificada e não re-derivá-la
na mesma versão**. A garantia é arquitetural, não uma expectativa sobre o modelo.

**Critério de segurança (na ARQUITETURA, não só na interface):**
1. Na 1ª extração, gerar a **assinatura (fingerprint)** da representação estruturada
   (`representation_fingerprint` — SHA-256 de nome + classificação + resultados canonizados; coluna
   migração 105; `src/lib/capture/reproducibility.ts`).
2. Uma reextração com a **mesma versão do extrator** deve produzir a **mesma assinatura**; a
   representação certificada **não é re-derivada** (Passo 1b curto-circuita antes de processar).
3. Se uma re-derivação produzir assinatura **diferente**, é **evento de consistência** — **nunca**
   substitui automaticamente os dados existentes.

**Reprocessamento — única exceção:** diferenças só são aceitas por **evento governado** — nova
**versão do extrator**, **correção manual** ou **validação explícita do usuário**. Nunca por uma simples
reextração.

**Teste obrigatório (guarda permanente contra regressão):** faz parte do CRC e da suíte automatizada.
- **Determinístico (todo PR):** a assinatura é estável para a mesma representação e muda a qualquer
  alteração de nome/classificação/resultado; e um exame **certificado** nunca é re-executado/sobrescrito
  numa reextração de mesma versão. `tests/capture-hub/func/FUNC-reproducibility.test.ts`. **Se falhar,
  alguma evolução reintroduziu o comportamento proibido.**
- **Homologação (IA real, informativo):** para cada caso do Gold Standard, medir a *variância* do
  extrator entre execuções — não como pass/fail de "idêntico" (o LLM varia), mas para vigiar o drift; a
  imutabilidade do usuário é garantida pelo congelamento, não pela repetição do modelo.

Ver `CEF-001` §4.1 (completude certificada), `docs/QA/GOLD_STANDARD_CASES.md`,
`principio_rastreabilidade_documental`.

**Reprodutibilidade ≠ Completude (fundadora, 13/07/2026):** reprodutibilidade protege que a
representação **não muda**; **não** garante que ela esteja **completa**. Um exame pode ser
**reprodutivelmente incompleto**. A completude é o **critério complementar** (CEF §4.1 — mínimo
estrutural esperado do tipo). Estado explícito: `reproducible=true` + `complete=false`.

**Os 5 pilares de garantia (complementares — nenhum substitui o outro):**
1. **Rastreabilidade Documental** — o documento nunca é alterado. *(implementado)*
2. **Identidade Documental** — nome/tipo não mudam automaticamente (write-once → estados). *(Passo 1 feito)*
3. **Reprodutibilidade** — a representação não muda entre reextrações de mesma versão. *(implementado)*
4. **Completude estrutural** — a plataforma sabe quando a representação ainda está incompleta (mínimo
   estrutural do tipo, CEF §4.1). *(ciclo do CEF — falta)*
5. **Confiança estrutural** — o quanto se pode confiar naquela estrutura (`structural_confidence`
   HIGH/MEDIUM/LOW, migração 104). *(implementado)*

A SINTERA deixa de "usar IA para ler exames" e passa a **medir, governar, auditar e evoluir a qualidade
da informação clínica** — diferencial difícil de copiar. O pilar 4 é trabalho do **ciclo do CEF**
(pós-RI-001), pois depende do Modelo Clínico por tipo.

## Regras gerais

- **Código estável:** uma vez atribuído, não muda; a versão vive no cabeçalho do doc.
- **Cadências:** Nível 1 muda raramente (por evidência/revisão formal); Níveis 3–4 evoluem contínuo.
- **Fonte de verdade:** o `.md` no repo. PDFs na Área de Trabalho são derivados.
- Docs "⏳ a consolidar" existem hoje **dispersos**; extrair quando o conteúdo justificar
  documento próprio (não criar casca vazia).
