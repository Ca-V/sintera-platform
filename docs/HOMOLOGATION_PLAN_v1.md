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

> **Nota:** o `SAVA` exibido no exame `33670c0b` é o **artefato de código já conhecido** (fragmento de pedido, não emissor) — **não** é achado novo de homologação; correção pontual separada, fora deste ciclo, quando a fundadora decidir.
