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
| **M1** | Compreensão documental (Bundle → CertifiedCDUs) | **90%** | 🔄 | E (integração) |
| **M2** | Cobertura ligada (fim da falsa completude) | **70%** | 🔄 | E (confiab. plena em M5) |
| **M3** | Split de CDUs no fluxo real (1 upload → N registros) | **15%** | ⬜ | E+1 |
| **M4** | Identidade robusta (Clinical Identity Registry + estados) | **55%** | 🔄 | E+1 |
| **M5** | Extratores especializados do CEF (por modalidade) | **5%** | ⬜ | E+3 |
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

## M3 — Split de CDUs no fluxo real (1 upload → N registros) · 15% · ⬜
**Capacidade:** um upload com N exames distintos cria N registros (o PDF de 3 laudos → 3 registros).
**Critérios:** (a) `analyze`/criação cria 1 registro por CertifiedCDU, com vínculo ao Bundle de origem;
(b) CDUs em revisão técnica ficam retidas; (c) proveniência do Bundle preservada.
**Testes:** `INT-split-cdus` ⬜.
**CRC:** bundle 3-laudos (AXIAL).
**Bloqueadores:** depende de M1. **Decisão de produto sinalizada** (1 upload → N registros).

## M4 — Identidade robusta (Clinical Identity Registry + estados) · 10% · ⬜
**Capacidade:** identificar a modalidade por **ensemble de evidências** (auditável), com estados
`draft/validated`.
**Critérios:** (a) registry por modalidade (nomes/sinônimos/evidências com peso/extrator); (b) score de
identidade; (c) `document_identity_status`; (d) LLM = 1 evidência (conflito → revisão).
**Testes:** `FUNC-clinical-identity-registry` ⬜ · `INT` ⬜. **CRC:** GS-004 · GS-010.
**Bloqueadores:** depende de M1. Fundação pronta (Identity Validator).

## M5 — Extratores especializados do CEF · 5% · ⬜
**Capacidade:** cada modalidade tem seu leitor (achados/parâmetros), sobre `CertifiedCDU` — nunca PDF.
**Critérios:** imagem→achados · EEG→achados · Pentacam→parâmetros por olho; completude certificada por grupo.
**Testes:** regressão CRC. **CRC:** GS-003 (EEG) · GS-004 (Pentacam).
**Bloqueadores:** depende de M4 (registry escolhe o extrator).

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
