# MOBILE-037 — Defeitos da Homologação v1.0 (lista única para o ciclo de correção)

Lista **consolidada** dos defeitos/ajustes de **paridade e estabilidade** encontrados na homologação em device.
Regra: **registrar tudo → corrigir em UM ciclo → nova build → validação rápida → RC1**. Roadmap (evolução) fica em
`MOBILE-038`. Build homologado: `3aa2825e` (HEAD `29578bf`+).

> **Numeração canônica a partir de D‑17:** consolidada em **`docs/UX-002`** (parecer de refinamento, aprovado pela
> fundadora). D‑17 = **Auditoria de Layout/Hierarquia** (a formatação da Composição é caso dentro dele) · D‑18 =
> **Redesign do Histórico de Exames (arquitetura B — página dedicada por exame; decisão da fundadora)** · D‑19 =
> **Select universal (>4 opções)** · D‑20 = **arquitetura documental×longitudinal** · D‑21 = **auditoria completa de
> UX**. Este MOBILE‑037 permanece como o log bruto da homologação; o **plano executável** vive no UX‑002.

| ID | Severidade | Módulo | Descrição | Correção planejada | Status |
|---|---|---|---|---|---|
| D‑00 | P0 | Histórico de Saúde | 401 + blank total ao abrir (ponte ômica derrubava a tela) | Fontes auxiliares (ômica/contracepção) não‑fatais — carrega com eventos+exames | ✅ **corrigido** — validar na próxima build |
| D‑01 | P1 | Exames · Compartilhar | Compartilhar por e‑mail/WhatsApp traz **só os dados**, não o **documento original** | Incluir no Share o **link seguro do documento** (ou o próprio arquivo, quando adequado) — via e‑mail/WhatsApp/Share nativo. Simples e equivalente à expectativa de "Compartilhar exame". | ⏳ **ciclo único** |
| D‑02 | P1 | Ômica | "Falha ao carregar ômica (401)" — tela inacessível | **Deploy do Bearer** (`omicsAuth → getAuthedSupabase`) na **Web de produção** → re‑homologar. Código **já commitado** e backward‑compatible (cookie+bearer). **Deploy pode ser PREPARADO; execução só com autorização** da fundadora (produção); fluxo de publicação a confirmar. | ⏳ **aguardando autorização de deploy** |
| D‑03 | P1 | Histórico de Exames | "Parede de chips" com nomes de biomarcadores no topo → excesso de informação, difícil navegar | Alinhar à Web: **remover a parede de chips**; usar **seletores compactos (dropdown)** para tipo e data; **manter busca**; manter filtros tipo/data | ⏳ **ciclo único** |
| D‑04 | P1 | Histórico de Saúde | Falta busca/filtros; só agrupa por mês | Alinhar à Web: **busca** + **filtro por tipo** + **filtro por data** (Por data / Por tipo) + organização equivalente | ⏳ **ciclo único** |
| D‑05 | P2 (UX) | Início (Painel Inicial) | Home deve priorizar **card "Como usar a SINTERA"** + **acesso rápido**; talvez **"Adicionar registro"** e, no máximo, o **card de lembrete de Agenda**. **NÃO** incluir Resumo / Linha do tempo / Exame recente / Insights. | Reorganizar a Home: guia "como usar" (paridade c/ o onboarding da Web) + atalhos + (opcional) adicionar registro + lembrete de Agenda; manter slots Summary/Timeline/Insights **fora**. Respeitar INV‑HOME‑001. Liga à IA da Home (MOBILE‑036). | 🗺️ **a triar** (candidato a evolução; guia "como usar" pode ser paridade) |
| D‑06 | P1 | Agenda ("Por tipo") | Cards de **Consulta** e **Procedimento** aparecem **sem o nome/título** no Mobile (na Web o nome está correto) | Exibir o nome/título de todos os tipos de card, igual à Web | 🔧 **ciclo único** |
| D‑07 | P2 | Agenda | Falta **exportar evento para o calendário** do dispositivo (Web tem) | Adicionar "exportar/adicionar ao calendário" (ex.: .ics/integração nativa) — mecanismo de plataforma | 🗺️ **a triar** (paridade; mecanismo de device) |
| D‑08 | P1 | Agenda · form de evento | Falta a opção **despesa direta** (Web tem) | Adicionar "despesa direta" no evento (conta como gasto sem precisar concluir), como na Web | 🔧 **ciclo único** |
| D‑09 | P1 | Agenda · lembrete | Mobile só tem "marcar lembrete ou não"; falta **"receber lembrete no dia anterior pelo canal das preferências de notificação"** (Web tem) | Adicionar a opção equivalente à Web; **confirmar que, com lembrete + dia‑anterior marcados, o envio ocorre por e‑mail e WhatsApp** conforme preferências | 🔧 **ciclo único** |
| D‑10 | P2 | Agenda · recorrência | Cadências hoje: diária/semanal/quinzenal/mensal/anual. Faltam **bimestral, trimestral, semestral**; alternativa: opção **"a cada N"** (N dias 1–30, ou N meses). Estrutura "não repetir / repetir". | **Lógica compartilhada** (core recurrence → Web+Mobile): decidir entre adicionar as 3 cadências fixas **ou** um intervalo custom "a cada N dias/meses". Aplicar nos dois. | 🗺️ **a triar** (enhancement compartilhado — decisão de produto) |
| D‑11 | P1 | Exames · extração/classificação (CEF) — **compartilhado Web+Mobile** | Exame de **imagem** (OCULUS PENTACAM, topografia de córnea, 2 olhos) foi mal tratado ao adicionar: nomeado só **"Exame (foto)"**, com **data de hoje** (não a de realização 18/03 e 23/06), e classificado **"Laboratorial"** (é **imagem**, não lab). Resultados vivem só no documento/imagem; o laudo é **dividido por olho** com datas próprias. | **Análise profunda da estratégia de extração por MODALIDADE (CEF‑001):** exames de imagem/gráficos (Pentacam etc.) **não** devem ser forçados a extração laboratorial. Decidir: (a) extrair alguns **metadados estruturados** (emissor, data de realização, olho D/E) + **"consultar documento original"**; ou (b) só **"documento disponível/consultar original"** (como outros exames de imagem). Corrigir a **classificação de modalidade** (não marcar imagem como laboratorial), o **nome** (usar o título do laudo, não "Exame (foto)") e a **data** (realização, não hoje). Roda no servidor → **afeta Web e Mobile**. | 🔧/🗺️ **a triar** — correção de classificação = ciclo; estratégia de extração de imagem = **decisão de produto/arquitetura** (análise no ciclo) |
| D‑12 | P1 | Exames · extração (CEF) — **compartilhado Web+Mobile** (refina D‑11) | OCULUS **CEM‑530 "Endothelial cells"** (microscopia especular, **bilateral**): a extração **funcionou**, MAS **não distingue Direito/Esquerdo** — a mesma métrica aparece duplicada sem rótulo de olho (ex.: AVG **308** e **303**; CD **3063** e **3127**), o que é **fundamental** e hoje fica ambíguo. Também classificado como **"Laboratorial"** (é **equipamento/imagem**, não lab). | Na extração de exames **bilaterais oftalmológicos/equipamento**, cada resultado deve carregar o **olho (OD/OS · Direito/Esquerdo)** — valores inequívocos; e a **modalidade não** deve ser "laboratorial". **Refina o D‑11:** como a extração É viável nesses equipamentos, avaliar caminho **(a)** — extrair **com rótulo de olho** + metadados corretos (nome/data/emissor) — em vez de só documento‑original. | 🔧/🗺️ **a triar** (junto com D‑11 — mesma análise CEF/oftalmologia) |
| D‑13 | — (feature) | Medicamentos/Suplementos · **Receita médica** (NOVA capacidade — Web+Mobile) | **Receita médica não existe** em nenhuma plataforma. Precisa ser incorporada espelhando o padrão **pedido↔exame**: dentro de **Medicamentos** e **Suplementos**, opção de **anexar a receita** (armazenada **separada** do produto — a receita é um objeto, o medicamento/suplemento é outro); depois a receita é **vinculada à compra** do produto (como o pedido é vinculado ao exame ao ser realizado). Além disso: o **"Adicionar registro"** (hub) já separa categorias, mas as **páginas respectivas** não têm essas categorias; e a **Web (home)** não tem o "adicionar registro" com essas specs + vínculo. | Criar o domínio **Receita** (anexo + vínculo à compra) em Medicamentos/Suplementos, nas duas plataformas; consistência do **RegistrationHub** (HUB‑001) entre home e páginas respectivas; adicionar "Adicionar registro" na home da Web. Lógica de vínculo no core (como o pedido↔exame). | 🗺️ **ROADMAP** (nova capacidade compartilhada → MOBILE‑038; não é defeito de paridade do ciclo) |
| D‑14 | — (feature) | **Captura unificada** em toda a plataforma (Web+Mobile) — CAP‑001/HUB‑001 | Toda **entrada de documento/arquivo/imagem** deve seguir o **mesmo protocolo** (o do "Adicionar registro"), com as **5–6 formas**: (1) **tirar foto/câmera**, (2) **selecionar arquivo** (PDF/foto), (3) **digitar manualmente**, (4) **falar** (voz/áudio), (5) **arrastar arquivo** (drag‑and‑drop). Aplicar em **todas as páginas, categorias e entradas de produto**, nas **duas** plataformas. | Padronizar o componente de captura (HUB‑001) em todas as entradas; apresentar os **mecanismos por plataforma** (drag‑and‑drop = Web; câmera = Mobile; selecionar arquivo/manual = ambos; voz = roadmap §2; câmera/OCR = roadmap §1). Consolida com MOBILE‑038 §1/§2. | 🗺️ **ROADMAP** (padrão de captura sistêmico → MOBILE‑038; não é defeito de paridade do ciclo) |
| D‑15 | P1 | Exames · detalhe — **divergência Web↔Mobile** (mesmo exame OCULUS por foto) | Para **o mesmo exame** sem data estruturada, a **data exibida difere entre plataformas**: **Web** mostra "Realizado em **06 de ago. de 2026**" (data de hoje) e **Mobile** mostra "Realizado em **Sem data**". Além disso, a **ação de acesso ao documento diverge**: **Mobile** tem **"Abrir documento original"** (fonte da verdade, RDC 657) e a **Web** oferece **"Baixar PDF"** — rótulo/comportamento diferentes para a mesma intenção. (Correção da data em si = D‑11; aqui o ponto é a **inconsistência entre as duas plataformas**.) | Alinhar Web↔Mobile: (a) **mesma regra de data** ("Sem data" quando não há data de realização — nunca preencher com hoje; ver D‑11); (b) **mesma ação/rótulo** de acesso ao documento original ("Abrir documento original" nas duas, mantendo baixar quando fizer sentido). | 🔧 **ciclo único** (paridade de exibição/ação — a estratégia de extração/nome/classificação segue em D‑11/D‑12) |
| D‑16 | P2 (UX sistêmico) | **Toda a plataforma (Web+Mobile)** — controles de escolha | Sempre que um campo oferece **opções**, hoje muitas telas **listam tudo aberto** (ex.: recorrência de lembrete = diária/semanal/…/anual todas visíveis; chips de tipo/nome). Deve virar um **seletor compacto** (aba/"picker"): a pessoa **toca**, **rola** dentro do seletor e **escolhe**. Vale para **nome de exame, tipo, recorrência de lembrete, filtros e qualquer campo de opção**, em **todas as páginas/categorias**, nas duas plataformas. Generaliza o D‑03 (parede de chips → dropdown). | Criar/usar um **primitivo do Design System** (`Select`/`Picker` — Web dropdown; Mobile bottom‑sheet rolável), com busca quando a lista for grande. Substituir listas abertas por esse seletor em todas as entradas de opção. Sem regra de negócio no primitivo (DS‑003). | 🔧 **ciclo (Mobile)** — primeiro uso: Histórico de Exames (D‑18). Rollout completo Web+Mobile = roadmap MOBILE‑038 |
| D‑17 | P1 (formatação) | Composição Corporal (Mobile) | Texto **desconfigurado**: em "Estado atual", o valor à direita (ex.: "Peso 64 kg (+2.8)") **encavala/estoura**; rótulo+data+origem espremidos; alinhamento inconsistente. Precisa **formatar/centralizar** melhor e distribuir a informação (leitura/enquadramento). | Reorganizar a linha de cada métrica (rótulo em cima, valor + variação alinhados, origem/data em linha própria com quebra); revisar espaçamentos; auditoria de formatação da tela toda. | 🔧 **ciclo único** |
| D‑18 | P1 (UX/redesign) | Histórico de Exames (Mobile) | (a) **Parede de chips** de tipo (todos os nomes listados) — mesma raiz do D‑03/D‑16: deve virar **picker** ("Buscar por biomarcador ou exame" → toca, rola, escolhe). (b) Cabeçalho **estruturado** com seleção **Por tipo · Por data**. (c) A lista deve mostrar **só nome + nº de medições**; **clicar** abre a **página específica** (evolução longitudinal / extração / documento original) — hoje já aparece valor/tendência inline e os grupos (ex.: ENDOTHELIAL CELLS) dão a impressão de "mostrar tudo". (d) Informações **muito juntas** — espaçamento/leitura. | Substituir o filtro de tipo por **Select** (D‑16); header com seletores **Por tipo/Por data**; cartões colapsados = **nome + contagem**, toque → detalhe; revisar densidade/espaçamento. Paridade conceitual com a Web `/dashboard/saude`. | 🔧 **ciclo único** |

> **Estratégia confirmada (fundadora):** registrar TODOS os achados aqui durante a homologação → **um único ciclo**
> de correção ao final (D‑01/D‑03/D‑04 + demais) → **uma build** de validação → RC1. **D‑02:** o Bearer já está pronto
> na branch; deploy em produção só **após autorização** e confirmação do fluxo de publicação — a homologação do resto
> do app segue normalmente, deixando só a ômica pendente dessa etapa.

## Critérios de aceite (por item)
- **D‑01:** ao "Compartilhar exame", o destinatário recebe **acesso ao documento original** (link seguro clicável ou o arquivo), não apenas os dados extraídos; funciona por e‑mail, WhatsApp e Share nativo.
- **D‑02:** a tela de Ômica **carrega** os painéis no device (após o deploy do Bearer em produção).
- **D‑03:** o topo do Histórico de Exames fica **limpo** (sem parede de chips); tipo e data via **dropdown**; busca preservada; comportamento equivalente à Web.
- **D‑04:** o Histórico de Saúde tem **busca + Por data/Por tipo**, consistente com a Web.

## Fluxo
1. Continuar a homologação e **acrescentar novos achados** a esta tabela.
2. Ao concluir, **corrigir toda a lista em um ciclo** (D‑02 depende do deploy de produção).
3. Nova build (rápida — Starter) → **validação rápida** dos itens afetados → **RC1**.

> Itens de EVOLUÇÃO (captura por câmera/OCR, voz, ingestão IA de laudos, integrações Fase 2/wearables, backlog
> P2/P3, IA/navegação) **não** entram aqui — ver `MOBILE-038_ROADMAP_EVOLUCAO.md`.

---

## Atualização de status — verificação contra o código atual (não device)

Ciclo de fechamento V1 retomado. Verificação item a item **no código** (revalidação em device pendente):

- **D‑01 (Compartilhar · documento):** ✅ **já resolvido no código** — `ExamDetailScreen.onShare` inclui `exam.file_url` na mensagem do Share (link do documento). *Revalidar em device.*
- **D‑06 (Agenda · nome nos cards):** ✅ **já resolvido no código** — `AgendaScreen` renderiza `e.title?.trim() ? e.title : typeLabel(e.type)` (nunca fica sem rótulo). *Revalidar em device.*
- **D‑15 (data + ação):** 🔧 **data corrigida agora** — o detalhe Mobile deixa de exibir "Realizado em Sem data" e passa a mostrar **"Data de realização não informada"** (paridade com a Web, que nunca usa `created_at`). A **ação de documento já está alinhada** ("Abrir documento original" nas duas plataformas via `AttachmentLink`). *Estratégia de extração/nome/classificação de imagem segue em D‑11/D‑12.* typecheck (root+mobile) limpo; suíte 1194 verde.

> Nota: estas são verificações de **código**; a homologação final exige revalidação **em device** na próxima build.

---

## Reconciliação completa com o código — 2026-08-15 (pós-release V1 `9eebb0e`)

Verificação item a item **no código atual** (não device). A tabela original acima é o **log bruto** da homologação;
esta seção é o **estado real** para a próxima homologação partir de um baseline correto. Convenção: **✅ resolvido no
código (revalidar em device)** · **🔓 desbloqueado pelo release** · **⏸️ decisão (clínica/produto)** · **🗺️ roadmap**.

| ID | Estado real (código) | Evidência |
|---|---|---|
| D‑00 | ✅ resolvido | fontes auxiliares não‑fatais (Histórico carrega com eventos+exames) |
| D‑01 | ✅ resolvido | `ExamDetailScreen.onShare` inclui `file_url` no Share |
| D‑02 | 🔓 **desbloqueado pelo release** | Bearer/ADR‑020 agora em `main` (`9eebb0e`) → **revalidar ômica em produção** |
| D‑03 | ✅ resolvido | `HistoricoExamesScreen`: `Select` searchable + busca (sem parede de chips) |
| D‑04 | ✅ resolvido | `TimelineScreen`: busca + "Por data/Por tipo" |
| D‑05 | ⏸️ decisão de produto | reorg da Home (não é defeito de código) |
| D‑06 | ✅ resolvido | `AgendaScreen` renderiza título ou `typeLabel` (nunca sem rótulo) |
| D‑07 | ✅ resolvido | `EventFormScreen`: "Adicionar ao calendário" (`googleCalendarUrl`) |
| D‑08 | ✅ resolvido | `EventFormScreen`: switch "Despesa direta" |
| D‑09 | ✅ resolvido | `EventFormScreen`: "Receber lembrete no dia anterior" + canal das preferências |
| D‑10 | ⏸️ decisão de produto | cadências extras/"a cada N" (enhancement compartilhado) |
| D‑11 | ✅ classificação resolvida | `imageModalityOverride` (imaging/ophthalmology → document_only); commits `b3d789a`/`a8537d5`/`43354a0` |
| D‑12 | ⏸️ **revisão clínica (RC)** | rótulo de olho OD/OS **não implementado** na extração; `0e803f5` = candidato p/ revisão do RC |
| D‑13 | 🗺️ roadmap | Receita médica (feature) → `MOBILE-038` |
| D‑14 | 🗺️ roadmap | Captura unificada (feature) → `MOBILE-038` |
| D‑15 | ✅ resolvido | detalhe Mobile "Data de realização não informada" (paridade Web, `f4d5ccb`) |
| D‑16 | ✅ resolvido | `primitives/Select.tsx` (bottom‑sheet rolável + busca); 1º uso no D‑18 |
| D‑17 | ✅ resolvido | `ComposicaoScreen` usa `MetricRow` do DS (valor em destaque, metadados subordinados) |
| D‑18 | ✅ resolvido | `HistoricoExamesScreen` redesenhado (picker + cartões colapsados nome+contagem) |

**Resumo:** os defeitos de **paridade/"ciclo único" estão resolvidos no código** — falta **revalidação em device**
(homologação). **D‑02** revalida após o release. **D‑12** aguarda **revisão clínica**. **D‑05/D‑10** e a estratégia de
extração de imagem são **decisões de produto**. **D‑13/D‑14** são **features de roadmap** (não defeitos). Gates técnicos:
root TSC 0 · mobile TSC 0 · suíte 1224 · build verde (com env). Nenhum defeito de código aberto pendente de correção.
