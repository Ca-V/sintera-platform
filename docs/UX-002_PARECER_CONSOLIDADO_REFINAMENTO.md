# UX-002 — Parecer Consolidado de Refinamento (Web + Mobile)

> **Guia definitivo desta fase.** Consolida, sem redundância: (a) a análise crítica das telas/arquitetura; (b) todos
> os achados da homologação; (c) as entregas já feitas; (d) as diretrizes estratégicas da fundadora; (e) os princípios
> permanentes da SINTERA (paridade Web/Mobile, SSOT, protocolo único de entrada, consistência de UX, rastreabilidade,
> escalabilidade). **Numeração canônica** D‑17…D‑21 definida aqui — supera a numeração ad‑hoc do MOBILE‑037 (ver §9).
> Complementa: [[principio_paridade_total_web_mobile]] · REL‑002 · MOBILE‑036 (nav) · DS‑002/DS‑003 · [[adr_001_projecao_ssot]].

---

## 0. Tese central
Os problemas encontrados **não são isolados** — pertencem à mesma família: **não existe ainda uma linguagem de
interação única entre Web e Mobile**. A correção não é tela a tela; é **um Design System único + SSOT + paridade**.
A partir daqui a plataforma entra em **fase de refinamento**: o foco deixa de ser só corrigir defeitos e passa a ser
**consolidar uma experiência consistente, escalável e previsível**.

**Critério de decisão para TODA implementação a partir de agora (nesta ordem):**
1. **Consistência** entre módulos · 2. **Reutilização** de componentes · 3. **Paridade** Web/Mobile ·
4. **Escalabilidade** futura · 5. **Simplicidade** para o usuário.

---

## 1. Baseline — o que já foi entregue
| Entrega | Estado |
|---|---|
| **REL‑002** — Histórico de Exames do **relatório** respeita o período + link público respeita filtro por item | ✅ no ar (typecheck Web+Mobile+packages, 1134 testes, build verde) |
| **Select (D‑16)** — primitivo Mobile: bottom‑sheet rolável com busca (DS‑003, sem regra de negócio) | ✅ criado |
| **Histórico de Exames (Mobile)** — fim da parede de chips; filtros Tipo/Período via Select; cartões = nome + nº de medições | ✅ 1ª iteração — **detalhe ainda expandido no cartão** (interino; será substituído pela **página dedicada**, decisão B — D‑18) |
| **Composição Corporal (Mobile)** — "Estado atual" reformatado (fim do estouro à direita) | ✅ 1ª iteração — **revisão completa da página pendente** (D‑17) |

---

## 2. Decisões de arquitetura CONFIRMADAS (fundadora) — passam a valer para a plataforma
- **A1 · Histórico de Exames = ÍNDICE de acesso.** **Opção B**: cada exame/indicador tem **página própria de detalhe**
  (não expansão no card). Fluxo: `Histórico → filtros → lista → clique no exame → página do exame → documento original
  · resultados estruturados (quando existirem) · evolução longitudinal · comparação · tendências · histórico de
  documentos daquele exame`. **Nunca** expandir automaticamente.
- **A2 · Separar histórico DOCUMENTAL × LONGITUDINAL.** O Histórico **só indexa**; a interpretação longitudinal
  (gráficos, comparações, tendências) vive **dentro da página do exame**. (D‑20)
- **A3 · SSOT + Paridade obrigatórias.** Nenhuma função nasce só‑Web ou só‑Mobile, com componentes/fluxos/nomenclaturas
  diferentes. A lógica mora no **núcleo compartilhado**; Web e Mobile são **camadas de apresentação**.
- **A4 · Design System ÚNICO.** Componentes compartilhados para: seleção (Select), filtros, cards, páginas de detalhe,
  histórico, formulários de cadastro, espaçamentos e tipografia. Sem ajustes isolados por tela.
- **A5 · Protocolo ÚNICO de entrada de dados** (D‑14): **tirar foto · selecionar imagem · selecionar PDF/arquivo ·
  arrastar (quando suportado) · digitar manualmente · voz** — idêntico em **todos** os módulos, Web e Mobile.
- **A6 · Hierarquia de informação:** **valor principal → indicador → data → origem**. Metadados (registro manual,
  informado pela usuária, data…) sempre com **menor** destaque visual. Nunca o contrário.
- **A7 · Select obrigatório** sempre que houver **mais de 4 opções** (D‑19). Fim dos "chips infinitos".

---

## 3. Itens consolidados (numeração canônica)

### D‑17 (P1 · RC1) — Auditoria de Layout e Hierarquia Visual (Web + Mobile)
- **Problema:** elementos "colados" (busca, filtros, chips, cards, secundários) → leitura cansativa, grupos
  indistinguíveis, sensação de excesso. Metadados competem com o valor principal.
- **Correção:** **grid único de espaçamento** — `24 px entre seções · 16 px entre cards · 12 px entre título e
  conteúdo · 8 px entre itens internos`. Aplicar hierarquia A6 em todas as telas. **Composição Corporal** é o caso
  exemplar: `valor` grande, depois `indicador`, depois `data`, depois `origem` (menor).
- **Por quê:** espaçamento e hierarquia definem leitura e agrupamento; padronizados, dão a sensação de "um só DS" e
  reduzem carga cognitiva.
- **Aceite:** grid tokenizado no DS e aplicado; Composição sem texto escorrendo/estourando; metadados visualmente
  subordinados ao valor; amostra representativa de telas (Web+Mobile) revisada.

### D‑18 (P1 · RC1) — Redesign do Histórico de Exames (arquitetura B)
- **Problema:** hoje é **mistura de busca + relatório + histórico + dashboard** na mesma tela; abre já mostrando
  biomarcadores/valores/medições/tendências → quebra o fluxo.
- **Correção (estrutura):**
  1. **Cabeçalho:** busca (campo/Select pesquisável) — sem chips gigantes.
  2. **Filtros (todos Select):** `Tipo · Período · Origem · Ordenação`.
  3. **Lista de exames.** Cada card = **nome do exame · nº de medições · última realização**. Nada mais.
  4. **Clique → PÁGINA do exame** (não expandir). A página contém: documento original · resultados estruturados
     (quando existirem) · evolução longitudinal · comparação · tendências · histórico de documentos daquele exame.
- **Por quê:** separa responsabilidades (índice × interpretação), escala, remove poluição visual e usa o **mesmo
  padrão de navegação** das demais áreas (paridade com a Web `/dashboard/saude/[slug]`).
- **Aceite:** Histórico **não** exibe valores/biomarcadores inline; clique abre **página dedicada**; mesma estrutura
  conceitual em Web e Mobile.

### D‑19 (P1 · RC1) — Padronização Universal dos Selects (complementa D‑16)
- **Regra:** **> 4 opções ⇒ Select** (bottom‑sheet no Mobile, dropdown na Web, **pesquisável**). Nunca listar aberto.
- **Aplicar em:** exames · biomarcadores · medicamentos · suplementos · laboratórios · médicos · especialidades ·
  categorias · tipos (evento/exame) · recorrência · período · origem · status · filtros — **qualquer lista extensa**.
- **Por quê:** um único componente e comportamento = tela limpa, menos manutenção e menos bugs; consistência Web↔Mobile.
- **Aceite:** nenhuma tela lista mais de 4 opções abertas; auditoria confirma o Select em todos os campos elegíveis;
  mesmo comportamento nas duas plataformas.

### D‑20 (P1 na base do D‑18 · conclusão Pós‑RC1) — Arquitetura Documental × Longitudinal
- **Problema:** o Histórico mistura **documento** (exame, data, laboratório, PDF) com **longitudinal** (biomarcadores,
  gráficos, comparações, evolução).
- **Correção:** separar os dois conceitos. `Histórico (índice) → escolho um exame → página do exame → documento OU
  resultados estruturados → histórico daquele exame → comparação longitudinal`.
- **Por quê:** muito mais escalável; evita a "tela que faz tudo"; clareza conceitual.
- **Aceite:** modelo de navegação implementado; Histórico atua só como índice; longitudinal vive na página do exame.

### D‑21 (P2 · Pós‑RC1) — Auditoria Completa de UX (checklist único)
- **Revisão sistemática de TODAS as telas (Web+Mobile)** com um checklist único: alinhamentos · padding · margens ·
  hierarquia tipográfica · contraste · tamanho de botões · consistência de cards · nomenclaturas · ícones ·
  componentes repetidos · comportamento de filtros · de selects · de páginas de detalhe · ordem das informações ·
  consistência Web × Mobile.
- **Por quê:** garantir que toda a plataforma **pareça construída por um único Design System**.
- **Aceite:** checklist aplicado a todas as categorias; divergências corrigidas ou registradas com destino.

### Complementares (mesmo esforço)
- **REL‑002 — Filtros do relatório:** ✅ entregue (RC1).
- **Composição Corporal — revisão completa:** parte do D‑17 (hierarquia A6 em toda a página) — RC1.
- **D‑11/D‑12 — Exames de imagem (OCULUS/Pentacam/microscopia especular):** **não** classificar como laboratorial.
  Extração **modality‑first**: `Documento → classificação → protocolo específico → extração compatível`. Oftalmologia:
  identificar **tipo** · **título** · **data de realização** · **estabelecimento** · **lateralidade (OD/OE)** ·
  **preservar o documento original**. Parâmetros clínicos específicos **só** com modelo oftalmológico dedicado — sem
  extrações parciais/ambíguas. CEF‑001, roda no servidor → afeta Web **e** Mobile. **Correção de classificação = RC1;
  modelo oftalmológico dedicado = Pós‑RC1/roadmap.**
- **D‑14 — Protocolo único de entrada (A5):** princípio agora **vinculante**; rollout completo (câmera/OCR, voz) =
  roadmap (dependem de recursos de device).

---

## 4. Priorização
| Faixa | Itens |
|---|---|
| **RC1 (obrigatório)** | **D‑17** layout/espaçamento · **D‑18** redesign Histórico (índice → página do exame) · **D‑19** Select universal · **REL‑002** (feito) · **Composição** revisão · **classificação** correta de exames de imagem (parte de D‑11/12) |
| **Pós‑RC1** | **D‑20** separação documental×longitudinal (conclusão) · **D‑21** auditoria completa de UX · **modelo oftalmológico** dedicado |
| **Roadmap** | **D‑14** rollout do protocolo único (câmera/OCR, voz) · nav v1.1 (MOBILE‑036) · convergência total Web→core do relatório (REL‑002 §7) |

---

## 5. Critérios de aceite (homologação)
- Por item: ver "Aceite" em cada D‑NN acima.
- **Globais (todo incremento):** paridade Web×Mobile verificada (mesmos campos/fluxos/nomenclaturas/estados); sem
  regressão; **typecheck + suíte + build verdes**; decisão estrutural registrada em doc/ADR ([[adr_012...]]).

---

## 6. Padrões anti‑recorrência (governança de Design System)
Para o **mesmo problema não voltar** em outras telas:
1. **Grid de espaçamento tokenizado** (24/16/12/8) no DS — telas consomem tokens, não valores soltos.
2. **Select obrigatório > 4 opções** — vira regra do checklist DS‑003; PR que listar aberto é reprovado.
3. **Padrão "página de detalhe"** (índice → item → página dedicada) reutilizado por Histórico, e demais listas.
4. **Componente único de captura** (protocolo de entrada A5) reutilizado por todos os módulos.
5. **Hierarquia de informação** (valor > indicador > data > origem) como recipe/token de composição.
6. **Gate de paridade** — nada nasce só‑Web/só‑Mobile; lógica no core; Web/Mobile só apresentação.
7. **Toda decisão estrutural → ADR/doc** (ADR‑012), não só em código.

---

## 7. Justificativa transversal (por quê, não só o quê)
- **Consistência reduz carga cognitiva** e erro do usuário — a tela vira previsível.
- **SSOT elimina divergência e retrabalho** — evidência concreta: o próprio bug do REL‑002 nasceu de **3
  implementações paralelas** do relatório (Web inline · view pública · core). Componente único mata a classe do erro.
- **Paridade evita drift** entre plataformas (o produto principal é o Mobile; a Web é referência).
- **DS único = manutenção previsível e escala** — um ajuste propaga a todas as telas.
- **Simplicidade = adoção** — menos elementos concorrendo, decisão do usuário mais rápida.

---

## 8. Sequência de execução proposta (RC1)
1. **Tokenizar o grid** (24/16/12/8) + hierarquia A6 no DS e aplicar (D‑17).
2. **Página de detalhe do exame/indicador** + reconverter o Histórico para **índice** (D‑18/A1) — Mobile e Web.
3. **Rollout do Select** em todos os campos > 4 opções (D‑19).
4. **Revisão completa da Composição Corporal** (D‑17/A6).
5. **Correção da classificação** dos exames de imagem (D‑11/12 — modality‑first; parte RC1).
→ **Pós‑RC1:** D‑20 (conclusão), D‑21 (auditoria completa), modelo oftalmológico dedicado.

> Cada passo entra em incremento verificável (typecheck + suíte + build + commit), com paridade e critérios de aceite
> acima. Nada de rewrite de uma vez — blocos reversíveis ([[principio_ds_promovido_antes_da_aplicacao]]).
