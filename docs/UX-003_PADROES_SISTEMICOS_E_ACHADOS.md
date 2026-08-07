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
