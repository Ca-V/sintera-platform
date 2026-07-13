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

## Regras gerais

- **Código estável:** uma vez atribuído, não muda; a versão vive no cabeçalho do doc.
- **Cadências:** Nível 1 muda raramente (por evidência/revisão formal); Níveis 3–4 evoluem contínuo.
- **Fonte de verdade:** o `.md` no repo. PDFs na Área de Trabalho são derivados.
- Docs "⏳ a consolidar" existem hoje **dispersos**; extrair quando o conteúdo justificar
  documento próprio (não criar casca vazia).
