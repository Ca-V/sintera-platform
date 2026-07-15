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

**PARAR DE ADICIONAR PRINCÍPIOS (fundadora, 13/07/2026 — encerramento da fase de arquitetura):** o nível
de abstração é **suficiente**. Daqui para frente o risco deixa de ser *falta* de arquitetura e passa a
ser *excesso*. **Próximo ciclo = MATERIALIZAÇÃO**, nesta ordem: (1) **RI-001** homologado/certificado
(gate — depende da fundadora no preview); (2) **Identity Validator** existir (independe do CEF); (3) **1º
extrator especializado do CEF** (identidade clínica + representação); (4) **validar GS-003/GS-004** no
CRC; (5) **medir os indicadores** definidos; (6) **aprender com a execução**. Seis meses de implementação
revelarão refinamentos mais valiosos que seis semanas de especificação — é o próprio **Princípio da
Evidência Arquitetural** aplicado à governança. O arcabouço (5 pilares · 3 camadas de identidade · 4
perguntas do CEF · validação entre camadas · Pipeline de Certificação da Informação Clínica) está
**fechado**; só evolui por **evidência da execução**.

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
O **Identity Validator** é **engenharia da INFORMAÇÃO, não clínica** (fundadora, 13/07): `existe título? ·
texto íntegro? · houve corrupção? · fabricante reconhecido? · caracteres estranhos? · confiança OCR? ·
conflito? · título curto/longo demais? · mistura de duas linhas?`. **Vale para qualquer formato** —
OCR·PDF·DICOM·HL7·FHIR·XML·JSON — é uma **camada universal de qualidade da informação** (conversa com a
UCDA), não só documental. "Fabricante reconhecido (OCULUS)" = **lista de sanidade da informação**, NÃO o
registro clínico (saber que OCULUS é um fabricante real ≠ saber que é tomografia de córnea). Consequência
de sequência: o Identity Validator **não espera o CEF/HUB-001** — pode ser construído **logo após o
RI-001**. Fluxo com o estágio explícito:
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

---

## Princípio da Validação entre Camadas (CONSTITUCIONAL — fundadora, 13/07/2026)

> **Toda informação produzida pela plataforma deve ser validada por uma camada INDEPENDENTE antes de
> poder ser utilizada pela camada seguinte.** *(Forma abrangente; "nenhuma camada valida a si própria"
> é o corolário.)* Deixa de ser só "quem valida" e vira um **princípio de fluxo de informação**:
> `Produção → Validação → Certificação → Uso`. Elimina a **autocertificação** — o calcanhar de Aquiles
> dos sistemas de IA. É a **abstração-mãe** de todas as guardas da plataforma. Aproxima a SINTERA da
> engenharia **aeronáutica/financeira/espacial**, não das aplicações de IA comuns (`Entrada → IA →
> Resposta`).

**Contratos entre camadas (ferramenta de engenharia — fundadora):** cada camada responde 3 perguntas —
**o que recebe · o que garante · o que NUNCA garante**. O "nunca garante" é guardião do RDC 657.
- **Identity Validator** — recebe OCR/texto/metadados · garante identidade documental consistente ·
  **nunca** garante classificação clínica.
- **CEF** — recebe documento certificado · garante representação estruturada · **nunca** garante
  interpretação clínica.
- **Camada Cognitiva** — recebe representação certificada · garante contexto científico · **nunca**
  garante diagnóstico, conduta ou decisão clínica.

**Nome que descreve o que já existe (não domínio novo):** **Pipeline de Certificação da Informação
Clínica** — a informação clínica passa por sucessivas etapas de **produção → validação → certificação**
antes de ser disponibilizada. Sintetiza Capture Hub · Identity Validator · CEF · Representation Validator
· CRC · Governança.

Exemplos: `OCR → Identity Validator` (o OCR não se declara correto) · `Extrator → Representation
Validator` (o extrator não certifica a própria saída) · `Camada Cognitiva → Governance Validator` (a IA
nunca valida a própria conclusão). Também já aplicado: o `representation_fingerprint` é conferido por um
passo separado; a verificação adversarial não confia no próprio finder.

**Os validadores são "engenharia da INFORMAÇÃO" (format-agnostic):** OCR·PDF·DICOM·HL7·FHIR·XML·JSON
passam pela mesma família de validação de qualidade — camada universal, conversa com a UCDA.

**O regresso TERMINA na Governança (âncora — refinamento Claude):** "cada camada validada pela seguinte"
não é infinito. A **última camada é a Governança, validada por HUMANO/corpus — nunca por outra IA**
(Responsável Clínico · CRC/Gold Standard · confirmação do usuário). É o fim proposital da corrente — o
que mantém o RDC 657 e o aprendizado governado. Sem esse âncora humano, "validação entre camadas" viraria
IA validando IA.

**Pipeline completo (visão) — 9 ETAPAS (fundadora, 13/07/2026: descoberta ANTES da extração):**
```
1. Ingestão → 2. Análise Estrutural → 3. Segmentação (→ N CDUs) → [por CDU:] 4. Identidade Documental
  → 5. Identidade Clínica → 6. Representação Estruturada (CEF) → 7. Validação da Representação
  → 8. Cobertura → 9. UCDA   (→ Contextualização científica → Camada cognitiva → Governança humano/corpus)
```
Cada seta é também uma **validação**: a camada seguinte valida a informação da anterior antes do uso.

**Cada etapa produz um ARTEFATO próprio (fundadora, 13/07 — explicita o que já era implícito):** os
componentes deixam de "fazer uma transformação" e passam a **emitir um artefato auditável, reprocessável
e versionável.**

| Etapa | Artefato produzido |
|---|---|
| Ingestão | **Bundle** (contêiner) |
| Análise Estrutural | **Representação estrutural transitória** |
| Segmentação | **CDUs** |
| Identidade Documental | **Documento identificado** |
| Identidade Clínica | **Documento clinicamente classificado** |
| Representação (CEF) | **Evidência estruturada** |
| Validação da Representação | **Evidência certificada** |
| Cobertura | **Relatório de cobertura** |
| UCDA | **Evidência interoperável** |

**Payoff (refinamento Claude):** cada artefato carrega **{produtor · versão · fingerprint · proveniência}**
→ reprocessamento **granular**: quando muda a versão de UMA etapa (ex.: novo extrator do CEF),
re-executa-se **só daquela etapa em diante**, reaproveitando os artefatos anteriores. É a Reprodutibilidade
+ reprocessamento-por-versão aplicados a **cada** etapa. Conecta com Rastreabilidade, Validação entre
Camadas, CRC e Governança — **não é arquitetura nova; é tornar explícito o que já estava implícito.**

### Princípio da Descoberta antes da Extração (CONSTITUCIONAL — fundadora, 13/07/2026)

> **A plataforma nunca deve extrair antes de compreender a ESTRUTURA do documento.** Operacional:
> **primeiro descobrir o que existe; depois decidir como representar.**

Unifica **todos** os defeitos dos testes numa causa só — antes de extrair, a plataforma **não determina
quais entidades clínicas existem** no documento: Pentacam (não sabe que há 2 olhos) · bundle com
mamografia + 2 US (não sabe que há 3 exames) · painel lab (não sabe que há 6 exames) · EEG (não separa
achados de parâmetros). **Enquanto a Descoberta estiver incompleta, todos os problemas seguintes
reaparecem, em qualquer modalidade.**

**A "Descoberta" separa-se em DUAS etapas explícitas (refinamento fundadora, 13/07):**
- **Análise Estrutural** (read-only, **engenharia da informação — não interpreta medicina**): a organização
  física e lógica do material — páginas · anexos · texto · imagens · tabelas · laudos · assinaturas ·
  blocos independentes · cabeçalhos repetidos · datas diferentes · emissores diferentes. **Format-agnostic**
  (PDF/DICOM/HL7/FHIR/XML). *Observação (sem nome/domínio novo — respeita o freeze): a **Análise Estrutural
  produz uma representação estrutural TRANSITÓRIA** (rede de blocos/relações) **sobre a qual a Segmentação
  opera** — ela não trabalha diretamente sobre páginas. Materializar só quando a implementação pedir.*
- **Segmentação**: usa essa estrutura para responder **quantas unidades clínicas independentes existem** e
  cria **uma unidade de processamento (CDU) para cada uma**.

**CDU — Clinical Document Unit (objeto da camada de PROCESSAMENTO, não da Captura — fundadora, 13/07):** o
**Bundle é o CONTÊINER** (produto da Captura); após a Segmentação surgem **CDUs**, e **cada CDU percorre
todo o pipeline** sozinha. A CDU **independe da origem** (Bundle · FHIR · DICOM · HL7 · API · integração
hospitalar) — por isso **não pertence ao Capture Hub**; é objeto do **processamento**, vizinho da **UCDA**
(**é o que a UCDA representa como "evidência clínica"**).
**Fronteira da CDU (refinamento Claude — resolve "painel = 1 ou N CDUs"):** uma CDU = **uma identidade
documental única + uma modalidade**; os sub-elementos (resultados de um painel, os 2 olhos do Pentacam,
grupos do EEG) vivem **DENTRO** da CDU. Dois níveis de enumeração: **Segmentação = inter-CDU** ("quantos
documentos?"; 3 laudos = 3 CDUs) · **Cobertura = intra-CDU** ("quantos resultados/olhos/grupos desta CDU
foram estruturados?"; painel de 1 lab/data = **1 CDU** com N resultados dentro). Evita estilhaçar um painel.

**Efeito no CEF:** ele **nunca mais recebe um PDF/Bundle heterogêneo** — recebe uma **entidade clínica já
delimitada** (uma CDU com identidade + modalidade), o que aumenta a confiabilidade de qualquer extrator.

**Roadmap de execução reorganizado:** `Ingestão → Análise Estrutural → Segmentação → Identidade Documental
→ Identidade Clínica → CEF → Validação da Representação → Cobertura → UCDA`. **Timeout / retries /
performance = robustez operacional (backlog), NÃO prioridade.** Próxima entrega de execução = a etapa de
**Análise Estrutural + Segmentação** (compreensão documental).

### Princípio da Cobertura Documental (CONSTITUCIONAL — fundadora, 13/07/2026)

> **Nenhuma representação pode ser certificada antes da validação da COBERTURA documental.** Antes de um
> documento ser considerado "estruturado", a plataforma responde: **"Toda a informação clínica presente
> neste documento foi identificada?"** Enquanto a resposta não for afirmativa, o documento **não é
> certificado como completo.**

Evidência (RI-001): laudo laboratorial com **6 exames** (Glicemia · Cortisol · IGF-1 · GH · Insulina ·
Peptídeo C) → a plataforma extraiu **4** e marcou `structured`/`high` (falsa completude). O pipeline
estava certificando **antes de saber quantos exames existiam**.

**Duas responsabilidades DIFERENTES (separá-las torna a arquitetura robusta):**
- **Cobertura documental** — *"encontrei TUDO o que existe?"* (descoberta). É anterior à extração e ao CEF.
- **Extração estruturada** — *"estruturei corretamente o que encontrei?"* (estruturação).

**Mecanismo (refinamento Claude — nenhuma camada valida a si própria):** o extrator NÃO valida a própria
cobertura (não sabe o que perdeu). Um **contador estrutural INDEPENDENTE** conta as **unidades de
evidência** do documento sem extraí-las (lab: blocos `MATERIAL -`, ocorrências de `RESULTADO:`,
cabeçalhos; imagem: laudos/olhos/regiões/achados por tipo) e **compara** com o extraído. `esperadas 6 ×
encontradas 4 → 67% → INCOMPLETA`. **O denominador é a contagem do PRÓPRIO documento** (descoberta), não
um "conjunto esperado" arbitrário — resolve honestamente o problema do denominador. Fail-safe: cobertura
incerta → **INCOMPLETA** (nunca falsamente completa). Vale para **toda modalidade**.

**REFINAMENTO (fundadora, 13/07 — Descoberta × Cobertura):** o contador independente **pertence à
DESCOBERTA** (enumera o que existe, 1ª etapa). A **Cobertura deixa de descobrir** e passa a só
**COMPARAR**: *"tudo que a Descoberta achou foi efetivamente estruturado?"* (descoberto × estruturado).
Vem **depois** da extração/CEF. Um documento só recebe selo de representação **completa** quando a
cobertura fechar; senão, honesto-parcial ou `document_only`, sempre remetendo ao original (§4.0.1).
"A Cobertura só diz *faltam 2 exames* se antes a Descoberta soube que existiam 6."
A **Segmentação documental** (Capture Hub, `CAP-002` §6) é o **1º estágio** — nunca assumir `1 PDF = 1
exame` nem `N páginas = 1 exame`; um bundle representa **1+ documentos** e a segmentação decide quantos
registros existem. É **pré-requisito de todo o pipeline** (evidência: laudo com 3 exames de imagem
mesclado num só). Governada e independente do CEF (engenharia da informação, não clínica).

## Princípio da Não-Produção de Conteúdo Clínico (CONSTITUCIONAL — fundadora, 14/07/2026)

> **A SINTERA nunca produz conteúdo clínico. Ela apenas preserva, organiza, estrutura, relaciona e apresenta
> conteúdo produzido pelo paciente ou por profissionais de saúde, mantendo sempre a origem e a autoria de
> cada informação.**

A plataforma **transcreve, organiza e evidencia relações temporais/estruturais** — nunca interpreta, conclui,
resume nem emite juízo clínico (RDC 657). Toda informação apresentada tem **origem e autoria explícitas**:
ou é dado do paciente, ou transcrição de documento, ou derivação por organização (cronologia/agrupamento/
classificação) — nunca conclusão gerada por IA.

**Consequências operacionais (valem em toda a plataforma, explícitas no domínio CARE-001):**
1. **Documento original sempre acessível** — todo documento representado permanece acessível na forma original;
   a representação organiza, **nunca substitui** a fonte documental.
2. **Evolução = visualização, não conclusão** — mostrar a série no tempo (ex.: glicemia 210→170→130), nunca
   "melhora/piora/controle inadequado". Quem interpreta é o profissional.
3. **Camadas objetivas** — telas-síntese (ex.: "Visão Geral") só contêm dado cadastrado · transcrito ·
   derivado por organização. Nunca conclusões/hipóteses/resumos de IA.
4. **Autoria separada** — conteúdo da SINTERA (organizado) e conteúdo do profissional (observações/hipóteses/
   plano) **nunca se misturam**; sempre fica claro quem produziu cada informação.

Conecta e reforça: **Rastreabilidade Documental · Reprodutibilidade · Validação entre Camadas · Evidência
Arquitetural · Governed Knowledge Evolution · UCDA · CARE-001**. Detalhe do domínio de compartilhamento em
`docs/CARE-001_ESPACO_COLABORATIVO.md` §5.2.

## Princípio da Convergência Progressiva (CONSTITUCIONAL — fundadora, 14/07/2026)

> **A convergência da plataforma ocorre no Clinical Processing Engine e na UCDA, NUNCA por migração prematura
> dos domínios maduros. Os domínios existentes permanecem estáveis até que exista evidência suficiente para
> sua substituição.**

A plataforma tem **um único modelo canônico de representação clínica** — mas isso é um **destino**, não uma
migração imediata. Regras:
1. **UCDA é o ponto de convergência** (contrato único de saída), não a persistência. Toda fonte
   (Laboratório · Imagem · Patologia · EEG · DICOM · FHIR · Wearables) chega à UCDA **via CPE**; todo consumidor
   (Timeline · Evolução · Care Space · Compartilhamento · Pesquisa · Analytics) lê UCDA.
2. **`clinical_results` e `biomarkers` são BACKENDS de persistência** de certas modalidades — não o centro.
3. **Modalidade NOVA nasce no modelo canônico** (via CPE); **nenhuma nova usa estrutura legada**.
4. **Domínio MADURO não migra** por decisão arquitetural: o CPE o **consome** via **Adapter transitório**
   (ex.: Laboratory Adapter — `biomarkers` → UCDA, sem tocar nos 446 registros nem no caminho `current_biomarkers`
   → evolução). O adapter existe até haver evidência para convergir a persistência; a UCDA não muda.

Preserva a estabilidade do laboratório, acelera a consolidação da plataforma e evita migração de alto risco
antes de a infra universal estar validada. Conecta: Evidência Arquitetural · Reprodutibilidade · UCDA-001 ·
Clinical Processing Engine. Sequência de execução: consolidar CPE (fachada única) → Laboratory Adapter →
validar com o laboratório real → consolidar UCDA (contrato único) → só então modalidades (todas via CPE).

## Princípio do Modelo Aberto (CONSTITUCIONAL — fundadora, 14/07/2026)

> **Nenhum modelo de dados da SINTERA poderá depender de listas fechadas de biomarcadores, modalidades,
> fabricantes ou equipamentos. A arquitetura deverá representar CLASSES de informação clínica, permitindo a
> incorporação de novos elementos sem necessidade de alteração estrutural.**

O domínio da SINTERA **não** é "laboratório" nem "446 biomarcadores" — é **informação clínica**. Os 446
biomarcadores desta base são **dado de VALIDAÇÃO** (validar Engine · Cobertura · UCDA · persistência ·
evolução · desempenho), **nunca referência do modelo**. A plataforma deve receber, sem alteração estrutural:
qualquer biomarcador (atual ou futuro) · qualquer modalidade · qualquer documento · qualquer equipamento ·
qualquer fabricante · qualquer laboratório · qualquer padrão (FHIR/HL7/DICOM…).

**Consequências de implementação:**
- Adapters e processadores operam sobre um **modelo genérico**, não sobre listas de itens. Ex.: o **Laboratory
  Adapter** representa cada resultado por CLASSE de campos — *identificador/código do analito (LOINC ou outro,
  quando existir) · nome apresentado no documento · valor · unidade · faixa de referência · método · material
  biológico · contexto · proveniência* — e funciona para um analito novo ou um nome diferente do mesmo analito
  **sem mudar estrutura**.
- Enumerações existentes (Clinical Identity Registry, Clinical Models) são **registros EXTENSÍVEIS por
  adição** (novo elemento = novo dado, jamais alteração estrutural); item desconhecido **degrada com
  elegância** (`document_only`), nunca quebra.
- Códigos (LOINC/SNOMED/BI-RADS/…) são **abertos** (`code` + `code_system`), nunca uma lista fixa.

Conecta: Convergência Progressiva · UCDA-001 · Descoberta antes da Extração · Não-Produção de Conteúdo Clínico.

## Princípio da Delegação de Modalidade ao CPE (CONSTITUCIONAL — fundadora, 14/07/2026)

> **Nenhum componente arquitetural deverá conhecer modalidades clínicas quando essa responsabilidade puder
> ser delegada ao Clinical Processing Engine.**

O conhecimento específico de modalidade fica restrito ao **Clinical Identity Registry** e aos **processadores
especializados** do CPE. O restante da plataforma (`analyze`, persistência, consumidores) opera **apenas
sobre abstrações**: Bundle · CDU · Identidade · Resultado Clínico · Evidência · UCDA. O `analyze` **não
decide** se extrai biomarcadores, se gera parâmetros ou narrativa — entrega a CDU ao Engine e persiste a
representação; **quem decide o tipo de representação é o processador correspondente** (via `planRepresentation`
+ `processClinical`).

**Estado (14/07):** ✅ o `analyze` NÃO contém mais nenhuma decisão baseada em modalidade — `isNarrativeLaudo`
e os checks `=== 'imaging'`/`=== 'laboratory'` foram movidos para `planRepresentation` no Engine (equivalência
provada em `FUNC-representation-plan`). O caminho laboratorial permanece intacto (Convergência Progressiva).

### Critério de aposentadoria do legado laboratorial (registrar — fundadora 14/07)
O caminho atual (`extractBiomarkers → biomarkers → current_biomarkers → evolução`) **só poderá ser aposentado**
quando, **sobre os exames laboratoriais REAIS**, forem demonstradas equivalências de: **funcional · cobertura
· persistência · evolução longitudinal · reprodutibilidade · performance**. Até lá, **o caminho legado
permanece ativo** e o CPE o **consome** via Laboratory Adapter (sem alterar comportamento).

## Certificação da Plataforma — GATE de conclusão (CONSTITUCIONAL — fundadora, 14/07/2026)

> **Toda nova capacidade só é considerada CONCLUÍDA após passar pela Certificação da Plataforma.**

A fase deixa de ser "equivalência com o legado" e passa a ser **certificação contra os princípios
constitucionais**. Seis dimensões (detalhe em `docs/CERTIFICACAO_PLATAFORMA.md`):
**1. Universalidade** (representa qualquer exame da classe, inclusive futuros) · **2. Fidelidade** (sem perda/
invenção/reorganização incorreta) · **3. Reprodutibilidade** (mesmo doc → mesma representação) ·
**4. Auditabilidade** (por elemento: documento·página·trecho·versão do Engine·versão do processador·quando) ·
**5. Cobertura** (nunca falsa completude) · **6. Evolução** (alimenta Timeline/Evolução/Care/UCDA/
compartilhamento/pesquisa).

Toda modalidade futura (Mamografia, EEG, Ecocardiograma, Anatomopatológico…) **nasce com este padrão** — só
entra como concluída quando as 6 dimensões passam, com teste/evidência registrados. Os 446 exames reais são
o **corpus** de certificação, nunca a referência do modelo.

## GATE de CONCLUSÃO em 4 dimensões (CONSTITUCIONAL — fundadora, 14/07/2026)

> **Uma capacidade só é CONCLUÍDA quando atende SIMULTANEAMENTE às quatro dimensões abaixo.**
> Não declarar um módulo concluído apenas porque a infraestrutura técnica existe.

A Certificação da Plataforma (6 dimensões acima) cobre a **dimensão 1**. A conclusão exige as quatro:

1. **Infraestrutura** — arquitetura implementada · testes · auditorias · Certificação da Plataforma (6 dim.).
2. **Funcionalidade** — TODOS os requisitos funcionais previstos para a capacidade implementados (não só os
   técnicos), conferidos contra o **backlog funcional registrado** do módulo.
3. **Experiência de uso** — fluxo consistente · nomenclatura · organização · usabilidade · **ausência de
   comportamentos contraditórios**.
4. **Integrações transversais** — notificações · financeiro · recorrência · compartilhamento (quando
   aplicável) · histórico · evolução · demais capacidades reutilizáveis.

**Motivo (fundadora):** risco de considerar um módulo pronto porque os componentes técnicos existem, enquanto
ajustes de experiência, negócio e operação já levantados seguem abertos. **Aplicação:** toda entrega declara o
estado nas 4 dimensões; com itens abertos em 2/3/4, o módulo é "infra pronta", **não** "concluído". Ex.:
Exames E1–E8 = Infra+Funcionalidade em grande parte, mas Integrações transversais (Notificações, Care Space)
e parte de UX seguem abertas → **Exames não está concluído** (ver `docs/EXAMES_CONCLUSAO.md`).

## Ciclo de Vida Obrigatório da Capacidade (CONSTITUCIONAL — fundadora, 15/07/2026)

> **Nenhuma capacidade é concluída só porque tem código implementado.** Toda capacidade percorre,
> obrigatoriamente, o ciclo completo — definido em `docs/LIFECYCLE_DOMINIOS.md` (processo ÚNICO da plataforma):
> **1. Implementação → 2. Auditoria estática (código) → 3. Auditoria funcional (execução) → 4. Homologação
> (docs reais) → 5. Certificação → 6. Encerramento.**

**Distinção crítica (3 × 4):** a **auditoria funcional CAÇA defeitos** (achar problemas; NC volta à
implementação); a **homologação é ACEITE** (confirma o comportamento esperado + trata documentos reais) e só
começa quando a funcional não acha mais NC relevante. **Homologação** responde "a plataforma fez o que
deveria, o usuário completa a jornada, o comportamento está correto, os documentos reais foram tratados?".
**Certificação** responde "Modelo Aberto preservado, sem invenção de conteúdo, rastreabilidade/auditabilidade
íntegras, representação universal, princípios constitucionais válidos?". Detalhe completo: `LIFECYCLE_DOMINIOS.md`.

Padrão UNIFORME para TODOS os domínios (Exames, Eventos, Financeiro, Billing, Medidas, Notificações,
HIP-001, CARE-001, modalidades…). Cada domínio é acompanhado por **dois controles independentes e
obrigatórios** (modelo consolidado no domínio Exames — `docs/EXAMES_CHECKLIST_FUNCIONAL.md`):
- **Controle 1 — Backlog Funcional oficial** (fonte ÚNICA da verdade do domínio): cada item com ID ·
  descrição · estado (Não iniciado/Em desenvolvimento/Implementado/Homologado, **sem %**) · dependências ·
  responsável · **evidências verificáveis** (commit/teste/migration/homologação/CRC/certificação) ·
  observações. Validação em **3 eixos**: Código × Testes × Homologação. Nada existe só em memória/conversa.
- **Controle 2 — Matriz de Homologação** (validação com documentos reais).
- **NC → item F:** toda não-conformidade que exige desenvolvimento origina/vincula um item do backlog
  (NC → F → Implementação → Testes → Homologação → encerramento), com Origem da descoberta registrada.
- **Encerrar um item** exige simultaneamente: Código · Testes (quando aplicável) · Homologação (quando
  aplicável) · NCs relacionadas encerradas.
- **Conclusão do domínio:** backlog todo `Homologado` + Matriz aprovada + Certificação da Plataforma.

## Princípio da Capacidade Certificada (CONSTITUCIONAL — fundadora, 14/07/2026)

> **A unidade de evolução da plataforma é a CAPACIDADE CERTIFICADA, não o código.**

Uma capacidade só é **ENTREGUE** quando: (1) **implementada**; (2) **testada**; (3) **auditada**; (4) passou
pelas **6 dimensões da Certificação da Plataforma**; e (5) é **reutilizável por qualquer modalidade futura sem
alterações arquiteturais**. Esse é o critério de conclusão de **toda** entrega daqui em diante.

**Sequência de execução (antes de novas modalidades):**
1. **Consolidação e certificação completa da INFRAESTRUTURA** (não do laboratório — o laboratório é a 1ª
   evidência de que a infra representa qualquer modalidade). Quatro entregas:
   (a) certificar a **infra** (capacidade de representar qualquer modalidade, não um domínio);
   (b) certificar o **pipeline universal** com documentos reais **heterogêneos** (laboratório · imagem · laudo
   narrativo · multipágina · múltiplos exames · sem resultados estruturáveis);
   (c) auditar a **persistência canônica** (representa parâmetros · biomarcadores · achados · classificações ·
   medidas · estruturas anatômicas · lateralidade · grupos · texto estruturado · qualquer tipo futuro — sem
   adaptação por modalidade);
   (d) certificar o **DESACOPLAMENTO** (Ingestão · Análise Estrutural · Segmentação · Identity Validator ·
   Persistência · UCDA **não conhecem modalidades**; só o CPE e os processadores têm conhecimento clínico).
2. **Certificação da arquitetura universal** (aprovação da auditoria de desacoplamento = arquitetura atingida).
3. **Modalidades clínicas**, uma por vez, dirigidas por CRC — cada uma certificada ao nascer.
4. **CARE-001**, sobre a infra já consolidada.

Assim evitamos construir capacidades sobre infra ainda em estabilização.

## 🔻 PONTO DE INFLEXÃO — de construir arquitetura a ENTREGAR a plataforma (fundadora, 14/07/2026)

**A fase de consolidação da infraestrutura está ENCERRADA.** A infra passa a ser a **base oficial da SINTERA**
e só sofre alteração quando **evidência concreta durante a implementação** demonstrar necessidade real —
**não** se expande nem refina a arquitetura sem necessidade prática identificada.

**Novo indicador de progresso:** módulos **completos, consistentes e utilizáveis** sobre a infra certificada —
não a expansão da arquitetura. O foco passa a ser transformar a arquitetura certificada em **capacidades
concretas para o usuário.**

**Ordem de execução (nova — substitui a anterior "modalidades antes de tudo"):**
1. **Consolidação dos módulos existentes** — Exames · Medicações · Suplementos · Condições · Cirurgias ·
   Procedimentos · Eventos Assistenciais · Medidas Corporais · Sinais Vitais · Relatórios. Padronizar
   comportamento entre todos usando a infra certificada.
2. **Backlog funcional** (`docs/BACKLOG_EVOLUCOES.md`, organizado por fases A–E) — já documentado, **não volta
   para validação arquitetural**.
3. **CARE-001** — mantendo os princípios; **inegociável:** compartilha documentos originais · exames ·
   evolução objetiva · dados estruturados · comentários dos profissionais. **NÃO gera resumo/interpretação/
   conclusão clínica** (interpretação é exclusiva do profissional — [[principio_nao_producao_conteudo_clinico]]).
4. **Modalidades clínicas** — só após as fases anteriores; cada uma usa a infra certificada, nasce dirigida
   por CRC e passa pela Certificação da Plataforma antes de concluída.

**Novo foco da AUDITORIA:** deixa de procurar refinamentos arquiteturais e passa a identificar **inconsistências
entre módulos · diferenças de comportamento · duplicidade de funcionalidades · problemas de UX · fluxos
redundantes · oportunidades de reúso de componentes.** A arquitetura está madura; agora consolida-se a
**experiência** da plataforma.

**Autonomia:** máxima. Interromper só por **decisão de PRODUTO · decisão REGULATÓRIA · evidência concreta que
ponha em dúvida um princípio arquitetural já estabelecido.** O resto segue direto para implementação → testes
→ auditoria → certificação.

## Pilar transversal — Assinaturas & Billing (BILLING-001) + disciplina de execução (fundadora, 14/07/2026)

**Novo PILAR arquitetural: Billing & Assinaturas (SaaS).** Toda a lógica comercial fica **centralizada num
serviço próprio** (como o CPE para o clínico), **completamente desacoplada dos módulos** — os módulos apenas
**consultam entitlements/permissões**, nunca conhecem regra comercial (planos/preços/gateway). Gateway-agnóstico
(adapters por meio de pagamento). Capacidade **transversal** (ao lado de CPE · UCDA · CARE · Eventos),
**requisito de produção** (pronta antes do lançamento comercial). Detalhe: `docs/BILLING-001_ASSINATURAS.md`.
**Registrar agora, implementar na fase adequada** — não interrompe a prioridade atual (concluir o módulo Exames).

**Disciplina de execução (reforço):**
- **Uma CAPACIDADE COMPLETA por vez** — ponta a ponta, validada e **encerrada antes de iniciar a próxima**;
  **não abrir frentes paralelas**.
- **Reutilizar antes de criar** — localizar capacidades existentes → estender → só criar estrutura nova quando
  realmente necessário (ex.: `health_events` já sustenta financeiro/recorrência/lembretes).
- **Consolidar antes de expandir** — módulos existentes completos → arquitetura consolidada → capacidades
  transversais reutilizáveis (Eventos · Notificações · **Billing**) → só então modalidades clínicas.
- **Backlog consolidado como única referência** — sem iniciativas paralelas. Cada entrega declara: **item do
  backlog · dependências · critério objetivo de encerramento**.
- **Prioridade atual:** concluir integralmente o **módulo Exames** (`docs/EXAMES_CONCLUSAO.md`, E1–E8).

## Pilar transversal — Plataforma de Integrações em Saúde (HIP-001) (fundadora, 14/07/2026)

**Novo PILAR arquitetural: aquisição de dados externos por CONECTORES independentes.** Não é uma arquitetura
para wearables específicos — é uma **infraestrutura universal**: qualquer fonte externa entra por um conector,
que **traduz o formato/protocolo para a representação canônica (UCDA)**; o núcleo **nunca depende de fabricante
ou formato original**. Novos fabricantes entram **sem mudança estrutural** (Modelo Aberto). Sincronização
**rastreável·auditável·versionada** (Reprodutibilidade/Auditabilidade). O **usuário autoriza/revoga** cada
integração (LGPD Art. 11). Alvos: wearables · plataformas esportivas · dispositivos de monitorização (CGM,
pressão, oxímetro, balança/bioimpedância, sono…) · e preparada para FHIR/HL7/DICOM/RNDS/hospitais/laboratórios/
operadoras/telemedicina. Detalhe: `docs/HIP-001_PLATAFORMA_INTEGRACOES.md`. **Sinais Vitais automáticos = 1º
consumidor.** **Registrar agora, considerar na arquitetura desde já** (evitar acoplamento); implementar na fase 3/4.

## Conjunto de capacidades TRANSVERSAIS + sequência de execução (fundadora, 14/07/2026)

Pilares transversais da plataforma (não-modalidades): **Clinical Processing Engine · UCDA · CARE-001 ·
Billing/Assinaturas · Sistema de Notificações (NOTIF-001) · Eventos Assistenciais · Plataforma de Integrações
em Saúde (HIP-001)**.

Sequência de implementação (não inverter): **(1) consolidação da plataforma (transversais: Exames · Relatórios
· Agenda · Histórico · Notificações · Billing · Financeiro · Eventos · HIP-001 · CARE-001) → (2) experiência do
usuário (fluxo único de upload · cards · nomenclatura · design system · identidade visual · responsividade ·
consistência) → (3) infraestrutura clínica (CPE · UCDA · Validator · Coverage · Identity Registry · persistência
· Certificação — já muito avançada) → (4) só então modalidades clínicas.** Não abrir novas modalidades enquanto
a Fase 1 não terminar. HIP-001 e Billing são considerados na arquitetura desde já; implementados na fase adequada.

## Princípio da Estabilidade Arquitetural (CONSTITUCIONAL — fundadora, 14/07/2026)

> **Nenhuma nova abstração enquanto uma existente puder ser reutilizada ou estendida.** Antes de criar QUALQUER
> tabela · documento · serviço · componente · pipeline · engine · modelo, verificar primeiro se algo existente
> serve. Reduz duplicação/divergência no crescimento.

Os grandes pilares já estão definidos; o ganho agora vem de transformá-los em funcionalidades completas,
consistentes e utilizáveis — **não** de novas ideias arquiteturais. Postura de execução: **mais código, menos
documentação** — não criar `.md` novo sem necessidade real; foco em **implementar · validar · auditar · corrigir**.
Expansão arquitetural fica em 2º plano, salvo quando uma necessidade CONCRETA da implementação revelar lacuna real.

## Regras gerais

- **Código estável:** uma vez atribuído, não muda; a versão vive no cabeçalho do doc.
- **Cadências:** Nível 1 muda raramente (por evidência/revisão formal); Níveis 3–4 evoluem contínuo.
- **Fonte de verdade:** o `.md` no repo. PDFs na Área de Trabalho são derivados.
- Docs "⏳ a consolidar" existem hoje **dispersos**; extrair quando o conteúdo justificar
  documento próprio (não criar casca vazia).
