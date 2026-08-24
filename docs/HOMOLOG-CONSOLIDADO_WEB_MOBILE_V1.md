# Homologação consolidada Web + Mobile — checklist único (rodada atual)

**Objetivo:** registrar **todas** as observações desta rodada (Web + Mobile) num único checklist cumulativo, com
**status real** e **reconciliação com o que já estava registrado**, para que **nenhuma observação precise ser repetida**
e para fechar a homologação das duas plataformas.

> Regra da fundadora: **"Não implementar agora" ≠ "não registrar".** Todo item fica registrado com motivo, dependência
> e condição de execução. Este documento é o **backlog cumulativo** da homologação (não é substituído a cada rodada).

## Legenda de status
| Status | Significado |
|---|---|
| 🆕 NOVO | Identificado agora; ainda não estava registrado |
| 📌 REGISTRADO — PENDENTE | Já informado antes; ainda não executado |
| 🔧 EM IMPLEMENTAÇÃO | Em correção agora |
| ⛔ BLOQUEADO | Registrado, mas depende de outra etapa (ex.: Fase 0) |
| 🧭 DECISÃO DE PRODUTO | Precisa de decisão da fundadora antes de implementar |
| 🔎 CORRIGIDO — AGUARDANDO HOMOLOGAÇÃO | Implementado; falta a fundadora conferir |
| ✅ HOMOLOGADO | Conferido e aprovado |
| 🗺️ BACKLOG FUTURO | Deliberadamente adiado para etapa posterior |

---

## A. WEB

| ID | Área | Observação | Classificação | Status | Evidência |
|---|---|---|---|---|---|
| **W‑01** | Exames · **Múltiplos documentos por exame + anexação posterior** | Vários arquivos no mesmo exame (PDF+imagem, vários PDFs, várias imagens, formatos mistos); **adicionar documentos depois**; **não criar outro exame**; **não encerrar o fluxo após um PDF**. | Correção obrigatória de alto impacto | 🔧 **camada de dados pronta** → ⛔ **homologação depende da Fase 0** | Código: **PR #121** (`examDocuments.ts` + testes) · Schema: **PR #117** (Fase 0, execução *gated*) · Specs: EXDOC‑002/004, FHIR‑001 |
| **W‑02** | **Sidebar** (Registros de Saúde / Histórico / Fonte) | Regressão (commit `f8fd527`): perda de destaque visual e do comportamento de abertura/estado das categorias. | Regressão — restaurar comportamento homologado | 🔎 **CORRIGIDO — aguardando homologação** | **PR #120** (`Sidebar.tsx`) |
| **W‑03** | **Relatórios** | Filtros/seleção de período dentro de área rolável (regressão **reincidente** — já havia sido corrigida e voltou). | Regressão — restaurar | 🔎 **CORRIGIDO — aguardando homologação** | **PR #120** (`relatorio/page.tsx`) |

**Nota W‑01 (dependência):** o código já está preparado (opção B) para entrar **junto com a Fase 0**. A homologação real
só acontece **depois** de aplicar a migração `exam_documents` no **Preview** (#117) — apply/backfill/wiring/UI estão
**bloqueados** aguardando autorização de infraestrutura. Produção continua bloqueada (gate separado).

---

## B. MOBILE (observações desta rodada M1–M9)

| ID | Área | Observação | Classificação | Status | Reconciliação com o registro |
|---|---|---|---|---|---|
| **M‑01** | Receita de **medicamento** | Não há local adequado para **anexar a receita** do medicamento. | Nova capacidade | 🧭 **DECISÃO DE PRODUTO** / 🗺️ backlog | **Já registrado** como **D‑13** (MOBILE‑037): domínio **Receita** (anexo + vínculo à compra), espelhando `pedido↔exame`, nas duas plataformas. Não é ajuste visual isolado. |
| **M‑02** | Receita de **suplemento** | Não há local adequado para **anexar a receita** do suplemento. | Nova capacidade | 🧭 **DECISÃO DE PRODUTO** / 🗺️ backlog | Mesma frente **D‑13**. |
| **M‑03** | Adicionar registro → **Receita médica** | Ao selecionar **Receita médica**, o fluxo direciona **incorretamente** para **Adicionar exame**. | **Bug de roteamento** | 🆕 **NOVO** (bug de rota) + 🧭 destino final depende de D‑13 | Sharpening do **D‑13**: o *bug de rota* é específico e não estava explícito. Roteamento **não deve** cair em "Adicionar exame"; o **destino definitivo** (tela de receita) depende da arquitetura de receita (D‑13). |
| **M‑04** | Adicionar registro → **Medicamento** | O fluxo de medicamento precisa contemplar o **registro/anexação da receita**. | Definir fluxo | 🧭 **DECISÃO DE PRODUTO** | Frente **D‑13** (vínculo receita↔compra). |
| **M‑05** | Adicionar registro → **Suplemento** | O fluxo de suplemento precisa contemplar o **registro/anexação da receita**. | Definir fluxo | 🧭 **DECISÃO DE PRODUTO** | Frente **D‑13**. |
| **M‑06** | **Novo evento** (via Adicionar registro → Consulta) | Abre "Novo evento" com **dois itens só com ícone**, **sem nomenclatura** — correspondem a **Consulta** e **Procedimento**. | UX/UI — nomear | 🆕 **NOVO** (superfície do seletor de tipo em *Novo evento*) | **Relacionado** ao **D‑06** (na Agenda, cards de Consulta/Procedimento sem título — resolvido no código). Aqui a superfície é o **seletor de tipo na tela de Novo evento**; nomear os itens. Pronto para correção imediata (independe de infra/decisão). |
| **M‑07** | **Composição corporal** | Botão **"Nova medida"** **fora do padrão visual** de formatação. | UI | 🆕 **NOVO** (elemento: o botão) | **Relacionado** ao **D‑17** (formatação da Composição — texto/métricas, resolvido). O **botão "Nova medida"** é elemento distinto; alinhar ao DS. Pronto para correção imediata. |
| **M‑08** | **Relatório** | Botão **"Gerar link"** **fora do padrão visual** de formatação. | UI | 🆕 **NOVO** | Não constava no registro. Alinhar ao DS. Pronto para correção imediata. |

---

## C. O que já estava registrado (para não repetir)
- **Sidebar (W‑02)** e **Relatórios roláveis (W‑03):** já reconhecidos como **regressão** e **corrigidos** na **PR #120** — aguardam sua homologação. **Não precisa repetir.**
- **Múltiplos documentos (W‑01):** registrado e com **código pronto** (PR #121); só a **homologação** depende da **Fase 0** (#117). **Não precisa repetir.**
- **Receita (M‑01/02/04/05):** registrado como **D‑13** (MOBILE‑037) — **nova capacidade** (domínio Receita), **decisão de produto/arquitetura** ainda em aberto. **Não precisa repetir** — falta **sua decisão** sobre a arquitetura de receita.
- **Consulta/Procedimento sem nome (M‑06):** a raiz de "card sem título" já foi tratada na Agenda (**D‑06**); a **tela de Novo evento** é uma superfície adicional agora registrada.
- **Formatação da Composição (M‑07):** a tela já passou por ajuste (**D‑17**); o **botão** é sub‑item novo agora registrado.

## D. Itens prontos para um ciclo de correção imediato (independem de infra e de decisão)
Aguardando seu "pode corrigir" — sem fragmentar, num único ciclo:
- **M‑03** (parte *bug de rota*: impedir que "Receita médica" caia em "Adicionar exame").
- **M‑06** (nomear Consulta/Procedimento no seletor de Novo evento).
- **M‑07** (formatação do botão "Nova medida" na Composição corporal).
- **M‑08** (formatação do botão "Gerar link" no Relatório).

## E. Itens que dependem de decisão sua (produto/arquitetura)
- **Arquitetura de Receita (M‑01/02/03‑destino/04/05 · D‑13):** definir se **Receita médica** é uma **categoria própria** de documento/registro **ou** o **mecanismo de anexação documental dentro de Medicamento e Suplemento** (padrão `pedido↔exame`: receita é um objeto, o produto é outro; a receita é vinculada à **compra**). Só depois disso o fluxo é implementado.

## F. Itens bloqueados por infraestrutura
- **W‑01 (múltiplos documentos):** homologação depende da **Fase 0** (#117) aplicada no **Preview**. Apply/backfill/wiring/UI **gated**.

---

### Congelados / fora desta rodada (intocados)
Registros clínicos congelados (ab5b5816, 0f5ec205), **RNDS** (sem implementação), **#118** (Atestado/Relatório/Encaminhamento — backlog). Produção permanece bloqueada (gate separado).

> **Próximo passo:** você continua enviando as observações restantes da Mobile; eu **acrescento** a este mesmo
> checklist (sem substituir). Ao fechar a rodada, você libera **um único ciclo** para os itens da seção **D** e as
> **decisões** da seção **E**, e a homologação de W‑02/W‑03/W‑01 conforme os gates.
