# Execução — Milestones por CAPACIDADE (documento vivo)

> Fundadora (13/07/2026): acompanhar a plataforma por **capacidades entregues**, não por tarefas
> isoladas. Cada milestone tem **critérios objetivos de conclusão · testes obrigatórios · casos do CRC ·
> % · bloqueadores · previsão relativa**. Atualizado a cada entrega. Foco: executar/auditar/validar/
> consolidar (arquitetura congelada). Ver `GOVERNANCA.md` (pipeline de 9 etapas) e
> `docs/QA/GOLD_STANDARD_CASES.md` (CRC).

**Legenda:** ✅ concluído · 🔄 em execução · ⬜ não iniciado · ⛔ bloqueado.
**Convenção de previsão (relativa):** *E* = 1 entrega de execução; *E+n* = n entregas adiante.

---

## Painel (visão rápida)

| # | Capacidade | % | Estado | Previsão |
|---|---|---|---|---|
| **M1** | Compreensão documental (Bundle → CertifiedCDUs) | **100%** ✅ | ✅ | ligado ao analyze |
| **M2** | Cobertura ligada (fim da falsa completude) | **70%** | 🔄 | E (confiab. plena em M5) |
| **M3** | Split de CDUs no fluxo real (1 upload → N registros) | **70%** | 🔄 | UX de confirmação (produto) |
| **M4** | Identidade robusta (Clinical Identity Registry + estados) | **90%** | 🔄 | fusão LLM no M5 |
| **M5** | Clinical Processing Engine (motor único · processadores por modalidade) | **20%** | 🔄 | E+3 |
| **M6** | Datas semânticas (CEF §5) | **75%** | 🔄 | E (ligada) |
| **M7** | Captura de evidência completa (laudo + imagens) | **0%** | ⬜ | E+4 |
| **M8** | Robustez operacional (timeout/retries/perf) | **0%** | ⬜ (backlog) | — |
| **M9** | Certificação RI-001 (homologação + merge) | ⛔ pausada | ⛔ | após M1+M2 |

---

## M1 — Compreensão documental (Bundle → CertifiedCDUs) · 90% · 🔄
**Capacidade:** transformar qualquer Bundle em **CDUs certificadas** (contrato único), compreendendo a
estrutura ANTES de extrair.
**Critérios de conclusão:** (a) Análise Estrutural, Segmentação, Identity Validator, Orquestrador como
funções puras ✅; (b) `processBundle` devolve só `CertifiedCDU` ✅; (c) fail-safe: revisão técnica bloqueia
✅; (d) **`analyze` chama `processBundle` e opera por CDU** ⬜.
**Testes obrigatórios:** `FUNC-structural-analysis` ✅ · `FUNC-segmentation` ✅ · `FUNC-identity-validator`
(via pipeline) ✅ · `INT-analyze-pipeline` (a criar) ⬜.
**CRC:** GS-010 (identidade) · GS-011 (unidades) · bundle 3-laudos.
**Bloqueadores:** nenhum técnico. **Falta:** critério (d) — a integração ao `analyze`.

## M2 — Cobertura ligada (fim da falsa completude) · 50% · 🔄
**Capacidade:** a plataforma **nunca** apresenta um exame incompleto como completo.
**Critérios:** (a) `computeCoverage` puro ✅; (b) `analyze` calcula cobertura por CDU (descoberto×
estruturado); (c) exame vira `partial` quando `structured<discovered`; (d) UI mostra parcial + original.
**Testes:** `FUNC-coverage` ✅ · `INT-coverage-lab` (laudo 6 exames → partial) ⬜.
**CRC:** GS-011 (6 descobertos × 4 estruturados → partial 67%).
**Progresso:** ✅ Cobertura conservadora LIGADA ao `analyze` (só rebaixa `structured→partial` quando
descoberto > estruturado — direção segura, §4.0.1). Confiabilidade PLENA depende de o extrator do CEF
(M5) reportar unidades alinhadas com a Análise Estrutural.
**Bloqueadores:** confiabilidade plena depende de M5 (unidades alinhadas).

## M3 — Split de CDUs no fluxo real (1 upload → N registros) · 70% · 🔄
**Capacidade:** um upload com N exames distintos cria N registros (o PDF de 3 laudos → 3 registros).
**Critérios:** (a) `analyze` cria 1 registro por CertifiedCDU, com vínculo ao Bundle de origem ✅ (raiz vira
CDU#1; CDUs 2..N viram registros-irmãos `pending`); (b) CDUs em revisão técnica ficam retidas ✅ (o
planejador NÃO divide quando há revisão técnica); (c) proveniência do Bundle preservada ✅
(`source_bundle_exam_id` + `bundle_cdu_index/count` + `bundle_page_start/end`); (d) **extração ISOLADA por
CDU** ✅ (cada registro processa só o seu intervalo de páginas — `restrictPages`; CDU restrita força o
caminho de texto); (e) idempotência ✅ (raiz já-dividida não recria irmãos).
**Feito:** planejador puro `planBundleSplit` (10 testes FUNC) · migration 108 (proveniência) · fiação no
`analyze` (planejar antes de extrair · restrição de páginas · materialização dos irmãos).
**Testes:** `FUNC-bundle-split` ✅ (10) · `INT-split-cdus` ⬜ (homologação com IA real).
**CRC:** bundle 3-laudos (AXIAL).
**Falta (30%):** **DECISÃO DE PRODUTO** — a UX de **confirmar/revisar** a segmentação e **disparar** a
análise dos irmãos (hoje ficam `pending`; abrir o registro dispara sozinho, como qualquer pending). Sem
fan-out automático no servidor (evita timeout serverless + respeita a fronteira de produto).

## M4 — Identidade robusta (Clinical Identity Registry + estados) · 90% · 🔄
**Capacidade:** identificar a modalidade por **ensemble de evidências** (auditável), com estados
`draft/validated`.
**Critérios:** (a) registry por modalidade (nomes/sinônimos/evidências com peso/extrator) ✅ **13
modalidades** (mamografia, US, Pentacam, EEG, laboratório, RM, TC, ECG, ecocardiograma, Holter,
anatomopatológico, OCT, densitometria); (b) score de identidade + auditoria (evidências que casaram) ✅;
(c) `document_identity_status` (draft/validated) — migration 107 aplicada + fiado no `analyze` write-once ✅;
(d) LLM = 1 evidência (conflito → revisão) — **arquitetura pronta (registry é o ensemble); a FUSÃO efetiva
do LLM acontece no M5**, onde o LLM roda na extração (dependência técnica real, não decisão de produto).
**Testes:** `FUNC-clinical-identity-registry` ✅ (11 casos) · `INT` ⬜ (com M5). **CRC:** GS-004 · GS-010.
**Bloqueadores:** nenhum para o escopo determinístico; item (d) segue naturalmente no M5.

## M5 — Clinical Processing Engine (motor único · processadores por modalidade) · 20% · 🔄
**Capacidade:** UM motor de processamento clínico com **processadores especializados por modalidade**,
todos consumindo o mesmo contrato (`CertifiedCDU`, nunca PDF) e cada um produzindo o **modelo de resultado**
da sua modalidade (biomarcador ≠ achado ≠ parâmetro por região).
**Critérios:** (a) espinha de ROTEAMENTO pura (Identidade Clínica → processador) ✅ `routeProcessing`;
(b) sem processador/identidade ambígua → `document_only` (revisão CLÍNICA, não bloqueia) ✅ (CEF §4.0);
(c) processadores concretos por modalidade (imagem→achados · EEG→achados · Pentacam→parâmetros por olho) ⬜;
(d) completude certificada por grupo (liga na Cobertura/M2) ⬜; (e) LLM = 1 evidência na identidade (fusão
do M4) ⬜.
**Feito:** `src/lib/capture/clinical-processing-engine.ts` (13 processadores mapeados, contrato versionado) +
`FUNC-clinical-processing-engine` (9) + **ARCH invariante** (toda modalidade identificável tem processador —
sem órfãos entre camadas).
**Testes:** `FUNC-clinical-processing-engine` ✅ · `ARCH-identity-processor-coverage` ✅ · regressão CRC ⬜.
**CRC:** GS-003 (EEG) · GS-004 (Pentacam).
**Bloqueadores:** nenhum p/ a espinha; processadores concretos plugam incrementalmente (cada um puxado por CRC).

## M6 — Datas semânticas (CEF §5) · 5% · ⬜
**Capacidade:** data de realização correta por tipo; baixa confiança não sobrescreve.
**Testes:** `FUNC-semantic-dates` ⬜. **CRC:** GS-003 (EEG "2002") · laudo 2009.
**Bloqueadores:** nenhum; pode ser paralelo.

## M7 — Captura de evidência completa (laudo + imagens) · 0% · ⬜
**Capacidade:** exame de imagem = laudo + imagens em 1 CDU (reusa multipágina). **Bloqueadores:** M1/M3.

## M8 — Robustez operacional (timeout/retries/perf) · 0% · ⬜ (backlog)
Timeout 60→120s, retry em `provider_timeout`. **Não prioridade** (fundadora).

## M9 — Certificação RI-001 (homologação + merge) · ⛔ pausada
**Critérios:** M1+M2 fechados (compreensão + cobertura, sem falsa completude no laboratório); RI-001A/B
homologados; verificação do banco + Relatório RI-001. **Bloqueador:** M1(d) + M2.
