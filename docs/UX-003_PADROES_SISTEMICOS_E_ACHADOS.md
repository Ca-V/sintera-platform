# UX-003 — Padrões sistêmicos (vinculantes) + achados da homologação

> Origem: homologação da fundadora (06/08). Muitos "erros" são **a mesma família**, repetida em várias páginas.
> Este doc registra **3 padrões sistêmicos** que passam a valer em **TODA a plataforma (Web+Mobile)** — para não
> precisar reportar página por página — e mapeia os achados específicos a eles. Aplicados na **evolução funcional**
> dos módulos (ADR‑021). Complementa UX‑002 · MOBILE‑037 (D‑14/D‑16/D‑19).

## Padrões sistêmicos (aplicar em CADA módulo, sem exceção)

### PS‑1 — Seletor universal (picker) para qualquer campo com opções — [D‑16/D‑19]
Todo campo que ofereça **mais de uma opção** usa o **seletor rolável** (toca → rola → escolhe), **nunca** uma lista
aberta na tela. Vale para **filtros** (status do exame, data/período) **e** para **campos de formulário** (forma
farmacêutica, dia, lembrete, recompra, tipo, frequência, laboratório, médico, categoria, recorrência…). Componente
único do DS: `Select` (Mobile bottom‑sheet / Web dropdown), com busca quando a lista for grande.

### PS‑2 — Protocolo único de entrada (todo "Adicionar") — [D‑14]
Todo **"Adicionar"** abre o **mesmo hub de captura**, com as mesmas opções da Web, **antes** de qualquer formulário:
**selecionar arquivo (PDF/foto) · tirar foto · digitar manualmente · falar (voz)**. **Proibido** ir direto para os
campos de digitação manual (como está hoje em vários módulos do Mobile). Vale para exames, medicamentos, suplementos,
eventos, composição, documentos — qualquer módulo.

### PS‑3 — Nomenclatura / copy / taxonomia idênticas Web↔Mobile
Rótulos de botão, **frases (copy)**, opções e taxonomia **iguais** nas duas plataformas. Fonte da verdade = a Web
(referência), com a lógica/labels no núcleo compartilhado quando possível (SSOT). Nada de "Adicionar" numa ponta e
"Novo X" na outra; nada de frase de estado diferente entre as plataformas.

## Achados específicos desta rodada (todos são instâncias dos padrões acima)

| ID | Módulo · plataforma | Achado | Padrão |
|---|---|---|---|
| H‑1 | **Exames (Mobile)** | Filtros de **status** e **data** aparecem como cards/opções **expostos** no topo (parede) | **PS‑1** — status e data viram seletor rolável |
| H‑2 | **Adicionar exame (Web×Mobile)** | Opções e nomes divergem: Mobile "escolher documento / usar câmera"; Web "selecionar arquivo PDF ou foto / tirar foto" | **PS‑2 + PS‑3** — mesmas opções e nomes do protocolo único |
| H‑3 | **Pedidos de exame (Mobile)** | Mobile **não tem** a aba/seção de **Pedidos de exame** (Web tem) — não é possível inserir pedidos | **Paridade** — adicionar Pedidos ao Mobile |
| H‑4 | **Agenda (Web×Mobile)** | Botão: Web **"Adicionar"** × Mobile **"Novo evento"**; a **frase de Pendências** difere entre as plataformas | **PS‑3** — mesmo rótulo e mesma copy |
| H‑5 | **Medicamentos (Mobile)** | Botão **"Adicionar"** (Web = **"Novo medicamento"**); ao adicionar, **opções expostas** (forma/dia/lembrete/recompra) em vez de seletor; e o "Adicionar" vai **direto para digitação manual** | **PS‑1 + PS‑2 + PS‑3** |
| H‑6 | **Composição Corporal (Mobile)** | Botão **"Nova medida"** (Web "Adicionar medida"); add **só digitação manual**; **texto inicial**, **nomes** e **ordem** dos cards divergem da Web; **botão desenquadrado** (formatação — também em **Ciclo e Contracepção**) | **PS‑1/2/3 + formatação (DS)** |
| H‑7 | **Monitoramento (Mobile)** | Falta **Conexões** ("conecte um dispositivo e deixe os dados entrarem sozinhos") — existe na Web; a **copy** precisa ser reformulada (conceito ok, frase ruim) | **Paridade + PS‑3** |
| H‑8 | **Histórico de Exames** | Falta no Mobile a **frase explicativa** do que é o Histórico de Exames (Web tem) | **PS‑3** |
| H‑9 | **Histórico de Exames — exame de IMAGEM** (Web+Mobile) | OCULUS/"Endothelial cells" mostra **toda a extração** (cada dado como se fosse um exame). Deve mostrar **só o cabeçalho‑padrão** (tipo: sangue/imagem · data · laboratório/empresa · nº de medições). Se **imagem** (sem biomarcadores extraíveis) → **NÃO extrair**, só "consultar arquivo original". Vale p/ TODOS os exames, nas 2 plataformas. | **[D‑11/D‑12] CEF modality‑first** |
| H‑10 | **Histórico de Exames (Mobile) — O MAIS IMPORTANTE** | Falta o **acompanhamento longitudinal** que a Web tem (ver detalhamento). É propósito central da plataforma; hoje **não implementado** no Mobile. | **[D‑18/D‑20] paridade** |

### Detalhamento H‑9 / H‑10 — Histórico de Exames (replicar FIELMENTE Web→Mobile)
**Padrão de exibição de cada exame (H‑9):** cabeçalho com **nome · tipo (sangue/imagem/…) · data de realização ·
laboratório/empresa · nº de medições**. **Laboratorial** (tem biomarcador) → extrair replicando o laudo. **Imagem**
(não dá para extrair) → **não extrair**; só **"consultar arquivo original"** + o cabeçalho. Corrigir o OCULUS (que
trata cada informação como um exame) e **todos** os demais, nas duas plataformas.

**Fluxo longitudinal da Web (referência — ex.: Creatinina) que falta no Mobile (H‑10):**
1. **Cartão do exame/indicador:** nome ("Creatinina") · "exame de sangue" · data · total de exames · laboratório.
2. **Datas clicáveis → PÁGINA DO EXAME:** Pedido de origem · Registrar valor · **Resultados estruturados** (extração) ·
   laudo completo (se houver vários, todas as extrações) · **baixar arquivo original**.
3. **Sub‑card do indicador** ("Creatinina · 4 medições · último valor") → **DETALHE DO INDICADOR**: **gráfico** +
   **todas as medições** + **comparativo** entre elas.
→ Este acompanhamento longitudinal (gráfico/comparativo por indicador) é **um dos propósitos centrais** da SINTERA e
deve ser replicado **exatamente** como na Web (`/dashboard/saude` + `/dashboard/saude/[slug]`). Consolida a decisão B
(D‑18/D‑20): Histórico = índice → página do exame **e** página do indicador.

> A fundadora seguirá informando mais achados; todos entram nesta lista e nos padrões acima, para correção no ciclo
> da evolução funcional (módulo a módulo: Agenda → Exames → Minha Saúde…), reusando `Select` (existe) e o novo
> componente de captura (protocolo único). Sem builds soltas — um ciclo, uma build.

## Achados — rodada 3 (H‑12…H‑22)
| ID | Módulo · plataforma | Achado | Padrão/decisão |
|---|---|---|---|
| H‑12 | **Histórico de Exames** — filtro de período | Copy ruim ("Tudo" → algo como **"Período completo"**); só 30/90 dias/1 ano → **mais opções** (6 meses, 2 anos, personalizado); via **seletor** | PS‑1 + PS‑3 |
| H‑13 | **Histórico de Saúde (Mobile)** | Falta **"adicionar evento"**; falta **frase explicativa** (R‑PAGE); divisão só **por data** → **por data E por tipo** (seletor); faltam as ações **Reabrir (desfazer conclusão) · Editar · Incluir** que a Web tem | PS‑1 + R‑PAGE + paridade |
| H‑14 | **R‑ATTACH** (Web+Mobile) | Card de evento no Mobile não tem o **link "anexo"** (Web tem — abre a nota fiscal/laudo original). Instância do princípio R‑ATTACH acima. | **R‑ATTACH** |
| H‑15 | **Rede de Cuidado** (Web×Mobile) | Web abre **direto** o painel de Relatórios; Mobile abre um **menu** (Relatórios + Profissionais/Compartilhamento "em breve"); e a página de Relatório tem **formatação divergente**. + aplicar padrões (cards/ordem/formatação). | ✅ **RESOLVIDO:** ambos **DIRETO → Relatórios** (sem tela intermediária) até a CARE‑002; depois vira menu (Relatórios·Profissionais·Compartilhamentos) |
| H‑16 | **Relatórios** — Histórico de Exames | Ao incluir, mostrar **nome do exame + link ao arquivo**, não toda a extração/biomarcadores; + **busca/filtro** por exame específico | **R‑REPORT‑ENXUTO** |
| H‑17 | **Modelo de dados — Bioimpedância** | Bioimpedância vive em **Composição Corporal** (não listar todas as medidas — só nome+data+link) **mas também é Exame** → deve **projetar em Exames** (lá gera relatório com extração como qualquer exame). Projeção sem duplicação. | **[coerência de dados] [[adr_001_projecao_ssot]]** |
| H‑18 | **BUG — Criar link (compartilhar relatório) Mobile** | "Não foi possível criar — ambiente sem gerador de aleatoriedade seguro" → `randomToken()` falha no RN (sem `crypto.getRandomValues`). **Corrigir** (polyfill/expo‑crypto). O relatório do link deve conter as infos da tela **+ todos os anexos vinculados** (arquivo original). | **BUG + R‑ATTACH** |
| H‑19 | **Configurações** — código de país (telefone) | Códigos **expostos** na tela → **seletor rolável com busca** (todos os códigos) | PS‑1 |
| H‑20 | **Central de notificações** | Só alguns itens → ou **todas** as categorias (email/WhatsApp/ambos/nenhum por categoria) **ou** uma única opção central. | ✅ **RESOLVIDO:** manter **POR CATEGORIA** (Agenda→WhatsApp, Exames→e‑mail, Medicamentos→ambos, Marketing→nenhum…), com **todas** as categorias — NÃO simplificar para canal único global (evita redesenho futuro). Padronizar nas 2 plataformas |
| H‑21 | **Histórico de Exames (Mobile)** — intervalo personalizado | Data personalizada só **digitável** → falta o **calendário** (date picker) como na Web | PS‑1/paridade |
| **H‑22** | **Exportar meus dados** (Web+Mobile) — **requisito funcional crítico** | Erro **401** ao exportar. Não é só bug: a exportação é crítica para a **confiança**. Deve **funcionar nas 2 plataformas**, exportar **exatamente os mesmos dados**, **incluir todos os anexos originais** quando pertinente, e dar **mensagens de erro compreensíveis** em falha de auth. O 401 é tratado **na origem** (autenticação/autorização), não escondido na UI. | **BUG + requisito + R‑PARIDADE FUNCIONAL + R‑DOCUMENTO** |

## Princípios elevados na homologação (regras de sistema, não itens) + H‑11
- **R‑FORM (de H‑6):** TODOS os formulários usam o mesmo padrão de entrada (PS‑1/2/3) — nomenclatura, **hierarquia
  dos botões, componentes de seleção, espaçamento e alinhamento visual**. Sem exceção por módulo.
- **R‑MONITOR (de H‑7):** Monitoramento sempre responde, de imediato, a **duas** perguntas: *"como registrar
  manualmente?"* e *"como conectar um dispositivo?"* — os dois caminhos percebidos na hora.
- **R‑PAGE (de H‑8):** **toda página principal** segue o mesmo esqueleto: **título · frase explicativa · ação principal**.
- **R‑EXTRACT (de H‑9):** a plataforma **NUNCA** apresenta como *"resultado estruturado"* algo ainda não estruturado.
  Etapas distintas: **Imagem → Arquivo → OCR → Extração → Validação → Resultado estruturado**. Extração bruta ≠ exame
  estruturado (confiança; factual — RDC 657).
- **R‑LONGITUDINAL (de H‑10):** o acompanhamento longitudinal é **componente central** e usa **exatamente o mesmo
  componente** (mesma lógica, navegação, interação e **estrutura de dados**) em Web e Mobile — nunca duas versões.
- **H‑11 — Componentes únicos (SSOT de componentes):** toda funcionalidade que exista nas duas plataformas reutiliza o
  **mesmo modelo conceitual** — Página de exame · Página de indicador · Timeline · Longitudinal · Formulários ·
  Seletores · Fluxo de adicionar. **Proibido** implementações paralelas com comportamento diferente. **Web = referência
  funcional; Mobile reusa a lógica (core/SSOT), adaptando só a apresentação ao dispositivo.** Reforça [[adr_001_projecao_ssot]].
- **R‑ATTACH (novo) — anexo sempre acessível:** qualquer registro (evento · exame · medicamento · qualquer produto) que
  tenha um **documento anexado** (nota fiscal, laudo, resultado, comprovante…) exibe, **onde o nome do registro aparece**,
  um **link clicável** para o **arquivo original**. Vale Web **e** Mobile, em todos os módulos e no Relatório.
- **R‑REPORT‑ENXUTO (de H‑16/H‑17) — relatório referencia, não despeja:** ao incluir exames/laudos no Relatório, listar
  **nome do exame + data + link ao arquivo original** — **não** despejar toda a extração/biomarcadores (um laboratorial
  pode ter 50). Extração completa só na **página do exame**. Oferecer **busca/filtro** para gerar relatório de exame(s)
  específico(s) (ex.: só Vitamina D, só ultrassom). Mesmo tratamento para bioimpedância (nome+data+link, não a lista de medidas).
- **R‑DOCUMENTO (novo) — o documento é a origem, ativo permanente:** todo documento original é **ativo permanente** da
  plataforma. Sempre que houver documento associado a registro/exame/evento/medicamento/composição/relatório, ele
  **permanece acessível** por **link ao arquivo original**. As extrações são **derivações** do documento (fundamenta R‑ATTACH/R‑EXTRACT).
- **R‑REPRESENTAÇÃO (novo) — representar o OBJETO, não os atributos internos:** a interface mostra o **objeto principal**
  (ex.: *"Bioimpedância · 08/08/2026 · Abrir arquivo"*), **não** a lista dos seus atributos (Peso/Massa magra/Água/
  Gordura/Taxa metabólica…). Vale para Ultrassom · Ressonância · Tomografia · Laboratório · Ecocardiograma · Bioimpedância.
- **R‑EXAME (novo) — Exame ≠ Biomarcador:** um **Exame** (ex.: "Laboratório Fleury · 15/07/2026") CONTÉM biomarcadores
  (Creatinina, Glicemia, Vitamina D, PCR, TSH…). O Relatório (e a navegação) opera **primeiro no nível do EXAME**; só
  depois, se solicitado, no nível do **biomarcador**. Resolve o laboratorial com dezenas de resultados.
- **R‑PARIDADE FUNCIONAL (novo) — 4º nível de paridade:** além de visual · componentes · modelo de dados, **qualquer
  AÇÃO** disponível numa plataforma deve existir na outra (salvo limitação de device). Ex.: adicionar evento · reabrir ·
  editar · incluir · criar link · exportar dados · abrir anexo · histórico por tipo. É funcionalidade, não interface.

### Gate adicional — COERÊNCIA DO MODELO DE DADOS
Muitos achados (esp. H‑9/H‑10) não são de interface, e sim de **como o dado é representado**. **Critério:** nenhuma
informação pode ser apresentada de forma diferente entre Web e Mobile quando representar o **mesmo objeto de domínio**
(Exame · Indicador · Medição · Medicamento · Evento…). A diferença limita‑se a **layout/adaptação ao device**, nunca ao
**modelo conceitual**. Este gate soma‑se ao de paridade (ADR‑021).

## Critério de aceite (gate — antes de cada build de homologação)
Estes padrões são **regra de sistema**, não correção pontual: aplicam‑se a **todas as telas existentes e futuras**.
Antes de considerar a build pronta, **varredura completa** verificando:
- [ ] **Nomenclaturas** consistentes (botões, títulos, rótulos) Web↔Mobile.
- [ ] **Componentes de seleção** = seletor único em todo campo com opções (PS‑1) — nenhuma lista aberta.
- [ ] **Fluxos de "Adicionar"** = protocolo único idêntico nas duas plataformas (PS‑2).
- [ ] **Textos/copy/mensagens/estados** idênticos para funcionalidade equivalente (PS‑3).
- [ ] **Paridade de funcionalidade** — nada existe em só uma plataforma (ex.: Pedidos de Exame no Mobile).

**Definition of Done (ADR‑021, 5ª regra):** nenhuma funcionalidade é concluída com diferença de UX entre Web e Mobile,
salvo limitação inerente ao dispositivo (câmera, gestos nativos). A homologação não se conclui enquanto houver diferença.

### Validação funcional pré‑build (NÃO basta compilar / testes passarem) — obrigatória
Antes de disponibilizar a build, revisão **funcional** comparando Web×Mobile na experiência real. Confirmar:
- [ ] **Componentes compartilhados** de fato **reutilizados** pelas duas plataformas (não só existentes).
- [ ] **Zero implementações paralelas** para funcionalidades equivalentes (H‑11).
- [ ] **Paridade validada** em: arquitetura · comportamento · nomenclatura · componentes · **modelo de dados**.
- [ ] **Documentos originais acessíveis** em **todos** os pontos onde são referenciados (R‑ATTACH/R‑DOCUMENTO).
- [ ] **Acompanhamento longitudinal** usa o **mesmo componente e a mesma lógica** nas duas plataformas (R‑LONGITUDINAL).
- [ ] **Correção por causa, não sintoma:** onde o mesmo componente/padrão/lógica aparece em **outros** módulos (mesmo
      não citados na homologação), a correção foi aplicada também.
- [ ] Os **novos padrões** passam a ser a **referência** para implementações futuras (este doc + ADR‑021).
> Objetivo desta build: **comportamento consistente por construção** — a próxima homologação deve ser de refinamento,
> não de novas inconsistências estruturais.
