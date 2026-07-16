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
| EXA-F003 | Laboratório + médico solicitante | Em desenvolvimento | ✅ | ✅ | ⬜ | E1 · issuer/requesting_physician | `deriveExamIdentity` + `FUNC-exam-identification` · `normalizeExtractedName` (comum) · `normalizeIssuer`/`FUNC-issuer` · `normalizeRequestingPhysician`/`FUNC-requesting-physician` | derivação lab testada; **extração de emissor E solicitante endurecidas** (normalizador comum, DRY): descartam "sem dado" ("N/A"/"não informado"/"—") e rótulo ecoado — no solicitante remove "Solicitante:/Médico:"; no emissor só "Emissor:/Emitido por:" (PRESERVA nomes que começam com "Laboratório/Clínica/Hospital") |
| EXA-F004 | Reorganização (Exames × Pedidos) | Em desenvolvimento | ✅ | ✅ | ⬜ | — | `isOrderDocumentType` · `FUNC-exam-classification` | classificação Exame×Pedido testada; abas UI = N/A unitário |
| EXA-F005 | Fluxo de pedidos (Pedido→Agend.→Realiz.→Result.) | Em desenvolvimento | 🔄 | ✅ | ⬜ | Eventos Assistenciais | `careFlow` + `FUNC-care-flow` · "Agendar" | falta vínculo duro + stepper (adiado) |
| EXA-F006 | Política binária de estruturação | Em desenvolvimento | ✅ | ✅ | ⬜ | `regra_estruturacao_binaria` | `binaryStructuringState` · `FUNC-exam-structuring` | decisão binária extraída/testada (nunca "parcial") |
| EXA-F007 | Experiência completa de upload | Em desenvolvimento | ✅ | N/A | ⬜ | Bundle→CDU | E6 · `useDocumentBundle` | hook React stateful — teste unitário N/A (validado na homologação/uso); `imagesToPdf` é lib à parte |
| EXA-F008 | Financeiro (valor + nota fiscal) | Em desenvolvimento | ✅ | ✅ | ⬜ | `health_events` | E7 · `parseAmountToCents` (`agenda/money`) · `FUNC-money` | parsing financeiro testado; fiação UI = N/A unitário |
| EXA-F009 | Recorrência e agendamento | Em desenvolvimento | ✅ | ✅ | ⬜ | `health_events` · `lib/recurrence` | E8 · `FUNC-recurrence` (serialize/parse/addToDate/occurrences) | mecanismo de recorrência testado; agendar UI = N/A unitário |
| EXA-F010 | Integração ao CPE | Em desenvolvimento | ✅ | ✅ | ⬜ | UCDA · CPE | `FUNC-clinical-processing-engine` · `FUNC-laboratory-adapter` | completude por modalidade = homologação |
| EXA-F011 | Detecção/confirmação de duplicado | Em desenvolvimento | ✅ | ✅ | ⬜ | fingerprint | `FUNC-exam-duplicates` | chip + "Ver original" |
| EXA-F012 | Evolução a partir do resultado | Em desenvolvimento | ✅ | ✅ | ⬜ | grouping | `grouping.test` (série; agora EXECUTADO após NC-0004) | link do card = N/A unitário |
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
| NC-0008 | 15/07 | Claude | Auditoria estática | Exames | EXA-F005 (binário) | Dados | média | ✅ encerrada | commit `a51f889` · descarte de laudo narrativo **de-promove** `current_extraction_version_id` → NULL (view `current_biomarkers` fica vazia = document_only) em vez de `DELETE`; append-only preservado (canônico não deleta), versão+biomarcadores+hash intactos no histórico. Lógica extraída p/ `planNarrativeDiscard` (pura) + `FUNC-narrative-discard` (4 casos). Sem mudança de arquitetura nem de comportamento do usuário. **Verificado no banco (read-only):** coluna `nullable`, 0 triggers em `exams`, RLS `exams_update` = dono atualiza a própria linha sem restrição de coluna → escrita do ponteiro garantida em runtime |
| NC-0009 | 15/07 | Claude | Auditoria estática | Exames | EXA (CPE) | Funcional | média | 🟡 justificada (adiada) | `clinical_results` (parâmetros não-biomarcador via CPE, ex. Pentacam) é persistido; `clinicalResultsToUcda` (`ucda.ts:218`) existe mas **nenhum** fluxo o lê → dado clínico invisível. Read-side adiado por **Convergência Progressiva** (exibição por modalidade = etapa futura, E6) |
| NC-0010 | 15/07 | Claude | Auditoria estática | Exames | EXA (segmentação, J4) | UX | média | 🟡 justificada (adiada) | Split de bundle grava `source_bundle_exam_id`/`bundle_cdu_index`/`bundle_cdu_count`/`bundle_page_*` (`analyze/route.ts:503-536`); irmãos "— parte X/N" aparecem **soltos** e a relação "partes do mesmo documento" nunca é reconstruída na UI. Roadmap multi-exame = PARCIAL |
| NC-0011 | 15/07 | Claude | Auditoria estática | Exames | EXA (careFlow) | Funcional | baixa | 🟡 justificada | `careFlow.ts` (CareStage requested→scheduled→performed→resulted) sem consumidor de UI (só o teste `FUNC-care-flow`). Capacidade planejada (stepper de care-stage), não implementada em tela |
| NC-0025 | 15/07 | Claude | Auditoria estática | Exames | EXA-F004 (segmentação, J4) | Dados | média | ✅ encerrada | commit `f7944c9` · `segment` SOBRE-SEGMENTAVA laudo narrativo multipágina: página de continuação SEM título (cabeçalho só na 1ª página) não casava `sameNarrative` (exigia `foldTitle(p.title) === curTitle`) nem `continuationUnknown` (é 'narrative') → virava CDU separada → registro-irmão "— parte X/N" espúrio. Fix: narrativa sem título continua a CDU atual (laudo distinto sempre tem título — princípio). Retrocompatível (todos os testes) + 2 casos novos em `FUNC-segmentation`. Validação final = homologação com docs reais |
| NC-0020 | 15/07 | Claude | Auditoria estática | Exames | EXA-F004 (segmentação) | Dados | média | ✅ encerrada | commit `a5ffb9b` · criação de registros-irmãos de bundle sem guarda de idempotência: se a marcação do root falhasse em silêncio (Supabase não lança) após criar os irmãos, uma reanálise (`isRootBundle=true`) os RECRIARIA → "— parte X/N" duplicados. Fix: head-count de irmãos existentes antes de inserir; só cria quando não há. Encerrada no mesmo ciclo |
| NC-0024 | 15/07 | Claude | Auditoria estática | Exames | EXA (Reprodutibilidade) | Dados | baixa | ✅ encerrada | commit `d88cf51` · `representationFingerprint` prometia ordem-independência, mas o comparador ordenava só por `name`+`value|valueText` → resultados EMPATADOS nesses campos (unit/faixa diferentes) ficavam na ordem de ENTRADA (sort estável) → a mesma representação em ordem diferente gerava fingerprint diferente (fere Reprodutibilidade constitucional). Fix: ordem TOTAL com desempate por unit/refMin/refMax, preservando a ordem antiga nos casos não-empatados (fingerprints existentes inalterados). `FUNC-reproducibility` (+caso empatado). Encerrada no mesmo ciclo |
| NC-0023 | 15/07 | Claude | Auditoria estática | Exames | EXA (exibição de valor) | Dados | baixa | ✅ encerrada | commit `7825b22` · `fmtNum` exibia valores minúsculos (`<1e-6`) como "0" (notação científica) e perdia o sinal em `|valor|<1` negativo (ex.: base excess `-0.5`→"0,5"). Extraído p/ `src/lib/ui/number.ts` (puro) + `FUNC-number-format` (4 casos); normais idênticos. Encerrada no mesmo ciclo |
| NC-0022 | 15/07 | Claude | Auditoria estática | Exames | EXA-F008 (financeiro) | Dados | média | ✅ encerrada | commit `194abb6` · `parseAmountToCents` tratava todo ponto sem vírgula como decimal → "1.234" (milhar pt-BR) virava R$ 1,23 em vez de R$ 1.234,00. Fix: ponto(s) separando grupos de 3 dígitos = milhar (removidos); ponto seguido de ≠3 dígitos segue decimal. `FUNC-money` (+milhar/decimal). Encerrada no mesmo ciclo |
| NC-0021 | 15/07 | Claude | Auditoria estática | Exames | EXA-F002 (nomenclatura) | Dados | média | ✅ encerrada | commit `2b5d093` · `deriveDisplayTitle` colapsava TODA urina em "Urina tipo I" (`isUrine` casa urocultura/urina-24h/sedimento/EAS) → uma **urocultura** era renomeada "Urina tipo I", perdendo a Identidade Documental (fere RDC 657 "transcreve, não infere"). Fix: só urina de ROTINA vira "Urina tipo I"; urocultura e urina-24h preservam o nome fiel. Casos no `ARCH-002`. Encerrada no mesmo ciclo |

**NCs ABERTAS de EXAMES por Tipo:** Arquitetural 0 · Regulatória 0 · Funcional **2** · UX **1** · Segurança 0 · Dados **0** · Performance 0. **Total aberto (Exames): 3** (0 crítica/alta; 2 média + 1 baixa; **todas justificadas/adiadas** — read-side canônico E6, multi-exame, careFlow). NC-0008 (Dados) **encerrada**. Tally da plataforma: `DOMINIOS.md`.

### Registro de Auditoria Estática por item (varredura contínua — uma linha por item verificado)
> Confirmar solidez também reduz incerteza. Itens auditados a fundo (borda/inconsistência/simplificação):
- **EXA-F002** (nomenclatura): 🔧 corrigido — NC-0021 (urina distinta) + hardening emissor (NC via F003).
- **EXA-F003** (identificação): 🔧 corrigido — emissor + solicitante endurecidos (rótulo ecoado / "sem dado"), normalizador comum DRY.
- **EXA-F004** (Exame × Pedido): ✅ auditado, sem alteração — `isOrderDocumentType` correto; segmentação NC-0020 corrigida.
- **EXA-F006** (estruturação binária): ✅ auditado, sem alteração — decisão correta, nunca "parcial".
- **EXA-F008** (financeiro): 🔧 corrigido — NC-0022 (milhar pt-BR); título/valor/NF corretos.
- **EXA-F010** (CPE/cobertura): ✅ auditado, sem alteração — `computeCoverage` puro, sem completude falsa.
- **EXA-F011** (duplicados): ✅ auditado, sem alteração — `findDuplicateIds`/`originalIdFor` corretos (uso guardado).
- **Datas** (F001/F012): ✅ auditado, sem alteração — `pickExamDate` resolve rótulo por proximidade; exclui nascimento/impressão/protocolo.
- **EXA-F012** (evolução/série longitudinal): ✅ auditado, sem alteração — `summarizeBiomarkers`/`computeReferenceIndex` guardam divisão por zero, tratam `unit_mismatch`, ordenação estável. Refino possível (agrupar por `catalog_id`) é comportamental → decisão de produto.
- **Imagem** (F002/normalizeModality): ✅ auditado, sem alteração — nome fiel preservado (Identidade Documental); `normalizeModality` é fallback canônico, raramente acionado.
- **Interpretação de referência** (F005/F010, `analyze` §biomarcadores): ✅ auditado, sem alteração — null→indisponível; <min→abaixo; >max→acima; tem ref→dentro; sem ref→sem_referencia; limite `value==min → dentro` correto.
- **Gateway de IA — parse/salvamento** (F007/F010): ✅ auditado — `extractJsonCandidate` ciente de strings/escapes (não corta em `}` dentro de string); salvamento em 3 níveis (parse→jsonrepair→salvar do 1º `{`). Robustez travada com `gateway.extractJson` (6 casos) + `rangeExtracted` simplificado (ciclo 5).
- **Data do laudo** (F001/F012, `parseExamDate`): ✅ auditado — formato estrito + faixa de ano + roundtrip (rejeita 2026-02-30/mês inválido) + bissexto correto. Travado com `gateway.parseExamDate` (5 casos).
- **Conferência de identidade do paciente** (`nameMatch`): ✅ auditado — heurístico conservador (aviso, não bloqueio); acentos/conectivos normalizados. Travado com `FUNC-name-match` (importa a impl. real; antes só havia smoke `.mjs` com lógica duplicada → risco de drift eliminado).
- **UCDA `toNum`** (F010, parser numérico canônico): 🔧 refinado — `"1.234,56"` (milhar+decimal pt-BR) virava NaN/null (perdia o valor); fix gatilhado por vírgula, **sem tocar** o caso ambíguo sem vírgula (densidade `1.028`/pH `7.35` preservados). `FUNC-laboratory-adapter` (+casos).
- **CPE `planRepresentation`/`processClinical`** (F010, ponto único de modalidade): ✅ auditado, sem alteração — guardas corretos (sem identidade/ambíguo/sem modelo → document_only), modalidade encapsulada só aqui; coberto por `FUNC-clinical-processing-engine`.

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
- **Passo 2 — Auditoria estática (código):** ✅ concluída + **aprofundada** — as 13 jornadas revisadas; varredura
  de latências (campo persistido × exibido, capacidade só-modelo, código parcialmente conectado). **0 NC crítica/
  alta**; NC-03 corrigida. Novas NC média/baixa registradas (NC-0008 a NC-0011): 1 Dados (descarte canônico),
  1 CPE read-side (adiado), 1 segmentação multi-exame (adiado), 1 careFlow latente. **NC-0008 já corrigida
  e encerrada** (de-promoção do ponteiro canônico; append-only preservado); as demais justificadas/adiadas.
- **Passo 3 — Gate Arquitetural (engenharia):** ✅ **PASSOU** — 51 testes `ARCH-*` verdes + checklist (desacoplado
  · CPE aditivo · UCDA · Modelo Aberto · sem listas fechadas · modalidade só no CPE · reúso · camadas). **0 NC arquitetural.**
- **Passo 4 — Gate Regulatório (conformidade):** ✅ **PASSOU** — transcreve/não interpreta (RDC 657) · Ver
  original (rastreabilidade) · proveniência em `clinical_results` (auditabilidade) · fingerprint (reprodutibilidade)
  · documento original preservado · RLS/LGPD. **0 NC regulatória.**
- **Passo 5 — Auditoria funcional (execução):** **DOMÍNIO PREPARADO** — roteiros, ambiente e critérios
  concluídos; **não há trabalho de engenharia pendente**. Aguarda apenas a **execução operacional das 13
  jornadas no preview** (ambiente executável já auto-implantado; **não exige produção**). Progresso: 0/13
  (ver Registro de Execução). Cada achado vira NC global → EXA-F → correção imediata → evidência.
- **Passos 6–8 (Homologação · Certificação · Encerramento):** não iniciados.

A maior fonte de descobertas nesta fase passa a ser o **uso real**, não o código.

## Roteiro da Auditoria Funcional (execução no preview) — passo 5
Percorrer no **ambiente executável** (preview da branch). Para cada jornada: seguir os passos, comparar com o
**resultado esperado**; qualquer divergência = **NC** (registrar Tipo+Severidade → EXA-F → corrigir → evidência).

| Jornada | Passos | Resultado esperado | Sinais de defeito |
|---|---|---|---|
| J1 Upload exame | Novo exame → PDF/foto; ou arrastar | vai ao detalhe; auto-análise inicia ("Analisando…") | erro técnico cru · trava · não analisa |
| J2 Upload pedido | Aba Pedidos → adicionar guia/pedido | classifica em "Pedidos e Solicitações" | cai em Exames · copy de resultado |
| J3 Exame único | abrir lab com 1 exame | card: nome/lab/solicitante; resultados agrupados | nome = arquivo · lab ausente |
| J4 Multi-exame | enviar doc com vários exames | gera N registros ("— parte X/N") | 1 só registro · perde exames |
| J5 Laboratorial | abrir painel | biomarcadores por material/painel; referência/status | material cru · valor sem unidade |
| J6 Imagem | abrir laudo de imagem | "Documento disponível" + Ver original | tela vazia/quebrada · tenta estruturar |
| J7 Qualitativo | abrir exame com resultado textual | texto exibido; nunca vira número/gráfico | qualitativo plotado |
| J8 Duplicidade | enviar 2× o mesmo exame | 2º marca "Possível duplicado" + Ver original | não detecta · marca o original |
| J9 Financeiro | detalhe → Registrar custo / NF | valor + NF (imediata) → aparece em Despesas | NF escondida · não entra em Gastos |
| J10 Agend./recorr. | detalhe → Criar lembrete + repetir | evento na Agenda; recorrência gera ocorrências | save sem data · recorrência falha |
| J11 Evolução | resultado → clicar biomarcador numérico | série no tempo em /saude/[slug] | link morto · série vazia |
| J12 Notificações | Configurações → canal por categoria; evento do exame | respeita e-mail/WhatsApp/ambos/nenhum | ignora preferência |
| J13 Exclusão | detalhe → Excluir | remove; Histórico recalcula; erro amigável se falhar | erro técnico cru · não remove |

**Homologação (passo 6):** usar a matriz `tests/homolog/COVERAGE.md` + fixtures reais (formato em
`tests/homolog/fixtures/exames/README.md`); `HOMOLOG=1 npm run test:homolog`. 8 dimensões, 0/8 hoje.

### Registro de EXECUÇÃO da Auditoria Funcional (preencher conforme cada jornada roda no preview)
Resultado: ⬜ não executada · ✅ aprovada · ❌ reprovada (gerou NC). Rastreável: quem · quando · NCs.

| Jornada | Executor | Data | Resultado | NCs |
|---|---|---|:--:|---|
| J1 Upload de exame | — | — | ⬜ | — |
| J2 Upload de pedido | — | — | ⬜ | — |
| J3 Documento único | — | — | ⬜ | — |
| J4 Documento múltiplo | — | — | ⬜ | — |
| J5 Laboratoriais | — | — | ⬜ | — |
| J6 Imagem | — | — | ⬜ | — |
| J7 Qualitativos | — | — | ⬜ | — |
| J8 Duplicidade | — | — | ⬜ | — |
| J9 Financeiro | — | — | ⬜ | — |
| J10 Agendamento/recorrência | — | — | ⬜ | — |
| J11 Evolução | — | — | ⬜ | — |
| J12 Notificações | — | — | ⬜ | — |
| J13 Exclusão | — | — | ⬜ | — |

**Progresso da Auditoria Funcional: 0/13 jornadas executadas.**

## Adiados (não retornam à fila antes de encerrar Exames)
stepper visual do fluxo · Care Space · push notifications · demais funcionalidades de fases posteriores.
