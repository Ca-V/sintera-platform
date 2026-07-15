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
| F1 | Identificação padronizada (nome) | Em desenvolvimento | ✅ | ✅ | ⬜ | E1/E2 | `deriveExamIdentity` + `FUNC-exam-identification` (lista+detalhe) | derivação extraída, testada e reutilizada |
| F2 | Nomenclatura (único × painel) | Em desenvolvimento | ✅ | ✅ | ⬜ | Identidade Documental | `ARCH-002` · `FUNC-nomenclature-consistency` | regra travada; homologação = doc real |
| F3 | Laboratório + médico solicitante | Em desenvolvimento | ✅ | ✅ | ⬜ | E1 · issuer/requesting_physician | `deriveExamIdentity` + `FUNC-exam-identification` | derivação lab testada (lista+detalhe) |
| F4 | Reorganização (Exames × Pedidos) | Em desenvolvimento | ✅ | ✅ | ⬜ | — | `isOrderDocumentType` · `FUNC-exam-classification` | classificação Exame×Pedido testada; abas UI = N/A unitário |
| F5 | Fluxo de pedidos (Pedido→Agend.→Realiz.→Result.) | Em desenvolvimento | 🔄 | ✅ | ⬜ | Eventos Assistenciais | `careFlow` + `FUNC-care-flow` · "Agendar" | falta vínculo duro + stepper (adiado) |
| F6 | Política binária de estruturação | Em desenvolvimento | ✅ | ✅ | ⬜ | `regra_estruturacao_binaria` | `binaryStructuringState` · `FUNC-exam-structuring` | decisão binária extraída/testada (nunca "parcial") |
| F7 | Experiência completa de upload | Em desenvolvimento | ✅ | N/A | ⬜ | Bundle→CDU | E6 · `useDocumentBundle` | hook React stateful — teste unitário N/A (validado na homologação/uso); `imagesToPdf` é lib à parte |
| F8 | Financeiro (valor + nota fiscal) | Em desenvolvimento | ✅ | ✅ | ⬜ | `health_events` | E7 · `parseAmountToCents` (`agenda/money`) · `FUNC-money` | parsing financeiro testado; fiação UI = N/A unitário |
| F9 | Recorrência e agendamento | Em desenvolvimento | ✅ | ✅ | ⬜ | `health_events` · `lib/recurrence` | E8 · `FUNC-recurrence` (serialize/parse/addToDate/occurrences) | mecanismo de recorrência testado; agendar UI = N/A unitário |
| F10 | Integração ao CPE | Em desenvolvimento | ✅ | ✅ | ⬜ | UCDA · CPE | `FUNC-clinical-processing-engine` · `FUNC-laboratory-adapter` | completude por modalidade = homologação |
| F11 | Detecção/confirmação de duplicado | Em desenvolvimento | ✅ | ✅ | ⬜ | fingerprint | `FUNC-exam-duplicates` | chip + "Ver original" |
| F12 | Evolução a partir do resultado | Em desenvolvimento | ✅ | 🔄 | ⬜ | grouping | `grouping.test` (série) | link do card sem teste |
| F13 | Varredura contínua do backlog | Em desenvolvimento | 🔄 | — | — | — | este documento | processo permanente |

**Leitura honesta:** todos os itens têm **Código** ✅ (exceto F5/F13 parciais), mas **Testes** cobre só F2,
F5(estados), F10, F11 (e F12 parcial) — os demais são UI/fiação **sem automação**. **Nenhum** item tem
**Homologação** (Controle 2 em 0/8). Portanto **nenhum item está `Homologado`**; o domínio segue *em
desenvolvimento*. Fechar os ⬜ de **Testes** (onde a lógica for extraível) é trabalho de execução corrente.

## Registro de Não-Conformidades (NC)

| NC | Descrição | Origem | Sev. | Item F | Evidência (verificável) | Estado |
|---|---|---|---|---|---|---|
| NC-01 | Detalhe do exame não exibia laboratório nem solicitante | Revisão funcional (Fundadora) | média | F3 (F1) | commit `a2f80e8` · `deriveExamIdentity` · `FUNC-exam-identification` | ✅ encerrada |
| NC-02 | Aba Pedidos mostrava caixa/explicação de upload de *resultados* (copy + ômica) | Auditoria / UX | baixa | F4 | commit `8355009` | ✅ encerrada |
| NC-03 | Falha de upload exibia mensagem TÉCNICA crua ao usuário (`[insert] 23505…`) | Auditoria funcional | baixa | F7 | commit `95f3d3f` · msg amigável + `console.error` | ✅ encerrada |

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

### Situação da auditoria (precisa)
Foi concluída a **auditoria ESTÁTICA das jornadas**: todas as 13 revisadas no código; não foram encontradas
novas NCs críticas ou altas; a única NC relevante (NC-03, baixa) foi corrigida. **A Auditoria FUNCIONAL
permanece PENDENTE** — depende da execução das jornadas no ambiente real (documentos e interações reais) e
**antecede a homologação**. Nenhuma jornada está em `Auditoria funcional (execução)`, `Homologada` nem
`Certificada`. A maior fonte de descobertas nesta fase passa a ser o **uso real**, não o código.

## Adiados (não retornam à fila antes de encerrar Exames)
stepper visual do fluxo · Care Space · push notifications · demais funcionalidades de fases posteriores.
