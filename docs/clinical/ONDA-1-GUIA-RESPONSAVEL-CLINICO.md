# Onda 1 — Guia do Responsável Clínico e da Curadoria

**Para:** Responsável Clínico (RC) + quem conduzir a curadoria
**Objetivo:** destravar o valor clínico do SINTERA preenchendo e assinando o que
hoje está estruturalmente pronto, porém vazio.
**Data:** 2026-06-16 · **Escopo:** Onda 1 (os 83 biomarcadores atuais)

> ⚠️ **Princípio que não muda.** SINTERA **não diagnostica, não prescreve, não
> recomenda tratamento** — traduz exames em compreensão e encaminha à avaliação
> médica. Enquanto este pacote não for preenchido e assinado, o motor de insights
> permanece **vazio** (0 insights) — comportamento seguro e intencional.

---

## 1. As duas frentes (independentes, podem correr em paralelo)

| Frente | O que é | Exige CRM? | Destrava |
|---|---|---|---|
| **A — Curadoria LOINC** | Confirmar o código de interoperabilidade de cada exame | Não (revisão técnica; RC valida) | Camada educacional + cobertura no painel |
| **B — Conteúdo clínico** | Definir limiares, `clinical_flag`, textos e aprovar prompts | **Sim** | O motor de insights "acende" |

A Frente A é mais leve e pode começar já. A Frente B é o coração clínico e
depende do RC identificado (nome + CRM).

---

## 2. Ordem de trabalho

```
  LER (entender)                PREENCHER                 LIBERAR (assinar)
  ─────────────                 ─────────                 ────────────────
  GOVERNANCA-CIENTIFICA.md  →   loinc-mapping-draft.csv → loinc-approval-ledger.csv
  GOVERNANCA-PROCESSO.md    →   regras-clinicas-          (Frente A)
  GOVERNANCA-CLINICA-           template.csv            → GOVERNANCA-PROCESSO.md §6
  SINTERA.md                →   prompts-candidatos-v1.1   (Frente B: assinatura)
  README.md                     (revisar/aprovar)
```

---

## 3. FRENTE A — Curadoria LOINC (Onda 1)

**Ler primeiro:** `loinc-mapping-draft.README.md` (explica o que é e como validar).

**Preencher/verificar:** `loinc-mapping-draft.csv` — 83 biomarcadores com um código
LOINC **candidato** (sugerido por IA, **a conferir**). Distribuição:
- **60 alta confiança** → Sprint A (comece por aqui; maior parte do uso).
- **16 média** → Sprint B (conferir variante/unidade: eGFR, ureia vs BUN, Vit D…).
- **3 baixa + 4 sem candidato** → Sprint C (ambíguos; por último).

**Como validar cada linha:**
1. Buscar o código em **https://loinc.org** (componente + espécime soro/plasma + unidade do laudo).
2. Confirmar ou corrigir `loinc_code_candidate`.
3. Registrar no ledger (abaixo).

**Liberar:** `loinc-approval-ledger.csv` — a **trilha de auditoria**. Para cada
biomarcador conferido, preencher: `fonte_validacao` (ex.: loinc.org), `curador`,
`data_aprovacao`, `status` (`verificado`/`aprovado`). É o que responde, no futuro,
"por que esse exame foi mapeado para esse código?".

> Só depois de `aprovado` no ledger a engenharia escreve o LOINC no banco (via
> migração). Nada vai a produção sem essa passagem.

---

## 4. FRENTE B — Conteúdo clínico (exige RC com CRM)

**Ler primeiro:** `README.md` (guia de preenchimento das regras) +
`regras-clinicas-para-revisao.md` (as regras candidatas organizadas para leitura).

**Preencher/assinar:** `regras-clinicas-template.csv` — **151 linhas** (83
biomarcadores; numéricos vêm com linha "abaixo" e "acima"; críticos no topo).
Para cada regra que deve gerar insight, definir:
- `clinical_flag` (`atencao_imediata` / `acompanhar` / `normal`);
- `condition_params` (faixa do laudo ou limiar absoluto, ex.: `>=126`);
- `template_key`, `priority`, `clinical_rationale`;
- `approved_by` (nome + CRM) e `approved_at`.
- Linhas que **não** devem gerar insight: deixar `clinical_flag` em branco.
- Começar pelos **6 críticos**: Cálcio iônico, Creatinina, Potássio, Sódio,
  Hemoglobina, Glicose.

**Revisar/aprovar prompts:** `prompts-candidatos-v1.1.md` — os textos `narrative`
(como o insight é escrito) e `qa` (o que é reprovado). Hoje em `draft`; o RC
aprova (assinatura) para irem a `active`.

**Liberar:** `GOVERNANCA-PROCESSO.md §6` — registrar cada aprovação (artefato,
versão, aprovado por, data, validade).

---

## 5. Checklist consolidado de entregáveis

**A preencher e devolver (ou editar no repositório):**
- [ ] `loinc-mapping-draft.csv` — LOINC conferido (Sprint A → B → C)
- [ ] `loinc-approval-ledger.csv` — fonte/curador/data/status por biomarcador
- [ ] `regras-clinicas-template.csv` — `clinical_flag`, rationale, `approved_by`/`approved_at`
- [ ] `prompts-candidatos-v1.1.md` — parecer de aprovação dos prompts `narrative` e `qa`
- [ ] `GOVERNANCA-PROCESSO.md §6` — registro de aprovações assinado
- [ ] `GOVERNANCA-CLINICA-SINTERA.md §6` — registro das decisões clínicas

**Pré-requisito de governança:**
- [ ] Responsável Clínico identificado (nome + CRM) — bloqueador da Frente B

---

## 6. Inventário dos documentos (mapa)

| Documento | Frente | Ação |
|---|---|---|
| `ONDA-1-GUIA-RESPONSAVEL-CLINICO.md` (este) | — | Ler primeiro |
| `GOVERNANCA-CIENTIFICA.md` | A/B | Analisar (arquitetura, fontes, workflow) |
| `GOVERNANCA-PROCESSO.md` | B | Analisar + registrar aprovações (§6) |
| `GOVERNANCA-CLINICA-SINTERA.md` | B | Analisar (memória de decisões) + registrar (§6) |
| `README.md` | B | Analisar (como preencher as regras) |
| `loinc-mapping-draft.README.md` | A | Analisar (como validar LOINC) |
| `loinc-mapping-draft.csv` | A | **Preencher/verificar** |
| `loinc-approval-ledger.csv` | A | **Preencher (liberar)** |
| `regras-clinicas-para-revisao.md` | B | Analisar |
| `regras-clinicas-template.csv` | B | **Preencher (liberar/assinar)** |
| `prompts-candidatos-v1.1.md` | B | Analisar + aprovar |

> Existe também `loinc-apply.template.sql` (artefato de engenharia, comentado) —
> **não é para o RC**; é o que a engenharia usa para escrever no banco depois que
> o ledger estiver `aprovado`.

---

## 7. O que acontece quando você devolver

- **Frente A aprovada** → engenharia gera a migração de LOINC, aplica, e a camada
  educacional (MedlinePlus) + cobertura no painel `/admin/catalogo` acendem.
- **Frente B aprovada e assinada** → engenharia transcreve o CSV para o
  `CLINICAL_RULESET` e ativa os prompts; **o motor de insights passa a emitir**.
- Tudo versionado e rastreável (ledger + registro de aprovações + `content_hash`).
