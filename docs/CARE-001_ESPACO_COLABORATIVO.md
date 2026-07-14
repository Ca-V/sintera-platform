# CARE-001 — Espaço Colaborativo de Cuidado (Care Space)

> Fundadora (14/07/2026): novo **PILAR** da SINTERA — não uma funcionalidade de compartilhamento. Hoje a
> plataforma **estrutura e representa** a informação clínica; com o CARE-001 ela passa a **orquestrar a
> continuidade do cuidado** entre paciente e profissionais. **Registrar agora, implementar depois** — após a
> consolidação do núcleo de processamento clínico. **Não interrompe a execução atual.**
>
> **Dependência técnica direta:** só tem valor sobre uma representação longitudinal já consistente,
> auditável e estruturada. Antes disso = compartilhar informação incompleta.
>
> **Natureza:** camada de **APRESENTAÇÃO e ORQUESTRAÇÃO** sobre a arquitetura existente. **NENHUM pipeline
> novo.** Reutiliza: Capture Hub · Bundle · CDU · Identidade Documental · Identidade Clínica · Clinical
> Processing Engine · Representation Validator · Cobertura · UCDA · Timeline · **Evento Assistencial**
> (recorrência/agendamento — [`EVENTO_ASSISTENCIAL.md`]).

---

## 0. Posição no fluxo — o Care Space nasce em torno de um EVENTO ASSISTENCIAL
Fluxo canônico (fundadora 14/07): **Paciente → Evento Assistencial → Care Space → Snapshot Clínico →
Compartilhamento → Colaboração → Continuidade do cuidado**. O CARE-001 é criado **em torno de um Evento
Assistencial** (consulta/retorno/junta…), não de um compartilhamento genérico — cada consulta tem seu
contexto clínico próprio. Isso evita reorganizações futuras e fecha o ciclo: a recomendação do profissional
volta ao Evento como recorrência/agendamento. Ver [`EVENTO_ASSISTENCIAL.md`] §0.1.

**Sequenciamento (roadmap 5 fases, `EXECUCAO_MILESTONES.md`):** o CARE-001 é a **Fase 4**, e vem **depois da
Fase 3 (Consolidação da Representação Longitudinal)** — porque *o CARE não compartilha exames, compartilha a
história clínica*, que precisa estar consolidada (Timeline definitiva, evolução, correlação) antes.

## 1. Terminologia — o profissional NUNCA "acessa o paciente"
A SINTERA **cria um Care Space para uma relação específica** entre paciente e profissional (um episódio de
cuidado). O médico **não entra na conta do paciente** — entra em um **espaço criado para aquele episódio**,
com **início, finalidade, duração, histórico e auditoria próprios**. É, na prática, um **prontuário
colaborativo temporário** (não um "compartilhamento de documentos").

## 2. Care Space — entidade própria
```
Care Space
├── Paciente
├── Profissional         (nome · CRM · especialidade · instituição · contato)
├── Finalidade           (Consulta · Retorno · Segunda opinião · Junta médica · Auditoria · Acompanhamento)
├── Especialidade
├── Status               (ativo · expirado · revogado)
├── Criado em
├── Expira em
├── Snapshot Clínico     (imutável — §4)
├── Permissões           (visualizar · baixar · imprimir · comentar · solicitar atualização)
├── Histórico            (auditoria append-only)
├── Comentários          (colaboração — separada da base do paciente)
└── Arquivos compartilhados
```

## 3. Princípios obrigatórios
1. **Paciente é dono do acesso** — todo Care Space é iniciado por ele; pode conceder, limitar, alterar
   permissões e **revogar imediatamente**.
2. **Por FINALIDADE** — sempre explícita.
3. **Contextual** — nunca só documentos; sempre um **contexto clínico organizado** (Dossiê, §5).
4. **Documento é a fonte da verdade** — toda informação estruturada mantém acesso imediato ao original.
5. **Auditoria completa** — quem acessou · quando · o que visualizou · downloads · comentários · revogações.
6. **Somente leitura** — o profissional **nunca** altera a base do paciente.
7. **Nunca alterar dados do paciente** — permissões incluem comentar/solicitar, jamais editar.

## 4. Snapshot Clínico — o ativo mais importante
Ao criar o Care Space, gerar um **Snapshot Clínico** = **congelamento** exato do que foi compartilhado naquela
consulta. Reaproveita o princípio de **Reprodutibilidade / write-once** (um snapshot é um congelamento datado).

> Consulta em 18/08/2027 → o médico viu exatamente exames A, B, C. Seis meses depois o paciente adicionou 80
> novos exames. O profissional **continua podendo reconstruir exatamente o contexto daquela consulta**.

Valor **clínico · jurídico · auditoria · continuidade do cuidado**. O Snapshot permanece **imutável** mesmo
que o paciente altere a plataforma depois.

## 5. Três camadas complementares — organizar, NUNCA interpretar nem substituir
O CARE Space **não substitui os documentos por uma representação estruturada, nem produz resumos ou
interpretações clínicas**. O profissional vê **três camadas complementares**; o **documento original permanece
a fonte PRIMÁRIA**. A representação e a evolução existem para **organizar e facilitar o acesso**, **não para
interpretar nem substituir** (RDC 657 · Rastreabilidade Documental):

1. **Representação estruturada** — organização **objetiva** das informações presentes nos documentos,
   preservando **origem e rastreabilidade**. Vem do CPE/UCDA. (Sem juízo clínico.)
2. **Evolução longitudinal** — visualização **cronológica** das informações estruturadas ao longo do tempo,
   para o profissional **analisar a evolução por conta própria** (a plataforma mostra os dados no tempo; quem
   conclui é o profissional).
3. **Documentos originais** — todo elemento estruturado mantém **acesso imediato ao original correspondente**
   (PDF · imagem · DICOM · laudo…), exatamente como foi emitido — a fonte primária.

**Navegação na consulta:** Visão Geral → evolução longitudinal → gráficos ao longo do tempo → abrir qualquer
exame **original com um clique** → imagens/laudos/documentos como emitidos. O CARE Space dá acesso
**organizado e contextualizado** à representação longitudinal E a todos os documentos originais que a sustentam.

### ⚖️ Princípio inegociável do domínio CARE-001 (explícito em todo o CARE)
- O **documento original** continua sendo a fonte da verdade.
- A plataforma **organiza** a informação e **evidencia relações temporais e estruturais**.
- O **profissional de saúde é quem interpreta** e exerce o **julgamento clínico**.
- A SINTERA **deliberadamente NÃO** gera texto interpretativo. **Proibido** no CARE Space: "Paciente apresenta
  melhora…", "Histórico compatível com…", "Principais achados…", ou qualquer resumo/conclusão clínica. Gráficos,
  tendências e comparações são **visualizações estruturais dos dados** (valores no tempo), nunca afirmações clínicas.

## 5.1 Dossiê Clínico — 4 áreas principais + Colaboração (apenas informação objetiva/estruturada)
O profissional **nunca** recebe uma lista de PDFs. A plataforma monta um **Dossiê Clínico** estruturado
(reusa Timeline + representação do CPE/UCDA + Evento Assistencial), sempre com o **original a um clique** e
**sem qualquer texto gerado pela plataforma** que interprete a clínica:

- **Visão Geral** — *apenas objetivo/estruturado*: identificação do paciente · condições cadastradas ·
  medicamentos em uso · procedimentos registrados · exames disponíveis · eventos assistenciais · linha do tempo.
  **NÃO** contém "resumo clínico" nem texto interpretativo gerado pela plataforma.
- **Evolução** — Timeline · gráficos ao longo do tempo · comparações de valores · **eventos assistenciais**
  (visualização estrutural; o profissional analisa por conta própria).
- **Evidências Clínicas** — exames laboratoriais · exames de imagem · procedimentos · cirurgias.
- **Documentos** — todos os documentos **originais** acessíveis.
- **Colaboração** *(§8)* — comentários do profissional · recomendações · solicitações · **plano de
  acompanhamento** (conteúdo do PROFISSIONAL, não da plataforma).

## 5.2 Fronteiras permanentes do domínio (regras — não ampliam escopo, tornam explícitas as fronteiras)

**A. O original é sempre compartilhado e sempre acessível.** O Care Space compartilha os **documentos
originais** + a representação estruturada deles + a evolução temporal — nunca só uma "história estruturada".
> *Princípio:* **Todo documento representado na SINTERA permanece permanentemente acessível em sua forma
> original. A representação estruturada existe para organizar a informação, nunca para substituir a fonte
> documental.** (Rastreabilidade · segurança jurídica · confiança clínica.)

**B. A evolução é uma VISUALIZAÇÃO, não uma conclusão.** A plataforma mostra valores no tempo (glicemia,
ferritina, peso, pressão, exames em ordem cronológica). **Nunca** diz "houve melhora", "houve piora",
"controle inadequado" — isso é interpretação. Ela apenas apresenta a série; **quem interpreta é o médico**:
```
Glicemia
03/2023 → 210
08/2023 → 170
01/2024 → 130
```

**C. A "Visão Geral" é absolutamente objetiva.** Só pode conter **três tipos** de informação:
(1) dados **cadastrados pelo paciente**; (2) informações **transcritas** dos documentos; (3) informações
**derivadas por organização** (cronologia, agrupamento, classificação). **Nunca**: conclusões · hipóteses ·
resumos produzidos por IA.

**D. Duas fontes claramente SEPARADAS (autoria sempre explícita).** Dentro do Care Space há apenas dois tipos
de conteúdo, que **nunca se misturam visualmente**:
| Conteúdo da SINTERA (organizado automaticamente) | Conteúdo do PROFISSIONAL (produzido só por ele) |
|---|---|
| exames · documentos · medicamentos cadastrados · evolução cronológica · gráficos · eventos assistenciais | observações · hipóteses diagnósticas · plano terapêutico · recomendações · comentários |

Fica sempre claro **quem produziu cada informação**.

> ### 🏛️ Princípio constitucional (vale para toda a SINTERA — ver `GOVERNANCA.md`)
> **A SINTERA nunca produz conteúdo clínico. Ela apenas preserva, organiza, estrutura, relaciona e apresenta
> conteúdo produzido pelo paciente ou por profissionais de saúde, mantendo sempre a origem e a autoria de cada
> informação.** Conversa com Rastreabilidade Documental · Reprodutibilidade · Validação entre Camadas ·
> Governed Knowledge Evolution · UCDA · CARE-001.

## 6. Preparação da Consulta (um dos maiores diferenciais)
Antes da consulta o paciente clica **"Preparar consulta"** e escolhe **médico · especialidade · objetivo**. A
plataforma monta automaticamente o Dossiê (exames relevantes · evolução · medicamentos · condições ·
procedimentos · gráficos) e pergunta: *"Deseja compartilhar este dossiê com o Dr. João?"*. Reduz
drasticamente o tempo que o médico gasta reconstruindo a história.

## 7. Inteligência de sugestão (rastreável; decisão final do paciente)
Antes de confirmar, a plataforma sugere o que provavelmente é relevante — sempre como sugestão pré-selecionada;
**o paciente confirma, remove ou adiciona**. Cada sugestão é **consequência rastreável do pipeline**, nunca
decisão implícita da IA ([`principio_ui_rastreavel`]).

- **Por especialidade** — ex.: *Mastologista* → mamografias · ultrassonografias · biópsias · ressonâncias ·
  histórico mamário. (Cruza a Identidade Clínica.)
- **Por profissional (princípio próprio)** — cruza **CRM · nome · instituição · documentos emitidos ·
  solicitados · laudos assinados** e sugere: *"Foram encontrados 14 documentos relacionados ao Dr. João."* —
  **pré-selecionados**, o paciente apenas confirma. (Depende de capturar emissor/`requesting_physician` —
  [`EVENTO_ASSISTENCIAL.md`] §4.)
- **Evolução longitudinal** — exames mais recentes · exames alterados · evolução temporal dos principais
  parâmetros.

## 8. Colaboração BIDIRECIONAL — o cuidado não termina na consulta
O profissional pode registrar comentários · sugestões · hipóteses · recomendações · **solicitação de novos
exames** — tudo **separado** da representação do paciente. Isso inicia um **ciclo de continuidade**:

> Médico solicita "repetir exame em 6 meses / nova mamografia / repetir vitamina D" → a SINTERA pergunta ao
> paciente *"Deseja criar este acompanhamento?"* → se confirmado: **cria o agendamento futuro · registra a
> recomendação · acompanha a execução · mostra ao médico na próxima consulta**.

A recorrência/agendamento reutiliza o **Evento Assistencial** (recorrência genérica, [`EVENTO_ASSISTENCIAL.md`]
§3). Incorporação **só por ação explícita do paciente**.

## 9. Bases legais e consentimento (capítulo próprio — LGPD)
Todo Care Space registra o **consentimento**: **quem autorizou · quando · qual finalidade · quais informações
· período de validade · revogação**. Fortalece a aderência à LGPD (Art. 11 — dado sensível de saúde) e a
auditabilidade. Ações de compartilhamento são **outward-facing**, sempre sob controle explícito do paciente —
nunca criadas por inferência da IA.

## 10. Integração com a arquitetura existente
Reutiliza Capture Hub · Bundle · CDU · Identidade Documental · Identidade Clínica · CPE · Representation
Validator · Cobertura · UCDA · Timeline · Evento Assistencial. **Nenhum pipeline novo** — CARE-001 é
apresentação/orquestração sobre a informação já produzida.

## Roadmap (reorganizado por dependências técnicas; após estabilidade do núcleo clínico)
- **Fase 1 — Infraestrutura:** entidade **Care Space** · convites · controle de acesso · auditoria · **Snapshot Clínico**.
- **Fase 2 — Compartilhamento Inteligente:** Dossiê Clínico · sugestão por especialidade · sugestão por médico ·
  seleção automática da evolução.
- **Fase 3 — Continuidade do Cuidado:** comentários · recomendações · solicitação de novos exames · **agendamento
  de repetição** · acompanhamento longitudinal.
- **Fase 4 — Equipe Assistencial:** múltiplos profissionais · discussão multidisciplinar · histórico das
  interações · **comparação entre snapshots**.

## Avaliação estratégica
CARE-001 inaugura um **novo pilar**: a SINTERA deixa de apenas estruturar/representar a informação clínica e
passa a **orquestrar a continuidade do cuidado** entre paciente e profissionais — coerente com toda a
arquitetura e reutilizando diretamente os componentes existentes, sem pipeline paralelo.
