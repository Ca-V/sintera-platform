# SINTERA — Plano de Homologação v1.0

**Objetivo:** validar toda a plataforma **antes** de iniciar o Scientific Catalog v2. Torna a estabilização **objetiva** (critérios, não impressão). Produzido durante o período de estabilização — **não** abre frente de arquitetura nem implementação estrutural.
**Legenda de status:** ✅ OK · ⚠️ Ressalva/triar · ⏳ Pendente (aguarda validação) · ⛔ Falha.
**Responsáveis:** PO = fundadora (valida UX/funcional em produção com login) · Dev = Claude (verifica técnico/arquitetural automatizável).
**Cada item:** Critério · Resultado esperado · Status · Responsável · Evidência.

---

## 1. Homologação Funcional
| Item | Resultado esperado | Status | Resp. | Evidência |
|---|---|---|---|---|
| Cadastro de usuário | `/onboarding` cria conta + perfil + consentimento; cai no dashboard | ⏳ | PO | depende do Supabase (branch `06dd0d0`) |
| Login | `/login` autentica; erros claros | ⏳ | PO | — |
| Adicionar exame (upload) | PDF/foto vira exame `pending`; opções na caixa única | ⏳ | PO | commit `00bf8d0` |
| OCR / Extração | biomarcadores extraídos; status `processed` | ⏳ | PO | — |
| Parser / Normalização | valores/unidades/datas coerentes | ⏳ | PO | — |
| Histórico (Linha do Tempo) | eventos ordenados; itens clicáveis → destino | ⏳ | PO | commit `ccf6b12` |
| Evolução | biomarcadores segmentados por material/painel; nome do catálogo | ⏳ | PO | commit `e157261` |
| Biomarcadores (detalhe/[slug]) | resultado uniforme; sem termo clínico; medições correto | ⏳ | PO | commits `ee64e2f`,`f727621` |
| Agenda | tipos corretos; formato/repetir; plano de saúde enxuto | ⏳ | PO | commits `bc53a3b`,`bf52220` |
| Produtos (Medicamentos/Supl./Disp.) | cadastro c/ especificação; projeta Agenda/Histórico/Gastos | ⏳ | PO | — |
| Ômicas | criar/importar painel; versionamento | ⏳ | PO | — |
| Documentos | anexos abrem; substituição preserva original | ⏳ | PO | — |

## 2. Homologação de UX
| Item | Resultado esperado | Status | Resp. | Evidência |
|---|---|---|---|---|
| Consistência do vocabulário | verbos oficiais (Adicionar/Fotografar/Escanear…) | ⚠️ | Dev/PO | `UI_LANGUAGE_STANDARD.md`; varredura parcial — telas restantes a revisar |
| Navegação | links levam ao destino certo; sem becos | ⏳ | PO | — |
| Responsividade | mobile/desktop sem quebra | ⏳ | PO | — |
| Estados vazios | convite/ação, não erro | ⏳ | PO | — |
| Mensagens de erro | claras, com saída | ⏳ | PO | — |
| Acessibilidade | contraste, foco, rótulos | ⏳ | PO | — |

## 3. Homologação Arquitetural
| Item | Resultado esperado | Status | Resp. | Evidência |
|---|---|---|---|---|
| Catálogo como SSOT | nomenclatura sempre do catálogo | ⚠️ | Dev | nome/segmentação OK; **séries ainda agrupam por nome** (dívida — `CATALOG_SSOT.md`) |
| Sem nomenclatura duplicada | UI não origina nomes | ⚠️ | Dev | `panels.ts` transicional (rótulos ainda fora do catálogo) |
| Conformidade com ADRs | nada contraria ADR aprovado | ✅ | Dev | `ARCHITECTURAL_DECISIONS.md` |
| Bounded Contexts | fronteiras respeitadas | ✅ | Dev | `BOUNDED_CONTEXTS.md` (referência) |
| Auditoria | operações críticas rastreadas | ⏳ | Dev/PO | a inventariar |
| Eventos | fluxos coerentes com `DOMAIN_EVENTS` | ⏳ | Dev | conceitual (não implementado como bus) |
| Invariantes | nenhuma violada | ⏳ | Dev | `DOMAIN_INVARIANTS.md` → virar testes |

## 4. Homologação Técnica
| Item | Resultado esperado | Status | Resp. | Evidência |
|---|---|---|---|---|
| TypeScript | `tsc --noEmit` sem erros | ✅ | Dev | **exit 0** (02/07) |
| ESLint | sem erros nem avisos | ✅ | Dev | **0 erros · 0 avisos** (02/07; era 22+9) — commits `3e72f25` + limpeza de avisos |
| Testes automatizados | suíte verde | ✅ | Dev | **153 passed** · 126 todo |
| Performance | tempos aceitáveis (OCR/Timeline/API) | ⏳ | Dev | metas em `NON_FUNCTIONAL_REQUIREMENTS` (a criar) |
| Logs | erros logados; cobertura de catálogo | ⚠️ | Dev | fallback `catalogId ?? ''` sem log (dívida) |
| Tratamento de exceções | sem tela quebrada; mensagens | ⏳ | Dev/PO | — |

## 5. Homologação Regulatória (Governança Científica / RDC 657)
| Item | Resultado esperado | Status | Resp. | Evidência |
|---|---|---|---|---|
| Sem linguagem interpretativa | nenhum termo proibido (estável/normal/…) | ⚠️ | Dev/PO | "estável" removido; varrer restante c/ `UI_LANGUAGE_STANDARD` |
| Sem recomendação clínica | nada de "inicie/deve/risco" | ⏳ | PO | — |
| Governança Científica | organiza/contextualiza, não conclui | ✅ | Dev | princípio `PLANO_MATURIDADE §0` |
| Rastreabilidade | dados com proveniência | ⏳ | Dev | referência do laudo OK; ciência (SRL) = futuro |

## 5.1 Smoke test mínimo (~15 min) — GATE para iniciar o Scientific Catalog v2
Cobertura automatizada é **só unitária/domínio** (não cobre OCR/Supabase/upload/auth). A PO executa em produção (`sinteramais.com.br`). Três grupos:

### Grupo A — Gate de Liberação (OBRIGATÓRIOS — precisam passar)
1. [ ] Criar usuário *(requer cadastro publicado — Supabase)*
2. [ ] Fazer login
3. [ ] Enviar exame em **PDF**
4. [ ] Enviar exame em **imagem** (foto)
5. [ ] OCR/extração processa
6. [ ] Parser: valores/unidades coerentes
7. [ ] Exame aparece na lista
8. [ ] **Timeline (Histórico)** atualiza
9. [ ] **Evolução** atualiza (biomarcadores)
10. [ ] **Dashboard** atualiza
11. [ ] Abrir **detalhes do exame** (resultado/segmentação/nome do catálogo)
12. [ ] Logout · 13. [ ] Novo login · 14. [ ] Dados permanecem íntegros

### Grupo B — Critérios de Validação da Nova Arquitetura (NÃO bloqueiam)
Não são apenas "testes": são os **critérios que a nova arquitetura deverá satisfazer**. Validam capacidades previstas para a PRÓXIMA arquitetura; **não são bugs**, e sim limitações conhecidas da implementação vigente (que **ainda não atende** ao domínio aprovado). Não são critério de aprovação da plataforma atual.
15. [ ] Excluir um exame → Timeline/Dashboard atualizam ✅. *Hoje a exclusão apaga o `ai_processing_log` (`api/exams/[id]/route.ts:60`) — a trilha de auditoria é perdida. A implementação atual **ainda não atende** ao domínio aprovado (Event Store + auditoria permanente). → **CAT-022**.*
16. [ ] Reenviar o mesmo exame → *Hoje faz nova ingestão (sem deduplicação — DOMAIN_BEHAVIORS B5). Previsto para a próxima arquitetura. → **CAT-021**.*

### Grupo C — Testes Futuros (executados APÓS o Catalog v2)
Replay completo · event sourcing · auditoria imutável · reprojeções · SRL · IA Contextual.

**GATE de bloqueio = Grupo A (1–14) + cutover + cadastro.** O Grupo B **não** bloqueia: dedup e auditoria permanente **dependem** da própria arquitetura orientada a eventos que o Catalog v2 introduz — não podem ser pré-condição para iniciá-la. Risco a mitigar: problema **estrutural** no fluxo do Grupo A.

## 6. Critérios de Aceite (regra)
A **homologação v1.0 é aprovada** quando: (a) todos os itens **Funcionais** e **Regulatórios** = ✅; (b) itens **Técnicos** sem ⛔ (ressalvas ⚠️ com dívida registrada são aceitáveis); (c) ressalvas arquiteturais (SSOT/séries por catalog_id) **registradas como pós-estabilização**, não bloqueiam v1.0. Cada ✅ exige **evidência** (screenshot/log/commit). O que ficar ⏳ é responsabilidade da PO validar em produção.

---
**Uso:** a estabilização (~30 dias) percorre esta lista até zerar ⏳ e resolver/registrar os ⚠️. Só então inicia o Catalog v2 (ver `POST_STABILIZATION_BACKLOG.md`).

---

## Achados de homologação — registro corrente (a VALIDAR antes de virar defeito)

Regra: **só corrigir o que for reproduzido como defeito REAL.** Cada achado: descrição · classificação · ação · status.
Classes: **defeito funcional · inconsistência de UX/paridade · melhoria/perf · problema ambiental.**

| # | Achado | Classificação | Ação | Status |
|---|---|---|---|---|
| H‑01 | **INP ~216 ms** ao clicar "Extrair novamente" no detalhe do exame (`/dashboard/exams/[id]`), observado no **preview** da Vercel com **Vercel Toolbar + widget "Feedback rápido"** ativos. Handler `handleAnalyze` é **assíncrono/correto** (o `fetch` é awaited); o custo é o **re-render síncrono** da página no `setAnalyzing(true)`, entre o clique e o paint. | **Perf borderline** (216 ms; limiar "bom" = 200 ms) **+ provável interferência ambiental** (preview/toolbar/widget). **Defeito funcional: NÃO identificado.** | **Reproduzir em PRODUÇÃO, sem Toolbar/widget.** Se ≤ ~200 ms → **ambiental** (fechar sem código). Se **consistente > 200 ms** → abrir defeito de perf + **correção cirúrgica** (memoizar seções pesadas do detalhe / `startTransition`), **sem tocar a arquitetura congelada**. | ⏳ **a validar em produção** |
| H‑02 | **Sidebar** — as subdivisões **Registros · Saúde · Histórico** (de "Minha Saúde") devem abrir **por padrão** ao entrar e ficar **destacadas** (destaque podendo **superar** o do rótulo "Minha Saúde", que permanece só como agrupador/título). Solicitação original da fundadora. | **Mudança de UX na NAVEGAÇÃO — baseline CONGELADA.** Hoje as subdivisões **recolhem por padrão** por decisão de design deliberada ("reduz poluição visual"); o pedido a reverte. | **NÃO implementar sem EXCEÇÃO EXPLÍCITA ao congelamento**, autorizada pela fundadora. Com a exceção: alteração pequena/localizada em `Sidebar.tsx` (default-expand + peso visual das subdivisões). Sem ela: **permanece congelada**, apenas registrada. | ⏸️ **registrada — aguardando decisão** (implementar c/ exceção × manter congelada) |
| H‑03 | **Paridade de conteúdo e hierarquia do detalhe do Exame — Web × Mobile.** Divergência de **ordem** e de **conteúdo**: na Web o detalhe começa por **Pedido de origem** e **Financeiro** (administrativo) ANTES do exame; no Mobile o exame vem primeiro (correto). Além disso, "O que é este exame?" existe na Web mas não no Mobile. | **Hierarquia/paridade do CONTEÚDO do Exame** (NÃO é a nav congelada — não confundir com H-02). Inversão de prioridade: administrativo/financeiro predominando sobre o conteúdo clínico. | **Implementar na branch/preview.** Reordenar o detalhe (Web) para **conteúdo do exame primeiro; pedido e financeiro por último**. Usar a hierarquia do **Mobile como referência de prioridade** (NÃO copiar o layout — preservar padrões de interação de cada plataforma). Garantir **paridade semântica de conteúdo** entre Web e Mobile. **Não** tocar a Sidebar/nav. | 🔧 **em correção (H-03)** |

> **H-03 — ordem conceitual (decisão de produto):** ① Exame (identificação · data · info principais) → ② Conteúdo/explicação ("O que é este exame?", finalidade, indicação) → ③ Documento original / consulta → ④ Ações complementares → ⑤ Pedido de origem / rastreabilidade → ⑥ Financeiro / valor pago / NF (por último).
> **Critério de aceite:** ao abrir um exame, o usuário encontra **primeiro o conteúdo do exame**; funções administrativas e financeiras permanecem disponíveis, porém em posição **secundária** (ao final). **Financeiro nunca antes do conteúdo.** Paridade: informação relevante numa plataforma deve existir na outra, salvo justificativa explícita de plataforma. **Web ≠ identidade visual do Mobile** — paridade de conteúdo e hierarquia, não de pixels.

### Lote de achados — homologação Mobile em device (17/08) — coletar → corrigir em UM ciclo

| # | Achado | Classe | Ação / diagnóstico | Status |
|---|---|---|---|---|
| H‑04 | **Mobile · "Minha Saúde" não abre as subcategorias** — vai direto para **Exames**. | defeito de **navegação (Mobile)** — NÃO é a Sidebar Web congelada (H-02). | **CAUSA:** o atalho "Minha Saúde" (Painel Inicial · `QuickActionsSlot`) navegava ao tab `MinhaSaude` **sem tela** → caía no estado atual do stack (ExamsList, após o atalho "Exames"). **FIX (mínimo, 1 linha):** atalho passa a navegar a `MinhaSaudeMenu` (raiz = menu Registros/Saúde/Histórico). Sem tocar Sidebar/stack/hierarquia. Regressão: mobile TSC 0 · root TSC 0 · suíte 1224. | ✅ **corrigido no código — revalidar em device** |
| H‑05 | **Mobile · Relatório não abre** — "Erro desconhecido" (e também **Medicamentos · Suplementos · Composição Corporal**). | **defeito funcional (P1) — regressão por schema divergente.** | **CAUSA RAIZ:** a query `listMedications` (api-client) seleciona `prescription_url`; a **migração 136** que adiciona a coluna estava no repositório mas **não fora aplicada em produção** → PostgREST erra → `asError` mascara como "Erro desconhecido". Quebrou Medicamentos, Suplementos, Composição (marcos de medicamentos) e Relatório (`listMedications` é 1 das 13 chamadas). Web ok (outro caminho de dados). **FIX (root cause, sem código):** aplicada a migração 136 (`alter table medications add column if not exists prescription_url text` — aditiva/nullable) em produção. Instrumentação `tag()` mantida (nomeia a fonte, não mascara). **NÃO** usado `allSettled`. Gates: root TSC 0 · mobile TSC 0 · suíte 1224. | 🔄 **corrigido (server-side) — revalidar em device** (Medicamentos·Suplementos·Composição·Relatório + protegidos: Exames·Agenda·Histórico·Minha Saúde). Fecha após revalidação. |
| H‑06 | **Home · "Acesso rápido" divergente Web×Mobile.** Web: 6 cards (Histórico de Saúde · Agenda · Exames · Medicamentos · Relatórios · Despesas). Mobile: 4 (Agenda · Exames · Minha Saúde · Rede de Cuidado). | UX / **paridade**. | Alinhar o conjunto de atalhos entre plataformas (decisão de qual conjunto canônico). | ⏸️ registrar (decisão) |
| H‑07 | **Configurações · Contato WhatsApp — código do país / DDD.** | ⏳ a detalhar. | Aguarda "o que está errado × esperado" da fundadora (o print sozinho não indica o defeito). | ⏳ a detalhar |
| H‑08 | **Mobile · Composição · botão "Nova medida" desconfigurado.** (`ComposicaoScreen:223`) | UI/formatação (classe do D-17). | Aguarda print para diagnóstico visual exato antes do fix mínimo. | ⏳ a detalhar (print) |
| H‑09 | **P0/P1 · GRAVE — Pedido de exame tratado como EXAME REALIZADO.** Documento de **pedido/solicitação** enviado por foto foi classificado como `imaging` (resultado) e roteado p/ **Exames**, não p/ **Pedidos**. Ex.: `ab5b5816` "Doppler … venoso de membro inferior" = `document_type=imaging`. **Contraprova de que o sistema SABE classificar pedido:** `47f8a374` "Pedido de ultrassonografia de parede abdominal" = `document_type=medical_order`, `order_status=realizado`. Logo, a capacidade existe; o defeito é **quando/por que a foto de um pedido cai em `imaging`**. | **defeito funcional — classificação + roteamento** (CEF/DUE). **Pedido e exame realizado devem permanecer entidades distintas.** | **Investigar a cadeia completa** captura(foto)→OCR/DUE→classificação(`document_type`)→persistência→roteamento; **reproduzir e identificar a causa raiz — NÃO corrigir por hipótese.** Antes de qualquer alteração, **declaração DEV-001** (abaixo). Não mexer em arquitetura/modelo de dados/classificação global salvo necessidade comprovada. | 🔎 **investigação de causa raiz (read-only)** |
| H‑10 | **Exame realizado com identificação incorreta** — nome, data e **lateralidade**. Ex.: `0f5ec205` nome genérico **"Ultrassom"**, `exam_date=null`; `ab5b5816` gravado como **"… - unilateral"** (a fundadora relata que o documento indica **bilateralidade**). | qualidade de **extração de imagem** (DUE) — nome/data/lateralidade. **Invariante:** *nunca inferir unilateralidade quando o documento indica bilateralidade; se a fonte não permitir determinar lateralidade com segurança, preservar o original ou marcar "não determinada" — não inventar OD/OS nem direita/esquerda.* | **Investigar separadamente** a extração de nome/data/lateralidade em imagem. **Não implementar regra de lateralidade sem revisão da evidência/documento.** Relaciona-se a **D-11/D-12** (governança de produto/clínica). Declaração DEV-001 (abaixo). | 🔎 **investigação (read-only) + decisão D-11/D-12** |
| H‑11 | **P2 · UI/visual — Exame laboratorial 2025** (`7989d640`, "Exames laboratoriais • Hermes Pardini") exibe **"possível duplicado" com letras desformatadas** (granulação `(ᄀ)` na apresentação). **Dado permanece íntegro** — é problema de **exibição**. | **UI/visual** (de-garble na apresentação) — **mesma raiz do #15** do backlog. | **Corrigir apenas a apresentação** (não exibir texto granulado / de-garble no render), **preservando o dado**. Conecta ao backlog #15. | 🔎 investigar apresentação (liga #15) |
| H‑12 | **Rótulo · página de Pedidos** — botão **"Adicionar exame realizado"** deveria ser **"Adicionar pedido de exames"**. **DISTINTO de H-09** (não é a quebra de classificação; é só o texto do botão). | **defeito de rótulo (UI)** — simples. | Localizar o rótulo na página de Pedidos e corrigir (correção mínima). Registrado à parte para **não** ser confundido com a causa de H-09. | 🔧 a corrigir |

> **Nota:** o `SAVA` exibido no exame `33670c0b` é o **artefato de código já conhecido** (fragmento de pedido, não emissor) — **não** é achado novo de homologação; correção pontual separada, fora deste ciclo, quando a fundadora decidir.

### Declaração DEV-001 — H-09 (Pedido × Exame realizado) — *investigação, ainda sem correção*
- **ESCOPO (a confirmar após causa raiz):** apenas o ponto da cadeia que faz a foto de um **pedido/solicitação** ser classificada como `imaging` em vez de `medical_order`, e roteada para Exames em vez de Pedidos. Nada além do necessário para eliminar a causa.
- **FORA DO ESCOPO:** modelo de dados (`exams`/`document_type`/`medical_order`), taxonomia de classificação global, extração de laboratório/PDF, UX de navegação, arquitetura da DUE/CEF. Melhoria de acurácia geral do classificador → backlog independente.
- **ÁREAS PROTEGIDAS:** Exames (lista/detalhe/autoanálise), Pedidos, classificação de **laboratório** e de **PDF** (baseline homologado), roteamento existente que já funciona (`47f8a374` prova o caminho `medical_order`). **Pedido e exame realizado são entidades distintas — a fronteira não pode ser diluída.**
- **CAUSA (COMPROVADA — 17/08; evidência: `understanding_report.pipeline.decisionLog` de `ab5b5816` + `src/app/api/exams/[id]/analyze/route.ts`):**
  1. A leitura multimodal **DUE (`understandImageDocument`) FALHOU** (retornou `null` após retry) para o pedido `ab5b5816`: `decisionLog=[{step:"due",status:"failed",reason:"…retornou null após retry… aguarda re-processamento"}]`, `extractor_version=heuristic-v0`, `finalStatus=pending`, `understanding_report.due=null`.
  2. Com a DUE nula, o pipeline caiu no fallback `classifyDocumentAI` (Content Classifier, Haiku) — `analyze/route.ts:617-637` (ramo `result.biomarkers.length===0`), que roda **sobre a imagem** (`docMediaType` de imagem, `:621-625`).
  3. O Content Classifier classificou o **pedido Unimed de Doppler** como `document_type='imaging'` (`:633`) e o nomeou "Doppler colorido venoso de membro inferior - unilateral". A regra `PEDIDO→medical_order` existe no prompt (`document-classifier.ts:26`) mas **perdeu** para "exame de IMAGEM→imaging" (`:27`): o classificador pesou a **MODALIDADE impressa** acima do **GÊNERO documental** (pedido × resultado).
  4. `imaging` não é tipo de ordem (`packages/core/src/domain/exams/classification.ts` · `ORDER_DOCUMENT_TYPES`) → roteado p/ **Exames**, não **Pedidos**.
- **PONTO EXATO em que `medical_order` se perde:** a decisão de **gênero** (DUE e/ou `classifyDocumentAI`) subordina "pedido/solicitação" à modalidade impressa. Fatores estruturais que agravam: (a) `imageModalityOverride` (`route.ts:380`) só aceita `imaging`/`ophthalmology` da DUE — um veredito `medical_order` da DUE é **descartado**; (b) na falha da DUE, `effectiveDocType` assume `'imaging'` (`:412`) — **promoção automática** de imagem ilegível a "exame de imagem" (exatamente o que a fundadora vetou).
- **CORREÇÃO MÍNIMA (PROPOSTA — NÃO implementada; aguarda aprovação):** distinção por **contexto documental**, nunca por palavra-chave. REQUISIÇÃO (solicito/requisito/pedido; sem resultados) → `medical_order`; LAUDO/RESULTADO (achados/medidas/conclusão) → `imaging`/categoria; **ambíguo/ilegível → não promover** a exame realizado (manter `pending`/`draft` p/ revisão). Direções candidatas (decidir juntas): (i) gênero ACIMA da modalidade no prompt da DUE + Content Classifier; (ii) permitir veredito `medical_order`/`insurance_guide` de **imagem** fluir (corrige assimetria `:380`/`:412`); (iii) falha da DUE = **não-determinado**, não `imaging`. Validar por **invariante de domínio** (pedido de imagem → `medical_order`; imagem ilegível → não-determinado).
- **REGRESSÃO:** classificação PDF-laboratório · classificação PDF-pedido (`47f8a374` deve continuar `medical_order`) · imagem-resultado legítimo (não pode virar pedido) · roteamento Exames × Pedidos · detalhe do exame.

### Declaração DEV-001 — H-10 (Identificação: nome · data · lateralidade) — *investigação, ainda sem correção*
- **ESCOPO (a confirmar após causa raiz):** apenas a extração de **nome**, **data** e **lateralidade** na leitura de **imagem** (DUE), quando a evidência do documento a sustenta.
- **FORA DO ESCOPO:** extração de laboratório/PDF, classificação de `document_type` (é o H-09), catálogo/SSOT, UX. Não criar regra clínica nova de lateralidade sem revisão da evidência (**D-11/D-12**).
- **ÁREAS PROTEGIDAS:** invariante de data já corrigida (Obs 10 / `normalizeGarbledDigits`), leitura de laboratório, catálogo de nomenclatura.
- **CAUSA (PARCIAL — 17/08; evidência: `understanding_report`):**
  - `ab5b5816` "- unilateral": a lateralidade foi cunhada pelo `classifyDocumentAI` (naming), cujo prompt pede nome "com região/**lateralidade** quando houver" (`document-classifier.ts:19,21`) — ponto onde a inferência pode entrar. Como a **DUE falhou** (`due=null`), **não há evidência persistida** do que o documento realmente diz → **não é auditável** se "unilateral" foi LIDO ou INFERIDO. **Isso viola o invariante #6 (origem rastreável).**
  - `0f5ec205` "Ultrassom", sem data: a **DUE teve sucesso** e reportou FIELMENTE `examName=null`, `examDate={absenceReason:not_found}`, `patient=null` (folha de medidas de ultrassom sem título/data claros). Nome caiu p/ a modalidade genérica; data ficou `null` (**correto — não inventou data**). Aqui a DUE agiu fielmente; o "defeito" é qualidade do documento-fonte + nome genérico, **não** invenção.
- **INDEPENDÊNCIA de H-09:** para `ab5b5816`, (má)classificação e nome/lateralidade vêm do **mesmo fallback** (`classifyDocumentAI` após falha da DUE) — **acoplados neste registro**; mas o risco de INVENÇÃO de lateralidade é do prompt de nomeação (independente da decisão de gênero). Para `0f5ec205`, é **independente** de H-09.
- **CORREÇÃO MÍNIMA (PROPOSTA — NÃO implementada):** (1) **reprocessar `ab5b5816`** com DUE funcionando p/ obter a evidência real antes de qualquer regra; (2) no naming, **não materializar lateralidade sem evidência** — sem confirmação do lado, preservar sem sufixo ou "não determinada"; **nunca** converter bilateral→unilateral; (3) **persistir o understanding_report mesmo no fallback** (rastreabilidade). **Regra de lateralidade (invariante):** nunca inferir unilateralidade quando o documento indica bilateralidade; sem determinação segura → preservar original ou marcar "não determinada"; **não** inventar OD/OS nem direita/esquerda.
- **REGRESSÃO:** extração de nome/data em PDF (não regredir) · invariante de data (Obs 10) · exibição do detalhe · testes de invariante de domínio (nome preservado; data não inventada; lateralidade não inferida contra evidência).
