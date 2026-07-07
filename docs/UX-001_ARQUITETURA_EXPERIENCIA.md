# UX-001 — Arquitetura Funcional da Plataforma (Constituição)

**Status:** 🔒 **ARQUITETURA FUNCIONAL CONGELADA** (07/07/2026) — implementada e em vigor a partir deste ciclo. Base para o KG v2 — Parte 3. Alterações estruturais exigem revisão explícita desta constituição (§9).
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

**Menu lateral** (agrupado pelo modelo mental da usuária):
- **Painel** — Painel Inicial.
- **Minha Saúde** *(estado-perfil: o que a pessoa **é/tem** de forma contínua)* — Condições de Saúde · **Recursos de Saúde** · Medidas Corporais · Sinais Vitais · Hábitos · Ciclo e Contracepção.
- **Acompanhamento** *(a jornada no tempo e os registros clínicos)* — Agenda · Histórico · Exames · Medicamentos e Suplementos.
- **Organização** — Despesas · Relatórios.
- **Configurações**.

*(Decisão desta versão: "Minha Saúde" passou a designar o **estado-perfil clínico** — reúne Condições, Recursos, Medidas, Sinais, Hábitos e Ciclo, cada um independente. Os módulos de jornada/registro migraram para o grupo **Acompanhamento**. Ciclo e Contracepção fica em Minha Saúde por ser estado-perfil contínuo, como Medidas/Sinais.)*

**Acesso rápido (Painel Inicial):** os módulos mais frequentes — Histórico · Agenda · Exames · Medicamentos · Relatórios · Despesas.
**Relatório:** espelha os módulos como seções, com os mesmos rótulos do menu.
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
