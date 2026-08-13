# ADR-CP-002 — Clinical Knowledge Provenance (proveniência e mapeamentos)

**Status:** princípio permanente / contratos congelados. Origem: fundadora 13/08. Relaciona: ADR-CP-001 ·
ADR-CK-001 · ADR-ARCH-002.

## Princípio filosófico (congelado)

> **A SINTERA nunca cria conhecimento clínico; ela identifica, organiza, contextualiza e referencia conhecimento
> proveniente de fontes reconhecidas.**

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
