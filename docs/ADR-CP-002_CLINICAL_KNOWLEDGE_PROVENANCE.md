# ADR-CP-002 — Clinical Knowledge Provenance (proveniência e mapeamentos)

**Status:** princípio permanente / contratos congelados. Origem: fundadora 13/08. Relaciona: ADR-CP-001 ·
ADR-CK-001 · ADR-ARCH-002.

## Princípio filosófico (congelado)

> **A SINTERA nunca cria conhecimento clínico; ela identifica, organiza, contextualiza e referencia conhecimento
> proveniente de fontes reconhecidas.**

**Princípio PERMANENTE — independência do modelo de IA (fundadora 13/08):**

> **Nenhuma decisão clínica persistida pode depender da REEXECUÇÃO de um modelo de IA para ser compreendida ou
> reproduzida.** Toda decisão deve ser integralmente EXPLICÁVEL e REPRODUZÍVEL a partir do **Pipeline Audit
> persistido** — garantindo auditabilidade, reprodutibilidade e independência do modelo de IA utilizado.

Consequências concretas: o audit persiste as OBSERVAÇÕES (com id/rótulo/região), as EVIDÊNCIAS normalizadas, e a
DECISÃO (aceita + rejeitadas com código) — de modo que a mesma entrada produz a mesma `ResolvedFact` por regra
determinística, sem chamar a IA de novo. A IA participa só da OBSERVAÇÃO (uma vez, registrada); a interpretação é
determinística e replayável.

Complementa o princípio já vigente:

> A SINTERA organiza, integra e contextualiza informações para apoiar a continuidade do cuidado, **mas não realiza
> diagnóstico nem produz recomendações terapêuticas.**

**Corolário — mapeamentos, não terminologia:** a SINTERA é dona dos **MAPEAMENTOS** (evidência → conceito), não da
NOMENCLATURA. Por isso o componente que resolve o nome é o **Clinical Mapping Service** (não um "catálogo próprio"):
ele consulta recursos (regras · aliases · sinônimos · heurísticas · equipamentos · catálogo interno · Terminology
Service) e RESOLVE qual conceito melhor representa as evidências. O catálogo interno é apenas **um recurso**, não a
autoridade.

## Regras de proveniência (obrigatórias)

1. **Nenhum conceito clínico existe sem proveniência.**
2. **Toda explicação possui fonte** (diretriz/sociedade/literatura — via curadoria).
3. **Toda nomenclatura possui origem** (`nameSource`: `terminology-official` | `internal-mapping` | `document` | `pending`).
4. **Toda terminologia possui versão** (`TerminologyRef.version`; `PIPELINE_VERSIONS`).
5. **Toda decisão possui rastreabilidade** (`resolution_id` + `decisionLog` estruturado + `versions` + data).
6. **Ausência de evidência NUNCA é substituída por inferência silenciosa** — registra-se a razão (`not_found` ·
   `illegible` · `low_confidence` · `detector_not_applicable`), nunca só `null`.
7. **Sem conceito oficial → a plataforma informa EXPLICITAMENTE que usa um mapeamento PROVISÓRIO** (`provisional=true`,
   `codes=[]`, `basis` declarada). É um estado legítimo, não um defeito.
8. **Auditabilidade retroativa (requisito, fundadora 13/08):** todo documento JÁ PROCESSADO deve ser explicável
   INTEGRALMENTE apenas com { documento original · Clinical Identity · Pipeline Audit · Understanding Report ·
   Decision Log }. **Nenhum diagnóstico técnico pode depender de novo upload.** O reprocessamento existe para
   produzir uma NOVA versão da Clinical Identity quando a lógica evolui — mas explicar a decisão ANTERIOR nunca
   depende dele. **Corolário:** o pipeline SEMPRE emite um Pipeline Audit — inclusive quando o DUE FALHA (registra
   a falha em `decisionLog` + `finalStatus='pending'`, `due=null`), e uma falha do DUE NUNCA regride ao caminho
   estruturado (o documento é tratado como document_only). **Lacuna encontrada e fechada:** antes, uma falha do DUE
   pulava o pipeline silenciosamente (documento sem audit, reclassificado como laboratorial+estruturado) — inexplicável.

## Crescimento previsto (contrato-primeiro)

A **Clinical Identity** ("quem é este exame?") cresce naturalmente para **Clinical Identity + Clinical Context**
("o que é este exame?"): periodicidade sugerida · especialidade · órgão · sistema · grupo · explicação · nível de
evidência · fontes (contrato `ClinicalContext`, congelado; populado por Clinical Knowledge + Evidence — C6/C8).
Nada a reinventar: já conversa com "O que é este exame?".

## Parada da evolução arquitetural

A arquitetura está madura para a fase atual:
`Documento → DUE → Clinical Mapping Service → Terminology Service → Clinical Knowledge Service → Evidence Service →
Clinical Identity → (Timeline · Insights · IA · Busca · Agenda · Relatórios · Web · Mobile)`.
**A partir daqui, os esforços vão para HOMOLOGAR o pipeline com exames reais variados** (laboratoriais, imagem,
cardiologia, oftalmologia, genética, anatomia patológica…), identificando LACUNAS na implementação dos componentes
já definidos — **não** introduzindo novas abstrações antes de validá-las na prática.
