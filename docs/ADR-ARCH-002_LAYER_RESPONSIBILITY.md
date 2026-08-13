# ADR-ARCH-002 — Responsabilidade única por camada (nenhuma camada produz conhecimento de outra)

**Status:** princípio permanente. Origem: fundadora 13/08. Relaciona: ADR-DUE-001 · ADR-CK-001.

## Princípio

**Nenhum componente pode produzir conhecimento que pertence a outra camada da arquitetura.** Cada camada tem uma
responsabilidade única e consome (nunca reimplementa) a saída da anterior.

```
Documento → OCR/IA → Document Understanding Engine → Terminology Service → Clinical Knowledge Service → Evidence Service → Persistência/Superfícies
```

| Camada | Responde | NÃO faz |
|---|---|---|
| **DUE** | "o que EXISTE no documento?" (fatos + evidências + razão de ausência) | não produz terminologia; não conhece KB clínica; não decide o nome |
| **Terminology Service** | "qual o CÓDIGO/nome oficial?" (LOINC/SNOMED/RNDS; value-set provisório enquanto não há oficial) | não produz explicação clínica; não interpreta o documento |
| **Clinical Knowledge Service** | "o que SIGNIFICA?" (finalidade, o que avalia, quando é indicado, limitações…) | não interpreta documentos; não decide nomenclatura |
| **Evidence Service** | "quais REFERÊNCIAS sustentam?" (AAO, SBO, ESCRS, PubMed, diretrizes) | não gera a explicação (só fornece as fontes ao Knowledge) |
| **UI (superfícies)** | apresenta o que as camadas resolveram | **nunca decide nomes** nem contém lógica clínica |

## Consequências (auditoria/rastreabilidade)

- O relatório persistido (`exams.understanding_report`) separa as ETAPAS: `versions` · `resolvedAt` · `due`
  (observação) · `terminology` (resolução) · `decisionLog` (trilha de decisões). Clinical Knowledge / Evidence
  entram como etapas próprias quando existirem.
- **Versões dos componentes** persistidas (`PIPELINE_VERSIONS`) → "por que este exame recebeu este nome?" responde-se
  com *"classificado usando DUE x.y.z + Terminologia <versão> + Knowledge <versão> em <data>"*.
- Proveniência da nomenclatura nunca é rotulada como "KB clínica": a origem é `terminology-official` |
  `terminology-catalog` (value-set provisório da Terminologia) | `document` | `pending`.

## Verificação

Mudança que faça uma camada assumir a responsabilidade de outra (ex.: DUE decidir nome, UI escolher nomenclatura,
Terminology escrever explicação) **viola este ADR** e deve ser rejeitada em revisão.
