# Backlog de Evoluções — organizado por FASES de implementação

> Fundadora (14/07/2026): o backlog deixa de ser lista de melhorias e passa a ser organizado por **fases de
> implementação**, para acompanhar naturalmente a evolução da plataforma e evitar itens fora do momento. Já
> documentado e **não volta para validação arquitetural** — segue direto para implementação → testes →
> auditoria → certificação. Executar **após** a consolidação dos módulos existentes; **sem interromper** a
> prioridade atual.

**Ordem de execução macro** (`GOVERNANCA.md` — Ponto de Inflexão): 1) consolidação dos módulos existentes →
2) este backlog → 3) CARE-001 → 4) modalidades clínicas.

---

## Fase A — Ajustes ESTRUTURAIS dos módulos existentes
- **A1 · Cards de Exames padronizados** — todo card: **tipo do exame · laboratório/clínica · médico
  SOLICITANTE**. Executor/assinante do laudo **NÃO** é identificação principal (está no documento). *(§2.1;
  refina [[req_display_card_exame]])*
- **A2 · Nomenclatura única** — identidade documental fiel + nomenclatura consistente em toda a UI; sem
  variações entre exames equivalentes. *(§2.2; [[regra_nomenclatura_documental]] · [[principio_identidade_documental]])*
- **A3 · Política binária de extração** *(regra permanente)* — só **estruturada completa** OU **documento
  disponível**; nunca parcial. *(§2.3; [[regra_estruturacao_binaria]])*
- **A4 · Classificação aberta (ômicas = categorias)** — ômicas viram **categorias de exame** (Laboratorial ·
  Imagem · Genético · Metabolômica · Proteômica · Transcriptômica · Microbioma · …), não fluxo próprio;
  aberta/escalável. *(§2.6; [[principio_modelo_aberto]])*
- **A5 · Relatórios: Histórico próprio** — módulo de Histórico separado da Agenda; acesso independente. *(§1.1)*
- **A6 · Reprocessamento/reclassificação controlada de exames existentes** *(origem: homologação Web 13/08 — WEB-001..004)* —
  Hoje a identidade documental (`document_type`, data, nome) é **write-once**: estabelecida na 1ª extração e
  **imutável** (reprodutibilidade/auditabilidade — princípio correto). Mas quando a **lógica de classificação/
  extração evolui** (ex.: passar a tratar oftalmologia como document_only), os exames **já existentes** não se
  atualizam por "Extrair novamente" — exigem **excluir + reenviar**, o que é uma **deficiência funcional** para
  correção/manutenção. Implementar o **Passo 2 do RI-001** já previsto no código (`analyze/route.ts:72-90`):
  `document_identity_status` com estados **draft/validated/locked**, `identity_source` por atributo, e um fluxo
  de **candidato + comparação + repromoção auditável** disparado quando houver `extractor_version` mais novo
  (ou reclassificação solicitada) — reclassifica/reprocessa **sem** quebrar append-only, rastreabilidade e
  reprodutibilidade (a versão anterior permanece no histórico). *(Não altera o freeze; adiciona o caminho
  deliberado de "descongelar/reprocessar" que hoje falta.)*

## Fase B — Melhorias de EXPERIÊNCIA DO USUÁRIO
- **B1 · Quantitativos × Qualitativos** — quantitativos: estruturação · comparação · evolução · gráficos ·
  indicadores. Qualitativos: documento/laudo em 1º plano, **sem** virar dado. *(§2.4; [[principio_nao_producao_conteudo_clinico]])*
- **B2 · Medidas Corporais em cards** — cada avaliação em **card** (padrão de Exames); abrir → dados completos ·
  evolução · comparações; evitar uma avaliação sempre aberta na tela. *(§4)*
- **B3 · Consistência de apresentação entre módulos** — mesmo padrão de card/detalhe/estados em todos os
  módulos (saída da auditoria de consistência). *(transversal)*

## Fase C — Novas FUNCIONALIDADES (sobre Eventos Assistenciais)
- **C1 · Fluxo ÚNICO de inclusão de exames** — unificar "Novo exame" + upload num só fluxo (PDF · foto ·
  escaneamento · imagem única · múltiplas · multipágina) via **Bundle → CDU → Processamento**. *(§2.5;
  [[req_captura_documental]])*
- **C2 · Financeiro por evento** — valor pago · upload de NF/recibo → módulo financeiro/despesas. Mesmo padrão
  p/ medicamentos · suplementos · cirurgias · consultas · demais eventos. *(§2.7; [[evento_assistencial_entidade_central]] §2)*
- **C3 · Agendamento e recorrência** — agendar · reagendar · recorrência (mensal/trimestral/semestral/anual/
  custom), via infra comum de **Eventos Assistenciais**. Aplica a Exames e Medidas Corporais. *(§2.8; §4)*
- **C4 · Medidas Corporais como avaliação geral** — evoluir de bioimpedância → **avaliação corporal geral**
  (renomear "Escanear Bioimpedância") + financeiro + agendamento/recorrência. *(§4)*

### C5 · Central de Notificações e Lembretes ⭐ **(implementar APÓS consolidação dos módulos, ANTES do CARE-001)**
Infraestrutura **ÚNICA** de notificações para toda a plataforma — nenhum módulo implementa lembrete próprio.
Todos os tipos de evento usam o mesmo mecanismo (exames · consultas · procedimentos · cirurgias · vacinas ·
medicamentos · suplementos · medidas corporais · eventos assistenciais · demais atividades agendadas).
- **6.1 Mecanismo único** — um só sistema de notificações, reutilizado por todos os módulos.
- **6.2 Canais** — o usuário escolhe, por lembrete, os canais: **e-mail · WhatsApp** (in-app e push =
  futuro). Canais **independentes e combináveis** (só e-mail · só WhatsApp · e-mail+WhatsApp · todos).
- **6.3 Configuração por evento** — cada evento tem sua própria estratégia de lembrete, sem alteração
  arquitetural: *Medicamentos* (30min antes · no horário · repetir até confirmação) · *Suplementos* (diário ·
  dias úteis · dias específicos) · *Exames* (30d/7d/1d/no dia) · *Consultas* (confirmação antecipada · véspera ·
  horas antes) · *Vacinas* (reforços · campanhas · próximas doses).
- **6.4 Confirmação de execução** — quando aplicável, o usuário confirma que a atividade foi realizada
  (medicamento administrado · suplemento tomado · exame/consulta realizado · vacina aplicada) → alimenta
  automaticamente **histórico + linha do tempo**.
- **6.5 Arquitetura** — reutiliza **integralmente** Eventos Assistenciais · recorrência · agenda · histórico.
  **Não** há mecanismo por módulo. *(Base: [[evento_assistencial_entidade_central]] §3.)*

**Por que antes do CARE-001:** quando o Espaço Colaborativo for implementado, médicos e pacientes já usam a
MESMA infra de agenda/recorrência/notificações — o CARE (recomendação → agendamento/lembrete) reutiliza tudo,
sem retrabalho nem duplicidade. Ordenação: *consolidação dos módulos → backlog (inclui C5) → **C5 é pré-requisito
do** → CARE-001*.

### C6 · Base de Conhecimento Clínica — "O que é este exame?" ⭐ **(diferencial estratégico; origem: fundadora 13/08)**
Contextualizar o exame **sem interpretar o resultado da paciente** — a distinção regulatória é o núcleo: a SINTERA
explica **o exame**, nunca **o achado**. Educação em saúde (RDC 657 / [[principio_nao_producao_conteudo_clinico]]),
não juízo clínico. Botão discreto no detalhe ("O que é este exame?"). **3 camadas:**
- **Camada 1 — o exame:** o que é, sinônimos, finalidade, como é realizado, quando costuma ser solicitado
  (ex.: "Pentacam — topografia/tomografia de córnea por câmera Scheimpflug…").
- **Camada 2 — os parâmetros/biomarcadores:** o que cada um MEDE, factual (ex.: "Paquimetria: espessura da córnea";
  "Cell Density: nº de células endoteliais/mm²"), com ícone ⓘ por linha na tabela.
- **Camada 3 — as fontes:** toda afirmação exibe a fonte técnico-científica que a embasa (SBO, AAO, SBC, ESC,
  ADA, KDIGO, SBEM, SBN, fabricante…).
**Arquitetura (decisão de produto):** NÃO buscar em tempo real na internet — construir uma **Base de Conhecimento
Clínica versionada e curada**. Registro por exame: `nome · sinônimos · especialidade · finalidade · como é
realizado · quando é solicitado · biomarcadores relacionados · fontes · data da última revisão · responsável
técnico`. Assim: **versionado · revisão clínica · rastreável · atualizável · sem inconsistência de busca ao vivo**.
Governança: conteúdo clínico-educativo é **artefato governado** (aprovação do Responsável Clínico, como o
`prompt_registry`/ruleset). Reaproveita a fundação já existente de educação por biomarcador
(`GET /api/education/biomarker/[code]`, MedlinePlus/NIH; "Sobre este exame" no Mobile) — evoluindo-a de fonte
externa para KB própria curada. **Alto valor:** transforma repositório de documentos em plataforma que
**contextualiza** sem substituir o profissional. *(Depende de curadoria clínica → fase de evolução, não v1.)*

### C7 · Serviço de Terminologia + cache versionado ⭐ **(governança clínica; base do DUE e do C6)**
A SINTERA **não é proprietária** da terminologia clínica — usa fontes oficiais como autoridade e preserva uma
cópia **versionada** do que usa. Arquitetura em 4 camadas (ver ADR-DUE-001): (1) **fonte oficial** — LOINC
(lab/observações), SNOMED CT (procedimentos), RNDS/MS-FHIR (BR); (2) **Serviço de Terminologia** (adapter:
busca · normalização · ranking · desambiguação); (3) **cache versionado** — por conceito: `nome canônico · código
· sistema · versão · fonte · data da consulta · idioma · sinônimos · categoria · descrição · confiança`; **nunca
muta versão antiga** (reprodutibilidade + auditoria); (4) **atualizador** governado (periódico/por release; cria
nova versão). A **IA só propõe candidatos** (com evidências e score); **quem decide o nome é a terminologia**.
Binding evidência→código é **artefato clínico governado** (revisão do Responsável Clínico), crescido **sob demanda**
(só os exames encontrados) — a SINTERA não vira mantenedora de terminologias. **Cuidado:** licença SNOMED CT (BR é
membro via MS) e cobertura parcial de exames de imagem → estado "provisório + confiança" é permanente e de 1ª classe.
Conecta ao **C6** ("O que é este exame?" — a descrição também cita as fontes). *Fase de evolução; não v1.*

## Fase D — REDESIGN VISUAL (Design System)
- **D1 · Identidade "Almond Blossom" (Van Gogh)** — **aqua** institucional (entre Verde Tiffany e Azul
  Turquesa); **trocar a sidebar verde escura**; **creme · branco · preto · marrom** secundários; **dourado
  metálico** só como destaque (premium/badges/estados especiais/detalhes). Elegante, atemporal, sofisticada.
  *(§5; refina [[branding_paleta_v3_vangogh]])*

## Fase E — INTEGRAÇÕES EXTERNAS → pilar HIP-001 (Plataforma de Integrações em Saúde)
> Reenquadrada (fundadora 14/07): NÃO é integração wearable isolada, é o **pilar transversal HIP-001** —
> conectores independentes p/ QUALQUER fonte externa, todos produzindo a representação canônica (UCDA), sem
> depender de fabricante/formato; usuário autoriza/revoga. Detalhe: `docs/HIP-001_PLATAFORMA_INTEGRACOES.md`.
- **E1 · Sinais Vitais automáticos** = **1º consumidor de HIP-001** (não uma integração isolada). Prioridade =
  aquisição automática (reduzir lançamento manual), via conector → UCDA → Sinais Vitais.
- **E2 · Conectores** — wearables (Apple/Google Health, Garmin, Fitbit, Polar, Suunto, Coros, Amazfit, Huawei,
  Samsung, Oura, Whoop) · esportivas (Strava, TrainingPeaks, Zwift, Wahoo, Runkeeper, Nike/Adidas Running) ·
  monitorização (CGM, pressão, oxímetro, balança/bioimpedância, sono, respiratório).
- **E3 · Preparação futura** (só arquitetura): FHIR · HL7 · DICOM · RNDS · hospitais · laboratórios · clínicas ·
  operadoras · telemedicina. Precursor a reconciliar: tabela `wearable_connections` (RLS sem política).

---

**Rastreabilidade:** os `§x.y` referem-se à relação original por módulo (preservada no histórico do git).
Vários itens reutilizam infra já certificada (Eventos Assistenciais · Modelo Aberto · Identidade Documental ·
Bundle/CDU) — nascem sobre a base consolidada, sem retrabalho.

---

## Alinhamento 14/07/2026 — definição de CONCLUSÃO (4 dimensões) + backlog reforçado por módulo

**GATE de conclusão (constitucional):** uma capacidade só é CONCLUÍDA com as 4 dimensões SIMULTÂNEAS —
Infraestrutura · Funcionalidade · Experiência de uso · Integrações transversais. Não declarar concluído só
porque a infra técnica existe. *(Ver `docs/GOVERNANCA.md` §GATE de CONCLUSÃO em 4 dimensões.)*

Itens que a fundadora pediu para manter REGISTRADOS no backlog de implementação dos módulos:

- **Exames** — confirmação automática de exame duplicado · upload de imagens além do PDF · médico solicitante ·
  nomenclatura padronizada · política binária de estruturação · categorias de exame · valor pago · NF/recibo ·
  agendamento · recorrência · compartilhamento futuro pelo Care Space. *(Rastreado em `docs/EXAMES_CONCLUSAO.md`
  — E1–E8 fechados; abertos: dedup, imagens, notificações (NOTIF-001), Care Space, UX/visual.)*
- **Relatórios** — **separação definitiva entre Agenda e Histórico** (não misturar previsto × realizado).
  ✅ **feito** (14/07): o relatório separa a seção de eventos em **Agenda (previstos)** × **Histórico
  (realizados)**, aplicando a regra definitiva do módulo Histórico (futuro planejado = Agenda; realizado/
  cancelado/passado = Histórico); contadores de resumo também separados.
- **Medidas Corporais** — reorganização completa conforme documento enviado (Fase C · Medidas/avaliação geral).
- **Sinais Vitais** — preparação para **integração automática com dispositivos externos** (Fase E1 · wearables).
- **Notificações (NOTIF-001)** — infraestrutura ÚNICA e transversal; usuário configura por CATEGORIA o canal
  (e-mail · WhatsApp · ambos · nenhum), válido para toda a plataforma (exames, procedimentos, vacinas,
  medicamentos, suplementos, consultas, avaliações corporais, eventos assistenciais, recorrências, lembretes,
  qualquer agendado). Reutilizada por TODOS os módulos, sem implementações específicas. *(Detalhe: Fase C §C5 +
  `notif_001_infraestrutura_unica`; reúso de Resend/WhatsApp/`buildEventNotification`/orquestrador de lembretes.)*
- **Billing (SaaS)** — seguir o planejamento registrado (`docs/BILLING-001_ASSINATURAS.md`); pilar transversal.
