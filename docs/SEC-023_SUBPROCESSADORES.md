# SEC-023 — Registro de subprocessadores · v0.1 (rascunho documental)

> **Natureza:** registro **inicial** dos terceiros efetivamente identificáveis **no código/ambiente**. Separa
> **fatos técnicos verificáveis** de **informação contratual não verificada**. **Não** assume DPA, localização,
> finalidade contratual, retenção ou condição jurídica que não esteja comprovada — esses itens ficam **PENDENTES
> (DPO/Jurídico)**. Baseline: `feat/fase-c-sql-source @ 1e77c79`. Não é due diligence formal (gate S3).

## 1. Fatos técnicos verificáveis (a partir do repositório)
| Terceiro | Evidência no código | Uso técnico observado | Dado potencialmente envolvido |
|---|---|---|---|
| **Supabase** | `package.json`: `@supabase/supabase-js`, `@supabase/ssr` | Auth, Postgres, Storage (RLS) | Dados de usuária, exames, documentos (C-alto) |
| **Anthropic** | `package.json`: `@anthropic-ai/sdk`; `src/lib/ai/*`, rotas de IA | Inferência LLM sobre texto de laudo/documento | **Texto clínico** enviado ao modelo (ver SEC-011/013) |
| **Resend** | `package.json`: `resend`; `src/lib/email/*` | E-mail transacional (ex.: boas-vindas) | E-mail/nome (contato) |

## 2. Inferido pelo ambiente (NÃO confirmado por artefato de código)
| Terceiro | Base da inferência | Status |
|---|---|---|
| **Vercel** | deploy/preview do projeto (bot Vercel no PR; Next.js) — **não** é dependência em `package.json` | **A confirmar** (hospedagem/edge) — não assumir como fato |

> Qualquer outro subprocessador (CDN, observabilidade, e-mail secundário) **não** foi identificado no material; ausência
> de evidência **≠** ausência de subprocessador.

## 3. Itens PENDENTES (DPO/Jurídico — não assumidos)
Para cada terceiro acima, permanecem **não verificados** e **não presumidos**:
- Existência e escopo de **DPA/contrato** e cláusulas de subprocessamento;
- **Localização** de processamento/armazenamento (transferência internacional);
- **Finalidade** contratual e base legal (LGPD);
- **Retenção** e devolução/eliminação de dados;
- Certificações/atestados (ISO 27001, SOC 2) — **a solicitar**;
- Uso de dados para **treino** (relevante para Anthropic — a confirmar contratualmente).

## 4. Checklist de due diligence (a preencher — S3)
- [ ] DPA assinado e arquivado · [ ] subprocessadores do terceiro revisados · [ ] localização/transferência mapeada ·
- [ ] finalidade/base legal · [ ] retenção/eliminação · [ ] segurança (certificações) · [ ] plano de saída/portabilidade.

## 5. Estado
Registro inicial baseado em evidência técnica. **Nada assumido** sobre contratos/localização/finalidade. Itens
jurídicos/DPO explicitamente **pendentes**; due diligence formal é **S3** (material), fora deste lote.
