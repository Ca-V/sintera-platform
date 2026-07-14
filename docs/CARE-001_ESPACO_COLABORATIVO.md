# CARE-001 — Espaço Colaborativo de Cuidado (Care Collaboration)

> Fundadora (14/07/2026): novo **domínio arquitetural permanente** da SINTERA. **Registrar agora,
> implementar depois** — após a consolidação do pipeline de processamento clínico (Capture Hub → CPE →
> extratores do CEF). **Não interrompe a execução atual.**
>
> **Dependência técnica direta:** o valor do Espaço Colaborativo depende de a **representação longitudinal
> já estar consistente, auditável e estruturada**. Implementá-lo antes = compartilhar informação incompleta.
> Início: quando o núcleo do processamento clínico atingir estabilidade para dar uma representação confiável
> ao profissional.
>
> **Natureza:** é uma **camada de APRESENTAÇÃO e COMPARTILHAMENTO** da informação já produzida pela
> arquitetura existente. **NENHUM pipeline novo.** Reutiliza: Capture Hub · Bundle · CDU · Identidade
> Documental · Identidade Clínica · Clinical Processing Engine · Representation Validator · Cobertura · UCDA
> · Timeline. Conecta com o domínio [`EVENTO_ASSISTENCIAL.md`].

---

## Objetivo
Permitir que o paciente compartilhe **parte** da sua representação longitudinal de saúde com um ou mais
profissionais, por um **período determinado** e uma **finalidade específica**. O profissional **não acessa a
conta** do paciente — acessa apenas um **espaço compartilhado**, criado e controlado pelo paciente. (LGPD
Art. 11 — dado sensível de saúde; controle pelo titular.)

## Princípios obrigatórios
1. **O paciente permanece proprietário do acesso** — todo compartilhamento é iniciado por ele; pode conceder,
   limitar, alterar permissões e **revogar imediatamente**.
2. **Compartilhamento por FINALIDADE** — sempre explícita: Consulta · Retorno · Segunda opinião · Junta
   médica · Auditoria · Acompanhamento.
3. **Compartilhamento CONTEXTUAL** — nunca só documentos; sempre um **contexto clínico organizado**.
4. **Documento é a fonte da verdade** — toda informação estruturada mantém **acesso imediato ao original**
   (Princípio da Rastreabilidade Documental).
5. **Auditoria completa** — registrar tudo: quem acessou, quando, o que visualizou, downloads, comentários,
   revogações.

## Estrutura do compartilhamento
- **Identificação do profissional:** nome · CRM · especialidade · instituição · contato.
- **Escopo** (o paciente escolhe): toda a plataforma · uma especialidade · um período · determinados exames ·
  documentos · condições · medicamentos.
- **Permissões** (separadas): visualizar · baixar · imprimir · comentar · solicitar atualização.
  **Nunca** permitir alteração dos dados do paciente.
- **Prazo:** permanente · temporário · **expiração automática** · revogação manual.

## Dossiê Clínico (montado automaticamente)
O profissional **nunca** recebe uma lista de PDFs. A plataforma monta um **Dossiê Clínico**: resumo clínico ·
linha do tempo (Timeline) · evolução longitudinal · exames organizados · medicamentos · condições · cirurgias
· documentos originais. (Reusa Timeline + a representação estruturada do CPE/UCDA.)

## Inteligência de compartilhamento (sugestão pré-confirmação, rastreável)
Antes de confirmar, a plataforma **sugere** o que provavelmente é relevante para aquele profissional, por
**múltiplas evidências** — sempre como sugestão; **a decisão final é do paciente** (pode remover/adicionar):
- **Por especialidade** — ex.: *Mastologista* → mamografias · ultrassonografias · biópsias · ressonâncias ·
  histórico mamário.
- **Por nome do profissional** — quando o nome coincide com documentos existentes, pré-selecionar: exames
  **solicitados** por ele · **assinados** por ele · **laudos emitidos** por ele · documentos do acompanhamento
  com esse profissional. (Depende de capturar `requesting_physician`/emissor — ver `EVENTO_ASSISTENCIAL.md` §4.)
- **Evolução longitudinal** — exames mais recentes · exames alterados · evolução temporal dos principais
  parâmetros.

Cada sugestão é **consequência rastreável do pipeline** (especialidade↔Identidade Clínica; nome↔emissor/
solicitante; evolução↔representação longitudinal), nunca decisão implícita da IA ([`principio_ui_rastreavel`]).

## Snapshot Clínico (imutável)
Ao criar o compartilhamento, gerar um **Snapshot Clínico** = exatamente o conjunto compartilhado naquela
consulta. Mesmo que o paciente altere depois a plataforma, o **Snapshot permanece imutável** para auditoria e
rastreabilidade. (Alinha com Reprodutibilidade/write-once: um snapshot é um congelamento datado.)

## Espaço do profissional (somente leitura)
Ambiente próprio: resumo clínico · evolução longitudinal · Timeline · exames · documentos · gráficos de
evolução · histórico compartilhado. **Somente leitura** — o profissional **nunca** altera a base do paciente.

## Colaboração (separada da representação do paciente)
O profissional pode registrar: comentários · sugestões · hipóteses · recomendações · solicitação de novos
exames. Essas informações ficam **separadas** da representação do paciente. A plataforma poderá depois
**perguntar ao paciente** se deseja incorporar alguma sugestão (incorporação só por ação explícita do paciente).

## Integração com a arquitetura existente
Reutiliza Capture Hub · Bundle · CDU · Identidade Documental · Identidade Clínica · Clinical Processing Engine
· Representation Validator · Cobertura · UCDA · Timeline. **Nenhum pipeline novo** — Care Collaboration é
camada de apresentação/compartilhamento sobre a informação já produzida.

## Roadmap de implementação (após estabilidade do núcleo clínico)
- **Fase 1 — Infraestrutura de compartilhamento:** convites · controle de acesso · escopo · auditoria ·
  revogação · Snapshot.
- **Fase 2 — Dossiê Clínico:** Timeline · evolução longitudinal · organização automática · sugestões por
  especialidade · sugestões por médico.
- **Fase 3 — Colaboração clínica:** comentários · solicitação de exames · compartilhamento entre equipes ·
  histórico das interações.
- **Fase 4 — Continuidade do cuidado:** compartilhamentos recorrentes · preparação automática para consultas ·
  comparação entre snapshots · acompanhamento longitudinal entre paciente e equipe assistencial.

## Segurança e governança (regras permanentes)
Acesso externo por convite; permissões granulares; expiração/revogação imediatas; auditoria append-only;
snapshot imutável; somente leitura; colaboração isolada da base. Toda ação de compartilhamento é
**outward-facing** e passa pelo controle explícito do paciente — nunca criada por inferência da IA.
