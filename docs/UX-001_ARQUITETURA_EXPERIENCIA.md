# UX-001 — Arquitetura da Experiência (Constituição da Interface)

**Status:** Especificação (documento apenas — sem código). Base para o **congelamento da arquitetura funcional** antes do KG v2 — Parte 3.
**Origem:** decisão da fundadora (07/07/2026): consolidar num único documento as decisões de nomenclatura, navegação, módulos, Design System, listas, formulários e responsividade — a "constituição" da interface — para que o KG v2 passe a consumir uma organização estável.
**Sequência:** UX-001 (spec) → Implementação → **Freeze da arquitetura funcional** → KG v2 Parte 3 → Implementação do KG.
**Herda:** [[PLANO_MATURIDADE_PRE_MOBILE]] (§0 Governança Científica, §0.1 SSOT, §3 modelo orientado a eventos) e o feedback de consistência de layout.

---

## 1. Princípios

1. **Simplicidade (mobile-first).** Cada tela é projetada primeiro para o celular: poucos toques, leitura rápida, mínimo de altura. O desktop é a expansão, nunca a origem.
2. **Consistência.** O mesmo problema tem a mesma solução em toda a plataforma: mesmos componentes, mesma hierarquia, mesmos espaçamentos, mesma tipografia. Um vocabulário visual único.
3. **Terminologia neutra (RDC 657/2022).** A interface **organiza, não diagnostica**. Evita termos que sugiram juízo clínico ("problema", "risco", "alterado", "perigoso", "diagnóstico"). Prefere termos factuais e amplos ("condição", "registro", "acompanhamento").
4. **Um conceito = um módulo.** Cada entidade de 1ª classe (Condição, Medicamento, Recurso, Procedimento…) tem seu **próprio modelo de dados** e seu próprio lugar. É proibido misturar entidades diferentes na mesma tabela/tela por conveniência.
5. **SSOT do metadado clínico.** Nomes, categorias, unidades, ícones, ordenação de metadados clínicos vêm do Catálogo Científico — nunca duplicados na interface (herda §0.1 do Plano de Maturidade).
6. **Modelo orientado a eventos.** A jornada é uma linha do tempo de eventos de saúde; a interface é projeção desse modelo, não a fonte da verdade.

---

## 2. Mapa Completo dos Módulos

Cada módulo é uma **entidade de 1ª classe** com modelo de dados próprio. Distinção fundamental entre **módulo** (entidade com página própria) e **tipo de evento** (categoria dentro da linha do tempo Agenda/Histórico).

| Módulo | Conceito (o que representa) | Grupo de menu | Modelo de dados (tabela) |
|---|---|---|---|
| **Painel Inicial** | Visão geral / porta de entrada | Painel | (agrega) |
| **Agenda** | Eventos **futuros** da jornada | Minha Saúde | `health_events` (futuros) |
| **Histórico** | Eventos **passados** + Evolução | Minha Saúde | `health_events` (passados), `exams`, biomarcadores |
| **Exames** | Laudos e documentos + extração IA | Minha Saúde | `exams`, `biomarkers` |
| **Medicamentos e Suplementos** | O que a pessoa **toma** (tratamento) | Minha Saúde | `medications` (kind: medicamento, suplemento) |
| **Condições de Saúde** | O que a pessoa **tem** (próprias + familiares) | Meu Perfil | `health_conditions` |
| **Recursos de Saúde** *(novo)* | Recursos **utilizados** para cuidado, compensação funcional ou monitoramento | Meu Perfil | *modelo próprio (novo — §"Recursos de Saúde")* |
| **Hábitos** | Estilo de vida (atividade, sono, tabagismo…) | Meu Perfil | `life_habits` |
| **Medidas Corporais** | Peso, altura, IMC, composição corporal | Meu Perfil | `body_metrics` (corporais) |
| **Sinais Vitais** | Pressão, FC, glicemia, SpO₂, temperatura | Meu Perfil | `body_metrics` (vitais) |
| **Ciclo e Contracepção** | Menstruação + métodos contraceptivos | Meu Perfil | (ciclo) |
| **Despesas** | Valores dos eventos/compras (projeção financeira) | Organização | `health_events` c/ valor (projeção) |
| **Relatórios** | Compilação factual para o profissional | Organização | (agrega todos) |
| **Configurações** | Conta | Configurações | — |

**Tipos de evento** (dentro de Agenda/Histórico, NÃO são módulos): consulta, retorno, procedimento, cirurgia, vacina, exame, plano de saúde, medicação (lembrete de recompra), outro. Fonte única de rótulos: `@/lib/agenda` (`typeLabel`).

**Correção estrutural definida por UX-001:** óculos e lentes (`eyeglass_prescriptions`), hoje embutidos na página de Condições, **migram para Recursos de Saúde**. Condição ≠ recurso (ceratocone é condição; lente escleral é recurso).

---

## 3. Modelo de Navegação

**Menu lateral** — agrupado pelo modelo mental da usuária (sem jargão):
- **Painel** — Painel Inicial.
- **Minha Saúde** (o que ela faz/acompanha na jornada) — Agenda · Histórico · Exames · Medicamentos e Suplementos.
- **Meu Perfil** (quem ela é em termos de saúde) — Condições de Saúde · **Recursos de Saúde** · Hábitos · Medidas Corporais · Sinais Vitais · Ciclo e Contracepção.
- **Organização** (gestão) — Despesas · Relatórios.
- **Configurações** — conta.

**Acesso rápido (Painel Inicial)** — os módulos de uso mais frequente: Histórico · Agenda · Exames · Medicamentos · Relatórios · Despesas. (Ciclo e demais itens de perfil não entram no acesso rápido — são consulta menos frequente.)

**Relatório** — espelha os módulos como seções selecionáveis; usa os mesmos rótulos do menu (SSOT de nomenclatura).

Regra: **rota ≠ rótulo.** URLs (ex.: `/dashboard/gastos`, `/dashboard/condicoes`) são estáveis e não mudam com renomeações de rótulo.

---

## 4. Padrão de Página

Toda página de listagem segue a **hierarquia fixa**, montada só com primitivos:

```
PageShell  (max-w-2xl · px-4 py-8 · space-y-6)
  1. PageHeader   → eyebrow (ícone + rótulo) · Título (h1) · Subtítulo (LARGURA TOTAL) · ação
  2. Toolbar      → filtros / segmentação (ViewModeSwitcher)
  3. Conteúdo     → listas de cards (ListCard) agrupadas
  4. Ações        → nos próprios cards (não há barra de ação global)
  (EmptyState quando não há conteúdo)
```

- **Subtítulo em largura total** (nunca espremido ao lado do botão).
- **Escala de espaçamento única:** entre seções `space-y-6`; header→conteúdo e dentro de grupo `space-y-3`; título→subtítulo `mt-1`.
- Componentes: `PageHeader`, `EmptyState` (padrão único).

---

## 5. Padrão de Lista

- **`ListCard`** (card de 2 camadas, mobile-first):
  - Linha 1: [ícone] **Nome** dominante (`break-words` + `line-clamp-2`, **nunca** `break-all`) · trailing (valor/status).
  - Linha 2: meta secundária (categoria • data • detalhe).
  - Linha 3: **chips** compactos (`CardChip`, tons: sage/petal/gold/mauve/neutral).
  - Linha 4: ações discretas à direita (ícones 12px, `text-mauve/40`).
- **Segmentação** via **`ViewModeSwitcher`** (componente único): Por data · Por tipo · Por situação · Ano — conforme o módulo. Padrão inicial por módulo e **preferência persistida** por módulo (`useStickyView`/localStorage).
- **Agrupamento** com ordem **fixa** (não alfabética/oportunista): ex. "Por tipo" = Consultas · Exames · Procedimentos · Medicamentos · Suplementos · Vacinas · Outros.
- Listagem mostra **só o essencial**; detalhes completos só na edição.

---

## 6. Padrão de Formulário

- Pares de campos: `grid-cols-1 sm:grid-cols-2` (empilham no mobile, nada sobreposto/comprimido).
- Campo com botão ao lado (ex.: "Falar"): input `flex-1 min-w-0` para o botão não ser empurrado.
- Rótulo `text-xs text-mauve/70` acima do campo; campo `rounded-xl` `bg-ivory`.
- Espaçamento entre campos uniforme (`space-y-3`).
- Situação/estado editável **no formulário** (na lista é badge, não seletor).
- Voz (`VoiceInput`) só onde acrescenta valor (nome, observações); com feedback de permissão de microfone.

---

## 7. Padrão de Nomenclatura

**Regras:** neutra (RDC 657) · curta · consistente com o menu · sem conotação negativa · um conceito por nome.

**Decisões consolidadas:**
| Antes | Depois | Motivo |
|---|---|---|
| Problemas de Saúde | **Condições de Saúde** | "problema" sugere diagnóstico/negativo; "condições" é amplo e factual |
| Gastos / Gastos com Saúde | **Despesas** | preciso; contexto já é saúde |
| Dispositivos (dentro de Medicamentos) | **Recursos de Saúde** (módulo próprio) | óculos/marcapasso/prótese não são medicamento; recurso ≠ condição |
| "Medicamentos, Suplementos, Produtos e Dispositivos" | **Medicamentos e Suplementos** | Produtos/Dispositivos saem para Recursos de Saúde |

---

## 8. Responsividade

- **Mobile-first**, breakpoint único `sm` (640px). Mesmo componente serve os dois formatos.
- **Mobile:** compacto, vertical, leitura rápida — cabeçalho empilha (subtítulo full-width), cards baixos, ações discretas, campos em 1 coluna.
- **Desktop:** aproveita a largura — cabeçalho lado a lado, cards mais largos (nome em 1 linha), campos em 2 colunas, chips na mesma linha.
- Nenhum texto quebra palavra; nenhum elemento estoura o card; nenhuma coluna fixa espreme o conteúdo.

---

## 9. Critérios para Criação de Novos Módulos

Antes de criar qualquer coisa nova (ex.: Vacinas, Alergias, Internações, Histórico Familiar), aplicar esta **árvore de decisão** — evita crescimento oportunista da arquitetura.

**Passo 1 — É um conceito distinto?** Se é a mesma coisa com outro nome de um módulo existente → é o módulo existente.

**Passo 2 — Tem modelo de dados próprio e significativo?** Se os atributos são substancialmente diferentes dos de qualquer módulo existente (não caberia sem encher de campos nulos/regras condicionais) → candidato a **módulo novo**. Se são poucos campos que cabem num módulo existente → é **atributo/sub-item**, não módulo.

**Passo 3 — Acontece numa data (evento) ou é um estado contínuo?**
- **Evento pontual** (ocorre numa data, entra na linha do tempo) → é **tipo de evento** dentro de Agenda/Histórico (ex.: consulta, vacina, internação, cirurgia). **Não** vira módulo próprio.
- **Estado/registro contínuo** (a pessoa "tem"/"usa" ao longo do tempo) → candidato a **módulo de perfil** (ex.: condição, recurso, hábito).

**Passo 4 — Justifica entrada no menu?** Volume de uso e clareza mental. Se raro/marginal, pode ser sub-seção de um módulo maior, não item de menu próprio.

**Aplicação (decisões de referência):**
| Ideia | Decisão | Por quê |
|---|---|---|
| **Recursos de Saúde** | **Módulo novo** | conceito distinto + modelo próprio + estado contínuo ("usa") |
| **Vacinas** | **Tipo de evento** (Agenda/Histórico) | ocorre numa data; já existe como event_type |
| **Procedimentos** | **Tipo de evento** | ocorre numa data (na jornada) |
| **Internações** | **Tipo de evento** | ocorre num período/data |
| **Alergias** | **Sub-item de Condições de Saúde** (ou atributo) | é um tipo de condição; não justifica módulo/tabela própria de início |
| **Histórico Familiar** | **Sub-seção de Condições de Saúde** (já é o `scope=familiar`) | mesma entidade, escopo diferente |

---

## Anexo A — Desenho do módulo "Recursos de Saúde" (para o ciclo de implementação)

**Conceito:** recursos utilizados pela pessoa para **cuidado, compensação funcional ou monitoramento** — o que ela *usa*, não o que ela *tem* (condição) nem *toma* (medicamento).

**Sub-tipos (taxonomia controlada):**
| Sub-tipo | Exemplos |
|---|---|
| Correção visual | óculos, lentes de contato, lente escleral |
| Dispositivos médicos | marca-passo, CDI, bomba de insulina, sensor contínuo de glicose, neuroestimulador |
| Próteses e órteses | prótese, órtese, palmilha, aparelho ortodôntico |
| Auxílios | aparelho auditivo, bengala, muletas, andador, cadeira de rodas |
| Compressão e suporte | meia compressiva, colar cervical, faixa, colete |

**Modelo de dados — próprio (NÃO reutilizar `medications`).** Motivo: dose/frequência/forma farmacêutica/via/recompra/prescritor/conteúdo da embalagem não fazem sentido para óculos/marcapasso/prótese; reaproveitar geraria tabela cheia de nulos e regras condicionais, e prejudicaria o KG v2. Modelo indicativo (a detalhar na implementação):
`resource_id · user_id · resource_type (sub-tipo) · name · brand · started_on · until_date · status · notes · attributes (JSON específico do sub-tipo, ex.: grau para correção visual)`.

**Migração:** os dados de `eyeglass_prescriptions` (óculos/lentes) migram para Recursos de Saúde (correção visual), saindo da página de Condições.

**UI:** página própria "Recursos de Saúde" (grupo Meu Perfil), montada com os primitivos do Design System (PageHeader, ListCard, ViewModeSwitcher por sub-tipo, EmptyState). A página de Medicamentos passa a ser **Medicamentos e Suplementos** (kinds: medicamento, suplemento).

---

## Congelamento (após a implementação do UX-001)

Concluída a implementação, a **arquitetura funcional é congelada**: qualquer novo desenvolvimento respeita este documento (módulos, navegação, nomenclatura, Design System, padrões de página/lista/formulário) e os critérios da §9. Alterações estruturais exigem revisão explícita desta constituição — não ajustes pontuais.

---

## Critérios de Aceite (do UX-001)

- Todos os módulos mapeados, cada um com conceito e modelo próprios definidos.
- Nomenclatura consolidada e neutra (RDC 657).
- Navegação (menu, acesso rápido, relatório) coerente e única.
- Design System declarado como padrão oficial (componentes únicos).
- Padrões de página, lista, formulário e responsividade documentados.
- Critérios objetivos para novos módulos (§9) definidos e aplicados aos casos conhecidos.
- "Recursos de Saúde" desenhado como módulo próprio, pronto para implementar.
