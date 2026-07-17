# UX-001 — Arquitetura Funcional da Plataforma (Constituição)

**Status:** 🔒 **ARQUITETURA FUNCIONAL CONGELADA** (07/07/2026) — implementada e em vigor a partir deste ciclo. Base para o KG v2 — Parte 3. Alterações estruturais exigem revisão explícita desta constituição (§9).
**Emendas pós-freeze (revisão explícita, aprovadas pela fundadora):** 2026-07-07 — §1.10 + §10 Padrões de Captura Documental ([[CAP-001]]); §1.11 Orientação por objetivo da usuária (princípio transversal).
**Escopo:** **arquitetura funcional** — o que existe, como se organiza, como se navega e como cresce. **NÃO** trata de componentes visuais, cores, tokens ou padrões de interface — isso é responsabilidade do **[[DS-001]] — Design System** (referenciado onde couber).
**Sequência:** UX-001 (spec) → Implementação → **Freeze da arquitetura funcional** → KG v2 Parte 3 → Implementação do KG.
**Herda:** [[PLANO_MATURIDADE_PRE_MOBILE]] (§0 Governança Científica, §0.1 SSOT, §3 modelo orientado a eventos).

---

## 1. Princípios

1. **Simplicidade (mobile-first).** Projetar primeiro para o celular; o desktop é expansão.
2. **Consistência.** O mesmo problema tem a mesma solução em toda a plataforma.
3. **Terminologia neutra (RDC 657/2022).** A plataforma **organiza, não diagnostica**. Evita termos de juízo clínico ("problema", "risco", "alterado", "diagnóstico"); prefere factuais e amplos ("condição", "registro", "acompanhamento").
4. **Um conceito = um módulo.** Cada entidade de 1ª classe tem **modelo de dados próprio** e lugar próprio. Proibido misturar entidades por conveniência.
5. **Responsabilidade única.** *Um módulo existe para representar apenas UM conceito do domínio.* Condições não registra compras, consultas nem medicamentos; Medicamentos não registra dispositivos nem condições; Recursos não registra medicamentos. (Detalhado na §8.)
6. **SSOT do metadado clínico.** Nomes, categorias, unidades, ícones e ordenação de metadados clínicos vêm do Catálogo Científico — nunca duplicados (herda §0.1 do Plano de Maturidade).
7. **Modelo orientado a eventos.** A jornada é uma linha do tempo de eventos; a interface é projeção, não a fonte da verdade.
8. **Navegação por frequência de uso, não por estrutura técnica.** *A organização do menu reflete a **frequência de uso** das funcionalidades — não a estrutura do banco de dados nem a arquitetura interna do sistema.* É por isso que **Acompanhamento** (uso diário) vem antes de **Minha Saúde** (contexto permanente), embora ambos sejam módulos independentes (§5). Reorganizações futuras de navegação partem da **experiência do usuário**, nunca da implementação técnica.
9. **Nome único por módulo (sem sinônimos).** O nome do módulo no **menu lateral** é o **mesmo** na Home, nos Relatórios, nos breadcrumbs, nos títulos de página e em qualquer fluxo de navegação. É **proibido** haver sinônimos para o mesmo módulo (ex.: "Problemas de Saúde" num lugar e "Condições de Saúde" em outro). Renomear um módulo significa atualizar **todos** os pontos de exibição de uma vez.
10. **Meios de entrada padronizados (captura documental).** *Todo módulo que aceite documentos oferece exatamente os mesmos meios de entrada: **digitar manualmente · tirar foto · enviar/arrastar arquivo · importar do Centro de Captura · falar (voz)**.* O Centro de Captura é canal **adicional** de entrada — nunca o único local onde se pode enviar um arquivo. Nenhum módulo oferece apenas um subconjunto sem justificativa técnica registrada. (Detalhado na §10 e em [[CAP-001]].)
11. **Orientação por objetivo da usuária, não pelo mecanismo técnico.** *A plataforma é organizada pelo **que a usuária quer fazer** (cadastrar um medicamento, um exame, um recurso, uma despesa, uma consulta), não pela **tecnologia** usada para isso (documento, upload, foto, OCR).* O ponto de partida do fluxo é a **intenção** ("O que você deseja cadastrar?" / "Como deseja cadastrar este medicamento?"); os meios (digitalizar, arquivo, foto, manual, voz) são secundários e intercambiáveis. Rótulos comunicam intenção ("Novo medicamento" / "Cadastrar medicamento"), não o mecanismo ("Adicionar documento"). Princípio transversal — vale para [[CAP-001]], [[REL-001]], DS-001, QA-001 e o Roadmap por Ondas.

---

## 2. Modelo Arquitetural — dois eixos distintos

A plataforma tem **dois eixos completamente diferentes**. Confundi-los é a principal causa de crescimento oportunista da arquitetura.

### A. Módulos — entidades permanentes
Representam algo que **existe/persiste** no perfil da pessoa; têm identidade própria e página própria.
> Condições de Saúde · Medicamentos e Suplementos · Recursos de Saúde · Hábitos · Medidas Corporais · Sinais Vitais · Exames · Ciclo.

### B. Eventos — acontecimentos no tempo
São **fatos registrados numa data**; pertencem à **Agenda** (futuros) e ao **Histórico** (passados). **Não** viram módulo.
> Consulta · Retorno · Procedimento · Cirurgia · Vacina · Internação · Exame (realização) · Plano de saúde · Compra · Recompra.

**Regra de ouro:** antes de propor "criar um módulo X", verificar se X é na verdade um **evento** (ocorre numa data → Agenda/Histórico) ou um **atributo/subtipo** de um módulo existente. Ex.: *Vacina* é evento, não módulo.

---

## 3. Tipos de Módulos

Todo módulo pertence a **uma** das três categorias — orienta a evolução e a navegação.

| Categoria | Módulos | Papel |
|---|---|---|
| **Clínicos** | Condições · Exames · Medicamentos e Suplementos · Recursos de Saúde · Hábitos · Medidas Corporais · Sinais Vitais · Ciclo | O que compõe a saúde da pessoa (o domínio) |
| **Operacionais** | Agenda · Histórico · Despesas · Relatórios | Gestão/organização da jornada (projeções e ferramentas) |
| **de Sistema** | Perfil · Configurações | Conta e preferências |

---

## 4. Mapa dos Módulos

Cada módulo = entidade de 1ª classe com **modelo de dados próprio**.

| Módulo | Categoria | Conceito | Modelo (tabela) |
|---|---|---|---|
| Painel Inicial | Operacional | Visão geral / entrada | (agrega) |
| Agenda | Operacional | Eventos **futuros** | `health_events` (futuros) |
| Histórico | Operacional | Eventos **passados** + Evolução | `health_events`, `exams`, biomarcadores |
| Despesas | Operacional | Projeção financeira (eventos/compras com valor) | `health_events` c/ valor |
| Relatórios | Operacional | Compilação factual p/ o profissional | (agrega) |
| Exames | Clínico | Laudos + extração IA | `exams`, `biomarkers` |
| Medicamentos e Suplementos | Clínico | O que a pessoa **toma** | `medications` (medicamento, suplemento) |
| Condições de Saúde | Clínico | O que a pessoa **tem** (próprias + familiares) | `health_conditions` |
| **Recursos de Saúde** *(novo)* | Clínico | Recursos que **usa** (cuidado/compensação/monitoramento) | `health_resources` (modelo próprio — Anexo A) |
| Hábitos | Clínico | Estilo de vida | `life_habits` |
| Medidas Corporais | Clínico | Peso/altura/IMC/composição | `body_metrics` (corporais) |
| Sinais Vitais | Clínico | Pressão/FC/glicemia/SpO₂/temperatura | `body_metrics` (vitais) |
| Ciclo e Contracepção | Clínico | Menstruação + métodos | (ciclo) |
| Perfil · Configurações | Sistema | Conta | — |

**Correção estrutural:** óculos/lentes (`eyeglass_prescriptions`), hoje embutidos em Condições, **migram para Recursos de Saúde** (condição ≠ recurso).

---

## 5. Navegação

**Hierarquia de navegação — regra única (toda página segue):**
```
Módulo → Lista → Detalhe → Edição
```

**Agrupamento ≠ fusão.** Os grupos de menu são **organização da experiência**, não fusão de entidades. Cada módulo dentro de um grupo **preserva identidade, ciclo de vida, regras e modelo de dados próprios** — agrupar reduz itens de primeiro nível sem misturar dados. O grupo é rótulo de navegação; a taxonomia formal é a §3.

> **Emenda 2026-07-17 (FB-010, revisão explícita da fundadora).** A navegação passa a ser organizada por
> **DOMÍNIO de negócio** (não por frequência), caminhando para **5 domínios de 1º nível**: Acompanhamento ·
> Minha Saúde · **Rede de Cuidado** ([[CARE-001]], a construir) · Organização · Configurações. Decisões-chave:
> (1) **"Histórico" → "Registros de Saúde"** (timeline de eventos); (2) surge **"Histórico de Exames"**
> (`/dashboard/saude`, evolução longitudinal de biomarcadores) como item próprio; (3) **Exames NÃO se funde** com
> Histórico de Exames — Exames é o **repositório documental/operacional** (captura/OCR/laudo/edição/valor/NF/
> recorrência/reextração), num grupo **📁 Documentos** ([[DOC-001]]; futuro: Vacinas, outros documentos);
> (4) **Composição Corporal** e **Monitoramento** sobem para Acompanhamento; **Medicamentos e Suplementos** e
> **Recursos** ficam em Minha Saúde. **Rede de Cuidado** = governança do compartilhamento (documentada, build adiado).

**Menu lateral** — organizado por **domínio de negócio** (FB-010); a estrutura em vigor:
- **Painel** — Painel Inicial.
- **Acompanhamento** *(evolução temporal da saúde)* — Agenda · **Registros de Saúde** · **Histórico de Exames** · Composição Corporal · Monitoramento.
- **📁 Documentos** *(repositório documental/operacional; [[DOC-001]])* — **duas fases:** FASE 1 (beta) = **Exames como item independente**, sem cabeçalho de grupo (evita "grupo de 1 item"), já documentado como futuro Documentos; FASE 2 (release) = grupo 📁 Documentos oficial ao surgir o 2º tipo (Vacinas · Receitas · Atestados · Encaminhamentos · Termos · outros).
- **Minha Saúde** *(estado permanente da pessoa)* — Condições de Saúde · **Medicamentos** · **Suplementos** · **Recursos de Saúde** · Hábitos · Ciclo e Contracepção. *(Medicamentos e Suplementos = duas VISÕES do mesmo modelo `medications` por `kind`; rotas `/dashboard/medicamentos` e `/dashboard/suplementos` reaproveitam a mesma página. Espelhado no Relatório como duas seções.)*
- **🤝 Rede de Cuidado** *(governança do compartilhamento — [[CARE-001]], build adiado; não aparece no menu até existir a página)*.
- **Organização** *("como organizo minha vida em saúde?")* — Despesas · Relatórios.
- **Configurações**.

*(Decisão desta versão: **Acompanhamento vem antes de Minha Saúde** — prioriza as funções mais acessadas no dia a dia e deixa o perfil de saúde como contexto permanente, não como primeiro ponto de entrada. "Minha Saúde" designa o estado-perfil clínico — Condições, Recursos, Medidas, Sinais, Hábitos e Ciclo, cada um independente. Ciclo fica em Minha Saúde por ser estado-perfil contínuo, como Medidas/Sinais. Reordenar grupos é arquitetura de navegação — não altera modelos, rotas nem permissões.)*

**Definição formal dos grupos (critério de encaixe para módulos novos):**
- **Acompanhamento** reúne os módulos da **jornada de cuidado** — atividades e registros organizados no tempo (agendar, realizar, tomar), de gestão contínua e orientada a datas/eventos. *(Agenda, Histórico, Exames, Medicamentos e Suplementos.)*
- **Minha Saúde** reúne os módulos que descrevem o **perfil/estado de saúde** da pessoa — o que ela **é, tem e mede sobre si** —, relativamente estável e independente de um evento específico. Mesmo quando medido periodicamente (ex.: peso, pressão), descreve o **corpo**, não uma atividade de cuidado. *(Condições, Recursos, Medidas, Sinais Vitais, Hábitos, Ciclo.)*

> **Como decidir onde encaixar um módulo novo:** ele representa uma **atividade/evento de cuidado no tempo** → Acompanhamento; representa um **traço/estado do perfil de saúde** → Minha Saúde. (Se for um acontecimento numa data, reveja antes a §2/§7: pode ser um **evento**, não um módulo.)

**Acesso rápido (Painel Inicial):** os módulos mais frequentes — Histórico · Agenda · Exames · Medicamentos · Relatórios · Despesas.
**Relatório = taxonomia da navegação (princípio, FB-010).** O Relatório **não tem árvore própria**: reutiliza a
**mesma taxonomia da Sidebar** (grupos, ordem e rótulos). Qualquer reorganização da Sidebar deve refletir
**automaticamente** na geração de relatórios (`relatorio/page` — `SELECT_GROUPS` + faixas de banda espelham os
grupos do menu). Assim, evoluções futuras da navegação propagam para os relatórios sem retrabalho.
**Rota ≠ rótulo:** URLs (`/dashboard/gastos`, `/dashboard/condicoes`) são estáveis; renomear o rótulo não muda a rota.

---

## 6. Padrões de Página (estrutura funcional)

Toda página de módulo segue a **hierarquia fixa de conteúdo**:
```
Título → Texto explicativo → Filtros/Segmentação → Conteúdo (lista) → Ações (no item)
```
- O **detalhe** e a **edição** são alcançados a partir da **lista** (hierarquia da §5).
- A **implementação visual** dessa estrutura (componentes, espaçamentos, tipografia, responsividade) é definida em **[[DS-001]]** — este documento fixa apenas a **ordem e a responsabilidade** de cada bloco.

---

## 7. Critérios para Criação de Novos Módulos (checklist obrigatório)

> **Regra arquitetural permanente.** Nenhum novo módulo pode ser criado **apenas porque surgiu uma nova funcionalidade**. Um módulo só existe quando representa uma **entidade de primeira classe** — com **modelo de dados, ciclo de vida e responsabilidades próprias**. Caso contrário, deve ser implementado como **subtipo · atributo · visão · evento · ou funcionalidade** de um módulo existente.

Um novo conceito **só vira módulo** se responder **SIM** a todas:
- [ ] Possui **identidade própria** (é um conceito distinto, não sinônimo de módulo existente)?
- [ ] Possui **ciclo de vida próprio** (nasce, muda de estado, encerra de forma independente)?
- [ ] Possui **modelo de dados próprio** (atributos que não caberiam em outro módulo sem encher de nulos)?
- [ ] Possui **regras próprias** (comportamento/validação específicos)?
- [ ] **Faz sentido existir sem depender** de outro módulo?

Se **qualquer** resposta for **NÃO**, provavelmente é:
- um **atributo** de um módulo existente; ou
- um **subtipo** dentro de um módulo; ou
- um **evento** (Agenda/Histórico).

**Aplicação (decisões de referência):**
| Ideia | Decisão | Por quê |
|---|---|---|
| Recursos de Saúde | **Módulo novo** | SIM a todas (identidade, ciclo, modelo, regras, independência) |
| Vacinas | **Evento** | ocorre numa data → Agenda/Histórico |
| Procedimentos · Internações · Cirurgias | **Eventos** | ocorrem numa data/período |
| Alergias | **Subtipo/atributo de Condições** | é um tipo de condição; sem modelo próprio |
| Histórico Familiar | **Escopo de Condições** (`scope=familiar`) | mesma entidade, escopo diferente |

---

## 8. Responsabilidades dos Módulos (responsabilidade única)

Cada módulo registra **apenas** o seu conceito. Fronteiras explícitas:

| Módulo | Registra | NÃO registra |
|---|---|---|
| Condições de Saúde | condições próprias e familiares | compras · consultas · medicamentos · recursos |
| Medicamentos e Suplementos | medicamentos e suplementos que toma | dispositivos · condições · procedimentos |
| Recursos de Saúde | recursos que usa (óculos, dispositivos, próteses, auxílios…) | medicamentos · condições |
| Hábitos | estilo de vida | medidas · sinais vitais |
| Medidas Corporais | peso/altura/IMC/composição | sinais vitais |
| Sinais Vitais | pressão/FC/glicemia/SpO₂/temperatura | medidas corporais |
| Agenda / Histórico | eventos (futuros/passados) | estados contínuos (módulos clínicos) |
| Despesas | valores (projeção de eventos/compras) | os próprios eventos (é projeção) |

---

## 9. Freeze Arquitetural

🔒 **Congelado em 07/07/2026.** A implementação do UX-001 foi concluída (navegação em Minha Saúde / Acompanhamento; módulo Recursos de Saúde com modelo próprio `health_resources` + migração de óculos/lentes; renames Condições de Saúde e Medicamentos e Suplementos). A partir daqui:
- Todo novo desenvolvimento respeita este documento (modelo de dois eixos, tipos de módulos, mapa, navegação, responsabilidade única) e o checklist da §7.
- Componentes/visual seguem o **DS-001**.
- Alterações **estruturais** exigem revisão explícita desta constituição — não ajustes pontuais.
- **Próximo passo:** KG v2 — Parte 3 (Decisão Arquitetural).

**Pendências registradas (não bloqueiam o freeze — sobre a base já congelada):**
- Consolidar `produto`/`dispositivo` (hoje ainda como `kind` em Medicamentos) no módulo Recursos — requer migração de dados dos registros reais; fazer com confirmação da fundadora.
- Ampliar a seção de Relatórios/relatório compartilhado para exibir **todos** os sub-tipos de Recursos (hoje espelha apenas correção visual).
- Alergias como subtipo de Condições (§7) — quando priorizado.

**Notas de evolução futura (registradas, não congeladas — não mudam agora):**
- **Histórico como visão global.** O Histórico é uma **projeção transversal** (consultas, exames, medicamentos, despesas, procedimentos sobre a linha do tempo). Hoje é, corretamente, um módulo Operacional em Acompanhamento; no futuro pode evoluir para uma **visão global tipo Timeline** que atravessa toda a plataforma, deixando de ser apenas um item de um grupo. Registrado como direção possível — sem alteração neste ciclo.

---

## 10. Padrões de Captura Documental (emenda 2026-07-07 · [[CAP-001]])

> Emenda aprovada pela fundadora após o freeze (§9) — revisão explícita, não ajuste
> pontual. Formaliza o princípio §1.10.

**Meios oficiais de entrada** — sempre os mesmos, na mesma ordem, em todo módulo que aceite documentos:

| # | Meio | Nota |
|---|------|------|
| 1 | **Digitar manualmente** | formulário do módulo |
| 2 | **Tirar foto** | câmera (`capture=environment`) |
| 3 | **Enviar ou arrastar arquivo** | file picker + drag-and-drop; **PDF, JPG, PNG, HEIC** |
| 4 | **Importar do Centro de Captura** | quando aplicável |
| 5 | **Falar** | captura por voz (`VoiceInput` reutilizável) |

**Regras:**
- O **envio de arquivo** (meio 3) deve existir **dentro do módulo**, não apenas no Centro de Captura.
- **"Escanear" ≠ apenas fotografar:** aceita foto **e** arquivo/PDF já existente (celular, e-mail, computador).
- Meios idênticos em **todos os módulos com OCR/IA documental**, atuais e futuros (Exames, Exames Ômicos, Medicamentos e Suplementos, Recursos de Saúde, Procedimentos, Vacinas, Documentos…).
- Implementação via **componente único** (`<DocumentCapture>`, evolução do Centro de Captura); cada módulo apenas declara `accepts` + processador de destino. Exames é a referência.
- **Centro de Captura** (Home): ponto único de classificação/roteamento — tipos: Exame · Exame ômico · Receita de medicamento ou suplemento · Receita de recurso de saúde · Outro documento de saúde → módulo correspondente ou revisão manual.
- **RDC 657/2022:** captura organiza; não interpreta.

Especificação de implementação, estado atual mapeado e auditoria de conformidade: **[[CAP-001]]**.

---

## Anexo A — Módulo "Recursos de Saúde" (para o ciclo de implementação)

**Conceito:** recursos que a pessoa **usa** para cuidado, compensação funcional ou monitoramento — não o que *tem* (condição) nem *toma* (medicamento).

**Sub-tipos (taxonomia controlada):**
| Sub-tipo | Exemplos |
|---|---|
| Correção visual | óculos, lentes de contato, lente escleral |
| Dispositivos médicos | marca-passo, CDI, bomba de insulina, sensor de glicose, neuroestimulador |
| Próteses e órteses | prótese, órtese, palmilha, aparelho ortodôntico |
| Auxílios | aparelho auditivo, bengala, muletas, andador, cadeira de rodas |
| Compressão e suporte | meia compressiva, colar cervical, faixa, colete |

**Modelo de dados — PRÓPRIO (não reutilizar `medications`).** Dose/frequência/forma/via/recompra não cabem em óculos/marcapasso/prótese; reaproveitar geraria nulos e regras condicionais e prejudicaria o KG v2. Tabela `health_resources`:
`id · user_id · resource_type · name · brand · prescriber · started_on · until_date · status (em_uso | suspenso | encerrado) · notes · file_url · attributes (JSONB por sub-tipo)`.
O `attributes` guarda o que é específico do sub-tipo — ex.: correção visual = `{vision_kind, od{sph,cyl,axis,add}, oe{…}, dnp, bc, dia}`. Assim o núcleo é comum a todos os recursos e o detalhe fica isolado, sem colunas nulas.
**Migração:** `eyeglass_prescriptions` → `health_resources` (`resource_type='correcao_visual'`), saindo de Condições; migração idempotente (rastreia `attributes.legacy_id`).
**UI:** página própria (grupo Meu Perfil), montada com os primitivos do **DS-001**. Medicamentos passa a ser **"Medicamentos e Suplementos"**.

---

## Critérios de Aceite (do UX-001)
- Dois eixos (Módulo × Evento) explícitos e no início.
- Três tipos de módulo (Clínicos/Operacionais/Sistema) definidos.
- Mapa dos módulos com categoria e modelo próprio.
- Hierarquia de navegação (Módulo→Lista→Detalhe→Edição) e estrutura de página.
- Checklist obrigatório para novos módulos + casos aplicados.
- Responsabilidade única declarada por módulo.
- Design System **fora** do UX-001 (referência ao DS-001).
- Recursos de Saúde desenhado como módulo próprio.
- Freeze definido.
