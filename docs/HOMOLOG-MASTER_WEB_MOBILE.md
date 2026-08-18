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
| **A1** | Web | **Sidebar** — regressão `f8fd527`: restaurar Registros de Saúde / Histórico / demais categorias; tipografia mais aparente; **categorias abertas por padrão**; sem redesenhar navegação homologada | 🟢 corrigido em **PR #120** (não mergeado) | = W‑02. Fix existe; falta merge/deploy → por isso reaparece na build |
| **A2** | Web | **Relatórios** — filtros/período dentro de card/picker **rolável** (não expor tudo verticalmente); manter padrão de seletores roláveis | 🟢 corrigido em **PR #120** (não mergeado) | = W‑03 |
| **A3** | Mobile | **Novo evento** — itens **Consulta** e **Procedimento** só com ícone, sem nomenclatura; nomear ambos; verificar se conduzem ao fluxo correto | 🔎 verificando | relacionado a D‑06 (cards da Agenda já nomeados) — superfície do seletor de tipo |
| **A4** | Mobile | **Composição Corporal** — botão **"Nova medida"** fora do padrão visual | 🔎 verificando | relacionado a D‑17 (formatação da tela) — o botão é elemento distinto |
| **A5** | Mobile | **Relatórios** — botão **"Gerar link"** fora do padrão visual | 🔎 verificando | novo |
| **A6** | Mobile | **Cards de Exames** — quebra de texto inadequada ("Exa/mes laborat/oriais", "Ecodopple/r…"); layout responsivo, sem mudar conteúdo/nomenclatura | 🔎 verificando | novo |
| **A7** | Mobile | **Filtros do Histórico** (Tipo/Período) — opções cortadas por falta de rolagem; usar picker/selector rolável; todas as opções acessíveis; sem modal infinito | 🔎 verificando | relacionado a D‑16/D‑18 (padrão de picker rolável) |
| **A8** | Web+Mobile | **Histórico de Saúde — taxonomia** — duas dimensões (Por data / Por tipo) com as categorias reais (Exame, Consulta, Procedimento, Vacina, Composição corporal, Medicamento, Suplemento, Recursos de saúde…). **Não usar "Evento" como categoria clínica** (colírio ≠ "Evento"). **Paridade Web×Mobile** (Mobile não pode reduzir a "Exames \| Consultas e eventos") | 🔎 verificando | correção de arquitetura de apresentação já definida (não é ideia nova) |
| **A9** | Mobile | **Pedido de exame — roteamento** — "Adicionar registro → Pedido de exame" leva a "Adicionar exame" (errado); deve ir ao domínio de **Pedidos de Exames** | 🔎 verificando | novo (parte roteamento) |
| **A10** | Mobile | **Receita médica — roteamento** — "Receita médica" leva ao fluxo de exame (errado). Impedir esse desvio (destino definitivo depende do spec de Receita — grupo C) | 🔎 verificando | = M‑03; destino final → C |
| **A11** | Web+Mobile | **Óculos/Lentes** — remover categoria/card exclusivo; tratar como **Recurso de Saúde** (decisão de produto já tomada) | 🔎 verificando | novo |
| **A12** | Web+Mobile | **Paridade Home Web × Mobile** — auditar informações, categorias, ações, nomenclaturas, atalhos, adicionar‑registro, estados, hierarquia; corrigir divergências não deliberadas | 🔎 auditoria pendente | novo (auditoria) |
| **A13** | Web | **Documentos não‑exame — persistência da categoria no fluxo** — a categoria escolhida (ex.: Atestado) some ao anexar o arquivo, sendo trocada por Exame/Medicamento/Recurso. Preservar a categoria durante todo o fluxo de captura (o domínio completo é grupo C/#118) | 🔎 verificando | bug concreto do #118 |

## GRUPO B — Estrutural já definido (preparar já; validar após Fase 0/Preview)

| ID | Plat. | Item | Status | Dedup / evidência |
|---|---|---|---|---|
| **B1** | Web(+Mobile) | **Multi-documento de exames (runtime)** — 1 exame ↔ N documentos (PDF+foto, N fotos, N PDFs, PDF hoje+foto amanhã, preliminar+laudo final, complementar depois); **não criar novo exame** por 2º arquivo; **acabar com "PDF encerra o fluxo"** | 🔧 camada de dados pronta (**PR #121**) · ⛔ runtime/UI/validação dependem da Fase 0 (**#117**) | = W‑01 |
| **B2** | Web+Mobile | **Auditoria universal de anexos** — todo ponto de upload: formatos (PDF/JPG/PNG/**Word**/demais suportados), formas (arquivo, câmera, múltiplas imagens, múltiplos arquivos, drag‑and‑drop na Web, voz quando aplicável), cardinalidade (1, N, mistos, posterior, complementar); consistência; **N docs → 1 exame/evento**; sem restringir por 1º formato | 🔎 auditoria a fazer | consolida CAP‑001/HUB‑001 (D‑14) |
| **B3** | Web+Mobile | **Testes multi-documento** — PDF; imagem; misto; múltiplos; anexação posterior; preliminar+final | 🔧 base em `FUNC-exam-documents-writer` (#121); ampliar | parte de B1 |

## GRUPO C — Nova capacidade (spec-first; sem improvisar regra de negócio)

| ID | Plat. | Item | Status | Dedup / evidência |
|---|---|---|---|---|
| **C1** | Web+Mobile | **Documentos clínicos não-exame** — evoluir **#118**: Atestado, Relatório, Encaminhamento e outros; categoria escolhida permanece por todo o fluxo; **separado de `exam_documents`** | 🗺️ spec (#118) → expandir | = W‑04 |
| **C2** | Web+Mobile | **Receita como objeto/documento próprio** — não é só "receita de medicamento"; uma receita pode originar informação para Medicamento, Suplemento, Ciclo/contracepção, Composição corporal, Recursos de saúde, Hábitos, Monitoramento. Definir Receita como **tipo de documento/registro próprio**, associável à categoria pertinente conforme conteúdo; **spec-first** (modelo + roteamento) antes de implementar | 🧭 decisão + 🗺️ spec | evolui D‑13 (antes "Receita médica"); amplia escopo |
| **C3** | Web+Mobile | **Monitoramento × integração Redbus** — auditar o modelo de Monitoramento e sua capacidade de receber dados de integração **antes** de fechar a implementação; não acoplar a interface a estrutura improvisada | 🧭 auditoria estrutural | novo |

---

## Congelados / não reabrir
H‑09/H‑10 · `ab5b5816` · `0f5ec205` · arquitetura de navegação homologada · **#113** (visão completa) · **RNDS** · qualquer decisão já congelada. Não transformar cada observação em alteração estrutural. Produção bloqueada (gate separado).

## Gates
- **Infra (Fase 0 / #117):** apply no Preview → habilita validação de B1/B2/B3 e runtime real de `exam_documents`. **Aguarda autorização.**
- **Produção:** bloqueada; gate separado.
- **Decisão de produto:** C2 (arquitetura/roteamento de Receita), C3 (modelo de Monitoramento) — avançar spec sem implementar regra até definição.

---

## Log de execução (mais recente no topo)
- _(inicial)_ Checklist master criado; 6 investigações de código em andamento (A3–A11, A13). Web A1/A2 já corrigidos em #120 (aguardam merge). B1 código em #121. Nada aplicado ao banco.
