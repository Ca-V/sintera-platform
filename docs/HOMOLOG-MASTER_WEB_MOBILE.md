# HOMOLOGAÇÃO — MATRIZ ÚNICA Web + Mobile (fonte de verdade)

**Este é o documento único e vivo da homologação — a fonte de verdade.** Nenhuma observação deve ser re-perguntada ou
perdida entre PRs: tudo é consolidado aqui, deduplicado contra o backlog, com status por item e por grupo, e
**atualizado continuamente** até a homologação ser considerada **finalizada**. Documentos de apoio: specs
(`HOMOLOG-SPECS_C1_C2_C3` = DOC-001/ANEXO-001/PEDIDO-001/C3), auditoria de anexos (`HOMOLOG-AUDIT_B2_ANEXOS`), snapshot
da 1ª rodada (`HOMOLOG-CONSOLIDADO_WEB_MOBILE_V1`).

> **Modo de execução (autorizado pela fundadora):** execução contínua, sem pedir confirmação a cada item. Parar apenas
> em **gate real de banco/produção** ou em **decisão de produto ainda não definida**. Não reabrir itens congelados. Não
> pedir para repetir observações já registradas.

## Legenda
`A` correção imediata (bug visual/navegação/nomenclatura/formatação/filtro/estado/regressão; sem alterar banco) ·
`B` estrutural já definido (depende de `exam_documents`/multi-documento; preparar já, validar após Fase 0/Preview) ·
`C` nova capacidade que exige **spec-first** (Receita, documentos não-exame, Monitoramento/Redbus).

**Status:** 🆕 novo · 📌 registrado‑pendente · 🔎 verificando no código · 🔧 em implementação · ✏️ **corrigido no código (revalidar em build nova)** · ⛔ bloqueado (infra) · 🧭 decisão de produto · 🟢 corrigido‑aguardando homologação · ✅ homologado · 🗺️ backlog futuro

---

## GRUPO A — Correção imediata

| ID | Plat. | Item | Status | Dedup / evidência |
|---|---|---|---|---|
| **A1** | Web | **Sidebar** — regressão `f8fd527`: restaurar Registros de Saúde / Histórico / demais categorias; tipografia mais aparente; **categorias abertas por padrão**; sem redesenhar navegação homologada | 🟢 **corrigido — PR #120 (Ciclo 1)** | = W‑02. Falta merge/deploy → por isso reaparece na build |
| **A2** | Web | **Relatórios** — filtros/período dentro de card/picker **rolável** | 🟢 **corrigido — PR #120** | = W‑03 |
| **A3** | Mobile | **Novo evento** — itens **Consulta** e **Procedimento** "só com ícone" | ✏️ **código já correto — revalidar em build nova** | O código renderiza "🩺 Consulta"/"🩹 Procedimento" com texto (`EventFormScreen.tsx:126/216`). NÃO era bug de código → build antiga ou truncamento (coberto por A6). Não re‑corrigido |
| **A4** | Mobile | **Composição** — botão **"Nova medida"** fora do padrão | 🟢 **corrigido — PR #120** | título com `flex`/`numberOfLines` (o botão já era DS‑correto) |
| **A5** | Mobile | **Relatórios** — botão **"Gerar link"** fora do padrão | 🟢 **corrigido — PR #120** | CTA primário + título não empurra o botão |
| **A6** | Mobile | **Cards de Exames** — quebra no meio da palavra | 🟢 **corrigido — PR #120** | badges `flexShrink`/`maxWidth` + `numberOfLines` |
| **A7** | Mobile | **Filtros do Histórico** (Tipo/Período) — opções cortadas por falta de rolagem | ✏️ **código já rolável** + 🟢 **safe‑area corrigido — PR #120** | `HistoricoExamesScreen` já usa o `Select` rolável (D‑16/D‑18); "corta embaixo" endurecido com safe‑area no bottom‑sheet. Revalidar em build nova |
| **A8** | Web+Mobile | **Histórico — taxonomia** clínica (Por data/Por tipo); **sem "Evento"**; paridade Web×Mobile | 🟢 **corrigido — PR #120** | `TimelineEntry.category` + `timelineCategoryLabel` no core; Mobile agrupa por categoria clínica; Web `outro`→"Outro" |
| **A9** | Mobile | **Pedido de exame — roteamento** → não abrir "Adicionar exame" | 🟢 **roteamento/rótulo corrigido — PR #120** · 🧭 **persistência imediata em Pedidos = decisão (REG-001)** | Hub → "Adicionar pedido de exame". `document_type` é derivado (REG-001); declarar na criação p/ aparecer já na aba Pedidos é decisão de arquitetura |
| **A10** | Mobile | **Receita médica — roteamento** → não virar exame | 🧭 **destino = C2** (Web ganhou o guard A13) | Mobile não tem destino de Receita hoje (capacidade nova) → corrigido junto com **C2**, não antes |
| **A11** | Web+Mobile | **Óculos/Lentes** → Recurso de Saúde | 🟢 **corrigido — PR #120** | removido o intent dedicado (`intents.ts`) + teste |
| **A12** | Web+Mobile | **Paridade Home Web × Mobile** — auditoria | 🔎 **auditoria em andamento** | resultado alimenta correções pontuais |
| **A13** | Web | **Documentos não‑exame — categoria some ao anexar** | 🟢 **guard corrigido — PR #120** · 🗺️ **domínio completo = C1** | `CaptureCenter` não sobrescreve mais a categoria declarada; destino próprio de doc clínico → C1 |

## GRUPO B — Estrutural já definido (preparar já; validar após Fase 0/Preview)

| ID | Plat. | Item | Status | Dedup / evidência |
|---|---|---|---|---|
| **B1** | Web(+Mobile) | **Multi-documento de exames (runtime)** — 1 exame ↔ N documentos (PDF+foto, N fotos, N PDFs, PDF hoje+foto amanhã, preliminar+laudo final, complementar depois); **não criar novo exame** por 2º arquivo; **acabar com "PDF encerra o fluxo"** | 🔧 kernel + cenários testados (**#121**) + **migração/backfill validados LOCALMENTE** (#117, ver FASE0-DIAG §6) · ⛔ **validação funcional integrada em Preview PENDENTE** (ausência de ambiente Preview); runtime/UI dependem dela | = W‑01 |
| **B2** | Web+Mobile | **Auditoria universal de anexos** | ✅ **auditoria concluída** (`HOMOLOG-AUDIT_B2_ANEXOS.md`) | Achados: "PDF encerra o fluxo" (`DocumentBundleCapture.tsx:35`); N→1 exame só p/ N imagens; **Word não aceito em lugar nenhum**; HEIC contraditório; 2 protocolos de captura; limites divergentes. Correções: runtime B1 (gated) + decisões de produto + 2 micro‑fixes prontos |
| **B3** | Web+Mobile | **Testes multi-documento** — PDF; imagem; misto; múltiplos; anexação posterior; preliminar+final | 🔧 base em `FUNC-exam-documents-writer` (#121); ampliar | parte de B1 |

## GRUPO C — Nova capacidade (spec-first; sem improvisar regra de negócio)

| ID | Plat. | Item | Status | Dedup / evidência |
|---|---|---|---|---|
| **C1+C2** | Web+Mobile | **Domínio único "Documentos do paciente"** (DOC-001) — Receita/Atestado/Relatório/Encaminhamento como **subtipos**, **separado de `exam_documents`**; Receita **associável** a 1..N contextos (Medicamento/Suplemento/Ciclo/Composição/Recursos/Hábitos/Monitoramento) | 🔧 **código isolado pronto (opção B, PR #124)** · ⛔ schema/UI/validação **gated** (Preview) | decisão Q3 travada; invariante documento≠exame testado; A10/A13 resolvem junto |
| **ANEXO** | Web+Mobile | **Política transversal de anexos (SSOT)** — allowlist única (PDF/JPEG/PNG/HEIC/Word), limite único, métodos por plataforma, PDF não encerra, N→1 exame | 🔧 **SSOT `attachmentPolicy` pronta (PR #124)** · ⛔ adoção nos pontos = rollout com B1/Fase 0 | ANEXO-001; consome de uma fonte única |
| **C3** | Web+Mobile | **Monitoramento × integração Redbus** — auditar o modelo antes de acoplar; adaptador desacoplado (princípio RNDS) | 📝 **spec/auditoria inicial escrita** (§C3) | modelo de wearables já existe (migr. 025/127‑133); `SyncEngine` port |

---

## Congelados / não reabrir
H‑09/H‑10 · `ab5b5816` · `0f5ec205` · arquitetura de navegação homologada · **#113** (visão completa) · **RNDS** · qualquer decisão já congelada. Não transformar cada observação em alteração estrutural. Produção bloqueada (gate separado).

## Gates
- **Fase 0 / #117:** **validação técnica local CONCLUÍDA** (Postgres efêmero, dados sintéticos: migration, `exam_documents`, alterações em `exams`/resultados, RLS, backfill, sem órfãos, congelados preservados, rollback, `fulfills_order_id` preservado — ver `FASE0-DIAG §6`). **Validação funcional em Preview PENDENTE por ausência de ambiente Preview.** NÃO marcar como "Fase 0 homologada".
- **Ciclo de infra ENCERRADO por ora:** sem contratar Supabase **Pro** e sem 2º projeto agora (só se necessário numa etapa posterior). **Nenhuma ação no Supabase**; produção intocada; #117 não aplicada em produção.
- **Produção:** bloqueada; gate separado.
- **Decisão de produto:** C2 (arquitetura/roteamento de Receita), C3 (modelo de Monitoramento) — avançar spec sem implementar regra até definição.

---

## Auditoria A12 — Paridade Home Web × Mobile (resumo)
Espinha central **bate** (saudação → Adicionar registro → Agenda próximo → acesso rápido → Como usar) e o **hub de registro é genuinamente compartilhado** (SSOT em `@sintera/core`; só o mapa de navegação difere). Divergências **deliberadas** (justificadas por INV‑HOME‑001): sem Resumo/Linha do tempo/Insights no Mobile; alertas sensíveis a tempo (novidade/exames pendentes/empty‑state) só na Web. Divergências **não deliberadas** (para a fundadora decidir alinhamento — envolve escolha de produto de quais atalhos expor):
1. **Acesso rápido:** Web 6 tiles (Histórico, Agenda, Exames, Medicamentos, Relatórios, Despesas) × Mobile 4 (Agenda, Exames, Minha Saúde, Rede de Cuidado).
2. **"Criar lembrete"** existe na Home Web, não na Mobile.
3. **Empty‑state da Agenda‑próximo:** Mobile mostra card vazio; Web oculta a seção.
4. **"Como usar":** Web dispensável (localStorage); Mobile permanente.

## Log de execução (mais recente no topo)
- **Reteste Ciclo 1 em device: 5/6 OK** (Histórico por tipo, formatação de exames, Nova medida, Gerar link, Óculos/Lentes). **Pedido de exame CORRIGIDO** (PEDIDO-001, **PR #128 mergeado**): pedido nasce `medical_order` e vai **direto para Pedidos** (Web+Mobile), **nunca** transita por Exames (nem em "Processando") — testes de regressão em `tests/exams/FUNC-pedido-para-pedidos`. Requer **nova build EAS** para revalidar no aparelho. Correlação Pedido↔Resultado registrada como spec própria (**ORD-002**), separada do bug.
- **Ciclo de infra encerrado por ora:** #117 **validada tecnicamente em local** (concluída; ver FASE0-DIAG §6) — **validação funcional em Preview PENDENTE** por ausência de ambiente Preview (branching exige Pro; sem staging). **Não** contratar Pro/2º projeto agora. #117/#121 marcados como "validação funcional em Preview pendente" (não é "Fase 0 homologada"). Foco da homologação volta ao que é testável: Web (Preview automático) + Mobile (aguarda build EAS).
- **DOC-001 opção B (PR #124):** domínio "Documentos do paciente" + política transversal de anexos em **código isolado testado** (16 casos; invariante documento≠exame; 7 associações da Receita), **sem banco/produção**; validação aguarda Preview.
- **Decisões Q1–Q4 aplicadas:** Ciclo 1 (#120) **mergeado** na integração; Ciclo 2 micro-fixes de anexo (**PR #123**); specs travadas (domínio único "Documentos"; REG-001 mantido; política única de anexos). Matriz declarada como fonte de verdade.
- **Ciclo 1 (PR #120)** entregue e validado: A1, A2, A4, A5, A6, A8 (Web+Mobile+core), A9 (roteamento/rótulo), A11. tsc root/mobile/core 0; capture‑hub 381/381; timeline‑projection 8/8; FUNC‑registration‑hub 9/9.
- **A3** era falso‑positivo de código (o seletor já renderiza "🩺 Consulta"/"🩹 Procedimento") → revalidar em build nova.
- **A13** guard de categoria na captura (Web) entregue; **A10/C1/C2** dependem de destino próprio (spec).
- **Specs C1/C2/C3** escritas (`HOMOLOG-SPECS_C1_C2_C3.md`).
- **A12** auditoria de Home concluída (acima).
- **A7** entregue (safe‑area do `Select`) — os filtros já eram roláveis (revalidar em build nova).
- **B2** auditoria de anexos **concluída** (`HOMOLOG-AUDIT_B2_ANEXOS.md`): confirma "PDF encerra o fluxo", N→1 exame parcial, Word ausente, 2 protocolos de captura → alimenta o runtime **B1** (gated Fase 0) + decisões de produto.
- **Ciclo 1 (PR #120)** final: A1, A2, A4, A5, A6, A7, A8, A9(roteamento), A11, A13(guard). **A3** falso‑positivo. **A10/C1/C2/C3** spec‑first.
- **Gates intocados:** Fase 0 (#117) não aplicada; produção bloqueada; congelados preservados.

## Situação por grupo (fechamento desta rodada)
- **Grupo A (imediato):** **entregue** no Ciclo 1 (PR #120), exceto A10 (destino de Receita = C2) e A12 (auditoria → alinhamentos de Home são decisão de produto). A3/A7 já estavam no código → **revalidar em build nova**.
- **Grupo B (estrutural):** B1 código em #121; runtime/UI/N→1‑exame/PDF‑não‑encerra dependem da **Fase 0** (#117, gate). B2 auditado.
- **Grupo C (spec‑first):** C1/C2/C3 especificados; **aguardam decisões** da fundadora (não implementar até definir).

## Decisões RESOLVIDAS (fundadora — não reabrir)
- **Ciclo 1 (PR #120):** ✅ **mergeado** em `feat/mobile-inc4-perfil` → chega ao ambiente de homologação (Web via Preview automático; **Mobile exige build EAS nova**).
- **Pedido/REG-001:** **manter derivado** pela extração. Não alterar REG-001 sem etapa específica; a mudança é **especificada** (`PEDIDO-001`, opção (a) faixa "Em classificação" recomendada).
- **Documentos (C1+C2):** **domínio único "Documentos do paciente"** — Receita e Atestado/Relatório/Encaminhamento são **subtipos**, **separado de `exams` e `exam_documents`**; Receita **associável** a N alvos. Design em `DOC-001`. Sem provisório.
- **Anexos:** **política única** (Word + HEIC + limite único, valor definido tecnicamente) em **todos** os pontos. Micro-fixes de bug entregues (Ciclo 2 · **PR #123**); o restante é estrutural (`ANEXO-001`, com B1/Fase 0).
- **Home:** manter paridade estrutural; corrigir só divergências não intencionais (auditoria A12).

## Decisões/menores ainda em aberto (não bloqueiam o design)
- **Pedido:** escolher opção (a) faixa "Em classificação" vs (b) declarar na criação — numa etapa própria.
- **Receita:** extração propõe associações ou manual no MVP (sugestão: manual no MVP).
- **Anexos:** valor do limite único; Word extraído (docx→pdf) vs armazenado como documento; avatar de perfil.
- **C3 Redbus:** domínios/auth/unidades do provedor (informação externa).
- **Infra:** liberar **Fase 0 (#117) no Preview** → habilita homologação real do multi-documento (B1).
