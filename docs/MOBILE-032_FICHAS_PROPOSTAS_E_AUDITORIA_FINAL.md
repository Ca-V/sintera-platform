# MOBILE-032 — Auditoria final de produto + fichas de propostas (pré-encerramento da paridade)

Documento de DECISÃO (continuidade ADR-012). Reúne (§A) a auditoria final de produto por módulo (Web ainda-não-no-
Mobile · Mobile-inferior · melhorias de UX para ambos) e (§B) as fichas estruturadas das propostas que dependem de
decisão. **Nada aqui foi implementado** — é insumo para priorização após a homologação.

Legenda de severidade: **P0** quebra paridade · **P1** relevante · **P2** menor. Tipos: **A** Web não reproduzida ·
**B** Mobile inferior · **C** melhoria de UX para ambos.

---

## §A — Auditoria final por módulo

> Preenchida a partir de 3 auditorias independentes (clusters Acompanhamento · Documentos/Organização · Minha
> Saúde/Configurações) + as auditorias já feitas de Composição Corporal, Relatório, Monitoramento e Ômica.
> _(Consolidação dos achados abaixo — atualizada quando as auditorias retornam.)_

### Composição Corporal · Relatório (auditados a fundo nesta sessão)
Gaps P1/P2 identificados por 2 auditores foram **corrigidos** (IMC/altura, faixa+tendência no histórico, comparação
A×B completa com indisponíveis, tabela de evolução clicável, rastreabilidade ao laudo, total de despesas, óptica
`vision_kind`, seções-vazias, jornada com início/tempo/massa magra, etc.). Resíduos = melhorias (ver §B).

### Monitoramento · Ômica (construídos nesta sessão, à paridade)
Sinais vitais: CRUD + sparkline por sinal + estados. Ômica: lista + criar + N1–N4 + entrada manual com resolução de
catálogo + exclusão (ingestão por IA do laudo = exceção de plataforma).

### Cluster Acompanhamento (Agenda · Histórico de Saúde · Histórico de Exames)

**⚠️ 2 P0 de paridade encontrados** — recomendo avaliar corrigir ANTES da homologação (quebram comportamento
central de produto), sob decisão da fundadora (não implementados, conforme diretriz de documentar-e-priorizar).

**Agenda** (Web `agenda/page.tsx` · Mobile `AgendaScreen`/`EventFormScreen`/`useAgenda`)
- (A·P1) Sugestão inteligente de recência de exames (`buildExamRecencySuggestion`: detecta exame vencendo → "Registrar lembrete" com prefill) — ausente no Mobile.
- (A·P1) Agrupamento + alternância "Por data / Por tipo" (ViewModeSwitcher, ordenação por prioridade) — Mobile mostra lista plana única.
- (B·P1) **Erro de ação silencioso**: falha ao Concluir/Cancelar não dá feedback no Mobile (`useAgenda` ignora o `{error}` do `save()`); a Web mostra ErrorBanner inline.
- (B·P2) "Excluir de vez" na linha do card (Web tem 4 ações; Mobile só Concluir/Cancelar/Editar — excluir só no form).
- (B·P2) Lembrete de medicação abre Medicamentos na Web; no Mobile abre sempre o EventForm genérico.

**Histórico de Saúde / Timeline** (Web `timeline/page.tsx` · Mobile `TimelineScreen` + core `timelineProjection`)
- (B·**P0**) **Eventos ABERTOS vazam para o Histórico**: a Web só mostra fatos FECHADOS (`isClosedStatus`); o Mobile usa `mergeTimeline` sem aplicar o campo `closed` → consultas/exames planejados aparecem no "Histórico de Saúde". Quebra a separação Agenda×Histórico.
- (A·P1) Fontes ausentes: ômicas (`omics_panels`) e contracepção (`contraceptive_methods`) — a Web projeta 4 fontes; o Mobile mescla só eventos+exames.
- (B·P1) Densidade de informação inferior: faltam chips de prioridade/retorno/modalidade, valor BRL, badge realizado/cancelado, link de anexo, Preparo/Desfecho.
- (B·P2) Sem dedup do evento financeiro de exame (risco de duplicar o fato); sem alternância por tipo; sem ações inline (reabrir/realizar/excluir).

**Histórico de Exames** (Web `saude/page.tsx` · Mobile `HistoricoExamesScreen`)
- (A·**P0**) **Exames documentais/imagem ausentes**: a Web tem 2 trilhas (laboratoriais com biomarcadores + "Outros exames" documentais longitudinais); o Mobile carrega só `getAllBiomarkers()` → toda a classe de exames sem números (imagem, densitometria, laudos) não aparece.
- (A·P1) Filtros de descoberta (por tipo, por período 30d/90d/1a, ordenação) — Mobile só tem busca textual.
- (A/B·P1) Resumo longitudinal por exame (1ª/última realização, total, último laboratório/solicitação) + chips que **linkam para cada laudo** — ausentes no Mobile.
- (B·P2) Busca só por biomarcador (Web busca biomarcador OU nome do exame); símbolo de posição na faixa (▲/▼/✓/–) ausente; empty-state sem CTA.

**Melhorias (C) para AMBOS (candidatas a ficha):** descer o filtro período/tipo do Histórico de Exames ao core (seletor puro); `mergeTimeline` expor `selectHistoryTimeline()` já filtrado por `closed` (evita o P0 e divergência futura); extrair a montagem dos "bits" do item de timeline (prioridade/retorno/valor/anexo) ao core.

### Cluster Documentos + Organização (Exames lista/detalhe/upload · Despesas)

**⚠️ 1 P0** (Pedidos de Exames ausentes).

**Exames — lista** (Web `exams/page.tsx` · Mobile `ExamsListScreen`/`useExamsList`) — maior divergência do cluster:
- (A·**P0**) **Subseção "Pedidos de Exames" inexistente**: a Web separa Resultados × Pedidos/Solicitações (listar guias, marcar realizado/pendente, agendar, ver documento, excluir, contagem de resultados vinculados via `isOrderExam`). O Mobile não tem aba/tela de pedidos — e `useExamsList` não filtra `isOrderDocumentType`, então pedidos ou aparecem misturados como resultados (incorreto) ou somem.
- (A·P1) Filtros (busca por nome, ano, status, período) e (A·P1) **detecção de duplicados** (chip + "ver original") ausentes — `findDuplicateIds` vive em `@/lib/exams/duplicates`, não no core.
- (A·P2) Selo binário estruturado×documento, chip de categoria (E5 `categoryOf`), rótulo de página de bundle, aviso agregado de nome divergente, ações inline (renomear/excluir/reextrair) — ausentes na lista Mobile.

**Exame — detalhe** (Web `exams/[id]/page.tsx` · Mobile `ExamDetailScreen`+seções) — **paridade forte**. Lacunas P2:
- (A·P2) Exportar **CSV** dos biomarcadores (portabilidade, não é impressão) ausente. (A·P2) "Última extração"/log não exibido. (B·P2) tooltip metodológico do Índice Experimental mais curto (é copy). (B·P2) analytics `exam_*` não disparados.

**Upload** (Web inline · Mobile `ExamUploadScreen`/`useExamUpload`):
- (B·P1) **Após upload a extração não inicia sozinha**: a Web navega ao detalhe (auto-análise dispara); o Mobile volta à lista, que faz polling mas NÃO dispara `analyzeExam` → exame fica `pending` até abrir o detalhe. (Sugestão: navegar do upload ao detalhe, ou disparar analyze no sucesso.)
- (B·P2) Mensagens de erro de extração cruas (Web mapeia `ERROR_MESSAGES`/`friendlyError` PT). (A·P2) staging multipágina (bundle) — fronteira com câmera, mas vale p/ galeria.

**Despesas** (Web `gastos/page.tsx` · Mobile `DespesasScreen`/`useDespesas`):
- (A·P1) **Sem forma de adicionar despesa no Mobile** (a Web tem "Adicionar despesa" com guia: novo evento/medicamento/ir ao histórico).
- (B·P2) Semântica do total diverge: Web = seletor de ano + total do ano + contagem; Mobile = total geral de tudo, sem seletor. (B·P2) erros de remover/reabrir silenciosos no Mobile. (B·P2) disclaimer tributário mais fraco.

### Cluster Minha Saúde + Configurações

**⚠️ 1 P1 de compliance** (links legais).

- **Condições** — (A·P2) "salvar exame sem condição" (roteamento de captura) ausente; deep-link `?novo=1` (C). Resto em paridade (Mobile adiciona pull-to-refresh).
- **Medicamentos/Suplementos** — (B·P2) card não mostra DATAS de compra/recompra nem término estimado (`runoutDate`); (B·P2) unidade de embalagem não editável; (B·P2) view não persistida (sticky). Projeção contraceptiva OK.
- **Recursos** — **SEM GAPS RELEVANTES** (paridade forte, despesa inline). (C·P3) conjunto de frequências diverge (ver melhoria compartilhada).
- **Hábitos** — **SEM GAPS RELEVANTES**. (C·P3) mesmo tema de frequências.
- **Ciclo** — (B·P2) sem prévia ao vivo de "troca prevista/próxima recompra" no form; (B·P2) stats menos detalhadas (Web = 3 cards; Mobile = 1 linha); (B·P3) sem nota "aparece em Medicamentos (só leitura)" nem explicação do lead-time.
- **Configurações** — (A·**P1**) **links legais ausentes** ("Seus direitos/LGPD", "Privacidade", "Termos") — carga de compliance (COMPLIANCE-001); (B·P2) notificações não agrupadas por seção da Sidebar (FB-017); (B·P3) verificar logout explícito na tela; (B·P3) nota "dados nunca compartilhados". Resto (e-mail/senha/WhatsApp/prefs/exportar/excluir) OK.

**Melhorias (C) compartilhadas deste cluster:** consolidar os conjuntos de frequência de lembrete/troca numa lista canônica única no `packages/core` (hoje `TROCA_FREQ_OPTS`/`LEMBRETE_FREQ_OPTS` na Web × `FREQUENCY_LABELS` no core divergem em Recursos/Hábitos).

---

## §C — Consolidado de severidade (paridade, não "melhorias")

- **P0 (quebram comportamento central; recomendo corrigir ANTES da homologação):**
  1. Timeline — eventos abertos vazam para o Histórico (filtrar por `closed`).
  2. Histórico de Exames — classe de exames documentais/imagem ausente (só biomarcadores).
  3. Exames lista — subseção "Pedidos de Exames" ausente / pedidos possivelmente misturados aos resultados.
- **P1 (relevantes):** auto-análise pós-upload; adicionar despesa no Mobile; filtros+duplicados na lista de exames;
  filtros+resumo longitudinal+links de laudo no Histórico de Exames; ômicas+contracepção+densidade na Timeline;
  sugestão de recência + agrupamento + erro silencioso na Agenda; **links legais LGPD/Privacidade/Termos** em
  Configurações (compliance).
- **P2/P3:** enriquecimentos de card/preview (Medicamentos, Ciclo), selos/chips/filtros da lista de exames, CSV,
  erros silenciosos em Despesas, semântica de ano em Despesas, agrupamento de notificações, disclaimers, etc.

**Oportunidades de infra compartilhada (reduzem trabalho futuro de paridade):** mover ao `@sintera/core`:
`exams/duplicates`, `exam-categories` (categoryOf), estado de estruturação binária, `friendlyError`/`ERROR_MESSAGES`,
o seletor de período/tipo do Histórico de Exames, `selectHistoryTimeline()` (closed) e a montagem dos "bits" do item
de timeline; e uma lista canônica única de frequências. Cada um habilita vários gaps acima de uma vez.

---

## §A.1 — Reauditoria pós-correção (confirmação)

Após corrigir os P0/P1, 3 verificadores independentes reauditaram. **Resultado: todos os P0/P1 ELIMINADOS.**

| Item | Sev | Status |
|---|---|---|
| Timeline — eventos abertos vazando p/ Histórico | P0 | ✅ RESOLVIDO (selectHistory no core; 4 fontes; densidade; dedup FB-008) |
| Histórico de Exames — trilha documental ausente | P0 | ✅ RESOLVIDO (trilha documental + filtros tipo/período/ordenação + ocorrências→laudo) |
| Exames lista — "Pedidos" ausentes | P0 | ✅ RESOLVIDO (Resultados × Pedidos via isOrderDocumentType) |
| Exames lista — filtros + duplicados | P1 | ✅ RESOLVIDO (busca/status/ano + findDuplicateIds no core) |
| Upload — auto-análise/feedback | P1 | ✅ RESOLVIDO (vai ao detalhe; analyze disparado no done) |
| Despesas — adicionar despesa | P1 | ✅ RESOLVIDO (guia novo evento/medicamento) |
| Agenda — recência + views + erro silencioso | P1 | ✅ RESOLVIDO (buildExamRecencySuggestion no core; por data/tipo; erro reportado) |
| Timeline — ômicas/contracepção/densidade | P1 | ✅ RESOLVIDO |
| Histórico de Exames — filtros + resumo + laudo | P1 | ✅ RESOLVIDO |
| Configurações — links legais LGPD/Privacidade/Termos | P1 | ✅ RESOLVIDO |
| Configurações — logout na própria tela | P1 | ✅ RESOLVIDO (botão "Sair da conta") |

### P2/P3 remanescentes (backlog — não bloqueiam a homologação)
- Exames lista: duplicado sem link "Ver original" (só o selo); seção Pedidos read-only (sem ciclo "marcar realizado/agendar/contagem", Q1); busca não aplicada aos Pedidos.
- Despesas: ramo "já registrei, só faltou o valor" (ir ao Histórico/Medicamentos) do guia da Web; semântica de total por ano (Mobile = total geral); erros de remover/reabrir ainda sem banner.
- Agenda: ação "Excluir de vez" inline no card (Mobile só Concluir/Cancelar/Editar; exclusão existe no formulário); ordenação por prioridade dentro de "Por tipo".
- Histórico de Exames: metadados longitudinais mais rasos (sem "último laboratório/última solicitação" por exame).
- Medicamentos: datas de compra/término/recompra no card; unidade de embalagem editável; view sticky.
- Ciclo: prévia ao vivo de "troca prevista/próxima recompra"; stats em 3 cards; notas de referência cruzada.
- Configurações: agrupar notificações por seção da Sidebar (FB-017).
- Exame detalhe: exportar CSV dos biomarcadores; "última extração"; tooltip metodológico completo do Índice.
- Condições: "salvar exame sem condição" (roteamento de captura).
- (C) compartilhadas: lista canônica única de frequências no core (Recursos/Hábitos); mover ao core
  `friendlyError`/`ERROR_MESSAGES`, `exam-categories`, estado de estruturação binária, e os "bits" do item de
  timeline — cada um habilita vários P2 de uma vez.

## §B — Fichas das propostas (dependem de decisão)

### Ficha 1 — Editar altura no Perfil (Mobile) para habilitar o IMC
- **Objetivo:** permitir que o usuário só-Mobile informe a altura, base do IMC (peso ÷ altura²) na Composição
  Corporal. Hoje o contrato Perfil do Mobile (MOBILE-019) edita apenas name/phone; `profiles.height_cm` só é
  editável na Web → usuário só-Mobile nunca vê o IMC.
- **Benefício esperado:** IMC calculado disponível no Mobile (indicador central da Composição/relatório); paridade
  real do resumo antropométrico; remove a mensagem "informe a altura na Web".
- **Impacto arquitetural:** ampliar `ProfileEditable` (contrato COMPARTILHADO em `@sintera/api-client/profile`) para
  incluir `height_cm` (e, se desejado, outros de composição), OU expor a edição de altura no contexto de Composição
  gravando via `body`/perfil. Mexe em contrato compartilhado → Web e Mobile alinham juntos. RLS já cobre (owner).
- **Impacto UX:** positivo e localizado (um campo no Perfil, ou um atalho "definir altura" na Composição). Sem risco
  de regressão.
- **Esforço:** BAIXO (~0,5 dia): 1 campo no ProfileEditable + tela Perfil + validação; testes.
- **Recomendação:** **implementar após a homologação** (pequeno, alto valor, mas mexe em contrato — melhor com a
  Web no mesmo lote).

### Ficha 2 — Resumo executivo + índice + síntese de biomarcadores no Relatório
- **Objetivo:** reproduzir no Mobile (e unificar com a Web) o cabeçalho executivo do relatório: contagens por seção,
  "última atualização", índice navegável e a síntese "N biomarcadores organizados em M categorias · K fora da faixa"
  (hoje só-Web, via `assembleOrganizedBiomarkers` em `src/lib/ai/insights/assembler`).
- **Benefício esperado:** relatório mais legível para o profissional (visão de topo antes do detalhe); paridade de
  conteúdo; fonte única da síntese.
- **Impacto arquitetural:** mover `assembleOrganizedBiomarkers` (ou uma versão PURA) para `@sintera/core` e gerar os
  blocos no `assembleReport` (fonte única já consumida pelo Mobile; a Web passa a consumir também). Verificar que o
  assembler é isomórfico (sem dependências de servidor).
- **Impacto UX:** positivo; adiciona um resumo no topo do relatório (Web e Mobile). Baixo risco.
- **Esforço:** MÉDIO (~1–1,5 dia): extração/pureza do assembler + testes + serialização + render Mobile + (opcional)
  convergência do topo da Web.
- **Recomendação:** **fase futura** (enriquecimento, não paridade essencial — o conteúdo por seção já existe no
  Mobile). Priorizar após itens de maior impacto.

### Ficha 3 — Convergir o render do Relatório da Web para o `assembleReport` do core
- **Objetivo:** eliminar a duplicação de APRESENTAÇÃO: hoje as REGRAS do relatório são fonte única no core
  (`assembleReport`), mas a Web ainda monta o JSX inline (1093 linhas). Convergir a Web para consumir o core.
- **Benefício esperado:** uma implementação de montagem para os dois lados; toda evolução do relatório passa a
  refletir automaticamente em Web e Mobile (reduz trabalho futuro — regra-mestra da paridade).
- **Impacto arquitetural:** refator da página Web `/dashboard/relatorio` por BLOCOS REVERSÍVEIS (proibido rewrite de
  1093 linhas de uma vez — princípio DS-promovido-antes-da-aplicação). Pode exigir o core expor dados estruturados
  filtrados (não só linhas de texto) para preservar o render rico da Web (tabelas, proveniência, grau óptico).
- **Impacto UX:** neutro se bem-feito (mesma tela); risco de regressão visual se apressado → fazer incremental com
  verificação a cada bloco.
- **Esforço:** ALTO (~2–4 dias): expor modelo estruturado no core + migrar seções da Web uma a uma + testes de
  regressão.
- **Recomendação:** **fase futura** (dívida de duplicação de apresentação; sem impacto no usuário agora). Fazer
  quando houver janela para refatorar a Web com segurança.

### Ficha 4 — Enriquecer a Home Shell (slots Summary/Timeline/Insights)
- **Objetivo:** preencher os slots reservados da Home com o que o dashboard Web mostra: estatísticas (exames,
  pendentes, biomarcadores), jornada (próximo/último evento) e itens recentes — a "porta de entrada" do app.
- **Benefício esperado:** primeira tela útil (resumo acionável) em vez de casca; paridade com o dashboard Web;
  cumpre o roadmap ("cada domínio preenche um slot da Home").
- **Impacto arquitetural:** **INV-HOME-001** (tests/mobile/home-is-composition.test.ts) PROÍBE `@sintera/api-client`/
  Supabase dentro de `apps/mobile/src/presentation/home/`. Exige um PADRÃO DE INJEÇÃO (container acima da Home lê os
  dados via api-client e injeta nos slots por props, ou slots recebem render-props dos módulos) — definir em
  ADR-018/MOBILE-014. É incremento de arquitetura, não um "fill" rápido.
- **Impacto UX:** alto e positivo (a Home deixa de ser vazia). Precisa cuidar de estados carga/vazio/erro por slot.
- **Esforço:** MÉDIO-ALTO (~2–3 dias): desenhar o contrato de injeção (ADR) + container de dados + 3 slots
  (Summary/Timeline/Insights) + estados + testes (mantendo o invariante verde).
- **Recomendação:** **fase futura** (próximo incremento dedicado, com ADR de injeção). Não bloqueia a homologação da
  paridade dos domínios.

---

### Quadro-resumo (para priorização)

| # | Proposta | Esforço | Impacto UX | Mexe em contrato/arquitetura? | Recomendação |
|---|---|---|---|---|---|
| 1 | Altura no Perfil (IMC) | Baixo | Médio | Sim (ProfileEditable) | Após homologação |
| 2 | Resumo/síntese no Relatório | Médio | Médio | Sim (mover assembler ao core) | Fase futura |
| 3 | Convergir render Relatório Web→core | Alto | Neutro | Sim (refator Web incremental) | Fase futura |
| 4 | Enriquecer a Home (slots) | Médio-Alto | Alto | Sim (ADR de injeção, INV-HOME-001) | Fase futura (incremento próprio) |
