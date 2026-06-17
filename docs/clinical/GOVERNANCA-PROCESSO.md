# Governança Clínica — Processo e Estrutura (v1)

**Status:** estrutura aprovável imediatamente. **NÃO contém critérios clínicos.**
Este documento define o *processo* pelo qual o conteúdo clínico (limiares,
`clinical_flag`, templates, prompts) é aprovado e versionado. O conteúdo em si é
preenchido e assinado pelo Responsável Clínico — ver `docs/clinical/README.md` e
`docs/clinical/regras-clinicas-template.csv`.

> Complementa `docs/GOVERNANCA-CLINICA-SINTERA.md` (memória das decisões) com o
> *workflow* operacional de aprovação.

## 1. Papéis

- **Responsável Clínico (RC):** única autoridade que aprova conteúdo clínico
  (limiares, `clinical_flag`, templates rule-based, prompts `narrative`/`qa`,
  limiares de QA). Identificado por nome + registro profissional.
- **Engenharia (ENG):** implementa o *mecanismo*; nunca define conteúdo clínico.
- **Aprovador de Produto (AP):** valida UX e linguagem não-clínica.

## 2. Artefatos sob governança

| Artefato | Fonte | Quem aprova |
|---|---|---|
| Ruleset clínico | `docs/clinical/regras-clinicas-template.csv` | RC |
| Prompt `narrative` | `prompt_registry` (operation=narrative) | RC |
| Prompt `qa` | `prompt_registry` (operation=qa) | RC |
| Templates rule_based | (a criar) | RC |
| Limiares de QA (§5) | (a definir) | RC |
| Política de fatos aritméticos (saliência) | (a definir) | RC + AP |

## 3. Fluxo de aprovação (estados)

```
draft → in_review → approved → active → deprecated
```

- **draft:** rascunho técnico (ENG).
- **in_review:** submetido ao RC.
- **approved:** RC assinou (`approved_by` + `approved_at` preenchidos).
- **active:** em produção (`deployed_at`; no máximo 1 ativo por operação — o
  índice único `prompt_registry_one_active_per_operation` já garante isso).
- **deprecated:** substituído (`deprecated_at`).

**Regra:** nenhum artefato vai a `active` sem passar por `approved` com assinatura.

## 4. Versionamento

- **SemVer** por artefato (ex.: `narrative 1.1.0`).
- **`content_hash` obrigatório** (coluna já existe no `prompt_registry`): qualquer
  alteração de texto gera novo hash. Divergência de hash em runtime bloqueia o uso
  (mesmo mecanismo já aplicado à extração).

## 5. Cadência de revisão

- Revisão obrigatória: **a cada 6 meses**, OU quando o `biomarker_catalog` mudar,
  OU após incidente de QA. O campo "Validade até" no registro abaixo controla isso.

## 6. Registro de aprovações (a preencher pelo RC)

| Artefato | Versão | content_hash | Aprovado por | Data | Validade até |
|---|---|---|---|---|---|
| Processo de governança (Aprovação 1) | v1 | — | Carina Leite (fundadora) — **provisório, pendente ratificação RC** | 2026-06-16 | ratificar c/ RC |
| Prompts `narrative`/`qa` (Aprovação 2) | v1.1 | a registrar na ativação | Carina Leite (fundadora) — **provisório, pendente ratificação RC** | 2026-06-16 | ratificar c/ RC |

## 7. Histórico de alterações

| Data | Artefato | De → Para | Autor | Motivo |
|---|---|---|---|---|
| — | — | — | — | — |
