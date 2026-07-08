# REL-001 — Central de Relatórios (Central de Comunicação da Saúde)

**Status:** 🔒 **CONGELADA — documento oficial do projeto** (aprovada 07/07/2026). Não abrir novas rodadas de refinamento. Iniciativa da **Onda 0.5** do [[roadmap_ondas_core]] ("Relatório Médico + Ver exame original").
**Depende de:** **Gate O0** (Arquitetura Funcional Congelada — UX-001 homologado + merge). A **implementação** começa após o Gate O0.
**Herda (congelado, não reabre):** [[UX-001]] (arquitetura funcional + princípio 9 "nome único") · [[DS-001]] (componentes/layout) · Roadmap por Ondas (governança) · ADR-017 (proveniência científica).
**Posicionamento regulatório (RDC 657):** rastreabilidade **factual** — organizar e dar acesso ao documento de origem. **Nunca** interpretação clínica (isso é Onda 1/2/4, atrás do Gate R).

---

## 0.0 Enquadramento arquitetural — CAMADA DE COMUNICAÇÃO DA SINTERA (fundadora, 07/07)

Esta frente é, oficialmente, a **Camada de Comunicação da Plataforma** — responsável por **transformar os dados organizados pela plataforma em diferentes formas de apresentação**. O **Relatório é apenas o primeiro consumidor**. A mesma infraestrutura alimentará: compartilhamento por link · compartilhamento para médicos · exportação PDF · impressão · e-mail · WhatsApp · integração com prontuários · timeline compartilhada · APIs futuras · IA contextual.

**Regra permanente desta frente:** ao implementar qualquer coisa aqui, perguntar — *"Estou construindo uma capacidade reutilizável da plataforma ou uma solução específica do Relatório?"*. Se for específica → **parar e abstrair antes**.

**Capacidades transversais (construir como infraestrutura única, nunca por módulo):**
- **Proveniência** (`@/lib/provenance`) — 5 níveis; módulos só implementam adaptadores. **REGRA ARQUITETURAL DEFINITIVA (permanente):** *toda informação apresentada deve possuir uma **origem identificável**; e sempre que existir um documento original associado, ele deverá estar acessível ("Ver documento original") em **qualquer** consumidor da Camada de Comunicação* (Relatório · PDF · compartilhamento · impressão · Timeline compartilhada · integrações) — mesma lógica, sem implementação específica por módulo. **Layout pronto para o nível 5:** cada seção/bloco pode futuramente receber uma área **"Referências científicas relacionadas"** (alimentada pelo KG v2/SRL), hoje oculta, sem reformulação do relatório. Abrange: exames laboratoriais e de imagem · **exames de ômica/metabolômica** · laudos · receitas médicas · receitas de medicamentos/suplementos · prescrições de óculos/lentes/dispositivos · qualquer documento emitido por profissional de saúde. **LACUNA DE ARMAZENAMENTO (decisão da fundadora — fora do escopo desta entrega):** hoje só `exams` e `health_resources` armazenam o documento (`file_url`); `omics_panels` e `medications` **não têm** coluna/captura de documento — por isso ômica e receitas de medicamentos ainda não exibem o link (não é tratamento diferente: o documento não é salvo). Quando o armazenamento for adicionado a esses fluxos, o link passa a aparecer **automaticamente** pela mesma camada, sem mudança nos consumidores. **Solução definitiva (decisão da fundadora, 07/07):** em vez de `file_url` por tabela, criar um **repositório ÚNICO de documentos** (`health_documents`) — documento = ativo de 1ª classe; módulos apenas referenciam; a Proveniência consome por referência. Registrado em **[[DOC-001]]** (backlog arquitetural, não implementar agora).
- **Seleção** (`SelectionToolbar` + estado) — seleção em massa/exportação/compartilhamento.
- **Ordenação** — infraestrutura ÚNICA: cada módulo declara campos ordenáveis, ordenação padrão e agrupamentos; Agenda/Histórico/Exames/Recursos/Medicamentos/Despesas usam o mesmo mecanismo.
- **Filtros e agrupamentos** — mesma abstração comum (filtros · agrupamentos · ordenação · seleção), usada em toda a plataforma.
- **Contexto Temporal** (`@/lib/communication/period` + `PeriodSelector`) — o Período representa oficialmente o **Contexto Temporal da comunicação**, não apenas um filtro de datas. **Parâmetro oficial e ÚNICO** da comunicação: Todo o histórico · 30 dias · 90 dias · 6 meses · 1 ano · Intervalo personalizado. Aplica-se a **todos os módulos temporais** (Agenda · Histórico · Exames · Medicamentos · Recursos com data · Procedimentos · Despesas · Sinais Vitais · Medidas · Hábitos com histórico · Ciclo). Reutilizável por PDF · compartilhamento · impressão · Timeline compartilhada · Dashboards · APIs. **Nenhum mecanismo paralelo de período** — todo consumidor usa esta infraestrutura. O contexto **é informado ao destinatário** abaixo do título ("Período: …").
  - **Estados permanentes:** condições atuais e itens **em uso** aparecem **independentemente** do período; entidades **encerradas** só aparecem se a janela de atividade **cruzar** o intervalo (`overlapsPeriod`).
  - **Evoluções de contexto futuras (previstas, modelagem aberta — NÃO agora):** desde a última consulta · desde o último relatório · desde determinado exame · durante um tratamento · durante uma gestação · durante uma internação · antes/depois de um procedimento.
  - **Resumo do período (previsto, NÃO nesta entrega):** logo abaixo do período, um resumo executivo ("Neste período: 8 exames · 2 consultas · 3 medicamentos · 1 procedimento · 4 medições").
  - **Filtros temporais futuros (previstos):** apenas ativos · apenas alterações no período · apenas exames alterados · apenas medicamentos em uso · apenas determinado profissional · apenas determinada condição.

**Perfis de Comunicação (não "configuração salva"):** os templates são **Perfis de Comunicação**. Arquiteturalmente, **primeiro os perfis OFICIAIS da plataforma** (Consulta médica · Segunda opinião · Emergência · Viagem · Compartilhamento familiar · Seguro · Perícia · Pesquisa clínica), **depois** os personalizados pelo usuário.

---

## 0. Diretrizes oficiais complementares (congeladas)

**Nome oficial do módulo: "Relatório"** (nunca "Relatório de Saúde"). A SINTERA **não emite avaliação nem parecer clínico** — organiza e apresenta os registros e documentos inseridos pela usuária. Aplicar "Relatório" de forma consistente em: menu · título da página · breadcrumbs · Home (atalhos) · compartilhamento · PDF · cabeçalhos · links internos.
**Diretriz permanente de nomenclatura:** em qualquer dúvida de nome, priorizar termos que descrevam a **função da plataforma** — *organiza · registra · estrutura · relaciona · apresenta* — e **nunca** uma interpretação clínica (a plataforma não diagnostica, não interpreta, não emite pareceres). Coerente com a RDC 657 e com o princípio 9 do UX-001 (nome único por módulo).

1. **Relatório = funcionalidade de primeira classe.** Não é "uma tela que gera PDF": é a **central oficial de compartilhamento** das informações de saúde da SINTERA. Toda evolução futura de compartilhamento parte desta arquitetura.
2. **Organização única e oficial.** A árvore de seleção espelha **integralmente** o menu lateral. Menu · Relatórios · Home · navegação futura têm **uma só** organização (ordem/nomenclatura/hierarquia) — UX-001.
3. **Documento original = requisito obrigatório.** Sempre que houver documento associado (exames · receitas · laudos · documentos escaneados · prescrições), o item **deve** dar acesso ao original. Sem documento (autorrelato) → informar claramente a **origem**. **Nunca** links fictícios.
4. **Pensado para médicos.** Privilegiar rapidez de leitura · rastreabilidade · organização · navegação simples · confiança na origem. **Pergunta de validação:** *"Um médico conseguiria compreender rapidamente a história clínica do paciente usando apenas este relatório?"* — se não, revisar a implementação.
5. **Preparado para o futuro (estrutura, não implementação).** A arquitetura já prevê documento original · origem · espaço para referências científicas · espaço para contextualização — **sem construí-los agora** (KG v2 / SRL / IA = Ondas 1/2/4, Gate R). Preparar para receber sem refatorar.
6. **Templates personalizados = parte oficial da spec.** Além dos perfis padrão, a usuária salva os próprios modelos (Consulta médica · Endocrinologista · Nutricionista · Seguro saúde · Viagem · personalizado), memorizando toda a configuração de seleção.
7. **Etapa encerrada.** REL-001 é documento oficial e congelado. Sequência: concluir **Gate O0** (merge + freeze do UX-001) → implementar a REL-001 na **Onda 0.5** → só então retomar o **KG v2 — Parte 3**.

---

## 1. Propósito — mudança de paradigma

Hoje a página de Relatórios é um **local para marcar o que entra no PDF** (lista de checkboxes). Ela passa a ser a **central oficial de compartilhamento das informações de saúde da usuária** — o ponto único onde ela decide *o que*, *para quem* e *como* compartilha, sempre com acesso ao documento de origem.

**Revisão completa da experiência** (não ajustes pontuais), preservando a arquitetura congelada.

## 2. Princípios permanentes (critério definitivo)

1. **Mesma arquitetura do menu lateral** — a árvore de seleção é idêntica ao menu (ordem, nomenclatura, hierarquia). Reduz carga cognitiva (princípio 9 do UX-001).
2. **Rastreabilidade completa** — sempre permitir acessar o documento de origem; nunca só o resultado resumido.
3. **Seleção simples mesmo com muitos registros** — comandos rápidos, perfis e templates.
4. **Preparada para KG v2 / SRL / IA contextual** sem refazer a interface — a estrutura já reserva o lugar da camada científica, sem construí-la agora.

## 3. Estrutura de seleção = espelho do menu

Árvore idêntica ao menu lateral, **mesma ordem e nomenclatura**:
```
Acompanhamento
   Agenda · Histórico · Exames · Medicamentos e Suplementos
Minha Saúde
   Condições de Saúde · Recursos de Saúde · Medidas Corporais · Sinais Vitais · Hábitos · Ciclo e Contracepção
Organização
   Despesas · Relatórios
```
- Cada **grupo** e cada **categoria** é **expansível/recolhível** (não uma lista plana de checkboxes).
- Categorias com itens (Exames, Medicamentos, Recursos…) permitem **selecionar item a item**:
```
▾ Exames        ☑ Hemograma  ☑ Ferritina  ☐ Vitamina D  ☑ PCR
▾ Medicamentos  ☑ Lamitor    ☑ Restasis   ☐ NAC
```
- Selecionar um grupo/categoria = selecionar seus filhos (tri-state: todos / alguns / nenhum).

## 4. Rastreabilidade documental (requisito central)

- Todo **exame** listado é **clicável** e abre o **documento de origem** — PDF, imagem ou documento armazenado. Nunca apenas o resultado resumido.
- Cada item mostra a **origem/fonte** de forma discreta:
```
Hemograma completo · 15/06/2026 · Laboratório Hermes Pardini        [ Ver exame original ]
```
```
Origem: Receita médica                                              [ Ver documento ]
```
- **Regra de graça (correção):** onde existe documento armazenado → link "Ver original". Onde **não** existe (registro autorrelatado, ex.: medida digitada) → exibir **"Origem: autorrelato"** sem link falso. A cobertura de documento por fonte é confirmada na implementação (exams, recursos e demais com arquivo anexado; registros sem arquivo mostram origem).

## 5. Experiência de seleção

Cinco comandos rápidos: **Selecionar tudo · Limpar seleção · Restaurar padrão · Expandir tudo · Recolher tudo**.
Dentro de **Exames**, ordenar por: **Data · Laboratório · Categoria** (facilita localizar um exame específico em muitos registros).

## 6. Perfis de relatório (presets)

Perfis que **marcam itens automaticamente** (a usuária ainda edita manualmente):
`Consulta médica` · `Resumido` · `Nutricionista` · `Endocrinologista` · `Completo`.

## 7. Templates salvos (personalizados) — alto valor

Além dos perfis padrão, a usuária **salva configurações próprias** que memorizam exatamente quais seções e documentos incluir:
`Consulta com Dra. Ana` · `Seguro Saúde` · `Viagem Internacional` · `Avaliação esportiva`.
Reduz muito o trabalho de quem compartilha repetidamente com os mesmos profissionais.

## 8. Prévia + tamanho estimado

- **Prévia da estrutura** antes de gerar (páginas: Resumo · Condições · Medicamentos · Exames…).
- **Tamanho aproximado**: `48 páginas · 22 exames · 6 medicamentos · 4 condições · 3 recursos · 8 documentos anexos`. Evita gerar relatórios enormes sem perceber.

## 9. Integração com o Histórico (SSOT)

Quando um exame/procedimento/consulta aparece no Histórico, o relatório **reutiliza exatamente aquele registro** — **uma única representação** da informação (sem duplicar). Coerente com o modelo canônico e o SSOT.

## 10. Compartilhamento profissional

`Gerar PDF` · `Compartilhar por link seguro` (temporário — **primeira opção**) · `Exportar impressão` · `Revogar acesso`.
Reusa a infraestrutura existente de `report_shares` (link com expiração/revogação).

## 11. Layout do relatório (DS-001)

Cada seção segue a mesma arquitetura da plataforma:
```
Título → Resumo curto → Conteúdo → Documento original
```
Nunca listas longas sem hierarquia visual.

## 12. Preparação para a camada científica (RDC 657)

Quando o KG v2 / SRL entrarem (Ondas 1–2), a interface já reserva a **separação obrigatória**, sem misturar:
```
Resultado do exame → Documento original → Referências científicas
```
**Nesta iniciativa (Onda 0.5) NÃO se constrói interpretação** — só a estrutura visual que a acomodará depois (atrás do Gate R). A plataforma organiza; não interpreta.

## 13. Modelo de dados

- **Nova tabela `report_templates`** (`id · user_id · name · selection JSONB · created_at`) — guarda seções/itens/documentos do template salvo. Perfis padrão = presets em código; templates = dados da usuária.
- **Reuso** dos documentos já armazenados (exams e demais fontes com arquivo/`file_url`); sem duplicar. Confirmar na implementação a cobertura de "documento original" por fonte.
- Compartilhamento reusa `report_shares` (existente).

## 14. Posicionamento no roadmap & fronteiras

| Ponto | Onda / Trilha | Depende de | Nota |
|---|---|---|---|
| 1 Árvore = menu · 2 expansível · 5 comandos/ordenação · 11 layout DS-001 | Onda 0.5 (core) | Gate O0 | UX puro sobre estrutura pronta |
| 3 Ver exame original · 4 origem/fonte · 9 integrar Histórico | Onda 0.5 (core) | Gate O0 | rastreabilidade factual (ADR-017) |
| 6 Perfis · 7 Templates salvos · 8 prévia/tamanho | Onda 0.5 (core) | Gate O0 | inclui `report_templates` |
| 10 Compartilhamento profissional | Onda 0.5 (core) | `report_shares` | link seguro = 1ª opção |
| 12 Rastreabilidade científica (Resultado→Documento→Referências) | **Prepara** agora; **constrói** na Onda 1/2/4 | KG v2 / SRL | interface reserva o lugar; **sem interpretação** (Gate R) |

**Fora de escopo deste ciclo:** interpretação científica/IA (Ondas 1/2/4); integrações clínicas externas / FHIR (Onda 5).

## 15. Critérios de aceite

- Árvore de seleção idêntica ao menu (ordem/nomenclatura/hierarquia), expansível por grupo e por item.
- Todo item com documento abre o **original**; itens sem documento mostram **origem** (sem link falso).
- Cinco comandos de seleção + ordenação de Exames (data/lab/categoria).
- Perfis padrão + **templates salvos** funcionando (marcam/editam a seleção).
- Prévia da estrutura + tamanho estimado antes de gerar.
- Compartilhamento: PDF · link seguro (revogável) · impressão.
- Layout por seção (Título→Resumo→Conteúdo→Documento) no padrão DS-001.
- Separação Resultado→Documento→Referências **preparada** (sem interpretação nesta onda).
- `tsc` limpo · `ESLint` limpo · testes verdes · sem regressão no relatório atual.
