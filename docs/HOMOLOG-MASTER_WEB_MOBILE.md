# HOMOLOGAÇÃO — Checklist MASTER Web + Mobile (tracker vivo)

**Este é o documento único e vivo da homologação.** Consolida **todos** os achados Web + Mobile, deduplicados contra o
backlog existente, e é **atualizado continuamente** conforme cada item é corrigido — até que tudo esteja executado e a
homologação possa ser considerada **finalizada**. Supera, como tracker, o `HOMOLOG-CONSOLIDADO_WEB_MOBILE_V1` (que fica
como snapshot da 1ª rodada).

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
| **A7** | Mobile | **Filtros do Histórico** (Tipo/Período) — opções cortadas por falta de rolagem | 🔎 **verificando** (próximo lote) | relacionado a D‑16/D‑18 (picker rolável). Investigar o componente de filtro do TimelineScreen |
| **A8** | Web+Mobile | **Histórico — taxonomia** clínica (Por data/Por tipo); **sem "Evento"**; paridade Web×Mobile | 🟢 **corrigido — PR #120** | `TimelineEntry.category` + `timelineCategoryLabel` no core; Mobile agrupa por categoria clínica; Web `outro`→"Outro" |
| **A9** | Mobile | **Pedido de exame — roteamento** → não abrir "Adicionar exame" | 🟢 **roteamento/rótulo corrigido — PR #120** · 🧭 **persistência imediata em Pedidos = decisão (REG-001)** | Hub → "Adicionar pedido de exame". `document_type` é derivado (REG-001); declarar na criação p/ aparecer já na aba Pedidos é decisão de arquitetura |
| **A10** | Mobile | **Receita médica — roteamento** → não virar exame | 🧭 **destino = C2** (Web ganhou o guard A13) | Mobile não tem destino de Receita hoje (capacidade nova) → corrigido junto com **C2**, não antes |
| **A11** | Web+Mobile | **Óculos/Lentes** → Recurso de Saúde | 🟢 **corrigido — PR #120** | removido o intent dedicado (`intents.ts`) + teste |
| **A12** | Web+Mobile | **Paridade Home Web × Mobile** — auditoria | 🔎 **auditoria em andamento** | resultado alimenta correções pontuais |
| **A13** | Web | **Documentos não‑exame — categoria some ao anexar** | 🟢 **guard corrigido — PR #120** · 🗺️ **domínio completo = C1** | `CaptureCenter` não sobrescreve mais a categoria declarada; destino próprio de doc clínico → C1 |

## GRUPO B — Estrutural já definido (preparar já; validar após Fase 0/Preview)

| ID | Plat. | Item | Status | Dedup / evidência |
|---|---|---|---|---|
| **B1** | Web(+Mobile) | **Multi-documento de exames (runtime)** — 1 exame ↔ N documentos (PDF+foto, N fotos, N PDFs, PDF hoje+foto amanhã, preliminar+laudo final, complementar depois); **não criar novo exame** por 2º arquivo; **acabar com "PDF encerra o fluxo"** | 🔧 camada de dados pronta (**PR #121**) · ⛔ runtime/UI/validação dependem da Fase 0 (**#117**) | = W‑01 |
| **B2** | Web+Mobile | **Auditoria universal de anexos** — todo ponto de upload: formatos (PDF/JPG/PNG/**Word**/demais suportados), formas (arquivo, câmera, múltiplas imagens, múltiplos arquivos, drag‑and‑drop na Web, voz quando aplicável), cardinalidade (1, N, mistos, posterior, complementar); consistência; **N docs → 1 exame/evento**; sem restringir por 1º formato | 🔎 auditoria a fazer | consolida CAP‑001/HUB‑001 (D‑14) |
| **B3** | Web+Mobile | **Testes multi-documento** — PDF; imagem; misto; múltiplos; anexação posterior; preliminar+final | 🔧 base em `FUNC-exam-documents-writer` (#121); ampliar | parte de B1 |

## GRUPO C — Nova capacidade (spec-first; sem improvisar regra de negócio)

| ID | Plat. | Item | Status | Dedup / evidência |
|---|---|---|---|---|
| **C1** | Web+Mobile | **Documentos clínicos não-exame** — evoluir **#118**: Atestado/Relatório/Encaminhamento; categoria permanece; **separado de `exam_documents`** | 📝 **spec escrita** (`HOMOLOG-SPECS_C1_C2_C3` §C1) → aguarda decisão | = W‑04; A13 já protege a categoria declarada |
| **C2** | Web+Mobile | **Receita como objeto/documento próprio** — associável a Medicamento/Suplemento/Ciclo/Composição/Recursos/Hábitos/Monitoramento; modelo + roteamento **spec-first** | 📝 **spec escrita** (§C2) → 🧭 **decisões da fundadora** | evolui D‑13; A10 (Mobile) resolve junto |
| **C3** | Web+Mobile | **Monitoramento × integração Redbus** — auditar o modelo antes de acoplar; adaptador desacoplado (princípio RNDS) | 📝 **spec/auditoria inicial escrita** (§C3) | modelo de wearables já existe (migr. 025/127‑133); `SyncEngine` port |

---

## Congelados / não reabrir
H‑09/H‑10 · `ab5b5816` · `0f5ec205` · arquitetura de navegação homologada · **#113** (visão completa) · **RNDS** · qualquer decisão já congelada. Não transformar cada observação em alteração estrutural. Produção bloqueada (gate separado).

## Gates
- **Infra (Fase 0 / #117):** apply no Preview → habilita validação de B1/B2/B3 e runtime real de `exam_documents`. **Aguarda autorização.**
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
- **Ciclo 1 (PR #120)** entregue e validado: A1, A2, A4, A5, A6, A8 (Web+Mobile+core), A9 (roteamento/rótulo), A11. tsc root/mobile/core 0; capture‑hub 381/381; timeline‑projection 8/8; FUNC‑registration‑hub 9/9.
- **A3** era falso‑positivo de código (o seletor já renderiza "🩺 Consulta"/"🩹 Procedimento") → revalidar em build nova.
- **A13** guard de categoria na captura (Web) entregue; **A10/C1/C2** dependem de destino próprio (spec).
- **Specs C1/C2/C3** escritas (`HOMOLOG-SPECS_C1_C2_C3.md`).
- **A12** auditoria de Home concluída (acima). **B2** (anexos universais) e **A7** (filtros roláveis) em andamento.
- **Gates intocados:** Fase 0 (#117) não aplicada; produção bloqueada; congelados preservados.
