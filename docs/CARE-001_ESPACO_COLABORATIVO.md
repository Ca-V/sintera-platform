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

## 5. Três camadas complementares (a estruturação NUNCA substitui o documento)
O objetivo do CARE Space **não é substituir os documentos por uma representação estruturada**. O profissional
vê **três camadas complementares**, e o **documento original permanece a fonte PRIMÁRIA** — a representação e a
evolução existem para facilitar a compreensão, nunca para substituir (Princípio da Rastreabilidade Documental):

1. **Representação estruturada** — a organização produzida pela SINTERA (leitura rápida de exames, parâmetros,
   achados, informações clínicas). Vem do CPE/UCDA.
2. **Evolução longitudinal** — toda a linha do tempo do paciente (tendências, estabilidade, progressão,
   resposta a tratamentos).
3. **Documento original** — cada informação estruturada mantém **acesso imediato ao original correspondente**
   (PDF · imagem · DICOM · laudo…), exatamente como foi emitido.

**Navegação na consulta:** resumo clínico → evolução longitudinal → gráficos/tendências → abrir qualquer exame
**original com um clique** → imagens/laudos/documentos como emitidos. Essa combinação é o que entrega
**segurança clínica**. O CARE Space dá acesso **organizado e contextualizado** à representação longitudinal
E a todos os documentos originais que a sustentam.

## 5.1 Dossiê Clínico — 4 áreas principais + Colaboração
O profissional **nunca** recebe uma lista de PDFs. A plataforma monta um **Dossiê Clínico** estruturado
(reusa Timeline + representação do CPE/UCDA + Evento Assistencial), sempre com o **original a um clique**:

- **Visão Geral** — resumo clínico · principais condições · alertas · medicamentos atuais.
- **Evolução** — Timeline · tendências · comparações · **eventos assistenciais**.
- **Evidências Clínicas** — exames laboratoriais · exames de imagem · procedimentos · cirurgias.
- **Documentos** — todos os documentos **originais** acessíveis.
- **Colaboração** *(§8)* — comentários do profissional · recomendações · solicitações · **plano de
  acompanhamento**.

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
