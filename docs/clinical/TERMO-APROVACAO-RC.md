# Termo de Aprovação — Responsável Clínico (Onda 1)

**Responsável Clínico:** ______________________________  **CRM:** ____________
**Data de início da revisão:** ____/____/______

> Este termo separa a validação em **três aprovações independentes**, conforme
> boa prática de governança. Cada bloco pode ser assinado em momento diferente —
> as Aprovações 1 e 2 não dependem do preenchimento do conteúdo clínico. A
> Aprovação 3 só se conclui após o conteúdo clínico ser preenchido e validado.

---

## ✅ Aprovação 1 — Processo de Governança

**Objetivo:** confirmar que o *fluxo* de governança (papéis, estados, versionamento,
rastreabilidade) é aceitável. **Não** envolve conteúdo clínico.

**Documentos avaliados:**
- `GOVERNANCA-CIENTIFICA.md`
- `GOVERNANCA-CLINICA-SINTERA.md`
- `GOVERNANCA-PROCESSO.md`

| Parecer | Responsável (nome + CRM) | Data | Assinatura |
|---|---|---|---|
| ☑ **Aprovado (provisório — fundadora)** | Carina Leite — fundadora · *pendente ratificação do RC (CRM)* | 2026-06-16 | aprovação provisória |

**Ressalvas / observações:**
_______________________________________________________________________

---

## ✅ Aprovação 2 — Prompts (linguagem)

**Objetivo:** confirmar que a linguagem dos textos gerados é compatível com o
posicionamento clínico do SINTERA (não diagnostica, não prescreve, encaminha à
avaliação médica).

**Documento avaliado:**
- `prompts-candidatos-v1.1.md` (prompts `narrative` e `qa`)

| Parecer | Responsável (nome + CRM) | Data | Assinatura |
|---|---|---|---|
| ☑ **Aprovado (provisório — fundadora)** | Carina Leite — fundadora · *pendente ratificação do RC (CRM)* | 2026-06-16 | aprovação provisória |

**Ressalvas / observações:**
Aprovação provisória da fundadora; ratificação clínica pelo RC pendente.
_______________________________________________________________________

> A ativação dos prompts (`draft → active` no `prompt_registry` com
> `approved_by`/`approved_at`/`content_hash`) só ocorre na **ratificação do RC**.
> A aprovação provisória da fundadora **não** os coloca em produção — e, de todo
> modo, o motor está vazio, então nenhum prompt é invocado até a Aprovação 3.

---

## ✅ Aprovação 3 — Conteúdo Clínico

**Objetivo:** validar efetivamente o conteúdo clínico — o que destrava o motor
de insights. **Exige preenchimento prévio** das planilhas.

**Documentos avaliados / preenchidos:**
- `regras-clinicas-template.xlsx` — `clinical_flag`, `condition_params`,
  `template_key`, `priority`, `clinical_rationale`, `approved_by`, `approved_at`
- `regras-clinicas-para-revisao.md` — apoio à leitura das regras
- `loinc-mapping-draft.xlsx` — códigos LOINC conferidos
- `loinc-approval-ledger.xlsx` — trilha de auditoria preenchida

**Estado de preenchimento (marcar ao concluir):**
- ☐ 6 biomarcadores críticos preenchidos e assinados
- ☐ Demais regras numéricas preenchidas
- ☐ Tratamento de qualitativos decidido (ou adiado para v2, registrado)
- ☐ LOINC Sprint A (60 alta confiança) conferido e no ledger

| Parecer | Responsável (nome + CRM) | Data | Assinatura |
|---|---|---|---|
| ☐ Aprovado  ☐ Aprovado com ressalvas  ☐ Reprovado | | | |

**Ressalvas / observações:**
_______________________________________________________________________

---

## Estado conhecido (transparência)

Conforme reconhecido nos próprios documentos: a **governança está pronta**, o
**motor existe**, os **prompts existem** e o **catálogo existe** — mas o
**conhecimento clínico ainda não foi formalmente aprovado**. Os campos
`clinical_flag`, `template_key`, `clinical_rationale`, `approved_by` e
`approved_at` das regras são o vazio que a **Aprovação 3** preenche. Até lá, o
motor permanece vazio (0 insights), por desenho.

## Após as assinaturas

- **Aprovação 1 e 2** → engenharia ativa os prompts e registra as decisões.
- **Aprovação 3** → engenharia transcreve o CSV preenchido para o
  `CLINICAL_RULESET`, aplica o LOINC aprovado e **liga o motor**.
- Cada aprovação é registrada em `GOVERNANCA-PROCESSO.md §6`.
