# AI-001 — AI Governance (preventivo; mantém a estratégia não-SaMD)

> Referencia `ADR-000` e `GOVERNANCA.md`. **Não** é para implementar IA clínica — é para fixar as REGRAS que
> qualquer uso de IA na plataforma deve respeitar, evitando retrabalho quando recursos de IA forem adicionados.
> A IA é **interface e ferramenta de organização**, nunca o cérebro clínico (Visão — Sistema Cognitivo Clínico).

## Regras invioláveis da IA
1. **IA nunca altera o documento original.** (Original Document Preservation — ADR-000 §9.)
2. **IA nunca altera um biomarcador** já extraído/estruturado.
3. **IA nunca altera a proveniência.**
4. **IA nunca substitui metadados** (versão, origem, classificação, confiança).
5. **IA sempre gera CONTEÚDO DERIVADO** — marcado como tal, separado do dado-fonte (nunca se confunde com o fato impresso).
6. **IA é sempre auditável** — entrada, modelo, versão, prompt/versão, saída e log ficam registrados (trilha COMP-04).
7. **IA é sempre reversível** — sua saída pode ser descartada sem afetar o dado-fonte (idempotência/append-only).
8. **IA sempre identifica modelo e versão** (`model_version`, `prompt_version`, `ai_log_id`) — reprodutibilidade.

## Fronteira regulatória (não-SaMD)
IA **não** interpreta para fins diagnósticos, não diagnostica, não prognostica, não recomenda tratamento, não
gera conduta. Qualquer recurso que se aproxime disso → **projeto específico de adequação regulatória** (COMP-11),
nunca por evolução incremental silenciosa. Aprendizado/ajuste é **governado** (CRC), nunca automático sobre o dado do usuário.

## Estado
As extrações atuais (gateway/issuer/solicitante) já seguem: geram conteúdo derivado, identificam modelo/versão,
são auditáveis (`ai_processing_log`) e reversíveis (append-only canônico). Formalizado aqui como invariante do Gate
(eixos Regulação · Rastreabilidade · Auditoria · Arquitetura).
