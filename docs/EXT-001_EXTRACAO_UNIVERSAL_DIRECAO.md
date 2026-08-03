# EXT-001 — Direção arquitetural: Extração UNIVERSAL de exames

- **Natureza:** direção arquitetural (não implementação). Reafirma [ADR-001] (SSOT), UCDA-001 (arquitetura
  universal de evidência clínica), CEF-001 (protocolo de leitura por tipo de documento) e o **Modelo Aberto**.
- **Diretriz da fundadora (02–03/08):** a SINTERA deve receber e estruturar **qualquer** exame de **qualquer**
  especialidade (do laudo laboratorial ao Pentacam/OCT/ECG/densitometria/anatomia patológica…), **sem lógica
  específica por exame** e **sem reescrever o pipeline** a cada novo tipo. Pentacam = só um exemplo de exame complexo.

## 1. Estado atual (factual)
- A extração é **server-side** (rota `/analyze` → gateway de IA), disparada via ponte ADR-020 pelo Mobile.
- O **prompt ativo é único** (`prompt_registry` `operation='extraction'` v1.5.0), **orientado a biomarcadores de
  laboratório**. → laudos laboratoriais extraem bem; exames **não-lab** (imagem/traçado/laudo textual complexo)
  entram, preservam o documento, mas **não geram dados estruturados** ainda.
- O **Mobile já é genérico**: sobe qualquer documento e delega ao pipeline; **nenhum** special-casing por tipo.
- O banco **já modela heterogeneidade** além de biomarcadores (`clinical_results`, `body_metrics`, `omics_panels`,
  `document_type`, `clinical_family`, `extraction_versions`), e há um pipeline de processamento clínico
  (`clinical-information-pipeline`, `clinical-processing-engine`, UCDA) — a fundação para o modelo aberto existe.

## 2. Alvo (universal, sem reescrever o pipeline)
Pipeline genérico e extensível, em 6 passos (diretriz): **(1) identificar tipo** → **(2) reconhecer estrutura
documental** → **(3) extrair o relevante** → **(4) preservar o original** (já garantido) → **(5) estruturar no
modelo de dados** (UCDA — biomarcador/medida/traçado/achado/score/variante) → **(6) evoluir p/ novos tipos sem
redesenho**.

## 3. Caminho de evolução (não-disruptivo — quando esta trilha entrar)
1. **Classificação → protocolo (CEF):** `document_type`/`clinical_family` já existem; usar a classificação para
   selecionar o **protocolo de leitura + prompt por família** (registro de prompts por `operation`/família, não um
   único prompt lab). Aditivo — não quebra o fluxo atual.
2. **Prompt por modalidade no `prompt_registry`:** de "um prompt de extração" → "um prompt **ativo por família**"
   (lab, imagem/laudo, traçado, …). O `loadActivePrompt(operation)` já é a costura; estende-se a chave.
3. **Representação UCDA por tipo de resultado:** mapear a saída para a tabela certa (biomarcador × medida × achado
   textual × score), com **proveniência/versão** (`extraction_versions`) e **degradação graciosa** (Modelo Aberto:
   tipo desconhecido → preserva documento + marca "estruturação pendente", nunca "erro").
4. **Reprocessamento reprodutível:** re-extrair quando surgir protocolo/prompt novo para a família (a reprodução
   já é princípio — representação certificada).

## 4. Invariantes (não regridem)
- **Zero special-casing por exame** — sempre por **categoria/família**.
- **Documento original = fonte da verdade** (REG-001); a estruturação é organização, não interpretação clínica.
- **Aditivo**: novos tipos entram por dados/configuração (classificação + prompt + mapeamento), não por reescrita.

## 5. Escopo / gate
Esta é uma **evolução do pipeline da Web** (arquitetura de plataforma) — **fora da Onda 1 Mobile** e do escopo de
estabilização atual. Requer **decisão de produto/arquitetura** da fundadora para priorizar (quando entra, quais
famílias primeiro). O Mobile **não precisa mudar** para acompanhar (já é genérico; consome o resultado via contrato).
