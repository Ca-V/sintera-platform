# Exames — ESTADO do Domínio (Controle 1: Backlog Funcional)

> **Processo (regra ÚNICA da plataforma):** `docs/LIFECYCLE_DOMINIOS.md` — ciclo de vida obrigatório,
> os 2 controles, os 5 estados de jornada, NC→F, critérios de encerramento, homologação × certificação.
> **Este documento contém apenas o ESTADO do domínio Exames** (backlog `F`, NCs, jornadas). Fonte ÚNICA da
> verdade do domínio; nada vive só em memória/conversa; toda NC/funcionalidade entra aqui antes de implementar.
>
> **Escopo CONGELADO** (só correção/auditoria/homologação/certificação; ideias novas → `docs/BACKLOG_EVOLUCOES.md`).
> **Objetivo = encerrar a capacidade.** Estado global: **em desenvolvimento** (nenhum item `Homologado`; matriz 0/8).

## Backlog / plano de execução (Controle 1 — 3 eixos: Código × Testes × Homologação; ver LIFECYCLE)

| ID | Funcionalidade | Estado | Cód | Test | Homol | Dependências | Evidências | Observações |
|---|---|---|:--:|:--:|:--:|---|---|---|
| EXA-F001 | Identificação padronizada (nome) | Em desenvolvimento | ✅ | ✅ | ⬜ | E1/E2 | `deriveExamIdentity` + `FUNC-exam-identification` (lista+detalhe) | derivação extraída, testada e reutilizada |
| EXA-F002 | Nomenclatura (único × painel) | Em desenvolvimento | ✅ | ✅ | ⬜ | Identidade Documental | `ARCH-002` · `FUNC-nomenclature-consistency` | regra travada; homologação = doc real |
| EXA-F003 | Laboratório + médico solicitante | Em desenvolvimento | ✅ | ✅ | ⬜ | E1 · issuer/requesting_physician | `deriveExamIdentity` + `FUNC-exam-identification` | derivação lab testada (lista+detalhe) |
| EXA-F004 | Reorganização (Exames × Pedidos) | Em desenvolvimento | ✅ | ✅ | ⬜ | — | `isOrderDocumentType` · `FUNC-exam-classification` | classificação Exame×Pedido testada; abas UI = N/A unitário |
| EXA-F005 | Fluxo de pedidos (Pedido→Agend.→Realiz.→Result.) | Em desenvolvimento | 🔄 | ✅ | ⬜ | Eventos Assistenciais | `careFlow` + `FUNC-care-flow` · "Agendar" | falta vínculo duro + stepper (adiado) |
| EXA-F006 | Política binária de estruturação | Em desenvolvimento | ✅ | ✅ | ⬜ | `regra_estruturacao_binaria` | `binaryStructuringState` · `FUNC-exam-structuring` | decisão binária extraída/testada (nunca "parcial") |
| EXA-F007 | Experiência completa de upload | Em desenvolvimento | ✅ | N/A | ⬜ | Bundle→CDU | E6 · `useDocumentBundle` | hook React stateful — teste unitário N/A (validado na homologação/uso); `imagesToPdf` é lib à parte |
| EXA-F008 | Financeiro (valor + nota fiscal) | Em desenvolvimento | ✅ | ✅ | ⬜ | `health_events` | E7 · `parseAmountToCents` (`agenda/money`) · `FUNC-money` | parsing financeiro testado; fiação UI = N/A unitário |
| EXA-F009 | Recorrência e agendamento | Em desenvolvimento | ✅ | ✅ | ⬜ | `health_events` · `lib/recurrence` | E8 · `FUNC-recurrence` (serialize/parse/addToDate/occurrences) | mecanismo de recorrência testado; agendar UI = N/A unitário |
| EXA-F010 | Integração ao CPE | Em desenvolvimento | ✅ | ✅ | ⬜ | UCDA · CPE | `FUNC-clinical-processing-engine` · `FUNC-laboratory-adapter` | completude por modalidade = homologação |
| EXA-F011 | Detecção/confirmação de duplicado | Em desenvolvimento | ✅ | ✅ | ⬜ | fingerprint | `FUNC-exam-duplicates` | chip + "Ver original" |
| EXA-F012 | Evolução a partir do resultado | Em desenvolvimento | ✅ | 🔄 | ⬜ | grouping | `grouping.test` (série) | link do card sem teste |
| EXA-F013 | Varredura contínua do backlog | Em desenvolvimento | 🔄 | — | — | — | este documento | processo permanente |

**Leitura honesta:** todos os itens têm **Código** ✅ (exceto F5/F13 parciais), mas **Testes** cobre só F2,
F5(estados), F10, F11 (e F12 parcial) — os demais são UI/fiação **sem automação**. **Nenhum** item tem
**Homologação** (Controle 2 em 0/8). Portanto **nenhum item está `Homologado`**; o domínio segue *em
desenvolvimento*. Fechar os ⬜ de **Testes** (onde a lógica for extraível) é trabalho de execução corrente.

## Registro de Não-Conformidades (NC)

Registro GLOBAL (sequência `NC-####` contínua entre domínios; ver `LIFECYCLE_DOMINIOS.md`).

| NC | Data | Resp. | Origem | Domínio | Func. | Tipo | Sev. | Estado | Evidência |
|---|---|---|---|---|---|---|---|---|---|
| NC-0001 | 15/07 | Claude | Revisão funcional (Fundadora) | Exames | EXA-F003 | Funcional | média | ✅ encerrada | commit `a2f80e8` · `deriveExamIdentity` · `FUNC-exam-identification` |
| NC-0002 | 15/07 | Claude | Auditoria / UX | Exames | EXA-F004 | UX | baixa | ✅ encerrada | commit `8355009` |
| NC-0003 | 15/07 | Claude | Auditoria funcional | Exames | EXA-F007 | UX | baixa | ✅ encerrada | commit `95f3d3f` · msg amigável + `console.error` |

**NCs ABERTAS por Tipo (todos os domínios): Arquitetural 0 · Regulatória 0 · Funcional 0 · UX 0 · Segurança 0 · Dados 0 · Performance 0. Total aberto: 0.**

_Origens possíveis: Revisão funcional · Revisão de UX · Homologação · Certificação · Documento CRC · Teste
automatizado · Feedback de usuário._

## Auditoria por JORNADAS do usuário
Estados e distinção estática × funcional: ver `docs/LIFECYCLE_DOMINIOS.md` (5 estados:
`Não iniciada` → `Auditoria estática (código)` → `Auditoria funcional (execução)` → `Homologada` → `Certificada`).

| # | Jornada | Estado | NCs | Evidência (auditoria estática) |
|---|---|---|---|---|
| J1 | Upload de exame | Auditoria estática (código) | NC-03 (encerrada) | auto-análise em `pending`; erro amigável; limite 50MB/MIME |
| J2 | Upload de pedido/solicitação | Auditoria estática (código) | NC-02 (encerrada) | caixa/copy por aba; `isOrderDocumentType` |
| J3 | Documento com um único exame | Auditoria estática (código) | — | render de biomarcadores agrupados; nome = exame único |
| J4 | Documento com múltiplos exames (segmentação) | Auditoria estática (código) | — | irmãos `pending` "— parte X/N"; análise por CDU sob demanda |
| J5 | Exames laboratoriais | Auditoria estática (código) | — | biomarcadores agrupados por material/painel; referência/interpretação |
| J6 | Exames de imagem | Auditoria estática (código) | — | `document_only` → "Documento disponível" + Ver original |
| J7 | Exames qualitativos | Auditoria estática (código) | — | `value_text` renderizado; nunca vira dado numérico |
| J8 | Duplicidade de exames | Auditoria estática (código) | — | detecção testada; mesmo `createdAt` = 1 marcado (estável) |
| J9 | Financeiro do exame | Auditoria estática (código) | — | "Registrar custo/NF"; data obrigatória; NF visível |
| J10 | Agendamento e recorrência | Auditoria estática (código) | — | AgendarModal; recorrência testada; save bloqueado sem data |
| J11 | Evolução longitudinal | Auditoria estática (código) | — | link numérico→`/saude/[slug]`; série filtra numéricos |
| J12 | Notificações relacionadas ao exame | Auditoria estática (código) | — | evento notifica por categoria (NOTIF-001); push adiado |
| J13 | Exclusão e restauração | Auditoria estática (código) | — | exclusão via API + erro amigável; **restauração N/A** (definitiva por design) |

**Severidade das NCs:** `crítica` (bloqueia/perde dado) · `alta` (fluxo quebrado) · `média` (UX confusa) ·
`baixa` (cosmético).

### Situação do domínio (precisa) — passo a passo do LIFECYCLE
- **Passo 1 — Implementação:** congelada.
- **Passo 2 — Auditoria estática (código):** ✅ concluída — as 13 jornadas revisadas no código; 0 NC crítica/
  alta nova; NC-03 (baixa, UX) corrigida.
- **Passo 3 — Gate Arquitetural (engenharia):** ✅ **PASSOU** — 51 testes `ARCH-*` verdes + checklist (desacoplado
  · CPE aditivo · UCDA · Modelo Aberto · sem listas fechadas · modalidade só no CPE · reúso · camadas). **0 NC arquitetural.**
- **Passo 4 — Gate Regulatório (conformidade):** ✅ **PASSOU** — transcreve/não interpreta (RDC 657) · Ver
  original (rastreabilidade) · proveniência em `clinical_results` (auditabilidade) · fingerprint (reprodutibilidade)
  · documento original preservado · RLS/LGPD. **0 NC regulatória.**
- **Passo 5 — Auditoria funcional (execução):** **PENDENTE** — depende da execução das jornadas no ambiente
  real (documentos e interações reais); **caça defeitos** e antecede a homologação. Nenhuma jornada está em
  `Auditoria funcional (execução)`, `Homologada` nem `Certificada`.
- **Passos 6–8 (Homologação · Certificação · Encerramento):** não iniciados.

A maior fonte de descobertas nesta fase passa a ser o **uso real**, não o código.

## Adiados (não retornam à fila antes de encerrar Exames)
stepper visual do fluxo · Care Space · push notifications · demais funcionalidades de fases posteriores.
